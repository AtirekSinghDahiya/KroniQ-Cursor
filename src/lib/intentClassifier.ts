export interface IntentResult {
  intent: 'chat' | 'code' | 'design' | 'video' | 'video-edit' | 'voice' | 'music' | 'image';
  confidence: number;
  suggestedStudio: 'Chat Studio' | 'Code Studio' | 'Design Studio' | 'Video Studio' | 'Video Editor' | 'Voice Studio' | 'Music Studio' | 'Image Studio';
  reasoning: string;
  suggestedModel?: string; // Specific AI model if detected
}

const CODE_KEYWORDS = [
  'function', 'component', 'react', 'html', 'css', 'javascript', 'typescript',
  'js', 'variable', 'api', 'endpoint', 'database', 'sql', 'node', 'express',
  'build', 'create', 'implement', 'code', 'program', 'script', 'class',
  'interface', 'type', 'import', 'export', 'async', 'await', 'promise',
  'fetch', 'axios', 'backend', 'frontend', 'server', 'client', 'http',
  'rest', 'graphql', 'query', 'mutation', 'state', 'props', 'hook',
  'npm', 'yarn', 'package', 'dependency', 'module', 'webpack', 'vite',
  'debug', 'error', 'bug', 'fix', 'test', 'unit', 'integration',
  'website', 'web', 'app', 'application', 'page', 'site'
];

const DESIGN_KEYWORDS = [
  'logo', 'thumbnail', 'poster', 'flyer', 'design', 'layout', 'banner',
  'mockup', 'graphic', 'image', 'icon', 'illustration', 'branding',
  'color', 'font', 'typography', 'palette', 'gradient', 'shadow',
  'ui', 'ux', 'interface', 'wireframe', 'prototype', 'sketch',
  'figma', 'adobe', 'photoshop', 'illustrator', 'canvas', 'artboard',
  'visual', 'aesthetic', 'style', 'theme', 'brand', 'identity',
  'photo', 'picture', 'artwork', 'creative', 'artistic'
];

const VIDEO_GEN_KEYWORDS = [
  'generate video', 'create video', 'make video', 'video of', 'video showing',
  'dancing', 'dance', 'moving', 'action', 'scene', 'sequence', 'cinematic',
  'sora', 'veo', 'video generation'
];

const VIDEO_EDIT_KEYWORDS = [
  'edit', 'clip', 'montage', 'footage', 'timeline', 'render',
  'transition', 'effect', 'animation', 'movie', 'film',
  'premiere', 'aftereffects', 'davinci', 'finalcut', 'editing',
  'cut', 'trim', 'splice', 'export', 'encode', 'mp4', 'mov',
  'frame', 'fps', 'resolution', '4k', 'hd', 'video editing',
  'modify video', 'change video', 'alter video', 'wan vace', 'wanvace'
];

const VOICE_KEYWORDS = [
  'voice', 'speech', 'tts', 'text-to-speech', 'speak', 'narrator',
  'voiceover', 'narrate', 'generate voice', 'voice generation',
  'ai voice', 'voice over', 'read aloud', 'pronunciation',
  'elevenlabs', 'voice synthesis', 'vocal', 'audiobook', 'dubbing', 'voice acting'
];

const MUSIC_KEYWORDS = [
  'music', 'song', 'track', 'tune', 'melody', 'beat', 'rhythm', 'composition',
  'soundtrack', 'audio', 'sound', 'mp3', 'wav', 'instrument', 'musical',
  'genre', 'pop', 'rock', 'jazz', 'classical', 'electronic', 'hip hop',
  'rap', 'country', 'blues', 'folk', 'ambient', 'techno', 'house',
  'suno', 'music generation', 'ai music', 'compose', 'album', 'single',
  'jingle', 'background music', 'bgm', 'soundtrack', 'score'
];

