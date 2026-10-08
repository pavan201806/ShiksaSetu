import { SpeechSynthesizer } from './interfaces';

export const SANTALI_AUDIO_FILES: string[] = [
  'assets/audio/scenario_1.mp3',
  'assets/audio/scenario_2.mp3',
  'assets/audio/scenario_3.mp3',
];

export const HINDI_AUDIO_FILES: string[] = [
  'assets/audio/hindi_scenario_1.mp3',
  'assets/audio/hindi_scenario_2.mp3',
  'assets/audio/hindi_scenario_3.mp3',
];

export class RecordedAudioTTS implements SpeechSynthesizer {
  private audioFiles: string[];
  private selectedIndex: number = 0;

  constructor(defaultIndex: number = 0, audioFiles?: string[]) {
    this.selectedIndex = defaultIndex;
    this.audioFiles = audioFiles || SANTALI_AUDIO_FILES;
  }

  public setScenarioIndex(index: number): void {
    if (index >= 0 && index < this.audioFiles.length) {
      this.selectedIndex = index;
    }
  }

  async synthesize(text?: string): Promise<{ audioUri: string }> {
    // Simulate TTS vocoder synthesis latency
    await new Promise((resolve) => setTimeout(resolve, 500));

    const audioUri = this.audioFiles[this.selectedIndex] || this.audioFiles[0];
    return {
      audioUri,
    };
  }
}

export class HindiRecordedAudioTTS implements SpeechSynthesizer {
  private audioFiles: string[] = HINDI_AUDIO_FILES;
  private selectedIndex: number = 0;

  constructor(defaultIndex: number = 0) {
    this.selectedIndex = defaultIndex;
  }

  public setScenarioIndex(index: number): void {
    if (index >= 0 && index < this.audioFiles.length) {
      this.selectedIndex = index;
    }
  }

  async synthesize(text?: string): Promise<{ audioUri: string }> {
    // Simulate TTS vocoder synthesis latency for Hindi voice output
    await new Promise((resolve) => setTimeout(resolve, 500));

    const audioUri = this.audioFiles[this.selectedIndex] || this.audioFiles[0];
    return {
      audioUri,
    };
  }
}

