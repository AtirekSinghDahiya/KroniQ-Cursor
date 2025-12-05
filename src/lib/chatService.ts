import { supabase, Project, Message } from './supabaseClient';
import { auth } from './firebase';
import { generateAIProjectName as _generateAIProjectName } from './projectService';

// Re-export generateAIProjectName
export { generateAIProjectName } from './projectService';

// Get current user ID from Firebase Auth
export const getCurrentUserId = (): string | null => {
  return auth.currentUser?.uid || null;
};

// Create a new project
export const createProject = async (
  name: string,
  type: 'chat' | 'code' | 'design' | 'video' = 'chat',
  description?: string
): Promise<Project> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name,
      type,
      description: description || '',
      ai_model: 'openai',
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get all projects for current user
export const getProjects = async (): Promise<Project[]> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Subscribe to projects (real-time + polling fallback)
export const subscribeToProjects = (callback: (projects: Project[]) => void) => {
  console.log('🔔 Setting up projects subscription');

  let lastProjectCount = 0;

  const loadProjects = async () => {
    console.log('📥 Loading projects...');
    try {
      const projects = await getProjects();
      console.log('✅ Loaded projects:', projects.length);

      // Always trigger callback to ensure UI updates
      if (projects.length !== lastProjectCount) {
        console.log('🆕 Project count changed:', lastProjectCount, '->', projects.length);
      }
      lastProjectCount = projects.length;
      callback(projects);
    } catch (error) {
      console.error('❌ Error loading projects:', error);
    }
  };

  // Initial load
  loadProjects();

  // Set up real-time subscription
  const channel = supabase
    .channel('projects-changes')
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'projects',
      },
      (payload) => {
        console.log('🔔 Projects event received:', payload.eventType);
        console.log('🔔 Payload:', payload);
        loadProjects();
      }
    )
    .subscribe((status) => {
      console.log('🔌 Projects subscription status:', status);
    });

  // Polling fallback - check every 3 seconds
  console.log('⏰ Starting projects polling fallback (every 3s)');
  const pollInterval = setInterval(() => {
    console.log('🔄 Polling for project changes...');
    loadProjects();
  }, 3000);

  return () => {
    console.log('🔌 Unsubscribing from projects');
    clearInterval(pollInterval);
    supabase.removeChannel(channel);
  };
};

// Add message to project
export const addMessage = async (
  projectId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  userId?: string,
  fileAttachments?: any[],
  metadata?: Record<string, any>
): Promise<Message> => {
  console.log('📝 addMessage called:', { projectId, role, contentLength: content.length });
  console.log('📝 Content preview:', content.substring(0, 100));

  try {
    const messageData: any = {
      project_id: projectId,
      role,
      content,
    };

    if (fileAttachments && fileAttachments.length > 0) {
      messageData.file_attachments = JSON.stringify(fileAttachments);
    }

    // Store metadata in the payload column
    if (metadata) {
      messageData.payload = metadata;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error adding message:', error);
      throw error;
    }

    console.log('✅ Message inserted successfully:', data);

    // Update project updated_at
    const { error: updateError } = await supabase
      .from('projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', projectId);

    if (updateError) {
      console.warn('⚠️ Failed to update project timestamp:', updateError);
    }

    console.log('✅ addMessage complete');
    return data;
  } catch (error) {
    console.error('❌ Unexpected error in addMessage:', error);
    throw error;
  }
};

// Get messages for a project
export const getMessages = async (projectId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

// Subscribe to messages (real-time + polling fallback)
export const subscribeToMessages = (
  projectId: string,
  callback: (messages: Message[]) => void
) => {
  console.log('🔔 Setting up subscription for project:', projectId);

  let lastMessageCount = 0;

  const loadMessages = async () => {
    console.log('📥 Loading messages for:', projectId);
    try {
      const messages = await getMessages(projectId);
      console.log('✅ Loaded messages:', messages.length);

      // Only trigger callback if message count changed
      if (messages.length !== lastMessageCount) {
        console.log('🆕 Message count changed:', lastMessageCount, '->', messages.length);
        lastMessageCount = messages.length;
        callback(messages);
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error);
    }
  };

  // Initial load
  loadMessages();

  // Set up real-time subscription
  const channel = supabase
    .channel(`messages-${projectId}`)
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `project_id=eq.${projectId}`,
      },
      (payload) => {
        console.log('🔔 Real-time event received:', payload.eventType);
        console.log('🔔 Payload:', payload);
        loadMessages();
      }
    )
    .subscribe((status) => {
      console.log('🔌 Subscription status:', status);
    });

  // Polling fallback - check every 2 seconds
  console.log('⏰ Starting polling fallback (every 2s)');
  const pollInterval = setInterval(() => {
    console.log('🔄 Polling for new messages...');
    loadMessages();
  }, 2000);

  return () => {
    console.log('🔌 Unsubscribing from:', projectId);
    clearInterval(pollInterval);
    supabase.removeChannel(channel);
  };
};

// Rename project
export const renameProject = async (projectId: string, newName: string): Promise<void> => {
  console.log('✏️ Renaming project:', projectId, 'to:', newName);

  const { error } = await supabase
    .from('projects')
    .update({
      name: newName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  if (error) {
    console.error('❌ Error renaming project:', error);
    throw error;
  }

  console.log('✅ Project renamed successfully');
};

// Delete project (with CASCADE, automatically deletes related data)
export const deleteProject = async (projectId: string): Promise<void> => {
  console.log('🗑️ Deleting project:', projectId);

  try {
    // With CASCADE constraints, just delete the project
    // All related messages, assets, video_jobs, and conversations will be deleted automatically
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('❌ Delete failed:', error);
      throw new Error(`Failed to delete project: ${error.message}`);
    }

    console.log('✅ Project and all related data deleted successfully');
  } catch (error: any) {
    console.error('❌ Delete error:', error);
    throw error;
  }
};
