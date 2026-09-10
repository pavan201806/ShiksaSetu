import { SpeechRecognizer } from './interfaces';

export interface DemoPhrase {
  id: string;
  text: string;
}

export const DEMO_STT_PHRASES: DemoPhrase[] = [
  {
    id: 'phrase_1',
    text: 'कक्षा 1 गणित अध्याय 1 की गिनती सिखाएं',
  },
  {
    id: 'phrase_2',
    text: 'सजीव और निर्जीव वस्तुओं के उदाहरण बताएं',
  },
  {
    id: 'phrase_3',
    text: 'हिंदी वर्णमाला के स्वर और व्यंजन समझाएं',
  },
];

export class MockSTT implements SpeechRecognizer {
  private selectedIndex: number = 0;

  constructor(defaultIndex: number = 0) {
    this.selectedIndex = defaultIndex;
  }

  public setScenarioIndex(index: number): void {
    if (index >= 0 && index < DEMO_STT_PHRASES.length) {
      this.selectedIndex = index;
    }
  }

  async recognize(audioInput: any): Promise<{ text: string; confidence: number }> {
    // Simulate on-device speech model acoustic pass
    await new Promise((resolve) => setTimeout(resolve, 800));

    const phrase = DEMO_STT_PHRASES[this.selectedIndex] || DEMO_STT_PHRASES[0];
    return {
      text: phrase.text,
      confidence: 1.0,
    };
  }
}
