/**
 * Firestore Data Service
 * Replaces Supabase with Firebase Firestore for all data operations
 */

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
    limit,
    addDoc,
    serverTimestamp,
    Timestamp,
    increment,
    onSnapshot,
    writeBatch
} from 'firebase/firestore';
import { db, auth } from './firebase';

// ==================== TYPES ====================

export interface UserProfile {
    id: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
    plan: 'free' | 'pro' | 'enterprise';
    tokensUsed: number;
    tokensLimit: number;
    aiPersonality: string;
    aiCreativityLevel: number;
    aiResponseLength: string;
    createdAt: Date;
    updatedAt: Date;
    lastTokenResetAt?: Date; // Tracks when tokens were last reset
}

export interface Project {
    id: string;
    userId: string;
    name: string;
    type: 'chat' | 'code' | 'image' | 'video' | 'music' | 'voice' | 'ppt' | 'tts';
    description: string;
    aiModel: string;
    status: 'active' | 'archived';
    sessionState?: any;
    createdAt: Date;
    updatedAt: Date;
}

export interface Message {
    id: string;
    projectId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: Record<string, any>;
    file_attachments?: any[]; // Added for compatibility with MainChat
    createdAt: Date;
}

export interface TokenPack {
    id: string;
    name: string;
    tokens: number;
    priceUsd: number;
    recurringPriceUsd: number;
    popular: boolean;
    bonusTokens: number;
    active: boolean;
}

export interface AnalyticsEvent {
    id?: string;
    userId?: string;
    eventType: string;
    eventName: string;
    eventData?: Record<string, any>;
    pageName?: string;
    timestamp: Date;
}

// ==================== HELPERS ====================

const getCurrentUserId = (): string => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return user.uid;
};

const timestampToDate = (timestamp: any): Date => {
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    if (timestamp instanceof Date) {
        return timestamp;
    }
    if (typeof timestamp === 'string') {
        return new Date(timestamp);
    }
    return new Date();
};

// ==================== USER PROFILES ====================

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        const data = docSnap.data();
        return {
            id: docSnap.id,
            email: data.email || '',
            displayName: data.displayName || null,
            photoURL: data.photoURL || null,
            plan: data.plan || 'free',
            tokensUsed: data.tokensUsed || 0,
            tokensLimit: data.tokensLimit || 150000,
            aiPersonality: data.aiPersonality || 'balanced',
            aiCreativityLevel: data.aiCreativityLevel || 5,
            aiResponseLength: data.aiResponseLength || 'medium',
            createdAt: timestampToDate(data.createdAt),
            updatedAt: timestampToDate(data.updatedAt),
        };
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
};

export const createUserProfile = async (
    userId: string,
    email: string,
    displayName: string | null = null,
    photoURL: string | null = null,
    initialTokens: number = 150000
): Promise<UserProfile> => {
    const now = new Date();
    const profile: Omit<UserProfile, 'id'> = {
        email,
        displayName,
        photoURL,
        plan: 'free',
        tokensUsed: 0,
        tokensLimit: initialTokens,
        aiPersonality: 'balanced',
        aiCreativityLevel: 5,
        aiResponseLength: 'medium',
        createdAt: now,
        updatedAt: now,
        lastTokenResetAt: now, // Track when tokens were first allocated
    };

    await setDoc(doc(db, 'users', userId), {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastTokenResetAt: serverTimestamp(), // Set initial token reset timestamp
    });

    return { id: userId, ...profile };
};

export const updateUserProfile = async (
    userId: string,
    updates: Partial<UserProfile>
): Promise<void> => {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
};

export const deductTokens = async (userId: string, amount: number): Promise<boolean> => {
    try {
        const profile = await getUserProfile(userId);
        if (!profile) return false;

        const newUsed = (profile.tokensUsed || 0) + amount;
        await updateUserProfile(userId, { tokensUsed: newUsed });
        return true;
    } catch (error) {
        console.error('Error deducting tokens:', error);
        return false;
    }
};

