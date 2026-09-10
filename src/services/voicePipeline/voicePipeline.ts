import {
  SpeechRecognizer,
  Translator,
  SpeechSynthesizer,
  VoicePipelineResult,
} from './interfaces';

import { MockSTT } from './mockSTT';
import { MockTranslator } from './mockTranslator';
import { RecordedAudioTTS } from './recordedAudioTTS';

/*
 * ======================================================================================
 * AI MODEL SWAP CONFIGURATION (DEPENDENCY INJECTION)
 * ======================================================================================
 * When you are ready to integrate real on-device AI/ML models later,
 * REPLACE ONLY THE INSTANTIATION LINES BELOW (Lines 27, 28, and 29) with your real classes:
 *
 * Example:
 *   const defaultSTT: SpeechRecognizer = new VoskSTT();
 *   const defaultTranslator: Translator = new IndicTransTranslator();
 *   const defaultTTS: SpeechSynthesizer = new VitsTTS();
 *
 * DO NOT rewrite the VoicePipeline class or any UI screens below!
 * ======================================================================================
 */

// >>> CHANGE THESE LINES TO PLUG IN REAL MODELS <<<
const defaultSTT: SpeechRecognizer = new MockSTT(0);
const defaultTranslator: Translator = new MockTranslator();
const defaultTTS: SpeechSynthesizer = new RecordedAudioTTS(0);
// >>> END OF MODEL SWAP CONFIGURATION <<<

export class VoicePipeline {
  private stt: SpeechRecognizer;
  private translator: Translator;
  private tts: SpeechSynthesizer;

  constructor(
    stt: SpeechRecognizer = defaultSTT,
    translator: Translator = defaultTranslator,
    tts: SpeechSynthesizer = defaultTTS
  ) {
    this.stt = stt;
    this.translator = translator;
    this.tts = tts;
  }

  /**
   * Runs SpeechRecognizer -> Translator -> SpeechSynthesizer in sequence.
   */
  async process(audioInput?: any, scenarioIndex?: number): Promise<VoicePipelineResult> {
    // If using mock instances with scenario cycling, set scenario
    if (scenarioIndex !== undefined) {
      if ('setScenarioIndex' in this.stt) {
        (this.stt as any).setScenarioIndex(scenarioIndex);
      }
      if ('setScenarioIndex' in this.tts) {
        (this.tts as any).setScenarioIndex(scenarioIndex);
      }
    }

    // Step 1: Speech-to-Text Recognition
    const { text: recognizedText, confidence } = await this.stt.recognize(audioInput);

    // Step 2: Neural Translation
    const { translatedText, script } = await this.translator.translate(recognizedText);

    // Step 3: Text-to-Speech Synthesis
    const { audioUri } = await this.tts.synthesize(translatedText);

    return {
      recognizedText,
      confidence,
      translatedText,
      script,
      audioUri,
    };
  }
}

// Singleton pipeline instance
const pipelineInstance = new VoicePipeline();

/**
 * Main public entrypoint for voice processing in ShikshaSetu.
 * Calls the pipeline orchestrator in sequence and returns the combined result.
 */
export async function processVoiceInput(
  audioInput?: any,
  scenarioIndex?: number
): Promise<VoicePipelineResult> {
  return await pipelineInstance.process(audioInput, scenarioIndex);
}

export * from './interfaces';
export * from './mockSTT';
export * from './mockTranslator';
export * from './recordedAudioTTS';
