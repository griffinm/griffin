import OpenAI from 'openai';
import { toFile } from 'openai';

export interface OpenAIConfig {
  apiKey: string;
  organization?: string;
}

export interface TranscriptionOptions {
  model?: string;
  language?: string;
  prompt?: string;
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  temperature?: number;
  timestamp_granularities?: Array<'word' | 'segment'>;
}

export interface TranscriptionResult {
  text: string;
  language?: string;
}

export class OpenAIClient {
  private client: OpenAI;

  constructor(config: OpenAIConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
    });
  }

  /**
   * Get the underlying OpenAI client instance
   */
  getClient(): OpenAI {
    return this.client;
  }

  /**
   * Create a chat completion
   */
  async createChatCompletion(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options?: Omit<OpenAI.Chat.ChatCompletionCreateParams, 'messages'>
  ) {
    return this.client.chat.completions.create({
      model: options?.model || 'gpt-4o-mini',
      messages,
      ...options,
    });
  }

  /**
   * Create a streaming chat completion
   */
  async createStreamingChatCompletion(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options?: Omit<OpenAI.Chat.ChatCompletionCreateParams, 'messages' | 'stream'>
  ) {
    return this.client.chat.completions.create({
      model: options?.model || 'gpt-4o-mini',
      messages,
      stream: true,
      ...options,
    });
  }

  /**
   * Create speech from text (text-to-speech)
   */
  async createSpeech(
    input: string,
    options?: Omit<OpenAI.Audio.SpeechCreateParams, 'input'>
  ) {
    return this.client.audio.speech.create({
      model: options?.model || 'tts-1',
      voice: options?.voice || 'alloy',
      input,
      ...options,
    });
  }

  /**
   * Create a transcription (speech-to-text)
   */
  async createTranscription(
    file: File | Blob,
    options?: {
      model?: string;
      language?: string;
      prompt?: string;
      response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
      temperature?: number;
      timestamp_granularities?: Array<'word' | 'segment'>;
    }
  ) {
    return this.client.audio.transcriptions.create({
      model: options?.model || 'whisper-1',
      file,
      language: options?.language,
      prompt: options?.prompt,
      response_format: options?.response_format,
      temperature: options?.temperature,
      timestamp_granularities: options?.timestamp_granularities,
    });
  }

  /**
   * Transcribe audio from a buffer (useful for Node.js/NestJS)
   * Handles file conversion internally and returns a standardized result
   */
  async transcribeFromBuffer(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    options?: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    // Convert buffer to File object using OpenAI's toFile helper
    const audioFile = await toFile(buffer, filename, {
      type: mimeType,
    });

    // Call OpenAI transcription API
    const transcription = await this.client.audio.transcriptions.create({
      model: options?.model || 'whisper-1',
      file: audioFile,
      language: options?.language,
      prompt: options?.prompt,
      response_format: options?.response_format || 'json',
      temperature: options?.temperature,
      timestamp_granularities: options?.timestamp_granularities,
    });

    // Handle different response formats and return standardized result
    let transcriptionText: string;
    let detectedLanguage: string | undefined;

    if (typeof transcription === 'string') {
      // text, srt, or vtt format
      transcriptionText = transcription;
    } else if ('text' in transcription) {
      // json or verbose_json format
      transcriptionText = transcription.text;
      // language property only exists in verbose_json format
      if ('language' in transcription) {
        detectedLanguage = (transcription as any).language;
      }
    } else {
      throw new Error('Unexpected transcription response format');
    }

    return {
      text: transcriptionText,
      language: detectedLanguage || options?.language,
    };
  }

  /**
   * Create embeddings
   */
  async createEmbeddings(
    input: string | string[],
    options?: Omit<OpenAI.EmbeddingCreateParams, 'input'>
  ) {
    return this.client.embeddings.create({
      model: options?.model || 'text-embedding-3-small',
      input,
      ...options,
    });
  }
}

/**
 * Factory function to create an OpenAI client instance
 */
export function createOpenAIClient(config: OpenAIConfig): OpenAIClient {
  return new OpenAIClient(config);
}