export const addTokens = async (userId: string, amount: number): Promise<boolean> => {
    try {
        const profile = await getUserProfile(userId);
        if (!profile) return false;

        const newLimit = (profile.tokensLimit || 0) + amount;
        await updateUserProfile(userId, { tokensLimit: newLimit });
        return true;
    } catch (error) {
        console.error('Error adding tokens:', error);
        return false;
    }
};

// ==================== PROJECTS ====================

export const createProject = async (
    name: string,
    type: Project['type'],
    description: string = '',
    aiModel: string = 'default',
    sessionState?: any
): Promise<Project> => {
    const userId = getCurrentUserId();
    const now = new Date();

    const projectData = {
        userId,
        name,
        type,
        description,
        aiModel,
        status: 'active' as const,
        sessionState: sessionState || {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'users', userId, 'projects'), projectData);

    return {
        id: docRef.id,
        userId,
        name,
        type,
        description,
        aiModel,
        status: 'active',
        sessionState,
        createdAt: now,
        updatedAt: now,
    };
};

export const getProjects = async (type?: Project['type']): Promise<Project[]> => {
    const userId = getCurrentUserId();
    const projectsRef = collection(db, 'users', userId, 'projects');

    try {
        // Try to use the type filter directly (requires composite index)
        let q = query(projectsRef, orderBy('updatedAt', 'desc'));
        if (type) {
            q = query(projectsRef, where('type', '==', type), orderBy('updatedAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                userId: data.userId,
                name: data.name,
                type: data.type,
                description: data.description || '',
                aiModel: data.aiModel || 'default',
                status: data.status || 'active',
                sessionState: data.sessionState,
                createdAt: timestampToDate(data.createdAt),
                updatedAt: timestampToDate(data.updatedAt),
            };
        });
    } catch (error: any) {
        // Fallback: if index is missing, fetch all and filter client-side
        if (error.code === 'failed-precondition' || error.message?.includes('index')) {
            console.warn('⚠️ Firestore index missing, falling back to client-side filtering');
            const allProjects = query(projectsRef, orderBy('updatedAt', 'desc'));
            const snapshot = await getDocs(allProjects);
            const projects = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    userId: data.userId,
                    name: data.name,
                    type: data.type,
                    description: data.description || '',
                    aiModel: data.aiModel || 'default',
                    status: data.status || 'active',
                    sessionState: data.sessionState,
                    createdAt: timestampToDate(data.createdAt),
                    updatedAt: timestampToDate(data.updatedAt),
                };
            });
            // Filter by type on client side
            return type ? projects.filter(p => p.type === type) : projects;
        }
        throw error;
    }
};

export const getProject = async (projectId: string): Promise<Project | null> => {
    const userId = getCurrentUserId();
    const docRef = doc(db, 'users', userId, 'projects', projectId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
        id: docSnap.id,
        userId: data.userId,
        name: data.name,
        type: data.type,
        description: data.description || '',
        aiModel: data.aiModel || 'default',
        status: data.status || 'active',
        sessionState: data.sessionState,
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt),
    };
};

export const updateProject = async (
    projectId: string,
    updates: Partial<Project>
): Promise<void> => {
    const userId = getCurrentUserId();
    const docRef = doc(db, 'users', userId, 'projects', projectId);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
};

export const deleteProject = async (projectId: string): Promise<void> => {
    const userId = getCurrentUserId();

    // Delete all messages first
    const messagesRef = collection(db, 'users', userId, 'projects', projectId, 'messages');
    const messagesSnapshot = await getDocs(messagesRef);
    const batch = writeBatch(db);
    messagesSnapshot.docs.forEach(msgDoc => {
        batch.delete(msgDoc.ref);
    });
    await batch.commit();

    // Delete the project
    await deleteDoc(doc(db, 'users', userId, 'projects', projectId));
};

// ==================== MESSAGES ====================

