# @griffin/open-ai

A TypeScript library for interacting with the OpenAI API.

## Installation

This library is part of the Griffin monorepo and can be imported using:

```typescript
import { createOpenAIClient, OpenAIClient } from '@griffin/open-ai';
```

## Usage

### Basic Setup

```typescript
import { createOpenAIClient } from '@griffin/open-ai';

const client = createOpenAIClient({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION, // optional
});
```

### Chat Completions

```typescript
const response = await client.createChatCompletion([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'What is the capital of France?' }
], {
  model: 'gpt-4o-mini', // default
  temperature: 0.7,
  max_tokens: 150
});

console.log(response.choices[0].message.content);
```

### Streaming Chat Completions

```typescript
const stream = await client.createStreamingChatCompletion([
  { role: 'user', content: 'Tell me a story.' }
]);

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  process.stdout.write(content);
}
```

### Text-to-Speech

```typescript
const mp3 = await client.createSpeech('Hello, world!', {
  voice: 'alloy',
  model: 'tts-1'
});

// mp3 is a Response object with the audio data
const buffer = Buffer.from(await mp3.arrayBuffer());
```

### Speech-to-Text (Transcription)

#### From Buffer (Node.js/NestJS)

The easiest way to transcribe audio in Node.js environments:

```typescript
const result = await client.transcribeFromBuffer(
  buffer,           // Buffer from file upload
  'recording.webm', // Original filename
  'audio/webm',     // MIME type
  {
    language: 'en',
    response_format: 'json'
  }
);

console.log(result.text);        // Transcription text
console.log(result.language);    // Detected language
```

#### From File/Blob (Browser)

```typescript
const transcription = await client.createTranscription(audioFile, {
  language: 'en',
  response_format: 'json'
});

console.log(transcription.text);
```

### Embeddings

```typescript
const embeddings = await client.createEmbeddings('Sample text to embed', {
  model: 'text-embedding-3-small'
});

console.log(embeddings.data[0].embedding);
```

### Direct Client Access

If you need access to the underlying OpenAI client for advanced use cases:

```typescript
const openaiClient = client.getClient();
// Use openaiClient directly for any OpenAI API calls
```

## API Reference

### `OpenAIClient`

#### Constructor

- `constructor(config: OpenAIConfig)`

#### Methods

- `getClient(): OpenAI` - Get the underlying OpenAI client instance
- `createChatCompletion(messages, options?)` - Create a chat completion
- `createStreamingChatCompletion(messages, options?)` - Create a streaming chat completion
- `createSpeech(input, options?)` - Convert text to speech
- `transcribeFromBuffer(buffer, filename, mimeType, options?)` - Transcribe audio from buffer (Node.js)
- `createTranscription(file, options?)` - Transcribe audio from File/Blob (Browser)
- `createEmbeddings(input, options?)` - Create embeddings for text

### `OpenAIConfig`

```typescript
interface OpenAIConfig {
  apiKey: string;
  organization?: string;
}
```

## Environment Variables

When using this library, make sure to set the following environment variables:

- `OPENAI_API_KEY` - Your OpenAI API key (required)
- `OPENAI_ORGANIZATION` - Your OpenAI organization ID (optional)
