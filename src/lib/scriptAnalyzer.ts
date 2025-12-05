import { getAIResponse } from './simpleAI';

export interface DialogueLine {
  speaker: string;
  text: string;
  voiceId: string;
  voiceName: string;
}

export interface ScriptAnalysis {
  isDialogue: boolean;
  cleanedText: string;
  dialogueLines: DialogueLine[];
  suggestedVoice?: {
    id: string;
    name: string;
    reason: string;
  };
}

const VOICE_OPTIONS = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', type: 'female', description: 'Calm, natural' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', type: 'female', description: 'Soft, expressive' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', type: 'female', description: 'Young, energetic' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', type: 'female', description: 'Strong, confident' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', type: 'male', description: 'Deep, warm' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', type: 'male', description: 'Strong, authoritative' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', type: 'male', description: 'Deep, natural' },
  { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', type: 'male', description: 'Clear, professional' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', type: 'male', description: 'Mature, confident' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', type: 'male', description: 'Casual, friendly' },
];

export async function analyzeScript(rawText: string): Promise<ScriptAnalysis> {
  const cleanedText = rawText
    .replace(/^(generate|create|make|produce|convert)\s+(a|an)?\s+(voice|voiceover|speech|audio|narration)\s+(of|for|saying|speaking)?\s*/i, '')
    .replace(/\b(that says?|speaking|saying|this script)\b\s*:?\s*/gi, '')
    .trim();

  if (!cleanedText) {
    return {
      isDialogue: false,
      cleanedText: rawText,
      dialogueLines: [],
    };
  }

  const dialoguePattern = /^[A-Z][a-z]+\s*:\s*.+/m;
  const isDialogue = dialoguePattern.test(cleanedText);

  if (isDialogue) {
    const analysis = await analyzeDialogueWithAI(cleanedText);
    return analysis;
  } else {
    const suggestedVoice = await suggestVoiceWithAI(cleanedText);
    return {
      isDialogue: false,
      cleanedText,
      dialogueLines: [],
      suggestedVoice,
    };
  }
}

async function analyzeDialogueWithAI(text: string): Promise<ScriptAnalysis> {
  try {
    const prompt = `Analyze this dialogue script and extract speaker lines. For each speaker, suggest an appropriate voice type (male/female, tone).

Available voices:
${VOICE_OPTIONS.map(v => `- ${v.name} (${v.type}, ${v.description})`).join('\n')}

Script:
${text}

Return ONLY a JSON object in this exact format (no markdown, no explanation):
{
  "speakers": [
    {
      "name": "SpeakerName",
      "lines": ["line1", "line2"],
      "suggestedVoice": "VoiceName"
    }
  ]
}`;

    const aiResponse = await getAIResponse(prompt, [], 'grok-2');
    const response = aiResponse.content;

    let parsed;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      return fallbackDialogueAnalysis(text);
    }

    const dialogueLines: DialogueLine[] = [];
    const speakers = parsed.speakers || [];

    speakers.forEach((speaker: any) => {
      const voiceOption = VOICE_OPTIONS.find(v => v.name === speaker.suggestedVoice) || VOICE_OPTIONS[0];
      speaker.lines.forEach((line: string) => {
        dialogueLines.push({
          speaker: speaker.name,
          text: line,
          voiceId: voiceOption.id,
          voiceName: voiceOption.name,
        });
      });
    });

    return {
      isDialogue: true,
      cleanedText: text,
      dialogueLines,
    };
  } catch (error) {
    console.error('AI dialogue analysis failed:', error);
    return fallbackDialogueAnalysis(text);
  }
}

async function suggestVoiceWithAI(text: string): Promise<{ id: string; name: string; reason: string }> {
  try {
    const prompt = `Suggest the best voice for this text. Consider tone, style, and content.

Available voices:
${VOICE_OPTIONS.map(v => `- ${v.name} (${v.type}, ${v.description})`).join('\n')}

Text: "${text}"

Return ONLY a JSON object (no markdown):
{
  "voiceName": "VoiceName",
  "reason": "brief reason"
}`;

    const aiResponse = await getAIResponse(prompt, [], 'grok-2');
    const response = aiResponse.content;

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const voice = VOICE_OPTIONS.find(v => v.name === parsed.voiceName) || VOICE_OPTIONS[0];
      return {
        id: voice.id,
        name: voice.name,
        reason: parsed.reason || 'AI suggested',
      };
    }
  } catch (error) {
    console.error('AI voice suggestion failed:', error);
  }

  return {
    id: VOICE_OPTIONS[0].id,
    name: VOICE_OPTIONS[0].name,
    reason: 'Default voice',
  };
}

function fallbackDialogueAnalysis(text: string): ScriptAnalysis {
  const lines = text.split('\n').filter(line => line.trim());
  const dialogueLines: DialogueLine[] = [];
  const speakerVoices = new Map<string, { id: string; name: string }>();
  let voiceIndex = 0;

  lines.forEach(line => {
    const match = line.match(/^([A-Z][a-z]+)\s*:\s*(.+)/);
    if (match) {
      const speaker = match[1];
      const text = match[2].trim();

      if (!speakerVoices.has(speaker)) {
        const voice = VOICE_OPTIONS[voiceIndex % VOICE_OPTIONS.length];
        speakerVoices.set(speaker, { id: voice.id, name: voice.name });
        voiceIndex++;
      }

      const voice = speakerVoices.get(speaker)!;
      dialogueLines.push({
        speaker,
        text,
        voiceId: voice.id,
        voiceName: voice.name,
      });
    }
  });

  return {
    isDialogue: dialogueLines.length > 0,
    cleanedText: text,
    dialogueLines,
  };
}
