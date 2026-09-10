import { SpeechSynthesizer } from './interfaces';

export class RecordedAudioTTS implements SpeechSynthesizer {
  private audioFiles: string[] = [
    'assets/audio/scenario_1.mp3',
    'assets/audio/scenario_2.mp3',
    'assets/audio/scenario_3.mp3',
  ];
  private selectedIndex: number = 0;

  constructor(defaultIndex: number = 0) {
    this.selectedIndex = defaultIndex;
  }

  public setScenarioIndex(index: number): void {
    if (index >= 0 && index < this.audioFiles.length) {
      this.selectedIndex = index;
    }
  }

  async synthesize(text: string): Promise<{ audioUri: string }> {
    // Simulate TTS vocoder synthesis latency
    await new Promise((resolve) => setTimeout(resolve, 500));

    const audioUri = this.audioFiles[this.selectedIndex] || this.audioFiles[0];
    return {
      audioUri,
    };
  }
}
