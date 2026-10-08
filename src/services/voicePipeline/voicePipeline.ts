import {
  SpeechRecognizer,
  Translator,
  SpeechSynthesizer,
  VoicePipelineResult,
  VoiceDirection,
} from './interfaces';

import { MockSTT, SantaliMockSTT } from './mockSTT';
import { MockTranslator, ReverseMockTranslator } from './mockTranslator';
import { RecordedAudioTTS, HindiRecordedAudioTTS } from './recordedAudioTTS';

/*
 * ======================================================================================
 * AI MODEL SWAP CONFIGURATION (DEPENDENCY INJECTION)
 * ======================================================================================
 * When you are ready to integrate real on-device AI/ML models later,
 * REPLACE ONLY THE INSTANTIATION LINES BELOW with your real classes:
 *
 * Example (Forward Hindi -> Santali):
 *   const defaultSTT: SpeechRecognizer = new VoskSTT();
 *   const defaultTranslator: Translator = new IndicTransTranslator();
 *   const defaultTTS: SpeechSynthesizer = new VitsTTS();
 *
 * Example (Reverse Santali -> Hindi):
 *   const defaultReverseSTT: SpeechRecognizer = new SantaliASR();
 *   const defaultReverseTranslator: Translator = new IndicTransTranslatorReverse();
 *   const defaultReverseTTS: SpeechSynthesizer = new HindiPiperTTS();
 *
 * DO NOT rewrite the VoicePipeline class or any UI screens below!
 * ======================================================================================
 */

// >>> CHANGE THESE LINES TO PLUG IN REAL MODELS <<<
// Forward Direction: Hindi -> Santali
const defaultSTT: SpeechRecognizer = new MockSTT(0);
const defaultTranslator: Translator = new MockTranslator();
const defaultTTS: SpeechSynthesizer = new RecordedAudioTTS(0);

// Reverse Direction: Santali -> Hindi
const defaultReverseSTT: SpeechRecognizer = new SantaliMockSTT(0);
const defaultReverseTranslator: Translator = new ReverseMockTranslator();
const defaultReverseTTS: SpeechSynthesizer = new HindiRecordedAudioTTS(0);
// >>> END OF MODEL SWAP CONFIGURATION <<<

export class VoicePipeline {
  private direction: VoiceDirection;
  private stt?: SpeechRecognizer;
  private translator?: Translator;
  private tts?: SpeechSynthesizer;

  constructor(
    stt?: SpeechRecognizer,
    translator?: Translator,
    tts?: SpeechSynthesizer,
    direction: VoiceDirection = 'hi-to-sat'
  ) {
    this.stt = stt;
    this.translator = translator;
    this.tts = tts;
    this.direction = direction;
  }

  public setDirection(direction: VoiceDirection): void {
    this.direction = direction;
  }

  public getDirection(): VoiceDirection {
    return this.direction;
  }

  /**
   * Runs SpeechRecognizer -> Translator -> SpeechSynthesizer in sequence.
   */
  async process(
    audioInput?: any,
    scenarioIndex?: number,
    direction?: VoiceDirection
  ): Promise<VoicePipelineResult> {
    const activeDirection = direction || this.direction || 'hi-to-sat';

    // Resolve instances according to direction
    const activeSTT =
      this.stt || (activeDirection === 'sat-to-hi' ? defaultReverseSTT : defaultSTT);
    const activeTranslator =
      this.translator ||
      (activeDirection === 'sat-to-hi' ? defaultReverseTranslator : defaultTranslator);
    const activeTTS =
      this.tts || (activeDirection === 'sat-to-hi' ? defaultReverseTTS : defaultTTS);

    // If using mock instances with scenario cycling, set scenario
    if (scenarioIndex !== undefined) {
      if ('setScenarioIndex' in activeSTT) {
        (activeSTT as any).setScenarioIndex(scenarioIndex);
      }
      if ('setScenarioIndex' in activeTTS) {
        (activeTTS as any).setScenarioIndex(scenarioIndex);
      }
    }

    // Step 1: Speech-to-Text Recognition
    const { text: recognizedText, confidence } = await activeSTT.recognize(audioInput);

    // Step 2: Neural Translation
    const { translatedText, script } = await activeTranslator.translate(recognizedText);

    // Step 3: Text-to-Speech Synthesis
    const { audioUri } = await activeTTS.synthesize(translatedText);

    return {
      recognizedText,
      confidence,
      translatedText,
      script,
      audioUri,
      direction: activeDirection,
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
  scenarioIndex?: number,
  direction: VoiceDirection = 'hi-to-sat'
): Promise<VoicePipelineResult> {
  return await pipelineInstance.process(audioInput, scenarioIndex, direction);
}

export function getTranslatorForDirection(direction: VoiceDirection = 'hi-to-sat'): Translator {
  return direction === 'sat-to-hi' ? defaultReverseTranslator : defaultTranslator;
}

export function getTTSForDirection(direction: VoiceDirection = 'hi-to-sat'): SpeechSynthesizer {
  return direction === 'sat-to-hi' ? defaultReverseTTS : defaultTTS;
}

export * from './interfaces';
export * from './mockSTT';
export * from './mockTranslator';
export * from './recordedAudioTTS';