export const createMessage = async (
    projectId: string,
    role: Message['role'],
    content: string,
    metadata?: Record<string, any>
): Promise<Message> => {
    const userId = getCurrentUserId();
    const now = new Date();

    const messageData = {
        projectId,
        role,
        content,
        metadata: metadata || {},
        createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(
        collection(db, 'users', userId, 'projects', projectId, 'messages'),
        messageData
    );

    // Update project timestamp
    await updateProject(projectId, {});

    return {
        id: docRef.id,
        projectId,
        role,
        content,
        metadata,
        createdAt: now,
    };
};

export const getMessages = async (projectId: string): Promise<Message[]> => {
    const userId = getCurrentUserId();
    const messagesRef = collection(db, 'users', userId, 'projects', projectId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            projectId: data.projectId,
            role: data.role,
            content: data.content,
            metadata: data.metadata,
            createdAt: timestampToDate(data.createdAt),
        };
    });
};

export const updateMessage = async (
    projectId: string,
    messageId: string,
    updates: Partial<Pick<Message, 'content' | 'metadata'>>
): Promise<void> => {
    const userId = getCurrentUserId();
    const docRef = doc(db, 'users', userId, 'projects', projectId, 'messages', messageId);

    // Valid updates
    const validUpdates: any = {};
    if (updates.content !== undefined) validUpdates.content = updates.content;
    if (updates.metadata !== undefined) validUpdates.metadata = updates.metadata;

    // Only update if there are changes
    if (Object.keys(validUpdates).length > 0) {
        await updateDoc(docRef, validUpdates);
    }

    // Update project timestamp
    await updateProject(projectId, {});
};

// ==================== TOKEN PACKS ====================

export const getTokenPacks = async (): Promise<TokenPack[]> => {
    try {
        const packsRef = collection(db, 'tokenPacks');
        const q = query(packsRef, where('active', '==', true), orderBy('priceUsd', 'asc'));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            // Return default packs if none exist in Firestore
            return getDefaultTokenPacks();
        }

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                tokens: data.tokens,
                priceUsd: data.priceUsd,
                recurringPriceUsd: data.priceUsd * 0.9,
                popular: data.popular || false,
                bonusTokens: data.bonusTokens || 0,
                active: data.active,
            };
        });
    } catch (error) {
        console.error('Error fetching token packs:', error);
        return getDefaultTokenPacks();
    }
};

export const getDefaultTokenPacks = (): TokenPack[] => [
    {
        id: 'starter',
        name: 'Starter',
        tokens: 400000,
        priceUsd: 2,
        recurringPriceUsd: 1.8,
        popular: false,
        bonusTokens: 0,
        active: true,
    },
    {
        id: 'popular',
        name: 'Popular',
        tokens: 1000000,
        priceUsd: 5,
        recurringPriceUsd: 4.5,
        popular: true,
        bonusTokens: 0,
        active: true,
    },
    {
        id: 'power',
        name: 'Power User',
        tokens: 2000000,
        priceUsd: 10,
        recurringPriceUsd: 9,
        popular: false,
        bonusTokens: 0,
        active: true,
    },
];

export const initializeTokenPacks = async (): Promise<void> => {
    const packs = getDefaultTokenPacks();
    const batch = writeBatch(db);

    for (const pack of packs) {
        const docRef = doc(db, 'tokenPacks', pack.id);
        batch.set(docRef, {
            name: pack.name,
            tokens: pack.tokens,
            priceUsd: pack.priceUsd,
            popular: pack.popular,
            bonusTokens: pack.bonusTokens,
            active: pack.active,
            createdAt: serverTimestamp(),
        });
    }

    await batch.commit();
    console.log('✅ Token packs initialized in Firestore');
};

// ==================== ANALYTICS ====================

export const trackEvent = async (event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void> => {
    try {
        const userId = auth.currentUser?.uid;
        await addDoc(collection(db, 'analytics'), {
            ...event,
            userId,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error tracking event:', error);
    }
};

// ==================== SUBSCRIPTIONS ====================

export const subscribeToProjects = (
    callback: (projects: Project[]) => void,
    type?: Project['type']
): (() => void) => {
    try {
        const userId = getCurrentUserId();
        const projectsRef = collection(db, 'users', userId, 'projects');

        let q = query(projectsRef, orderBy('updatedAt', 'desc'));
        if (type) {
            q = query(projectsRef, where('type', '==', type), orderBy('updatedAt', 'desc'));
        }

        return onSnapshot(q, (snapshot) => {
            const projects = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    userId: data.userId,
                    name: data.name,
                    type: data.type,
                    description: data.description || '',
                    aiModel: data.aiModel || 'default',
                    status: data.status || 'active',
                    sessionState: data.sessionState,
                    createdAt: timestampToDate(data.createdAt),
                    updatedAt: timestampToDate(data.updatedAt),
                };
            });
            callback(projects);
        });
    } catch (error) {
        console.error('Error subscribing to projects:', error);
        return () => { };
    }
};