const IMAGE_KEYWORDS = [
  'image', 'picture', 'photo', 'generate image', 'create image', 'ai image',
  'dall-e', 'midjourney', 'stable diffusion', 'generate picture',
  'create picture', 'illustration', 'drawing', 'art', 'visual'
];

const CODE_PHRASES = [
  'build a', 'create a component', 'write a function', 'develop an app',
  'implement a feature', 'fix the bug', 'add functionality', 'create an api',
  'build an application', 'develop a website', 'code a', 'program a',
  'set up', 'configure', 'integrate with', 'connect to database'
];

const DESIGN_PHRASES = [
  'design a', 'create a logo', 'make a poster', 'design a banner',
  'create a thumbnail', 'design an interface', 'make a mockup',
  'design a layout', 'create graphics', 'design a flyer'
];

const VIDEO_GEN_PHRASES = [
  'create a video', 'make a video', 'generate a video', 'generate video',
  'video of', 'show me a video', 'make a movie', 'create animation',
  'generate animation'
];

const VIDEO_EDIT_PHRASES = [
  'edit a video', 'edit this clip', 'video editing', 'edit video',
  'create montage', 'edit footage', 'cut the video', 'add transitions',
  'render video', 'modify video', 'change video', 'alter video',
  'apply effects to video', 'add effects', 'slow motion', 'speed up video'
];

const VOICE_PHRASES = [
  'generate voice', 'text to speech', 'make voice',
  'voice generation', 'ai voice', 'voice over',
  'convert text to speech', 'read this aloud', 'narrate this',
  'create voiceover', 'generate speech', 'say this', 'speak this'
];

const MUSIC_PHRASES = [
  'generate music', 'create music', 'make music', 'compose music',
  'music generation', 'ai music', 'generate song', 'create song',
  'make a song', 'compose a song', 'create a track', 'generate a track',
  'music for', 'song about', 'create soundtrack', 'generate beat',
  'make a beat', 'compose soundtrack', 'background music for'
];

const IMAGE_PHRASES = [
  'generate image', 'create image', 'make image', 'generate picture',
  'create picture', 'make picture', 'image of', 'picture of',
  'draw me', 'show me', 'visualize', 'create visual', 'generate visual'
];

/**
 * Detect if user is requesting a specific AI model
 */
export const detectSpecificModel = (prompt: string): string | null => {
  const lowerPrompt = prompt.toLowerCase();

  // OpenAI models
  if (lowerPrompt.includes('gpt-5') || lowerPrompt.includes('gpt 5') || lowerPrompt.includes('chatgpt 5')) {
    if (lowerPrompt.includes('nano')) return 'gpt-5-nano';
    if (lowerPrompt.includes('chat')) return 'gpt-5-chat';
    if (lowerPrompt.includes('codex')) return 'gpt-5-codex';
    return 'gpt-5-chat';
  }
  if (lowerPrompt.includes('gpt-4') || lowerPrompt.includes('gpt 4') || lowerPrompt.includes('chatgpt')) {
    return 'gpt-5-chat';
  }
  if (lowerPrompt.includes('chatgpt')) {
    return 'gpt-5-chat';
  }

  // Claude models
  if (lowerPrompt.includes('claude')) {
    if (lowerPrompt.includes('opus 4.1') || lowerPrompt.includes('opus-4.1')) return 'claude-opus-4.1';
    if (lowerPrompt.includes('opus 4') || lowerPrompt.includes('opus-4')) return 'claude-opus-4';
    if (lowerPrompt.includes('opus')) return 'claude-opus-4.1';
    if (lowerPrompt.includes('sonnet 4.5') || lowerPrompt.includes('sonnet-4.5')) return 'claude-sonnet';
    if (lowerPrompt.includes('sonnet')) return 'claude-sonnet';
    if (lowerPrompt.includes('haiku')) return 'claude-haiku-4.5';
    return 'claude-sonnet';
  }

  // Gemini models
  if (lowerPrompt.includes('gemini')) {
    if (lowerPrompt.includes('2.5')) return 'gemini-flash-image';
    if (lowerPrompt.includes('flash')) return 'gemini-flash-image';
    return 'gemini-flash-image';
  }

  // DeepSeek models
  if (lowerPrompt.includes('deepseek')) {
    if (lowerPrompt.includes('v3.2') || lowerPrompt.includes('3.2')) return 'deepseek-v3.2';
    return 'deepseek-v3.2';
  }

  // Grok models
  if (lowerPrompt.includes('grok')) {
    return 'grok-4-fast';
  }

  // Kimi models
  if (lowerPrompt.includes('kimi')) {
    return 'kimi-k2';
  }

  // Llama models
  if (lowerPrompt.includes('llama')) {
    return 'llama-4-maverick';
  }

  // Perplexity models
  if (lowerPrompt.includes('perplexity')) {
    if (lowerPrompt.includes('sonar')) return 'perplexity-sonar';
    return 'perplexity-sonar';
  }

  return null;
};

