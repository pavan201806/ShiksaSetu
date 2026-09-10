import { Translator } from './interfaces';

const TRANSLATION_MAP: Record<string, string> = {
  'कक्षा 1 गणित अध्याय 1 की गिनती सिखाएं':
    'ᱯᱟᱹᱦᱤᱞ ᱪᱟᱱᱟᱪ ᱮᱞᱠᱷᱟ ᱯᱟᱴᱷ ᱑ ᱞᱮᱠᱷᱟ ᱥᱮᱪᱮᱫ (Teach counting for Class 1 Mathematics Chapter 1)',
  'सजीव और निर्जीव वस्तुओं के उदाहरण बताएं':
    'ᱡᱤᱣᱤᱭᱟᱱ ᱟᱨ ᱵᱤᱱ-ᱡᱤᱣᱤᱭᱟᱱ ᱡᱤᱱᱤᱥ ᱨᱮᱱᱟᱜ ᱫᱟᱹᱭᱠᱟᱹ (Explain living and non-living objects)',
  'हिंदी वर्णमाला के स्वर और व्यंजन समझाएं':
    'ᱟᱠᱷᱚᱨ ᱜᱟᱵᱟᱱ ᱟᱨ ᱨᱟᱦᱟ ᱟᱲᱟᱝ ᱵᱩᱡᱷᱟᱹᱣ (Explain vowels and consonants in language learning)',
};

export class MockTranslator implements Translator {
  async translate(text: string): Promise<{ translatedText: string; script: string }> {
    // Simulate neural machine translation inference delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    const translatedText =
      TRANSLATION_MAP[text] ||
      'ᱯᱟᱹᱦᱤᱞ ᱪᱟᱱᱟᱪ ᱮᱞᱠᱷᱟ ᱥᱮᱪᱮᱫ (Teach primary school curriculum lesson)';

    return {
      translatedText,
      script: 'sat_Olck', // Santali in Ol Chiki script placeholder tag
    };
  }
}
