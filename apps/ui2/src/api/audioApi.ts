import { baseClient } from "./baseClient";

export interface TranscribeAudioOptions {
  filename?: string;
  mimeType?: string;
  duration?: number;
  format?: string;
  language?: string;
  prompt?: string;
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
}

export interface AudioTranscriptionResponse {
  success: boolean;
  message?: string;
  id?: string;
  transcription: string;
  language?: string;
  duration?: number;
  processingTime?: number;
  fileName?: string;
  fileSize?: number;
  createdAt?: Date;
}

export const transcribeAudio = async (
  audioBlob: Blob,
  options: TranscribeAudioOptions = {}
): Promise<AudioTranscriptionResponse> => {
  const formData = new FormData();
  
  // Add the audio file
  const filename = options.filename || 'recording.webm';
  formData.append('audio', audioBlob, filename);
  
  // Add optional metadata fields
  if (options.mimeType) formData.append('mimeType', options.mimeType);
  if (options.duration) formData.append('duration', options.duration.toString());
  if (options.format) formData.append('format', options.format);
  if (options.language) formData.append('language', options.language);
  if (options.prompt) formData.append('prompt', options.prompt);
  if (options.responseFormat) formData.append('responseFormat', options.responseFormat);
  
  const response = await baseClient.post<AudioTranscriptionResponse>('/audio', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

