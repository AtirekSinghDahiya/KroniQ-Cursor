/**
 * Supabase Client Compatibility Layer
 * 
 * This file provides a compatibility layer that redirects Supabase calls to Firestore.
 * The original Supabase project is no longer available, so all data is now stored in Firebase.
 */

import { db, auth } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Mock Supabase auth that uses Firebase Auth
const supabaseAuth = {
  getSession: async () => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      return {
        data: {
          session: {
            user: {
              id: user.uid,
              email: user.email,
              user_metadata: {
                name: user.displayName,
                avatar_url: user.photoURL,
              },
            },
            access_token: token,
          },
        },
        error: null,
      };
    }
    return { data: { session: null }, error: null };
  },
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        callback('SIGNED_IN', {
          user: {
            id: user.uid,
            email: user.email,
            user_metadata: {
              name: user.displayName,
              avatar_url: user.photoURL,
            },
          },
          access_token: token,
        });
      } else {
        callback('SIGNED_OUT', null);
      }
    });
    return { data: { subscription: { unsubscribe } } };
  },
  signOut: async () => {
    await signOut(auth);
    return { error: null };
  },
};

// Mock Supabase client that redirects to Firestore
class FirestoreCompatClient {
  private tableName: string = '';
  private conditions: { column: string; value: any }[] = [];
  private orderByColumn: string = '';
  private orderDirection: 'asc' | 'desc' = 'desc';
  private selectColumns: string = '*';
  private insertData: any = null;
  private updateData: any = null;

  from(table: string) {
    this.tableName = table;
    this.conditions = [];
    this.orderByColumn = '';
    this.selectColumns = '*';
    this.insertData = null;
    this.updateData = null;
    return this;
  }

  select(columns: string = '*') {
    this.selectColumns = columns;
    return this;
  }

  eq(column: string, value: any) {
    this.conditions.push({ column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderByColumn = column;
    this.orderDirection = options?.ascending ? 'asc' : 'desc';
    return this;
  }

  insert(data: any) {
    this.insertData = data;
    return this;
  }

  update(data: any) {
    this.updateData = data;
    return this;
  }

  delete() {
    return this;
  }

  async maybeSingle(): Promise<{ data: any; error: any }> {
    return this.single();
  }

  async single(): Promise<{ data: any; error: any }> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        return { data: null, error: { message: 'Not authenticated' } };
      }

      // Handle profiles table -> users collection
      if (this.tableName === 'profiles') {
        const idCondition = this.conditions.find(c => c.column === 'id');
        const docId = idCondition?.value || userId;
        const docRef = doc(db, 'users', docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            data: {
              id: docSnap.id,
              email: data.email,
              display_name: data.displayName,
              photo_url: data.photoURL,
              tokens_balance: (data.tokensLimit || 150000) - (data.tokensUsed || 0),
              free_tokens_balance: data.tokensLimit || 150000,
              paid_tokens_balance: 0,
              current_tier: data.plan || 'free',
              created_at: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              updated_at: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            },
            error: null
          };
        }
        return { data: null, error: null };
      }

