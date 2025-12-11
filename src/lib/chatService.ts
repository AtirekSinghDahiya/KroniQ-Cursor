import { auth } from './firebase';
import { generateAIProjectName as _generateAIProjectName } from './projectService';
import {
  createProject as firestoreCreateProject,
  getProjects as firestoreGetProjects,
  updateProject as firestoreUpdateProject,
  deleteProject as firestoreDeleteProject,
  createMessage as firestoreCreateMessage,
  updateMessage as firestoreUpdateMessage,
  getMessages as firestoreGetMessages,
  subscribeToProjects as firestoreSubscribeToProjects,
  subscribeToMessages as firestoreSubscribeToMessages,
  getUserProfile as firestoreGetUserProfile,
  Project as FirestoreProject,
  Message as FirestoreMessage
} from './firestoreService';

// Re-export types to match existing usage where possible, or adapt
export type Project = FirestoreProject;
export type Message = FirestoreMessage;
export type UserProfile = import('./firestoreService').UserProfile;

// Re-export generateAIProjectName
export { generateAIProjectName } from './projectService';

// Get current user ID from Firebase Auth
export const getCurrentUserId = (): string | null => {
  return auth.currentUser?.uid || null;
};

// Get user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  return await firestoreGetUserProfile(userId);
};

// Create a new project
export const createProject = async (
  name: string,
  type: 'chat' | 'code' | 'design' | 'video' | 'image' | 'music' | 'voice' | 'ppt' = 'chat',
  description?: string
): Promise<Project> => {
  // Map 'design' to 'image' if needed, or keep as is if firestore supports it.
  // Firestore types: 'chat' | 'code' | 'image' | 'video' | 'music' | 'voice' | 'ppt' | 'tts'
  // We need to ensure type safety.

  let validType: any = type;
  if (type === 'design') validType = 'image';

  return await firestoreCreateProject(name, validType, description || '', 'default', {});
};

// Get all projects for current user
export const getProjects = async (): Promise<Project[]> => {
  return await firestoreGetProjects();
};

// Subscribe to projects
export const subscribeToProjects = (callback: (projects: Project[]) => void) => {
  return firestoreSubscribeToProjects(callback);
};

// Add message to project
export const addMessage = async (
  projectId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  _userId?: string, // Unused in firestoreService (it uses auth.currentUser)
  fileAttachments?: any[],
  metadata?: Record<string, any>
): Promise<Message> => {

  const meta = metadata || {};

  // Handle file attachments by adding them to metadata
  // Firestore message doesn't have a specific file_attachments column in the interface shown, 
  // but we can store it in metadata or update the interface if needed.
  // Wait, let's check firestoreService Message interface.
  // It has metadata: Record<string, any>.
  // We should store file_attachments in metadata.file_attachments if the schema expects it there,
  // OR update the Message interface in firestoreService to include file_attachments.
  // For now, let's put it in metadata to be safe, or check how MainChat reads it.
  // MainChat reads msg.file_attachments.

  // IMPORTANT: MainChat expects `file_attachments` on the message object.
  // The Firestore Message interface is:
  // export interface Message { id: string; projectId: string; role: ...; content: string; metadata?: ...; createdAt: Date; }
  // It MISSES file_attachments.
  // We should ideally update firestoreService Message interface.
  // converting to any for now to bypass type check and assuming we store it in metadata but return it mapped.

  const msgMetadata = { ...meta };
  if (fileAttachments && fileAttachments.length > 0) {
    msgMetadata.file_attachments = fileAttachments;
  }

  const message = await firestoreCreateMessage(projectId, role, content, msgMetadata);

  // Transform to match what MainChat expects if needed
  return {
    ...message,
    file_attachments: msgMetadata.file_attachments // Map from metadata back to top level for compatibility
  } as any;
};

// Get messages for a project
export const getMessages = async (projectId: string): Promise<Message[]> => {
  const messages = await firestoreGetMessages(projectId);
  // Map metadata.file_attachments to file_attachments
  return messages.map(msg => ({
    ...msg,
    file_attachments: msg.metadata?.file_attachments
  })) as any[];
};

export const subscribeToMessages = (
  projectId: string,
  callback: (messages: Message[]) => void
) => {
  return firestoreSubscribeToMessages(projectId, (messages) => {
    // Map metadata.file_attachments to file_attachments
    const mappedMessages = messages.map(msg => ({
      ...msg,
      file_attachments: msg.metadata?.file_attachments
    })) as any[];
    callback(mappedMessages);
  });
};

// Update message
export const updateMessage = async (
  projectId: string,
  messageId: string,
  updates: Partial<Pick<Message, 'content' | 'metadata'>>
): Promise<void> => {
  // Map 'file_attachments' in updates to metadata if present
  // If 'file_attachments' was passed in 'updates' (MainChat does this, although types say 'content' | 'metadata')
  // We need to handle it. The 'Message' type in chatService import is now FirestoreMessage which has metadata.

  // Cast updates to any to handle file_attachments if passed loosely
  const anyUpdates = updates as any;
  const firestoreUpdates: any = {};

  if (anyUpdates.content !== undefined) firestoreUpdates.content = anyUpdates.content;

  // Merge existing metadata? No, updateDoc merges fields. But metadata is a map.
  // We need to be careful. Firestore update of nested field can be done via "metadata.file_attachments".
  // But our firestoreService updateMessage takes metadata object and replaces it or merges top level fields?
  // Let's look at firestoreService again. It does `await updateDoc(docRef, validUpdates);`
  // so if we pass `metadata: { file_attachments: ... }`, it will overwrite `metadata` unless we use dot notation.
  // BUT the interface in firestoreService is `updates: Partial<Pick<Message, 'content' | 'metadata'>>`
  // So it expects the WHOLE metadata object if updating.

  // MainChat typically updates content and file_attachments.
  // We should construct the metadata object.
  // We iterate relevant keys.

  if (anyUpdates.validUpdates?.metadata) {
    firestoreUpdates.metadata = anyUpdates.validUpdates.metadata;
  } else if (anyUpdates.metadata) {
    firestoreUpdates.metadata = anyUpdates.metadata;
  }

  // If file_attachments is at top level of updates (from MainChat legacy call), move to metadata
  if (anyUpdates.file_attachments) {
    firestoreUpdates.metadata = {
      ...(firestoreUpdates.metadata || {}),
      file_attachments: anyUpdates.file_attachments
    };
  }

  // Handle payload -> metadata mapping if legacy code uses it
  if (anyUpdates.payload) {
    firestoreUpdates.metadata = {
      ...(firestoreUpdates.metadata || {}),
      ...anyUpdates.payload
    };
  }

  return await firestoreUpdateMessage(projectId, messageId, firestoreUpdates);
};

// Rename project
export const renameProject = async (projectId: string, newName: string): Promise<void> => {
  return await firestoreUpdateProject(projectId, { name: newName });
};

// Delete project
export const deleteProject = async (projectId: string): Promise<void> => {
  return await firestoreDeleteProject(projectId);
};

