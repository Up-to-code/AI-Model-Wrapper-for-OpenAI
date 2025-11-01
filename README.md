# AI Model Wrapper for OpenAI

A clean, TypeScript-based wrapper for the OpenAI API with built-in conversation management, streaming support, and optional debug logging.

## Features

✅ **Simple & Clean API** - Easy-to-use interface with method chaining  
✅ **Conversation Memory** - Automatic message history management  
✅ **Streaming Support** - Real-time response streaming  
✅ **Debug Mode** - Colorful console logs with detailed information  
✅ **TypeScript** - Full type safety  
✅ **Flexible Configuration** - Base config with per-request overrides  
✅ **Token Usage Tracking** - Get detailed token consumption data  

---

## Installation

```bash
npm install openai
```

---

## Quick Start

### Basic Usage

```typescript
import { AIModel } from './ai-model';

const ai = new AIModel({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o-mini',
  systemPrompt: 'You are a helpful assistant.',
});

ai.addUserMessage('What is TypeScript?');
const response = await ai.send();

console.log(response.content);
console.log(`Tokens: ${response.usage.totalTokens}`);
```

### With Debug Mode

```typescript
const ai = new AIModel({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o-mini',
  systemPrompt: 'You are a helpful assistant.',
  debug: true, // ✅ Enable colorful console logs
});

ai.addUserMessage('Hello!');
await ai.send();
```

---

## Configuration

### Constructor Options

```typescript
interface BaseConfig {
  apiKey: string;        // ✅ Required - Your OpenAI API key
  model: string;         // ✅ Required - Model name (e.g., 'gpt-4o-mini', 'gpt-4o')
  systemPrompt: string;  // ✅ Required - System prompt for the AI
  temperature?: number;  // Optional - Default: 0.7 (0.0 to 2.0)
  maxTokens?: number;    // Optional - Default: 1000
  debug?: boolean;       // Optional - Default: false
}
```

### Example with All Options

```typescript
const ai = new AIModel({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o',
  systemPrompt: 'You are a creative writer.',
  temperature: 0.9,    // More creative
  maxTokens: 2000,     // Longer responses
  debug: true,         // Enable logging
});
```

---

## API Reference

### Core Methods

#### `addUserMessage(content: string)`
Add a user message to the conversation.

```typescript
ai.addUserMessage('Tell me a joke');
```

#### `addAssistantMessage(content: string)`
Add an assistant message to the conversation.

```typescript
ai.addAssistantMessage('Why did the chicken cross the road?');
```

#### `send(options?: RequestOptions)`
Send messages and get a response.

```typescript
const response = await ai.send();

// Override config for this request only
const response = await ai.send({
  temperature: 1.0,
  model: 'gpt-4o',
  maxTokens: 500,
});
```

**Returns:**
```typescript
{
  content: string;           // AI response text
  usage: {
    promptTokens: number;    // Tokens in prompt
    completionTokens: number; // Tokens in response
    totalTokens: number;     // Total tokens
  };
  model: string;             // Model used
}
```

#### `stream(onChunk: (chunk: string) => void, options?: RequestOptions)`
Stream the response in real-time.

```typescript
await ai.stream((chunk) => {
  process.stdout.write(chunk);
});
```

### Configuration Methods

#### `setSystemPrompt(prompt: string)`
Update the system prompt.

```typescript
ai.setSystemPrompt('You are a math tutor.');
```

#### `updateConfig(config: Partial<BaseConfig>)`
Update base configuration.

```typescript
ai.updateConfig({
  temperature: 0.9,
  maxTokens: 2000,
});
```

#### `enableDebug(enable: boolean)`
Enable or disable debug logging.

```typescript
ai.enableDebug(true);  // Turn on
ai.enableDebug(false); // Turn off
```

### Message Management

#### `getMessages()`
Get all messages in the conversation.

```typescript
const messages = ai.getMessages();
```

#### `clearMessages()`
Clear all messages (keeps system prompt).

```typescript
ai.clearMessages();
```

#### `reset()`
Clear messages and system prompt.

```typescript
ai.reset();
```

### Static Methods

#### `AIModel.quickChat(config, prompt, options?)`
One-shot chat without creating an instance.

```typescript
const response = await AIModel.quickChat(
  {
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4o-mini',
    systemPrompt: 'You are funny.',
  },
  'Tell me a joke'
);

console.log(response);
```

#### `AIModel.createFromEnv(model, systemPrompt, overrides?)`
Create instance using `OPENAI_API_KEY` from environment.

```typescript
const ai = AIModel.createFromEnv(
  'gpt-4o-mini',
  'You are helpful.',
  { debug: true }
);
```

---

## Examples

### Example 1: Simple Conversation

```typescript
const ai = new AIModel({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o-mini',
  systemPrompt: 'You are a friendly chatbot.',
});

// First message
ai.addUserMessage('My name is Alice');
await ai.send();

// Second message (remembers context)
ai.addUserMessage('What is my name?');
const response = await ai.send();

console.log(response.content); // "Your name is Alice"
```

### Example 2: Method Chaining

