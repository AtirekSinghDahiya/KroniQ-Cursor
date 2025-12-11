/**
 * Data Service - Re-exports from Firestore Service
 * This file maintains backwards compatibility with existing imports
 */

export {
  // Types
  type UserProfile,
  type Project,
  type Message,
  type TokenPack,
  type AnalyticsEvent,

  // User Profile functions
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  deductTokens,
  addTokens,

  // Project functions
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,

  // Message functions
  createMessage,
  getMessages,

  // Token Pack functions
  getTokenPacks,
  getDefaultTokenPacks,
  getTotalTokens,

  // Real-time subscriptions
  subscribeToProjects,
  subscribeToMessages,

  // Analytics
  trackEvent,

  // Stats
  getAppStats,
} from './firestoreService';
