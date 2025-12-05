# Apply Chat-Style Messages to All Studios

## Status
✅ Image Studio - COMPLETE
⚠️ Music, Video, TTS, PPT Studios - NEEDS IMPLEMENTATION

## What's Been Done

### Image Studio
- ✅ Added `StudioMessageView` component
- ✅ Added `messages` state
- ✅ Modified `loadExistingProject` to load messages from database
- ✅ Updated generation handler to save user prompt + assistant response
- ✅ Replaced single image view with scrolling message view
- ✅ Clears prompt after each generation for continuous use

## What Needs to Be Done for Other Studios

For each studio (Music, Video, TTS, PPT), apply these changes:

### 1. Add Imports (Top of file)

```typescript
import { StudioMessageView, type StudioMessage } from './StudioMessageView';
import { saveStudioGeneration, loadStudioMessages, formatMusicMessage } from '../../../lib/studioMessagesService';
// Use: formatMusicMessage, formatVideoMessage, formatVoiceMessage, or formatPPTMessage
```

### 2. Add Messages State

```typescript
const [messages, setMessages] = useState<StudioMessage[]>([]);
```

### 3. Update loadExistingProject

```typescript
const loadExistingProject = async (projectId: string) => {
  try {
    const result = await loadProject(projectId);
    if (result.success && result.project) {
      setCurrentProjectId(projectId);

      // Load messages from database
      const projectMessages = await loadStudioMessages(projectId);
      setMessages(projectMessages as StudioMessage[]);

      // Load other state...
      const state = result.project.session_state || {};
      // ... rest of state loading
    }
  } catch (error) {
    console.error('Error loading project:', error);
  }
};
```

### 4. Update Generation Handler (After Success)

```typescript
// After successful generation
let projectId = currentProjectId;
if (!projectId) {
  projectId = await saveProjectState(); // or create project
}

// Save messages
if (projectId) {
  const assistantMessage = formatMusicMessage(audioUrl, title, 'beatoven-ai', duration);
  // OR: formatVideoMessage(videoUrl, model, duration);
  // OR: formatVoiceMessage(audioUrl, voice, duration);
  // OR: formatPPTMessage(title, slideCount, theme);

  await saveStudioGeneration(projectId, userPrompt, assistantMessage, {
    type: 'music', // or 'video', 'voice', 'ppt'
    url: audioUrl, // or videoUrl
    model: 'beatoven-ai',
    duration: duration,
    // ... other metadata
  });

  // Reload messages
  const updatedMessages = await loadStudioMessages(projectId);
  setMessages(updatedMessages as StudioMessage[]);
}

setDescription(''); // Clear prompt for next generation
```

### 5. Replace Content Display with StudioMessageView

Find the display area and replace with:

```tsx
{isGenerating ? (
  <div className="flex-1 flex items-center justify-center">
    {/* Loading spinner... */}
  </div>
) : messages.length > 0 ? (
  <StudioMessageView
    messages={messages}
    onDownload={handleDownload}
    onCopy={(text) => {
      navigator.clipboard.writeText(text);
      showToast('success', 'Copied', 'Text copied to clipboard');
    }}
    renderMedia={(message) => {
      // For Music Studio:
      if (message.payload?.type === 'music' && message.payload?.url) {
        return (
          <audio
            controls
            src={message.payload.url}
            className="w-full max-w-2xl"
          />
        );
      }

      // For Video Studio:
      if (message.payload?.type === 'video' && message.payload?.url) {
        return (
          <video
            controls
            src={message.payload.url}
            className="w-full max-w-2xl rounded-lg"
          />
        );
      }

      // For Voice/TTS Studio:
      if (message.payload?.type === 'voice' && message.payload?.url) {
        return (
          <audio
            controls
            src={message.payload.url}
            className="w-full max-w-2xl"
          />
        );
      }

      // For PPT Studio:
      if (message.payload?.type === 'ppt') {
        return (
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-sm text-white/80">Presentation generated successfully</p>
          </div>
        );
      }

      return null;
    }}
  />
) : (
  <div className="flex-1 flex items-center justify-center">
    {/* Empty state... */}
  </div>
)}
```

## Testing Checklist

For each studio after implementation:

1. ✅ Open studio
2. ✅ Generate content (first generation)
3. ✅ Verify user prompt and model response appear as messages
4. ✅ Generate again with different prompt
5. ✅ Verify second generation ADDS to messages (doesn't replace)
6. ✅ Close and reopen project from sidebar
7. ✅ Verify all messages persist and load correctly
8. ✅ Verify download buttons work
9. ✅ Verify media (audio/video/image) plays/displays correctly

## Benefits After Implementation

- ✅ All generations show in conversation format
- ✅ Full history preserved in database
- ✅ Easy to see prompts alongside outputs
- ✅ Consistent UX across all studios
- ✅ Projects retain complete generation history
- ✅ Sidebar shows meaningful project content