export const classifyIntent = (prompt: string): IntentResult => {
  const lowerPrompt = prompt.toLowerCase().trim();

  // Detect specific AI model request
  const suggestedModel = detectSpecificModel(prompt);

  let codeScore = 0;
  let designScore = 0;
  let videoGenScore = 0;
  let videoEditScore = 0;
  let voiceScore = 0;
  let musicScore = 0;
  let imageScore = 0;

  CODE_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowerPrompt.match(regex);
    if (matches) {
      codeScore += matches.length * 2;
    }
  });

  DESIGN_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowerPrompt.match(regex);
    if (matches) {
      designScore += matches.length * 2;
    }
  });

  VIDEO_GEN_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowerPrompt.match(regex);
    if (matches) {
      videoGenScore += matches.length * 2;
    }
  });

  VIDEO_EDIT_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowerPrompt.match(regex);
    if (matches) {
      videoEditScore += matches.length * 2;
    }
  });

  VOICE_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowerPrompt.match(regex);
    if (matches) {
      voiceScore += matches.length * 2;
    }
  });

  MUSIC_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowerPrompt.match(regex);
    if (matches) {
      musicScore += matches.length * 2;
    }
  });

  IMAGE_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowerPrompt.match(regex);
    if (matches) {
      imageScore += matches.length * 2;
    }
  });

  CODE_PHRASES.forEach(phrase => {
    if (lowerPrompt.includes(phrase)) {
      codeScore += 5;
    }
  });

  DESIGN_PHRASES.forEach(phrase => {
    if (lowerPrompt.includes(phrase)) {
      designScore += 5;
    }
  });

  VIDEO_GEN_PHRASES.forEach(phrase => {
    if (lowerPrompt.includes(phrase)) {
      videoGenScore += 5;
    }
  });

  VIDEO_EDIT_PHRASES.forEach(phrase => {
    if (lowerPrompt.includes(phrase)) {
      videoEditScore += 5;
    }
  });

  VOICE_PHRASES.forEach(phrase => {
    if (lowerPrompt.includes(phrase)) {
      voiceScore += 5;
    }
  });

  MUSIC_PHRASES.forEach(phrase => {
    if (lowerPrompt.includes(phrase)) {
      musicScore += 5;
    }
  });

  IMAGE_PHRASES.forEach(phrase => {
    if (lowerPrompt.includes(phrase)) {
      imageScore += 5;
    }
  });

  if (lowerPrompt.includes('.js') || lowerPrompt.includes('.ts') ||
      lowerPrompt.includes('.jsx') || lowerPrompt.includes('.tsx') ||
      lowerPrompt.includes('.css') || lowerPrompt.includes('.html')) {
    codeScore += 10;
  }

  if (lowerPrompt.includes('.png') || lowerPrompt.includes('.jpg') ||
      lowerPrompt.includes('.svg') || lowerPrompt.includes('.gif') ||
      lowerPrompt.includes('.psd') || lowerPrompt.includes('.ai')) {
    designScore += 10;
  }

  if (lowerPrompt.includes('.mp4') || lowerPrompt.includes('.mov') ||
      lowerPrompt.includes('.avi') || lowerPrompt.includes('.mkv') ||
      lowerPrompt.includes('.wmv') || lowerPrompt.includes('.flv')) {
    videoEditScore += 10;
  }

  if (lowerPrompt.includes('.mp3') || lowerPrompt.includes('.wav') ||
      lowerPrompt.includes('.ogg') || lowerPrompt.includes('.webm') ||
      lowerPrompt.includes('.aac') || lowerPrompt.includes('.flac')) {
    voiceScore += 10;
  }

  const totalScore = codeScore + designScore + videoGenScore + videoEditScore + voiceScore + musicScore + imageScore;
  const maxScore = Math.max(codeScore, designScore, videoGenScore, videoEditScore, voiceScore, musicScore, imageScore);

  // Require higher score threshold to avoid false positives
  if (totalScore === 0 || maxScore < 8) {
    return {
      intent: 'chat',
      confidence: 1.0,
      suggestedStudio: 'Chat Studio',
      reasoning: 'General conversation or query',
      suggestedModel
    };
  }

  // More conservative confidence calculation
  const confidence = totalScore > 0 ? maxScore / (totalScore + 10) : 0;

  if (musicScore === maxScore && musicScore > 0) {
    return {
      intent: 'music',
      confidence: Math.min(confidence, 1.0),
      suggestedStudio: 'Music Studio',
      reasoning: `Detected music generation intent with score ${musicScore}`,
      suggestedModel
    };
  } else if (imageScore === maxScore && imageScore > 0) {
    return {
      intent: 'image',
      confidence: Math.min(confidence, 1.0),
      suggestedStudio: 'Image Studio',
      reasoning: `Detected image generation intent with score ${imageScore}`,
      suggestedModel
    };
  } else if (voiceScore === maxScore && voiceScore > 0) {
    return {
      intent: 'voice',
      confidence: Math.min(confidence, 1.0),
      suggestedStudio: 'Voice Studio',
      reasoning: `Detected voice generation intent with score ${voiceScore}`,
      suggestedModel
    };
  } else if (videoEditScore === maxScore && videoEditScore > 0) {
    return {
      intent: 'video-edit',
      confidence: Math.min(confidence, 1.0),
      suggestedStudio: 'Video Editor',
      reasoning: `Detected video editing intent with score ${videoEditScore}`,
      suggestedModel
    };
  } else if (videoGenScore === maxScore && videoGenScore > 0) {
    return {
      intent: 'video',
      confidence: Math.min(confidence, 1.0),
      suggestedStudio: 'Video Studio',
      reasoning: `Detected video generation intent with score ${videoGenScore}`,
      suggestedModel
    };
  } else if (codeScore === maxScore && codeScore > 0) {
    return {
      intent: 'code',
      confidence: Math.min(confidence, 1.0),
      suggestedStudio: 'Code Studio',
      reasoning: `Detected coding intent with score ${codeScore}`,
      suggestedModel
    };
  } else if (designScore === maxScore && designScore > 0) {
    return {
      intent: 'design',
      confidence: Math.min(confidence, 1.0),
      suggestedStudio: 'Design Studio',
      reasoning: `Detected design intent with score ${designScore}`,
      suggestedModel
    };
  }

  return {
    intent: 'chat',
    confidence: 0.3,
    suggestedStudio: 'Chat Studio',
    reasoning: 'Ambiguous intent, defaulting to chat',
    suggestedModel
  };
};

export const shouldAutoRoute = (intentResult: IntentResult): boolean => {
  // Never auto-route, always ask for confirmation
  return false;
};

export const shouldShowConfirmation = (intentResult: IntentResult): boolean => {
  // Show confirmation if confidence is reasonable and not chat
  return intentResult.confidence >= 0.5 && intentResult.intent !== 'chat';
};
