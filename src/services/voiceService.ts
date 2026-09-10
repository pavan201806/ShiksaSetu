import { processVoiceInput as runPipeline, VoicePipelineResult } from './voicePipeline/voicePipeline';

export interface VoiceProcessResult {
  recognizedText: string;
  translatedText: string;
  confidence?: number;
  script?: string;
  audioUrl?: string;
}

/**
 * Public voice service function called by the UI.
 * Delegated directly to the voice pipeline orchestrator.
 */
export async function processVoiceInput(audioInputPlaceholder?: string, scenarioIndex?: number): Promise<VoiceProcessResult> {
  const result: VoicePipelineResult = await runPipeline(audioInputPlaceholder, scenarioIndex);
  return {
    recognizedText: result.recognizedText,
    translatedText: result.translatedText,
    confidence: result.confidence,
    script: result.script,
    audioUrl: result.audioUri,
  };
}

export * from './voicePipeline/voicePipeline';