export const subscribeToMessages = (
    projectId: string,
    callback: (messages: Message[]) => void
): (() => void) => {
    try {
        const userId = getCurrentUserId();
        const messagesRef = collection(db, 'users', userId, 'projects', projectId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    projectId: data.projectId,
                    role: data.role,
                    content: data.content,
                    metadata: data.metadata,
                    createdAt: timestampToDate(data.createdAt),
                };
            });
            callback(messages);
        });
    } catch (error) {
        console.error('Error subscribing to messages:', error);
        return () => { };
    }
};

// ==================== STATS ====================

export const getAppStats = async (): Promise<{
    activeUsers: number;
    aiGenerations: number;
    uptime: string;
    userRating: string;
}> => {
    try {
        // Count total users from the 'users' collection
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const activeUsers = usersSnapshot.size;

        // Count AI generations from the 'analytics' collection where eventType is 'generation'
        // Or count all analytics events as a proxy for "activity"
        const analyticsRef = collection(db, 'analytics');
        const generationQuery = query(analyticsRef, where('eventType', '==', 'generation'));
        const generationsSnapshot = await getDocs(generationQuery);
        let aiGenerations = generationsSnapshot.size;

        // If no generation events, fallback to counting all analytics events
        if (aiGenerations === 0) {
            const allAnalyticsSnapshot = await getDocs(analyticsRef);
            aiGenerations = allAnalyticsSnapshot.size;
        }

        // Uptime is typically calculated server-side; use a static value
        const uptime = '99.9%';

        // User rating could come from a feedback collection; use static for now
        const userRating = '4.8/5';

        return {
            activeUsers,
            aiGenerations,
            uptime,
            userRating,
        };
    } catch (error) {
        console.error('Error fetching app stats:', error);
        // Return zeros if there's an error so user knows data didn't load
        return {
            activeUsers: 0,
            aiGenerations: 0,
            uptime: '99.9%',
            userRating: '4.8/5',
        };
    }
};

// Export helper
export const getTotalTokens = (baseTokens: number, bonusTokens: number): number => {
    return baseTokens + bonusTokens;
};

/**
 * Increment usage count for a specific feature
 * This replaces the Supabase increment_usage RPC
 */
export const incrementUsage = async (
    userId: string,
    featureType: 'image' | 'video' | 'music' | 'tts' | 'code' | 'ppt',
    amount: number = 1
): Promise<boolean> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) return false;

        const fieldMap: Record<string, string> = {
            image: 'imagesGenerated',
            video: 'videosGenerated',
            music: 'musicGenerated',
            tts: 'ttsGenerated',
            code: 'codeGenerated',
            ppt: 'pptGenerated'
        };

        const fieldName = fieldMap[featureType];
        if (!fieldName) return false;

        await updateDoc(userRef, {
            [fieldName]: increment(amount),
            updatedAt: serverTimestamp()
        });

        // Also update daily usage stats
        const today = new Date().toISOString().split('T')[0];
        const dailyRef = doc(db, 'daily_usage', `${userId}_${today}`);

        // Check if daily doc exists, if not create it
        const dailyDoc = await getDoc(dailyRef);

        if (!dailyDoc.exists()) {
            await setDoc(dailyRef, {
                userId,
                date: today,
                [fieldName]: amount,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        } else {
            await updateDoc(dailyRef, {
                [fieldName]: increment(amount),
                updatedAt: serverTimestamp()
            });
        }

        return true;
    } catch (error) {
        console.error('Error incrementing usage:', error);
        return false;
    }
};
