import {
  processVoiceInput as runPipeline,
  VoicePipelineResult,
  VoiceDirection,
} from './voicePipeline/voicePipeline';

export interface VoiceProcessResult {
  recognizedText: string;
  translatedText: string;
  confidence?: number;
  script?: string;
  audioUrl?: string;
  direction?: VoiceDirection;
}

/**
 * Public voice service function called by the UI.
 * Delegated directly to the voice pipeline orchestrator.
 */
export async function processVoiceInput(
  audioInputPlaceholder?: string,
  scenarioIndex?: number,
  direction: VoiceDirection = 'hi-to-sat'
): Promise<VoiceProcessResult> {
  const result: VoicePipelineResult = await runPipeline(
    audioInputPlaceholder,
    scenarioIndex,
    direction
  );
  return {
    recognizedText: result.recognizedText,
    translatedText: result.translatedText,
    confidence: result.confidence,
    script: result.script,
    audioUrl: result.audioUri,
    direction: result.direction,
  };
}

export * from './voicePipeline/voicePipeline';

