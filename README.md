# AI Model Library Documentation

A comprehensive TypeScript library for interacting with multiple AI providers (OpenAI, Anthropic, OpenRouter, and custom providers) with a unified interface.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Advanced Features](#advanced-features)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Overview

### Features

| Feature | Description | Supported Providers |
|---------|-------------|-------------------|
| **Multi-Provider** | Unified interface for OpenAI, Anthropic, OpenRouter, custom | All |
| **Chat Completion** | Standard text conversations | All |
| **Streaming** | Real-time response streaming | All |
| **Image Analysis** | Vision capabilities with images | OpenAI-compatible |
| **Conversation Management** | Maintain chat history with context | All |
| **Retry Logic** | Automatic retries with exponential backoff | All |
| **Comprehensive Logging** | Debug and monitoring support | All |
| **Type Safety** | Full TypeScript support | All |

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AIModel       │    │  ProviderRegistry │    │  ConfigManager  │
│   (Main Class)  │───▶│  (Provider Config)│───▶│ (Global Config) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Logger        │    │   Message        │    │   Request       │
│   (Logging)     │    │   (Chat History) │    │   (API Calls)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Installation

### Prerequisites

```bash
# Required dependencies
npm install openai
npm install -D typescript @types/node

# Or if using Bun
bun add openai
bun add -D typescript @types/node
```

### Basic Setup

```typescript
// Create the library file
// Save as ai-model-lib.ts in your project
```

## Quick Start

### 1. Basic Setup

```typescript
import { AIModel } from './ai-model-lib';

// Simplest usage with OpenRouter (free tier available)
const ai = new AIModel({
  apiKey: 'your-api-key-here',
  provider: 'openrouter',
  debug: true
});

// Send a message and get response
const response = await ai.sendTextMessage('Hello, how are you?');
console.log(response.content);
```

### 2. Environment Variables Setup

```bash
# .env file
OPENROUTER_API_KEY=your_openrouter_key_here
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
```

```typescript
// Create from environment variables
const ai = AIModel.createFromEnv('openrouter', {
  temperature: 0.7,
  maxTokens: 1000
});
```

## Core Concepts

### Message Types

| Type | Description | Example |
|------|-------------|---------|
| **Text Message** | Simple text content | `"Hello world"` |
| **Image Message** | Text + image URL | `{ text: "Describe this", imageUrl: "..." }` |
| **System Prompt** | AI behavior/context | `"You are a helpful assistant"` |
| **Structured Message** | Multiple content parts | `[{ type: "text", text: "..." }, { type: "image_url", ... }]` |

### Provider Support

| Provider | Default Model | Base URL | Features |
|----------|---------------|----------|----------|
| **OpenRouter** | `mistralai/mistral-small-3.1-24b-instruct:free` | `https://openrouter.ai/api/v1` | Multiple models, free tier |
| **OpenAI** | `gpt-3.5-turbo` | `https://api.openai.com/v1` | GPT models, vision |
| **Anthropic** | `claude-3-haiku-20240307` | `https://api.anthropic.com/v1` | Claude models |
| **Custom** | User-defined | User-defined | Any OpenAI-compatible API |

## Configuration

### Model Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | **Required** | Provider API key |
| `provider` | `string` | `"openrouter"` | Provider ID |
| `model` | `string` | Provider default | Specific model name |
| `temperature` | `number` | `0.7` | Creativity (0.0-1.0) |
| `maxTokens` | `number` | `1000` | Response length limit |
| `systemPrompt` | `string` | `""` | AI context/behavior |
| `debug` | `boolean` | `false` | Enable logging |
| `timeout` | `number` | `30000` | Request timeout (ms) |
| `retryAttempts` | `number` | `3` | Retry attempts on failure |

### Provider Configuration

```typescript
import { ProviderRegistry } from './ai-model-lib';

// Register custom provider
ProviderRegistry.registerProvider('my-provider', {
  name: 'My AI Service',
  baseURL: 'https://api.my-ai.com/v1',
  defaultModel: 'my-model-v1',
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

## Usage Examples

### 1. Basic Text Conversations

```typescript
// Method 1: One-liner approach
const response1 = await ai.sendTextMessage('Tell me a joke about programming');

// Method 2: Conversation chain
const response2 = await ai
  .addUserMessage('Hello!')
  .addAssistantMessage('Hi there! How can I help you?')
  .addUserMessage('What is the capital of France?')
  .send();

// Method 3: Multiple messages at once
const response3 = await ai.sendMultipleMessages([
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi! How can I help?' },
  { role: 'user', content: 'Tell me about TypeScript' }
]);
```

### 2. Image Analysis

```typescript
// Analyze image with text question
const imageResponse = await ai.sendImageMessage(
  'What do you see in this image? Describe the main elements.',
  'https://example.com/image.jpg'
);

// Or use the chain method
const imageAnalysis = await ai
  .addImageMessage('Analyze this image', 'https://example.com/photo.jpg')
  .send();
```

### 3. Streaming Responses

```typescript
// Stream response in real-time
const fullResponse = await ai.stream((chunk) => {
  process.stdout.write(chunk); // Print as it comes
});

// Streaming with custom options
const streamedText = await ai.stream(
  (chunk) => console.log('Chunk:', chunk),
  { temperature: 0.9, maxTokens: 500 }
);
```

### 4. System Prompts and Context

```typescript
// Set AI personality/behavior
const aiWithPersonality = new AIModel({
  apiKey: 'your-key',
  provider: 'openai'
}).setSystemPrompt(`
  You are a knowledgeable historian specializing in European history.
  Provide detailed, accurate information with dates and context.
  Be engaging but factual in your responses.
`);

const historyResponse = await aiWithPersonality
  .addUserMessage('Tell me about the Renaissance period')
  .send();
```

### 5. Configuration Management

```typescript
import { ConfigManager } from './ai-model-lib';

// Global configuration
const config = ConfigManager.getInstance();
config.setDefaultConfig({
  temperature: 0.7,
  maxTokens: 1500,
  debug: process.env.NODE_ENV === 'development',
  retryAttempts: 5
});

// Create pre-configured models
const ai = config.createModel({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4'
});
```

### 6. Error Handling and Retries

```typescript
try {
  const response = await ai
    .addUserMessage('Generate a long story about space exploration')
    .send({ maxTokens: 2000 });
    
  console.log('Success:', response.content);
  
} catch (error) {
  if (error.message.includes('API key')) {
    console.error('Authentication failed - check your API key');
  } else if (error.message.includes('rate limit')) {
    console.error('Rate limit exceeded - try again later');
  } else if (error.message.includes('timeout')) {
    console.error('Request timed out - check your connection');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

### 7. Advanced Conversation Management

```typescript
// Complex conversation with context
const conversation = await ai
  .setSystemPrompt('You are a helpful travel assistant. Provide concise, practical advice.')
  .addUserMessage('I want to visit Japan next month')
  .addAssistantMessage('Great choice! Japan is wonderful. What cities are you thinking of visiting?')
  .addUserMessage('Tokyo and Kyoto for 10 days')
  .addAssistantMessage('Excellent itinerary. Tokyo for modern experiences, Kyoto for tradition.')
  .addUserMessage('What should I pack for April?')
  .send();

console.log('Travel advice:', conversation.content);

// Check conversation history
const messages = ai.getMessages();
messages.forEach((msg, index) => {
  console.log(`${index + 1}. ${msg.role}: ${msg.content}`);
});
```

## API Reference

### AIModel Class

#### Constructor

```typescript
new AIModel(config: AIModelConfig, logger?: Logger)
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `config` | `AIModelConfig` | Yes | Model configuration |
| `logger` | `Logger` | No | Custom logger instance |

#### Core Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `send(options?)` | `Promise<AIResponse>` | Send conversation and get response |
| `stream(onChunk, options?)` | `Promise<string>` | Stream response in real-time |
| `sendTextMessage(text, options?)` | `Promise<AIResponse>` | Quick text message and response |
| `sendImageMessage(text, imageUrl, options?)` | `Promise<AIResponse>` | Quick image analysis |
| `sendMultipleMessages(messages, options?)` | `Promise<AIResponse>` | Send multiple messages at once |

#### Message Management

| Method | Returns | Description |
|--------|---------|-------------|
| `addMessage(content, role)` | `this` | Add message to conversation |
| `addUserMessage(content)` | `this` | Add user message |
| `addAssistantMessage(content)` | `this` | Add assistant message |
| `addTextMessage(text, role)` | `this` | Add text message |
| `addImageMessage(text, imageUrl)` | `this` | Add image with text |
| `getMessages()` | `Message[]` | Get all messages |
| `clearMessages()` | `this` | Clear conversation history |
| `reset()` | `this` | Reset model (messages + system prompt) |

#### Configuration Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `setSystemPrompt(prompt)` | `this` | Set/update system prompt |
| `getSystemPrompt()` | `string` | Get current system prompt |
| `updateConfig(config)` | `this` | Update model configuration |
| `getConfig()` | `AIModelConfig` | Get current configuration |
| `enableDebug(enable)` | `this` | Enable/disable debug logging |

#### Static Factory Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `create(config, logger?)` | `AIModel` | Create new instance |
| `createFromEnv(provider?, overrides?, logger?)` | `AIModel` | Create from environment variables |
| `createForProvider(providerId, apiKey, overrides?, logger?)` | `AIModel` | Create for specific provider |

### AIResponse Interface

| Property | Type | Description |
|----------|------|-------------|
| `content` | `string` | Generated text response |
| `usage.promptTokens` | `number` | Input tokens used |
| `usage.completionTokens` | `number` | Output tokens used |
| `usage.totalTokens` | `number` | Total tokens used |
| `model` | `string` | Model that generated response |
| `finishReason` | `string` | Reason generation stopped |

### ProviderRegistry Class

| Method | Returns | Description |
|--------|---------|-------------|
| `registerProvider(id, config)` | `void` | Register new provider |
| `getProvider(id)` | `AIProviderConfig | undefined` | Get provider config |
| `getAllProviders()` | `Map<string, AIProviderConfig>` | Get all providers |
| `updateProvider(id, config)` | `boolean` | Update provider config |
| `hasProvider(id)` | `boolean` | Check if provider exists |
| `removeProvider(id)` | `boolean` | Remove provider |

## Advanced Features

### Custom Logging

```typescript
import { Logger } from './ai-model-lib';

class MyCustomLogger implements Logger {
  log(type: string, message: string, data?: unknown): void {
    // Send to your logging service
    myLoggingService.send({
      level: type.toLowerCase(),
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }
  
  enable(enabled: boolean): void {
    // Enable/disable your logger
    myLoggingService.setEnabled(enabled);
  }
}

const ai = new AIModel(config, new MyCustomLogger());
```

### Custom Providers

```typescript
// Register custom AI provider
ProviderRegistry.registerProvider('my-company-ai', {
  name: 'My Company AI',
  baseURL: 'https://api.mycompany.ai/v1',
  defaultModel: 'company-model-v2',
  headers: {
    'X-API-Version': '2024-01-01',
    'X-Client-ID': 'my-app'
  }
});

// Use custom provider
const customAI = new AIModel({
  apiKey: 'company-api-key',
  provider: 'my-company-ai',
  model: 'company-model-v2-premium'
});
```

### Request Options Override

```typescript
// Override defaults per request
const response = await ai.send({
  temperature: 0.9,        // More creative
  maxTokens: 2000,         // Longer response
  model: 'gpt-4'           // Different model
});

// Different options for streaming
await ai.stream(
  chunk => console.log(chunk),
  { temperature: 0.3 }  // More deterministic
);
```

## Error Handling

### Common Error Types

| Error Type | Cause | Solution |
|------------|-------|----------|
| **AuthenticationError** | Invalid API key | Check API key validity |
| **RateLimitError** | Too many requests | Implement backoff, upgrade plan |
| **TimeoutError** | Request timeout | Increase timeout, check network |
| **ModelNotFound** | Invalid model name | Check provider model list |
| **ProviderNotFound** | Unknown provider | Register provider or check spelling |

### Retry Configuration

```typescript
const resilientAI = new AIModel({
  apiKey: 'your-key',
  provider: 'openai',
  retryAttempts: 5,           // 5 retry attempts
  timeout: 60000,             // 60 second timeout
  debug: true
});

// Automatic retry with exponential backoff:
// Attempt 1: Immediate
// Attempt 2: 2 second delay  
// Attempt 3: 4 second delay
// Attempt 4: 8 second delay
// Attempt 5: 16 second delay
```

## Best Practices

### 1. API Key Management

```typescript
// ✅ Good - Environment variables
const ai = AIModel.createFromEnv('openai');

// ✅ Good - Secure config service
const ai = new AIModel({
  apiKey: configService.getAIKey(),
  provider: 'openai'
});

// ❌ Avoid - Hardcoded keys
const ai = new AIModel({
  apiKey: 'sk-12345...',  // Don't do this!
  provider: 'openai'
});
```

### 2. Error Handling

```typescript
// ✅ Good - Comprehensive error handling
try {
  const response = await ai.sendTextMessage(userInput);
  return response.content;
} catch (error) {
  if (error.message.includes('context length')) {
    // Handle context window issues
    await ai.clearMessages();
    return await ai.sendTextMessage('Please summarize your previous question: ' + userInput);
  }
  throw error; // Re-throw unexpected errors
}

// ❌ Avoid - Silent failures
const response = await ai.sendTextMessage(input); // No error handling
```

### 3. Token Management

```typescript
// ✅ Good - Monitor token usage
const response = await ai.sendTextMessage(largeText);
console.log(`Used ${response.usage.totalTokens} tokens`);

// Estimate costs (rough calculation)
const cost = (response.usage.totalTokens / 1000) * 0.002; // Adjust per model
console.log(`Estimated cost: $${cost.toFixed(4)}`);

// ❌ Avoid - Uncontrolled token usage
// No monitoring of token consumption
```

### 4. Conversation Management

```typescript
// ✅ Good - Manage context window
function isConversationTooLong(ai: AIModel): boolean {
  const messages = ai.getMessages();
  const totalLength = messages.reduce((sum, msg) => {
    return sum + (typeof msg.content === 'string' ? msg.content.length : 1000);
  }, 0);
  return totalLength > 8000; // Approximate token limit
}

// Reset if conversation gets too long
if (isConversationTooLong(ai)) {
  ai.clearMessages();
  ai.addSystemPrompt('Previous conversation was cleared due to length limits.');
}
```

## Complete Example Project

```typescript
// complete-example.ts
import { AIModel, ConfigManager, ProviderRegistry } from './ai-model-lib';

// 1. Setup configuration
const config = ConfigManager.getInstance();
config.setDefaultConfig({
  temperature: 0.7,
  maxTokens: 1000,
  debug: process.env.NODE_ENV === 'development'
});

// 2. Register custom provider if needed
ProviderRegistry.registerProvider('local-ai', {
  name: 'Local AI',
  baseURL: 'http://localhost:8080/v1',
  defaultModel: 'local-model'
});

// 3. Create AI instance
const ai = config.createModel({
  apiKey: process.env.OPENROUTER_API_KEY!,
  provider: 'openrouter',
  systemPrompt: 'You are a helpful and concise assistant.'
});

// 4. Use in application
async function chatWithUser(message: string): Promise<string> {
  try {
    const response = await ai.sendTextMessage(message);
    
    // Log usage for monitoring
    console.log(`Tokens used: ${response.usage.totalTokens}`);
    
    return response.content;
    
  } catch (error) {
    console.error('AI service error:', error.message);
    return 'Sorry, I encountered an error. Please try again.';
  }
}

// 5. Example usage
async function main() {
  const answer1 = await chatWithUser('What is the weather like?');
  console.log('AI:', answer1);
  
  const answer2 = await chatWithUser('How about tomorrow?');
  console.log('AI:', answer2);
}

main();
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **Module not found** | Check import path, ensure dependencies installed |
| **API key errors** | Verify API key, check provider requirements |
| **Network timeouts** | Increase timeout setting, check firewall |
| **Model not available** | Check provider documentation for available models |
| **TypeScript errors** | Ensure proper types are imported |

### Debug Mode

```typescript
// Enable debug logging
const ai = new AIModel({
  apiKey: 'your-key',
  provider: 'openai',
  debug: true  // Enable detailed logging
});

// Or enable later
ai.enableDebug(true);
```

## Support

For issues and questions:
1. Check the debug logs for detailed error information
2. Verify your API keys and provider configurations
3. Ensure you have the latest version of the library
4. Check provider status pages for service outages

This library provides a robust, type-safe interface for working with multiple AI providers while maintaining simplicity and flexibility for various use cases.