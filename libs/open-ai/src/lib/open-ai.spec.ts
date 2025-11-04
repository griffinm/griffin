import { createOpenAIClient, OpenAIClient } from './open-ai';

describe('OpenAIClient', () => {
  it('should create an OpenAI client instance', () => {
    const client = createOpenAIClient({
      apiKey: 'test-key',
    });

    expect(client).toBeInstanceOf(OpenAIClient);
  });

  it('should create client with organization', () => {
    const client = createOpenAIClient({
      apiKey: 'test-key',
      organization: 'test-org',
    });

    expect(client).toBeInstanceOf(OpenAIClient);
    expect(client.getClient()).toBeDefined();
  });
});
