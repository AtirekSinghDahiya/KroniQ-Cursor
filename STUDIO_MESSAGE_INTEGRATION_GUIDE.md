# Studio Message Integration Guide

This guide explains how to add chat-like message display to all studios (Image, Music, Video, TTS, PPT).

## Overview

Each studio should display content in a conversational format:
1. **User message**: Shows the prompt/request
2. **Model message**: Shows the response with generated content (image, audio, video, etc.)

All messages are saved to the `messages` table and displayed using the `StudioMessageView` component.

## Implementation Steps

### 1. Import Required Services

```typescript
import { StudioMessageView, type StudioMessage } from './StudioMessageView';
import {
  saveStudioGeneration,
  loadStudioMessages,
  formatImageMessage, // or formatMusicMessage, formatVideoMessage, etc.
} from '../../../lib/studioMessagesService';
import { getMessages } from '../../../lib/chatService';
```

### 2. Add Messages State

Replace or supplement the history state with messages:

```typescript
const [messages, setMessages] = useState<StudioMessage[]>([]);
```

### 3. Load Messages When Opening Project

In the `loadExistingProject` function:

```typescript
const loadExistingProject = async (projectId: string) => {
  try {
    const result = await loadProject(projectId);
    if (result.success && result.project) {
      setCurrentProjectId(projectId);

      // Load messages from database
      const projectMessages = await loadStudioMessages(projectId);
      setMessages(projectMessages);

      // Load other state from session_state if needed
      const state = result.project.session_state || {};
      setPrompt(state.prompt || '');
      // ... other state restoration
    }
  } catch (error) {
    console.error('Error loading project:', error);
  }
};
```

### 4. Save Messages After Generation

In the generation success handler:

```typescript
// After successful generation
const projectId = await saveProjectState(); // or use currentProjectId

if (projectId) {
  // Format assistant message based on type
  const assistantMessage = formatImageMessage(imageUrl, selectedModel, dimensions);
  // OR: formatMusicMessage(audioUrl, title, model, duration);
  // OR: formatVideoMessage(videoUrl, model, duration);
  // OR: formatVoiceMessage(audioUrl, voice, duration);
  // OR: formatPPTMessage(title, slideCount, theme);

  // Save both user prompt and assistant response
  await saveStudioGeneration(
    projectId,
    prompt, // user's prompt
    assistantMessage,
    {
      type: 'image', // or 'music', 'video', 'voice', 'ppt'
      url: imageUrl,
      model: selectedModel,
      dimensions: dimensions
      // Add other relevant metadata
    }
  );

  // Reload messages to show the new ones
  const updatedMessages = await loadStudioMessages(projectId);
  setMessages(updatedMessages);
}
```

### 5. Render Messages in UI

Replace the gallery/history view with the message view:

```typescript
{/* Message Display Area */}
<div className="flex-1 overflow-hidden flex flex-col">
  {messages.length > 0 ? (
    <StudioMessageView
      messages={messages}
      onDownload={handleDownload}
      onCopy={(text) => {
        navigator.clipboard.writeText(text);
        showToast('success', 'Copied', 'Text copied to clipboard');
      }}
      renderMedia={(message) => {
        // Render the media content based on type
        if (message.payload?.type === 'image' && message.payload?.url) {
          return (
            <img
              src={message.payload.url}
              alt="Generated image"
              className="w-full rounded-lg max-w-2xl"
            />
          );
        }
        if (message.payload?.type === 'music' && message.payload?.url) {
          return (
            <audio
              controls
              src={message.payload.url}
              className="w-full"
            />
          );
        }
        // Add other media types as needed
        return null;
      }}
    />
  ) : (
    <div className="flex-1 flex items-center justify-center text-gray-500">
      <div className="text-center">
        <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No generations yet. Start creating!</p>
      </div>
    </div>
  )}
</div>
```

## Studio-Specific Examples

### Image Studio

```typescript
// After image generation success
const assistantMessage = formatImageMessage(
  imageUrl,
  selectedModel,
  `${width}×${height}`
);

await saveStudioGeneration(projectId, prompt, assistantMessage, {
  type: 'image',
  url: imageUrl,
  model: selectedModel,
  dimensions: `${width}×${height}`,
  aspectRatio: aspectRatio
});
```

### Music Studio

```typescript
// After music generation success
const assistantMessage = formatMusicMessage(
  audioUrl,
  songTitle || 'Untitled Track',
  'beatoven-ai',
  duration
);

await saveStudioGeneration(projectId, description, assistantMessage, {
  type: 'music',
  url: audioUrl,
  model: 'beatoven-ai',
  duration: duration,
  genre: selectedGenre
});
```

### Video Studio

```typescript
// After video generation success
const assistantMessage = formatVideoMessage(
  videoUrl,
  selectedModel,
  duration
);

await saveStudioGeneration(projectId, prompt, assistantMessage, {
  type: 'video',
  url: videoUrl,
  model: selectedModel,
  duration: duration
});
```

### TTS/Voice Studio

```typescript
// After TTS generation success
const assistantMessage = formatVoiceMessage(
  audioUrl,
  selectedVoice,
  duration
);

await saveStudioGeneration(projectId, text, assistantMessage, {
  type: 'voice',
  url: audioUrl,
  voice: selectedVoice,
  duration: duration
});
```

### PPT Studio

```typescript
// After PPT generation success
const assistantMessage = formatPPTMessage(
  pptData.title,
  pptData.slides.length,
  pptData.theme
);

await saveStudioGeneration(projectId, prompt, assistantMessage, {
  type: 'ppt',
  slideCount: pptData.slides.length,
  theme: pptData.theme,
  // Store presentation data if needed
  pptData: pptData
});
```

## Benefits

1. **Unified Interface**: All studios use the same message-based UI
2. **Easy Navigation**: Projects show full conversation history when opened from sidebar
3. **Better Context**: Users can see their prompts alongside generated content
4. **Database Storage**: All content persists in the messages table
5. **Searchable**: Messages can be searched and filtered
6. **Timeline**: Shows chronological order of generations

## Migration Notes

- Existing localStorage history can coexist with the new message system
- Projects created before this change won't have messages but will still work
- New generations will automatically create messages
- The gallery view can be kept as a supplementary view if desired
