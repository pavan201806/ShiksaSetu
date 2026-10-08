import { Translator } from './interfaces';

export const TRANSLATION_MAP: Record<string, string> = {
  'कक्षा 1 गणित अध्याय 1 की गिनती सिखाएं':
    'ᱯᱟᱹᱦᱤᱞ ᱪᱟᱱᱟᱪ ᱮᱞᱠᱷᱟ ᱯᱟᱴᱷ ᱑ ᱞᱮᱠᱷᱟ ᱥᱮᱪᱮᱫ (Teach counting for Class 1 Mathematics Chapter 1)',
  'सजीव और निर्जीव वस्तुओं के उदाहरण बताएं':
    'ᱡᱤᱣᱤᱭᱟᱱ ᱟᱨ ᱵᱤᱱ-ᱡᱤᱣᱤᱭᱟᱱ ᱡᱤᱱᱤᱥ ᱨᱮᱱᱟᱜ ᱫᱟᱹᱭᱠᱟᱹ (Explain living and non-living objects)',
  'हिंदी वर्णमाला के स्वर और व्यंजन समझाएं':
    'ᱟᱠᱷᱚᱨ ᱜᱟᱵᱟᱱ ᱟᱨ ᱨᱟᱦᱟ ᱟᱲᱟᱝ ᱵᱩᱡᱷᱟᱹᱣ (Explain vowels and consonants in language learning)',
};

export const REVERSE_TRANSLATION_MAP: Record<string, string> = {
  'ᱯᱟᱹᱦᱤᱞ ᱪᱟᱱᱟᱪ ᱮᱞᱠᱷᱟ ᱯᱟᱴᱷ ᱑ ᱞᱮᱠᱷᱟ ᱥᱮᱪᱮᱫ':
    'कक्षा 1 गणित अध्याय 1 की गिनती सिखाएं',
  'ᱯᱟᱹᱦᱤᱞ ᱪᱟᱱᱟᱪ ᱮᱞᱠᱷᱟ ᱯᱟᱴᱷ ᱑ ᱞᱮᱠᱷᱟ ᱥᱮᱪᱮᱫ (Teach counting for Class 1 Mathematics Chapter 1)':
    'कक्षा 1 गणित अध्याय 1 की गिनती सिखाएं',
  'ᱡᱤᱣᱤᱭᱟᱱ ᱟᱨ ᱵᱤᱱ-ᱡᱤᱣᱤᱭᱟᱱ ᱡᱤᱱᱤᱥ ᱨᱮᱱᱟᱜ ᱫᱟᱹᱭᱠᱟᱹ':
    'सजीव और निर्जीव वस्तुओं के उदाहरण बताएं',
  'ᱡᱤᱣᱤᱭᱟᱱ ᱟᱨ ᱵᱤᱱ-ᱡᱤᱣᱤᱭᱟᱱ ᱡᱤᱱᱤᱥ ᱨᱮᱱᱟᱜ ᱫᱟᱹᱭᱠᱟᱹ (Explain living and non-living objects)':
    'सजीव और निर्जीव वस्तुओं के उदाहरण बताएं',
  'ᱟᱠᱷᱚᱨ ᱜᱟᱵᱟᱱ ᱟᱨ ᱨᱟᱦᱟ ᱟᱲᱟᱝ ᱵᱩᱡᱷᱟᱹᱣ':
    'हिंदी वर्णमाला के स्वर और व्यंजन समझाएं',
  'ᱟᱠᱷᱚᱨ ᱜᱟᱵᱟᱱ ᱟᱨ ᱨᱟᱦᱟ ᱟᱲᱟᱝ ᱵᱩᱡᱷᱟᱹᱣ (Explain vowels and consonants in language learning)':
    'हिंदी वर्णमाला के स्वर और व्यंजन समझाएं',
};

export class MockTranslator implements Translator {
  async translate(text: string): Promise<{ translatedText: string; script: string }> {
    // Simulate neural machine translation inference delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    const clean = text.trim();
    const translatedText =
      TRANSLATION_MAP[clean] ||
      'ᱯᱟᱹᱦᱤᱞ ᱪᱟᱱᱟᱪ ᱮᱞᱠᱷᱟ ᱥᱮᱪᱮᱫ (Teach primary school curriculum lesson)';

    return {
      translatedText,
      script: 'sat_Olck', // Santali in Ol Chiki script placeholder tag
    };
  }
}

export class ReverseMockTranslator implements Translator {
  async translate(text: string): Promise<{ translatedText: string; script: string }> {
    // Simulate neural machine translation inference delay (reverse direction)
    await new Promise((resolve) => setTimeout(resolve, 600));

    const clean = text.trim();
    let translatedText = REVERSE_TRANSLATION_MAP[clean];
    if (!translatedText) {
      const match = Object.keys(REVERSE_TRANSLATION_MAP).find(
        (key) => clean.includes(key) || key.includes(clean)
      );
      if (match) {
        translatedText = REVERSE_TRANSLATION_MAP[match];
      }
    }

    if (!translatedText) {
      translatedText = 'कक्षा 1 के प्राथमिक पाठ्यक्रम का पाठ सिखाएं';
    }

    return {
      translatedText,
      script: 'Devanagari', // Hindi in Devanagari script tag
    };
  }
}

