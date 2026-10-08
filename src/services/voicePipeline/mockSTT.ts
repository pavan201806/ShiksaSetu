import { SpeechRecognizer } from './interfaces';

export interface DemoPhrase {
  id: string;
  text: string;
  phoneticHint?: string;
  meaningHint?: string;
}

export const DEMO_STT_PHRASES: DemoPhrase[] = [
  {
    id: 'phrase_1',
    text: 'कक्षा 1 गणित अध्याय 1 की गिनती सिखाएं',
    meaningHint: 'Teach counting for Class 1 Math Ch 1',
  },
  {
    id: 'phrase_2',
    text: 'सजीव और निर्जीव वस्तुओं के उदाहरण बताएं',
    meaningHint: 'Explain living and non-living objects',
  },
  {
    id: 'phrase_3',
    text: 'हिंदी वर्णमाला के स्वर और व्यंजन समझाएं',
    meaningHint: 'Explain vowels and consonants',
  },
];

export const SANTALI_DEMO_PHRASES: DemoPhrase[] = [
  {
    id: 'sat_phrase_1',
    text: 'ᱯᱟᱹᱦᱤᱞ ᱪᱟᱱᱟᱪ ᱮᱞᱠᱷᱟ ᱯᱟᱴᱷ ᱑ ᱞᱮᱠᱷᱟ ᱥᱮᱪᱮᱫ',
    phoneticHint: 'Pahil chanach elkha path 1 lekha seched',
    meaningHint: 'कक्षा 1 गणित पाठ 1 गिनती सिखाएं (Class 1 Math)',
  },
  {
    id: 'sat_phrase_2',
    text: 'ᱡᱤᱣᱤᱭᱟᱱ ᱟᱨ ᱵᱤᱱ-ᱡᱤᱣᱤᱭᱟᱱ ᱡᱤᱱᱤᱥ ᱨᱮᱱᱟᱜ ᱫᱟᱹᱭᱠᱟᱹ',
    phoneticHint: 'Jiwiyan aar bin-jiwiyan jinis renag dayka',
    meaningHint: 'सजीव और निर्जीव वस्तुएं (Living & Non-living)',
  },
  {
    id: 'sat_phrase_3',
    text: 'ᱟᱠᱷᱚᱨ ᱜᱟᱵᱟᱱ ᱟᱨ ᱨᱟᱦᱟ ᱟᱲᱟᱝ ᱵᱩᱡᱷᱟᱹᱣ',
    phoneticHint: 'Akhor gaban aar raha arang bujhao',
    meaningHint: 'स्वर और व्यंजन समझाएं (Vowels & Consonants)',
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

  async recognize(audioInput?: any): Promise<{ text: string; confidence: number }> {
    // Simulate on-device speech model acoustic pass
    await new Promise((resolve) => setTimeout(resolve, 800));

    const phrase = DEMO_STT_PHRASES[this.selectedIndex] || DEMO_STT_PHRASES[0];
    return {
      text: phrase.text,
      confidence: 1.0,
    };
  }
}

export class SantaliMockSTT implements SpeechRecognizer {
  private selectedIndex: number = 0;

  constructor(defaultIndex: number = 0) {
    this.selectedIndex = defaultIndex;
  }

  public setScenarioIndex(index: number): void {
    if (index >= 0 && index < SANTALI_DEMO_PHRASES.length) {
      this.selectedIndex = index;
    }
  }

  async recognize(audioInput?: any): Promise<{ text: string; confidence: number }> {
    // Simulate on-device speech model acoustic pass for Santali
    await new Promise((resolve) => setTimeout(resolve, 800));

    const phrase = SANTALI_DEMO_PHRASES[this.selectedIndex] || SANTALI_DEMO_PHRASES[0];
    return {
      text: phrase.text,
      confidence: 1.0,
    };
  }
}