      // Handle projects table
      if (this.tableName === 'projects') {
        const idCondition = this.conditions.find(c => c.column === 'id');
        if (idCondition) {
          const docRef = doc(db, 'users', userId, 'projects', idCondition.value);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
          }
        }
        return { data: null, error: null };
      }

      // Handle messages table - return null gracefully (messages are stored in Firestore)
      if (this.tableName === 'messages') {
        const projectIdCondition = this.conditions.find(c => c.column === 'project_id');
        if (projectIdCondition) {
          try {
            const messagesRef = collection(db, 'users', userId, 'projects', projectIdCondition.value, 'messages');
            const q = query(messagesRef, orderBy('createdAt', 'asc'));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
              const firstDoc = snapshot.docs[0];
              const data = firstDoc.data();
              return {
                data: {
                  id: firstDoc.id,
                  project_id: projectIdCondition.value,
                  role: data.role,
                  content: data.content,
                  created_at: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                },
                error: null
              };
            }
          } catch (error) {
            // Messages collection might not exist yet - that's okay
          }
        }
        return { data: null, error: null };
      }

      // Handle user_preferences table - map to user profile preferences
      if (this.tableName === 'user_preferences') {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            data: {
              id: docSnap.id,
              user_id: docSnap.id,
              theme: data.theme || 'dark',
              language: data.language || 'en',
              ai_personality: data.aiPersonality || 'balanced',
              ai_creativity_level: data.aiCreativityLevel || 5,
              ai_response_length: data.aiResponseLength || 'medium',
              created_at: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              updated_at: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            },
            error: null
          };
        }
        return { data: null, error: null };
      }

      return { data: null, error: { message: `Table ${this.tableName} not implemented` } };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async then(resolve: (result: { data: any; error: any }) => void): Promise<void> {
    const result = await this.execute();
    resolve(result);
  }

  private async execute(): Promise<{ data: any; error: any; count?: number }> {
    try {
      const userId = auth.currentUser?.uid;

      // Handle insert
      if (this.insertData) {
        if (this.tableName === 'profiles') {
          const docId = this.insertData.id || userId;
          if (!docId) return { data: null, error: { message: 'No user ID' } };

          await setDoc(doc(db, 'users', docId), {
            email: this.insertData.email,
            displayName: this.insertData.display_name,
            photoURL: this.insertData.avatar_url,
            tokensLimit: this.insertData.tokens_balance || 150000,
            tokensUsed: 0,
            plan: 'free',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          return { data: null, error: null };
        }

        // Handle messages insert
        if (this.tableName === 'messages') {
          if (!userId) return { data: null, error: { message: 'Not authenticated' } };
          const projectId = this.insertData.project_id;
          if (!projectId) return { data: null, error: { message: 'No project ID' } };

          const messageData = {
            projectId: projectId,
            role: this.insertData.role,
            content: this.insertData.content,
            metadata: this.insertData.payload || {},
            fileAttachments: this.insertData.file_attachments ? JSON.parse(this.insertData.file_attachments) : [],
            createdAt: serverTimestamp(),
          };

          const docRef = await addDoc(
            collection(db, 'users', userId, 'projects', projectId, 'messages'),
            messageData
          );

          // Update project timestamp
          try {
            await updateDoc(doc(db, 'users', userId, 'projects', projectId), {
              updatedAt: serverTimestamp(),
            });
          } catch (e) {
            // Project might not exist - that's okay
          }

          return {
            data: {
              id: docRef.id,
              project_id: projectId,
              role: this.insertData.role,
              content: this.insertData.content,
              created_at: new Date().toISOString(),
            },
            error: null
          };
        }

        // Handle projects insert
        if (this.tableName === 'projects') {
          if (!userId) return { data: null, error: { message: 'Not authenticated' } };

          const projectData = {
            userId: userId,
            name: this.insertData.name,
            type: this.insertData.type || 'chat',
            description: this.insertData.description || '',
            aiModel: this.insertData.ai_model || 'default',
            status: this.insertData.status || 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          const docRef = await addDoc(
            collection(db, 'users', userId, 'projects'),
            projectData
          );

          return {
            data: {
              id: docRef.id,
              user_id: userId,
              name: this.insertData.name,
              type: this.insertData.type || 'chat',
              description: this.insertData.description || '',
              ai_model: this.insertData.ai_model || 'default',
              status: this.insertData.status || 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null
          };
        }

        // Handle user_preferences insert
        if (this.tableName === 'user_preferences') {
          if (!userId) return { data: null, error: { message: 'Not authenticated' } };

          const prefsData = {
            aiTone: this.insertData.ai_tone || 'friendly',
            aiLength: this.insertData.ai_length || 'balanced',
            aiExpertise: this.insertData.ai_expertise || 'intermediate',
            defaultLanguage: this.insertData.default_language || 'en',
            theme: 'dark',
            updatedAt: serverTimestamp(),
          };

          // Update the user document with preferences
          await updateDoc(doc(db, 'users', userId), prefsData);

          return {
            data: {
              user_id: userId,
              ai_tone: this.insertData.ai_tone || 'friendly',
              ai_length: this.insertData.ai_length || 'balanced',
              ai_expertise: this.insertData.ai_expertise || 'intermediate',
              default_language: this.insertData.default_language || 'en',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null
          };
        }

        return { data: null, error: { message: 'Insert not implemented for ' + this.tableName } };
      }

      // Handle update
      if (this.updateData) {
        if (this.tableName === 'profiles') {
          const idCondition = this.conditions.find(c => c.column === 'id');
          const docId = idCondition?.value || userId;
          if (!docId) return { data: null, error: { message: 'No user ID' } };

          const updates: any = {};
          if (this.updateData.display_name !== undefined) updates.displayName = this.updateData.display_name;
          if (this.updateData.photo_url !== undefined) updates.photoURL = this.updateData.photo_url;
          if (this.updateData.tokens_balance !== undefined) updates.tokensLimit = this.updateData.tokens_balance;
          updates.updatedAt = serverTimestamp();

          await updateDoc(doc(db, 'users', docId), updates);
          return { data: null, error: null };
        }

        // Handle projects update
        if (this.tableName === 'projects') {
          if (!userId) return { data: null, error: { message: 'Not authenticated' } };
          const idCondition = this.conditions.find(c => c.column === 'id');
          if (!idCondition) return { data: null, error: { message: 'No project ID' } };

          const updates: any = { updatedAt: serverTimestamp() };
          if (this.updateData.name !== undefined) updates.name = this.updateData.name;
          if (this.updateData.description !== undefined) updates.description = this.updateData.description;
          if (this.updateData.status !== undefined) updates.status = this.updateData.status;
          if (this.updateData.ai_model !== undefined) updates.aiModel = this.updateData.ai_model;
          if (this.updateData.updated_at !== undefined) updates.updatedAt = serverTimestamp();

          await updateDoc(doc(db, 'users', userId, 'projects', idCondition.value), updates);
          return { data: null, error: null };
        }

        // Handle user_preferences update
        if (this.tableName === 'user_preferences') {
          if (!userId) return { data: null, error: { message: 'Not authenticated' } };

          const updates: any = { updatedAt: serverTimestamp() };
          if (this.updateData.theme !== undefined) updates.theme = this.updateData.theme;
          if (this.updateData.language !== undefined) updates.language = this.updateData.language;
          if (this.updateData.ai_personality !== undefined) updates.aiPersonality = this.updateData.ai_personality;
          if (this.updateData.ai_creativity_level !== undefined) updates.aiCreativityLevel = this.updateData.ai_creativity_level;
          if (this.updateData.ai_response_length !== undefined) updates.aiResponseLength = this.updateData.ai_response_length;

          await updateDoc(doc(db, 'users', userId), updates);
          return { data: null, error: null };
        }

        return { data: null, error: { message: 'Update not implemented for ' + this.tableName } };
      }

      // Handle select with count
      if (this.selectColumns.includes('count')) {
        if (this.tableName === 'profiles') {
          const usersRef = collection(db, 'users');
          const snapshot = await getDocs(usersRef);
          return { data: null, error: null, count: snapshot.size };
        }
      }

      return { data: null, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  // RPC function mock
  async rpc(functionName: string, params?: any): Promise<{ data: any; error: any }> {
    console.log(`RPC call to ${functionName} with params:`, params);

    // Mock common RPC functions
    if (functionName === 'set_config') {
      return { data: null, error: null };
    }

    if (functionName === 'get_active_subscription') {
      return { data: { active: false }, error: null };
    }

    if (functionName === 'deduct_tokens') {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return { data: null, error: { message: 'Not authenticated' } };

        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const currentUsed = data.tokensUsed || 0;
          await updateDoc(docRef, {
            tokensUsed: currentUsed + (params?.p_tokens || 0),
            updatedAt: serverTimestamp()
          });
          return { data: { success: true }, error: null };
        }
        return { data: null, error: { message: 'User not found' } };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }

    return { data: null, error: { message: `RPC ${functionName} not implemented` } };
  }

  channel(name: string) {
    return {
      on: () => this.channel(name),
      subscribe: () => ({ unsubscribe: () => { } }),
    };
  }

  removeChannel(channel: any) {
    // No-op for compatibility
  }

  // Add auth property for compatibility
  auth = supabaseAuth;
}

export const supabase = new FirestoreCompatClient() as any;

export const setSupabaseUserContext = async () => {
  // No-op - Firestore uses Firebase Auth automatically
};

// Re-export types for compatibility
export interface Project {
  id: string;
  user_id: string;
  name: string;
  type: 'chat' | 'code' | 'design' | 'video' | 'image' | 'music' | 'voice' | 'ppt';
  description?: string;
  ai_model?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface Message {
  id: string;
  project_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
  attachments?: MessageAttachment[];
  generating?: boolean;
  generationType?: 'image' | 'video' | 'audio' | 'text';
  generationProgress?: number;
  generatedContent?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    prompt?: string;
  };
}
