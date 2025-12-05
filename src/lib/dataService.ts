import { supabase, setSupabaseUserContext } from './supabaseClient';
import { auth } from './firebase';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  type: 'chat' | 'code' | 'image' | 'video' | 'music' | 'voice' | 'ppt';
  description: string;
  ai_model: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  project_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  photo_url: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  tokens_used: number;
  tokens_limit: number;
  ai_personality: string;
  ai_creativity_level: number;
  ai_response_length: string;
  created_at: string;
  updated_at: string;
}

const getCurrentUserId = (): string => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.uid;
};

export const createProject = async (
  name: string,
  type: Project['type'],
  description: string = '',
  aiModel: string = 'openai'
): Promise<Project> => {
  const userId = getCurrentUserId();
  await setSupabaseUserContext();

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name,
      type,
      description,
      ai_model: aiModel,
      status: 'active'
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create project: ${error.message}`);
  return data;
};

export const getProjects = async (): Promise<Project[]> => {
  const userId = getCurrentUserId();
  await setSupabaseUserContext();

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch projects: ${error.message}`);
  return data || [];
};

export const getProject = async (projectId: string): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch project: ${error.message}`);
  return data;
};

export const updateProject = async (
  projectId: string,
  updates: Partial<Project>
): Promise<Project> => {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update project: ${error.message}`);
  return data;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  await supabase.from('messages').delete().eq('project_id', projectId);

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw new Error(`Failed to delete project: ${error.message}`);
};

export const createMessage = async (
  projectId: string,
  role: Message['role'],
  content: string,
  metadata?: Record<string, any>
): Promise<Message> => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      project_id: projectId,
      role,
      content,
      payload: metadata // Use 'payload' instead of 'metadata' to match the actual column name
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create message: ${error.message}`);

  await supabase
    .from('projects')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', projectId);

  return data;
};

export const getMessages = async (projectId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to fetch messages: ${error.message}`);
  return data || [];
};

export const subscribeToProjects = (
  callback: (projects: Project[]) => void
): (() => void) => {
  const loadProjects = async () => {
    try {
      const projects = await getProjects();
      callback(projects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  loadProjects();

  const channel = supabase
    .channel('projects-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'projects'
    }, () => {
      loadProjects();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const subscribeToMessages = (
  projectId: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  const loadMessages = async () => {
    try {
      const messages = await getMessages(projectId);
      callback(messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  loadMessages();

  const channel = supabase
    .channel(`messages-${projectId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `project_id=eq.${projectId}`
    }, () => {
      loadMessages();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch user profile:', error);
    return null;
  }
  return data;
};

export const createUserProfile = async (
  userId: string,
  email: string,
  displayName: string | null = null,
  photoUrl: string | null = null
): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email,
      display_name: displayName,
      photo_url: photoUrl,
      plan: 'free',
      tokens_used: 0,
      tokens_limit: 10000,
      ai_personality: 'balanced',
      ai_creativity_level: 5,
      ai_response_length: 'medium'
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create user profile: ${error.message}`);
  return data;
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update user profile: ${error.message}`);
  return data;
};
