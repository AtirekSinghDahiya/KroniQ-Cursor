/**
 * Studio Project Service
 * Handles studio-specific project operations using Firestore
 */

import {
  createProject,
  getProjects,
  getProject,
  updateProject as updateFirestoreProject,
  deleteProject as deleteFirestoreProject,
  type Project
} from './firestoreService';

export type StudioType = 'image' | 'video' | 'music' | 'tts' | 'voice' | 'ppt';

export interface StudioProject extends Project {
  session_state?: any;
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
    const { studioType, name, description, model, sessionState } = options;

    const project = await createProject(
      name,
      studioType,
      description || name,
      model || 'default',
      sessionState
    );

    return { success: true, projectId: project.id };

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

    await updateFirestoreProject(projectId, { sessionState });

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
    const project = await getProject(projectId);

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    const studioProject: StudioProject = {
      ...project,
      session_state: project.sessionState || {}
    };

    return { success: true, project: studioProject };

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
    const projects = await getProjects(studioType);

    const studioProjects: StudioProject[] = projects.map(proj => ({
      ...proj,
      session_state: proj.sessionState || {}
    }));

    return { success: true, projects: studioProjects };

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
    await deleteFirestoreProject(projectId);

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
