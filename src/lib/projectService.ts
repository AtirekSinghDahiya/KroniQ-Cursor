import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Project, ChatMessage } from '../types';
import { callOpenRouter } from './openRouterService';

export const detectProjectType = (message: string): 'chat' | 'code' | 'design' | 'video' => {
  const lowerMessage = message.toLowerCase();

  const codeKeywords = [
    'code', 'programming', 'function', 'api', 'debug', 'algorithm',
    'javascript', 'python', 'react', 'typescript', 'html', 'css',
    'database', 'backend', 'frontend', 'component', 'class', 'variable',
    'build', 'deploy', 'npm', 'git', 'repository', 'framework', 'write code',
    'create function', 'bug', 'error', 'syntax'
  ];

  const designKeywords = [
    'design', 'logo', 'thumbnail', 'poster', 'flyer', 'banner',
    'graphic', 'image', 'photo', 'mockup', 'ui', 'ux', 'layout',
    'color', 'typography', 'branding', 'illustration', 'icon',
    'create design', 'make logo', 'design a', 'visual'
  ];

  const videoKeywords = [
    'video', 'edit', 'editing', 'reel', 'youtube', 'tiktok',
    'clip', 'footage', 'trim', 'cut', 'transition', 'effect',
    'animation', 'timeline', 'export', 'render', 'create video',
    'make video', 'edit video'
  ];

  const codeScore = codeKeywords.filter(keyword => lowerMessage.includes(keyword)).length;
  const designScore = designKeywords.filter(keyword => lowerMessage.includes(keyword)).length;
  const videoScore = videoKeywords.filter(keyword => lowerMessage.includes(keyword)).length;

  const maxScore = Math.max(codeScore, designScore, videoScore);

  if (maxScore === 0) return 'chat';
  if (codeScore === maxScore) return 'code';
  if (designScore === maxScore) return 'design';
  if (videoScore === maxScore) return 'video';

  return 'chat';
};

/**
 * Generate a professional project name using AI
 */
export async function generateAIProjectName(message: string): Promise<string> {
  try {
    console.log('🤖 Generating AI project name for message:', message.substring(0, 50));

    const response = await callOpenRouter(
      [
        {
          role: 'system',
          content: 'You are a professional project naming assistant. Generate a short, professional, and descriptive project name (2-4 words max) based on the user\'s message. Return ONLY the project name, nothing else. Examples: "Marketing Strategy", "E-commerce Website", "Data Analysis", "Budget Planner", "Travel Blog"'
        },
        {
          role: 'user',
          content: message
        }
      ],
      'grok-4-fast' // Use fast model for quick names
    );

    const projectName = response.content.trim().replace(/["\']/g, '');
    console.log('✅ Generated project name:', projectName);
    return projectName;
  } catch (error) {
    console.error('❌ Error generating AI project name:', error);
    // Fallback to simple name
    return generateProjectName('chat', message);
  }
}

export const generateProjectName = (type: string, message: string): string => {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const messagePreview = message.slice(0, 30).trim();

  const typeNames = {
    chat: 'Chat',
    code: 'Code Project',
    design: 'Design Project',
    video: 'Video Project'
  };

  return `${typeNames[type as keyof typeof typeNames]} - ${messagePreview}${message.length > 30 ? '...' : ''} (${timestamp})`;
};

export const createProject = async (
  userId: string,
  message: string,
  aiModel: 'openai' | 'claude' | 'gemini' = 'openai'
): Promise<string> => {
  try {
    console.log('🆕 Creating new project...');
    console.log('   User ID:', userId);
    console.log('   Message preview:', message.substring(0, 50));

    const projectType = detectProjectType(message);
    const projectName = generateProjectName(projectType, message);

    console.log('   Detected type:', projectType);
    console.log('   Project name:', projectName);

    const projectData = {
      userId,
      name: projectName,
      type: projectType,
      description: message.slice(0, 100),
      aiModel,
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    console.log('📤 Creating project in Firestore...');
    const docRef = await addDoc(collection(db, 'projects'), projectData);
    console.log('✅ Project created successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error in createProject:', error);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);

    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Firebase rules need to be deployed. Run: firebase deploy --only firestore:rules');
    } else if (error.code === 'unavailable') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to create project. Please try again.');
    }
  }
};

export const addMessageToProject = async (
  projectId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> => {
  try {
    console.log(`💬 Adding ${role} message to project:`, projectId);
    console.log('   Content preview:', content.substring(0, 50));

    const messageData = {
      projectId,
      role,
      content,
      createdAt: Timestamp.now()
    };

    console.log('📤 Sending message to Firestore...');
    await addDoc(collection(db, 'messages'), messageData);
    console.log('✅ Message added successfully to Firestore');
  } catch (error: any) {
    console.error('❌ Error adding message:', error);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);

    // Provide helpful error messages
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Firebase rules need to be deployed. Run: firebase deploy --only firestore:rules');
    } else if (error.code === 'unavailable') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to send message. Please try again.');
    }
  }
};

export const subscribeToProjects = (
  userId: string,
  callback: (projects: Project[]) => void
): (() => void) => {
  console.log('👂 Subscribing to projects for user:', userId);

  const q = query(
    collection(db, 'projects'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const projects: Project[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        type: data.type,
        description: data.description || '',
        aiModel: data.aiModel,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    });

    console.log('📊 Projects updated:', projects.length);
    callback(projects);
  }, (error) => {
    console.error('❌ Error in projects subscription:', error);
  });

  return unsubscribe;
};

export const subscribeToMessages = (
  projectId: string,
  callback: (messages: ChatMessage[]) => void
): (() => void) => {
  console.log('👂 Subscribing to messages for project:', projectId);

  const q = query(
    collection(db, 'messages'),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'asc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        role: data.role,
        content: data.content,
        timestamp: data.createdAt?.toDate() || new Date()
      };
    });

    console.log('💬 Messages updated:', messages.length);
    callback(messages);
  }, (error) => {
    console.error('❌ Error in messages subscription:', error);
  });

  return unsubscribe;
};

export const selectAIModel = (): 'openai' | 'claude' | 'gemini' => {
  const claudeKey = import.meta.env.VITE_CLAUDE_API_KEY;
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

  // Priority: Claude > Gemini > OpenAI
  if (claudeKey && !claudeKey.includes('your-')) return 'claude';
  if (geminiKey && !geminiKey.includes('your-')) return 'gemini';
  if (openaiKey && !openaiKey.includes('your-')) return 'openai';

  return 'openai';
};
