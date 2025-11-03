import { openAi } from './open-ai';

describe('openAi', () => {
  it('should work', () => {
    expect(openAi()).toEqual('open-ai');
  });
});
