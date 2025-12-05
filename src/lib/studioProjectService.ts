import { supabase } from './supabase';

export type StudioType = 'image' | 'video' | 'music' | 'tts' | 'voice' | 'ppt';

export interface StudioProject {
  id: string;
  user_id: string;
  name: string;
  type: StudioType;
  description?: string;
  ai_model?: string;
  status?: string;
  created_at: string;
  updated_at: string;
  session_state?: any;
}

export interface ProjectMetadata {
  id: string;
  project_id: string;
  user_id: string;
  studio_type: StudioType;
  session_state: any;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectOptions {
  userId: string;
  studioType: StudioType;
  name: string;
  description?: string;
  model?: string;
  sessionState: any;
}

export interface UpdateProjectStateOptions {
  projectId: string;
  sessionState: any;
}

/**
 * Create a new studio project with metadata
 */
export async function createStudioProject(
  options: CreateProjectOptions
): Promise<{ success: boolean; projectId?: string; error?: string }> {
  try {
    const { userId, studioType, name, description, model, sessionState } = options;

    console.log('🎨 Creating studio project:', {
      userId,
      studioType,
      name: name.substring(0, 50)
    });

    const projectId = `${studioType}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const { error: projectError } = await supabase
      .from('projects')
      .insert({
        id: projectId,
        user_id: userId,
        name,
        type: studioType,
        description: description || name,
        ai_model: model || 'default',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (projectError) {
      console.error('❌ Error creating project:', projectError);
      return { success: false, error: projectError.message };
    }

    const { error: metadataError } = await supabase
      .from('project_metadata')
      .insert({
        project_id: projectId,
        user_id: userId,
        studio_type: studioType,
        session_state: sessionState,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (metadataError) {
      console.error('❌ Error creating project metadata:', metadataError);
      await supabase.from('projects').delete().eq('id', projectId);
      return { success: false, error: metadataError.message };
    }

    console.log('✅ Studio project created successfully:', projectId);
    return { success: true, projectId };

  } catch (error: any) {
    console.error('❌ Exception creating studio project:', error);
    return { success: false, error: error.message || 'Failed to create project' };
  }
}

/**
 * Update project session state
 */
export async function updateProjectState(
  options: UpdateProjectStateOptions
): Promise<{ success: boolean; error?: string }> {
  try {
    const { projectId, sessionState } = options;

    console.log('💾 Updating project state:', projectId);

    const { error: metadataError } = await supabase
      .from('project_metadata')
      .update({
        session_state: sessionState,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId);

    if (metadataError) {
      console.error('❌ Error updating project metadata:', metadataError);
      return { success: false, error: metadataError.message };
    }

    const { error: projectError } = await supabase
      .from('projects')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (projectError) {
      console.error('❌ Error updating project timestamp:', projectError);
    }

    console.log('✅ Project state updated successfully');
    return { success: true };

  } catch (error: any) {
    console.error('❌ Exception updating project state:', error);
    return { success: false, error: error.message || 'Failed to update project' };
  }
}

/**
 * Load project with metadata
 */
export async function loadProject(
  projectId: string
): Promise<{ success: boolean; project?: StudioProject; error?: string }> {
  try {
    console.log('📂 Loading project:', projectId);

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (projectError || !project) {
      console.error('❌ Error loading project:', projectError);
      return { success: false, error: projectError?.message || 'Project not found' };
    }

    const { data: metadata, error: metadataError } = await supabase
      .from('project_metadata')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (metadataError) {
      console.error('❌ Error loading project metadata:', metadataError);
    }

    const completeProject: StudioProject = {
      ...project,
      session_state: metadata?.session_state || {}
    };

    console.log('✅ Project loaded successfully');
    return { success: true, project: completeProject };

  } catch (error: any) {
    console.error('❌ Exception loading project:', error);
    return { success: false, error: error.message || 'Failed to load project' };
  }
}

/**
 * Get all projects for a user by studio type
 */
export async function getUserProjects(
  userId: string,
  studioType?: StudioType
): Promise<{ success: boolean; projects?: StudioProject[]; error?: string }> {
  try {
    console.log('📋 Fetching user projects:', { userId, studioType });

    let query = supabase
      .from('projects')
      .select(`
        *,
        project_metadata (*)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (studioType) {
      query = query.eq('type', studioType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching projects:', error);
      return { success: false, error: error.message };
    }

    const projects: StudioProject[] = (data || []).map((proj: any) => ({
      ...proj,
      session_state: proj.project_metadata?.[0]?.session_state || {}
    }));

    console.log(`✅ Fetched ${projects.length} projects`);
    return { success: true, projects };

  } catch (error: any) {
    console.error('❌ Exception fetching projects:', error);
    return { success: false, error: error.message || 'Failed to fetch projects' };
  }
}

/**
 * Delete a project and its metadata
 */
export async function deleteProject(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🗑️ Deleting project:', projectId);

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('❌ Error deleting project:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Project deleted successfully');
    return { success: true };

  } catch (error: any) {
    console.error('❌ Exception deleting project:', error);
    return { success: false, error: error.message || 'Failed to delete project' };
  }
}

/**
 * Generate a project name based on content
 */
export function generateStudioProjectName(
  studioType: StudioType,
  prompt: string,
  maxLength: number = 50
): string {
  const typeLabels: Record<StudioType, string> = {
    image: 'Image',
    video: 'Video',
    music: 'Music',
    tts: 'Voice',
    voice: 'Voice',
    ppt: 'Presentation'
  };

  const label = typeLabels[studioType];
  const truncatedPrompt = prompt.length > maxLength
    ? prompt.substring(0, maxLength) + '...'
    : prompt;

  return `${label}: ${truncatedPrompt}`;
}