```typescript
const response = await ai
  .setSystemPrompt('You are a math tutor.')
  .addUserMessage('What is 15 * 23?')
  .send();

console.log(response.content);
```

### Example 3: Streaming Response

```typescript
const ai = new AIModel({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o-mini',
  systemPrompt: 'You are a creative writer.',
});

ai.addUserMessage('Write a poem about coding');

await ai.stream((chunk) => {
  process.stdout.write(chunk); // Print as it streams
});
```

### Example 4: Override Settings Per Request

```typescript
const ai = new AIModel({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o-mini',
  systemPrompt: 'You are helpful.',
  temperature: 0.7,
});

// Use default settings
ai.addUserMessage('Explain quantum physics');
await ai.send();

// Override for creative writing
ai.addUserMessage('Write a creative story');
const response = await ai.send({
  model: 'gpt-4o',
  temperature: 1.2,
  maxTokens: 3000,
});
```

### Example 5: Express.js Integration

```typescript
import express from 'express';
import { AIModel } from './ai-model';

const app = express();
app.use(express.json());

const ai = new AIModel({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o-mini',
  systemPrompt: 'You are a helpful assistant.',
  debug: process.env.NODE_ENV === 'development',
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const response = await ai.addUserMessage(message).send();
    
    res.json({ 
      response: response.content, 
      tokens: response.usage.totalTokens 
    });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed' 
    });
  }
});

app.listen(3000);
```

### Example 6: Next.js API Route

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AIModel } from '@/lib/ai-model';

const ai = new AIModel({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o-mini',
  systemPrompt: 'You are a helpful assistant.',
});

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    const response = await ai.addUserMessage(message).send();
    
    return NextResponse.json({ 
      response: response.content, 
      tokens: response.usage.totalTokens 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get response' }, 
      { status: 500 }
    );
  }
}
```

---

## Debug Mode

When `debug: true` is enabled, you get colorful console logs with detailed information:

### What Gets Logged

- 🚀 **CONFIG** (Magenta) - Configuration changes
- 💬 **MESSAGE** (Blue) - Message additions
- 📤 **REQUEST** (Cyan) - API requests
- 📥 **RESPONSE** (Green) - API responses with token usage
- ✅ **STREAM** (Yellow) - Streaming information
- ❌ **ERROR** (Red) - Error details

### Example Debug Output

```
═══════════════════════════════════════════════════════
[2025-01-15T10:30:45.123Z] REQUEST
📤 Sending request to OpenAI
{
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "maxTokens": 1000,
  "messageCount": 2,
  "messages": [...]
}
═══════════════════════════════════════════════════════

═══════════════════════════════════════════════════════
[2025-01-15T10:30:46.789Z] RESPONSE
📥 Received response from OpenAI
{
  "duration": "1666ms",
  "model": "gpt-4o-mini",
  "finishReason": "stop",
  "usage": {
    "promptTokens": 45,
    "completionTokens": 123,
    "totalTokens": 168,
    "estimatedCost": "$0.000017"
  },
  "responseLength": 567,
  "responsePreview": "TypeScript is a strongly typed..."
}
═══════════════════════════════════════════════════════
```

---

## Environment Variables

Create a `.env` file:

```env
OPENAI_API_KEY=sk-your-api-key-here
```

---

## TypeScript Support

Full TypeScript support with type definitions included:

```typescript
import { AIModel, AIResponse, Message } from './ai-model';

const response: AIResponse = await ai.send();
const messages: Message[] = ai.getMessages();
```

---

## Error Handling

All methods throw descriptive errors:

```typescript
try {
  const response = await ai.send();
} catch (error) {
  console.error('AI Error:', error.message);
}
```

Common errors:
- `API key is required`
- `Model name is required`
- `System prompt is required`
- `No messages to send`
- `AI API Error: [OpenAI error message]`

---

## Best Practices

1. **Set base configuration** - Define your defaults in the constructor
2. **Use environment variables** - Keep API keys secure
3. **Enable debug in development** - Use `debug: process.env.NODE_ENV === 'development'`
4. **Override per request** - Change settings for specific requests without affecting base config
5. **Clear messages** - Use `clearMessages()` to start new conversations while keeping system prompt
6. **Monitor token usage** - Check `response.usage` to track costs

---

## Token Usage & Costs

Every response includes token usage:

```typescript
const response = await ai.send();

console.log('Prompt tokens:', response.usage.promptTokens);
console.log('Completion tokens:', response.usage.completionTokens);
console.log('Total tokens:', response.usage.totalTokens);

// Calculate approximate cost
// gpt-4o-mini: ~$0.0001 per 1000 tokens
const cost = (response.usage.totalTokens / 1000) * 0.0001;
console.log(`Estimated cost: $${cost.toFixed(6)}`);
```

---

## License

MIT

---

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

---

## Support

For issues or questions:
- GitHub Issues: [your-repo-url]
- OpenAI Documentation: https://platform.openai.com/docs

---

## Changelog

### v1.0.0
- Initial release
- Basic chat functionality
- Streaming support
- Debug mode with colorful console logs
- Token usage tracking
- Method chaining
- TypeScript support