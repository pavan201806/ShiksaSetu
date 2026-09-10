export interface SpeechRecognizer {
  recognize(audioInput: any): Promise<{ text: string; confidence: number }>;
}

export interface Translator {
  translate(text: string): Promise<{ translatedText: string; script: string }>;
}

export interface SpeechSynthesizer {
  synthesize(text: string): Promise<{ audioUri: string }>;
}

export interface VoicePipelineResult {
  recognizedText: string;
  confidence: number;
  translatedText: string;
  script: string;
  audioUri: string;
}
