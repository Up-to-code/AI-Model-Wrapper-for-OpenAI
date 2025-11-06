

# AI Model Library - Complete Documentation & Examples

A comprehensive TypeScript wrapper for multiple AI providers with clean, intuitive API design.

---

## 📚 Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Configuration](#configuration)
4. [Core Concepts](#core-concepts)
5. [API Reference](#api-reference)
6. [Practical Examples](#practical-examples)
7. [Advanced Patterns](#advanced-patterns)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## 🚀 Installation

```bash
npm install openai
```

---

## ⚡ Quick Start

### The Simplest Way

```typescript
import { AIModel } from './ai-model-lib';

// Create and use in one go
const ai = new AIModel({
  apiKey: process.env.OPENROUTER_API_KEY!,
  provider: 'openrouter',
  model: 'gpt-4o-mini',
  systemPrompt: 'You are a helpful assistant.',
});

// Send a message
const response = await ai
  .addUserMessage('What is TypeScript?')
  .send();

console.log(response.content);
```

### With Configuration Manager (Recommended)

```typescript
import { ConfigManager } from './ai-model-lib';

// Configure once, use everywhere
const config = ConfigManager.getInstance();
config.setDefaultConfig({
  temperature: 0.7,
  maxTokens: 1000,
  debug: process.env.NODE_ENV === 'development',
});

// Create models with defaults
const ai = config.createModel({
  apiKey: process.env.OPENROUTER_API_KEY!,
  provider: 'openrouter',
  model: 'gpt-4o-mini',
  systemPrompt: 'You are a helpful assistant.',
});
```

---

## ⚙️ Configuration

### Base Configuration Properties

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `apiKey` | `string` | ✅ Yes | - | Your API key for the provider |
| `provider` | `string` | ❌ No | `'openrouter'` | Provider ID (`openrouter`, `openai`, `anthropic`, or custom) |
| `model` | `string` | ❌ No | Provider default | Model name to use |
| `systemPrompt` | `string` | ❌ No | `''` | System prompt for context |
| `temperature` | `number` | ❌ No | `0.7` | Creativity level (0.0 to 2.0) |
| `maxTokens` | `number` | ❌ No | `1000` | Maximum response tokens |
| `debug` | `boolean` | ❌ No | `false` | Enable debug logging |
| `timeout` | `number` | ❌ No | `30000` | Request timeout in milliseconds |
| `retryAttempts` | `number` | ❌ No | `3` | Number of retry attempts |

### Configuration Examples

#### Minimal Configuration
```typescript
const ai = new AIModel({
  apiKey: process.env.OPENROUTER_API_KEY!,
});
```

#### Full Configuration
```typescript
const ai = new AIModel({
  apiKey: process.env.OPENROUTER_API_KEY!,
  provider: 'openrouter',
  model: 'anthropic/claude-3-haiku',
  systemPrompt: 'You are an expert software engineer.',
  temperature: 0.9,
  maxTokens: 2000,
  debug: true,
  timeout: 60000,
  retryAttempts: 5,
});
```

#### Environment-Based Configuration
```typescript
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const ai = new AIModel({
  apiKey: process.env.OPENROUTER_API_KEY!,
  provider: 'openrouter',
  model: isProduction ? 'anthropic/claude-3-opus' : 'gpt-4o-mini',
  temperature: isProduction ? 0.3 : 0.7,
  maxTokens: isProduction ? 4000 : 1000,
  debug: isDevelopment,
  timeout: isProduction ? 120000 : 30000,
  retryAttempts: isProduction ? 5 : 3,
});
```

---

## 🧠 Core Concepts

### 1. Providers

The library supports multiple AI providers out of the box:

```typescript
// OpenRouter (default) - Access to many models
const ai1 = new AIModel({
  apiKey: process.env.OPENROUTER_API_KEY!,
  provider: 'openrouter',
  model: 'gpt-4o-mini',
});

// OpenAI - Direct OpenAI API
const ai2 = new AIModel({
  apiKey: process.env.OPENAI_API_KEY!,
  provider: 'openai',
  model: 'gpt-4',
});

// Anthropic - Claude models
const ai3 = new AIModel({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  provider: 'anthropic',
  model: 'claude-3-haiku-20240307',
});
```

### 2. Message Types

The library supports different message content types:

```typescript
// Simple text message
ai.addUserMessage('Hello, world!');

// Multi-part message with image
ai.addUserMessage([
  { type: 'text', text: 'What do you see in this image?' },
  { type: 'image_url', image_url: { url: 'https://example.com/image.jpg' } }
]);

// Helper method for image messages
ai.addImageMessage(
  'Describe this image',
  'https://example.com/image.jpg'
);
```

### 3. Conversation Flow

```typescript
// System prompt sets context
ai.setSystemPrompt('You are a helpful math tutor.');

// User asks question
ai.addUserMessage('What is 15 * 23?');

// AI responds and remembers context
const response1 = await ai.send();

// Follow-up question maintains context
ai.addUserMessage('Can you show me the steps?');
const response2 = await ai.send();

// Both responses are aware of the conversation
```

---

## 📖 API Reference

### Message Management

#### `addUserMessage(content)`
Add a user message to the conversation.

```typescript
// Text message
ai.addUserMessage('Tell me a joke');

// Image message
ai.addUserMessage([
  { type: 'text', text: 'What is this?' },
  { type: 'image_url', image_url: { url: 'https://example.com/image.jpg' } }
]);
```

#### `addAssistantMessage(content)`
Add an assistant message (useful for pre-loading conversations).

```typescript
ai.addAssistantMessage('The capital of France is Paris.');
ai.addUserMessage('What did you just say?');
const response = await ai.send(); // Will reference the assistant message
```

#### `addImageMessage(text, imageUrl)`
Convenient method for image analysis.

```typescript
ai.addImageMessage(
  'Analyze this chart',
  'https://example.com/chart.png'
);
```

### Configuration Methods

#### `setSystemPrompt(prompt)`
Set or update the system prompt.

```typescript
ai.setSystemPrompt('You are a creative writer specializing in poetry.');
```

#### `updateConfig(config)`
Update configuration properties.

```typescript
ai.updateConfig({
  temperature: 0.9,    // More creative
  maxTokens: 2000,     // Longer responses
  debug: true,         // Enable logging
});
```

#### `enableDebug(enable)`
Toggle debug mode.

```typescript
ai.enableDebug(true);   // Turn on
ai.enableDebug(false);  // Turn off
```

### Request Methods

#### `send(options?)`
Send messages and get a complete response.

```typescript
// Basic usage
const response = await ai.send();

// With options override
const response = await ai.send({
  temperature: 1.0,
  maxTokens: 500,
  model: 'gpt-4o',
});

// Response structure
console.log(response.content);           // AI response text
console.log(response.usage.totalTokens); // Token usage
console.log(response.model);             // Model used
```

#### `stream(onChunk, options?)`
Stream response in real-time.

```typescript
console.log('AI Response: ');
await ai.stream((chunk) => {
  process.stdout.write(chunk); // Print as it arrives
});

// With options
await ai.stream(
  (chunk) => console.log(chunk),
  { temperature: 0.8 }
);
```

### Message History

#### `getMessages()`
Get all messages in the conversation.

```typescript
const messages = ai.getMessages();
console.log(`Total messages: ${messages.length}`);
```

#### `clearMessages()`
Clear all messages but keep system prompt.

```typescript
ai.clearMessages(); // Start fresh conversation
```

#### `reset()`
Clear everything including system prompt.

```typescript
ai.reset(); // Complete reset
```

---

## 💼 Practical Examples

### Example 1: Chatbot with Memory

```typescript
class ChatBot {
  private ai: AIModel;
  
  constructor() {
    this.ai = new AIModel({
      apiKey: process.env.OPENROUTER_API_KEY!,
      provider: 'openrouter',
      model: 'gpt-4o-mini',
      systemPrompt: 'You are a friendly assistant named Alex. Remember user preferences.',
      debug: true,
    });
  }
  
  async chat(userMessage: string): Promise<string> {
    this.ai.addUserMessage(userMessage);
    const response = await this.ai.send();
    return response.content;
  }
  
  async startNewConversation(): Promise<void> {
    this.ai.clearMessages();
    const greeting = await this.chat('Hello! Introduce yourself.');
    console.log('Bot:', greeting);
  }
  
  async setUserName(name: string): Promise<void> {
    await this.chat(`My name is ${name}. Please remember it.`);
  }
}

// Usage
const bot = new ChatBot();
await bot.startNewConversation();
await bot.setUserName('Alice');
console.log('Bot:', await bot.chat('What is my name?'));
```

### Example 2: Content Generator

```typescript
class ContentGenerator {
  private ai: AIModel;
  
  constructor() {
    this.ai = new AIModel({
      apiKey: process.env.OPENROUTER_API_KEY!,
      provider: 'openrouter',
      model: 'anthropic/claude-3-haiku',
      temperature: 0.9,
      maxTokens: 2000,
    });
  }
  
  async generateBlogPost(topic: string, tone: 'formal' | 'casual' = 'casual'): Promise<string> {
    const systemPrompt = `You are a professional content writer. Write ${tone} blog posts that are engaging and informative.`;
    this.ai.setSystemPrompt(systemPrompt);
    
    this.ai.addUserMessage(`Write a blog post about: ${topic}`);
    return await this.ai.stream((chunk) => process.stdout.write(chunk));
  }
  
  async generateSocialMediaPost(content: string, platform: 'twitter' | 'linkedin' | 'instagram'): Promise<string> {
    const platformPrompts = {
      twitter: 'Create a tweet (max 280 characters)',
      linkedin: 'Create a professional LinkedIn post',
      instagram: 'Create an engaging Instagram caption'
    };
    
    this.ai.setSystemPrompt('You are a social media expert.');
    this.ai.addUserMessage(`${platformPrompts[platform]} about: ${content}`);
    
    const response = await this.ai.send({ maxTokens: 100 });
    return response.content;
  }
}

// Usage
const generator = new ContentGenerator();
console.log('Generating blog post...');
await generator.generateBlogPost('The Future of AI', 'casual');

console.log('\nGenerating social media post...');
const tweet = await generator.generateSocialMediaPost('AI is transforming education', 'twitter');
console.log('Tweet:', tweet);
```

### Example 3: Code Review Assistant

```typescript
class CodeReviewer {
  private ai: AIModel;
  
  constructor() {
    this.ai = new AIModel({
      apiKey: process.env.OPENROUTER_API_KEY!,
      provider: 'openrouter',
      model: 'gpt-4o',
      systemPrompt: 'You are an expert software engineer. Provide constructive code reviews with specific suggestions for improvement.',
      temperature: 0.3, // More consistent
    });
  }
  
  async reviewCode(code: string, language: string): Promise<string> {
    this.ai.addUserMessage(`
      Review this ${language} code and provide feedback:
      
      1. Code quality and best practices
      2. Potential bugs or issues
      3. Performance considerations
      4. Suggestions for improvement
      
      Code:
      ${code}
    `);
    
    return await this.ai.stream((chunk) => process.stdout.write(chunk));
  }
  
  async suggestRefactoring(code: string, target: string): Promise<string> {
    this.ai.addUserMessage(`
      Refactor this code to ${target}:
      
      ${code}
      
      Explain the changes and benefits.
    `);
    
    const response = await this.ai.send();
    return response.content;
  }
}

// Usage
const reviewer = new CodeReviewer();

const sampleCode = `
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}
`;

console.log('Code Review:');
await reviewer.reviewCode(sampleCode, 'JavaScript');

console.log('\nRefactoring Suggestion:');
const suggestion = await reviewer.suggestRefactoring(sampleCode, 'use modern ES6+ features');
console.log(suggestion);
```

### Example 4: Image Analysis Service

```typescript
class ImageAnalyzer {
  private ai: AIModel;
  
  constructor() {
    this.ai = new AIModel({
      apiKey: process.env.OPENROUTER_API_KEY!,
      provider: 'openrouter',
      model: 'openai/gpt-4-vision-preview',
      systemPrompt: 'You are an expert image analyst. Provide detailed descriptions and insights.',
    });
  }
  
  async analyzeImage(imageUrl: string, analysisType: 'general' | 'detailed' | 'technical' = 'general'): Promise<string> {
    const prompts = {
      general: 'Describe what you see in this image.',
      detailed: 'Provide a detailed analysis of this image, including objects, colors, composition, and context.',
      technical: 'Analyze this image from a technical perspective, focusing on quality, composition, and technical aspects.'
    };
    
    this.ai.addImageMessage(prompts[analysisType], imageUrl);
    return await this.ai.stream((chunk) => process.stdout.write(chunk));
  }
  
  async extractTextFromImage(imageUrl: string): Promise<string> {
    this.ai.setSystemPrompt('Extract and transcribe all text visible in the image.');
    this.ai.addImageMessage('Extract all text from this image:', imageUrl);
    
    const response = await this.ai.send();
    return response.content;
  }
  
  async compareImages(imageUrl1: string, imageUrl2: string): Promise<string> {
    this.ai.setSystemPrompt('You are an expert at comparing images. Identify similarities and differences.');
    
    this.ai.addUserMessage([
      { type: 'text', text: 'Compare these two images:' },
      { type: 'image_url', image_url: { url: imageUrl1 } },
      { type: 'text', text: 'AND' },
      { type: 'image_url', image_url: { url: imageUrl2 } }
    ]);
    
    return await this.ai.send().then(r => r.content);
  }
}

// Usage
const analyzer = new ImageAnalyzer();

console.log('Analyzing image...');
await analyzer.analyzeImage(
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg',
  'detailed'
);
```

### Example 5: Multi-Provider Service

```typescript
class AIService {
  private providers: Map<string, AIModel> = new Map();
  
  constructor() {
    // Initialize multiple providers
    this.providers.set('fast', new AIModel({
      apiKey: process.env.OPENROUTER_API_KEY!,
      provider: 'openrouter',
      model: 'gpt-4o-mini',
      systemPrompt: 'Provide quick, concise responses.',
      temperature: 0.5,
    }));
    
    this.providers.set('creative', new AIModel({
      apiKey: process.env.OPENROUTER_API_KEY!,
      provider: 'openrouter',
      model: 'anthropic/claude-3-haiku',
      systemPrompt: 'You are a creative writer. Be imaginative and expressive.',
      temperature: 0.9,
    }));
    
    this.providers.set('analytical', new AIModel({
      apiKey: process.env.OPENROUTER_API_KEY!,
      provider: 'openrouter',
      model: 'gpt-4o',
      systemPrompt: 'You are an analytical expert. Provide detailed, logical responses.',
      temperature: 0.2,
    }));
  }
  
  async ask(question: string, provider: 'fast' | 'creative' | 'analytical' = 'fast'): Promise<string> {
    const ai = this.providers.get(provider);
    if (!ai) throw new Error(`Provider ${provider} not found`);
    
    ai.addUserMessage(question);
    const response = await ai.send();
    return response.content;
  }
  
  async askAll(question: string): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    
    for (const [name, ai] of this.providers) {
      ai.addUserMessage(question);
      results[name] = await ai.send().then(r => r.content);
    }
    
    return results;
  }
  
  async getConsensus(question: string): Promise<string> {
    const responses = await this.askAll(question);
    
    // Use analytical provider to synthesize
    const analytical = this.providers.get('analytical')!;
    analytical.addUserMessage(`
      Synthesize these responses into a consensus answer:
      
      Fast response: ${responses.fast}
      Creative response: ${responses.creative}
      Analytical response: ${responses.analytical}
      
      Original question: ${question}
    `);
    
    return await analytical.send().then(r => r.content);
  }
}

// Usage
const service = new AIService();

console.log('Fast response:', await service.ask('What is AI?', 'fast'));
console.log('Creative response:', await service.ask('What is AI?', 'creative'));
console.log('Analytical response:', await service.ask('What is AI?', 'analytical'));

console.log('\nAll responses:', await service.askAll('What is AI?'));
console.log('\nConsensus:', await service.getConsensus('What is AI?'));
```

---

## 🎯 Advanced Patterns

### Pattern 1: Request Queue with Rate Limiting

```typescript
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequest = 0;
  private minInterval = 1000; // 1 second between requests
  
  constructor(private ai: AIModel) {}
  
  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.process();
    });
  }
  
  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequest;
      
      if (timeSinceLastRequest < this.minInterval) {
        await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastRequest));
      }
      
      const request = this.queue.shift();
      if (request) {
        await request();
        this.lastRequest = Date.now();
      }
    }
    
    this.processing = false;
  }
}

// Usage
const queue = new RequestQueue(ai);

// Add multiple requests
const promises = Array.from({ length: 10 }, (_, i) => 
  queue.add(() => {
    ai.addUserMessage(`Question ${i + 1}: What is ${i + 1} + ${i + 1}?`);
    return ai.send();
  })
);

const results = await Promise.all(promises);
console.log(results);
```

### Pattern 2: Response Caching

```typescript
class CachedAIModel {
  private cache = new Map<string, any>();
  private ai: AIModel;
  
  constructor(config: any) {
    this.ai = new AIModel(config);
  }
  
  private getCacheKey(prompt: string, options?: any): string {
    return `${prompt}:${JSON.stringify(options || {})}`;
  }
  
  async send(prompt: string, options?: any): Promise<any> {
    const cacheKey = this.getCacheKey(prompt, options);
    
    if (this.cache.has(cacheKey)) {
      console.log('Returning cached response');
      return this.cache.get(cacheKey);
    }
    
    this.ai.addUserMessage(prompt);
    const response = await this.ai.send(options);
    
    // Cache for 1 hour
    this.cache.set(cacheKey, response);
    setTimeout(() => this.cache.delete(cacheKey), 3600000);
    
    return response;
  }
  
  clearCache(): void {
    this.cache.clear();
  }
}
```

### Pattern 3: Template System

```typescript
class PromptTemplate {
  private templates = new Map<string, string>();
  
  constructor(private ai: AIModel) {}
  
  addTemplate(name: string, template: string): void {
    this.templates.set(name, template);
  }
  
  async useTemplate(name: string, variables: Record<string, any>): Promise<string> {
    const template = this.templates.get(name);
    if (!template) throw new Error(`Template ${name} not found`);
    
    let prompt = template;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    
    this.ai.addUserMessage(prompt);
    const response = await this.ai.send();
    return response.content;
  }
}

// Usage
const templateAI = new PromptTemplate(ai);

templateAI.addTemplate('codeReview', `
  Review this {{language}} code:
  
  {{code}}
  
  Focus on: {{focus}}
`);

const review = await templateAI.useTemplate('codeReview', {
  language: 'TypeScript',
  code: 'const x = 1;',
  focus: 'best practices'
});
```

---

## ✅ Best Practices

### 1. Environment Configuration

```typescript
// config/ai.ts
export const AI_CONFIG = {
  development: {
    apiKey: process.env.OPENROUTER_API_KEY!,
    provider: 'openrouter',
    model: 'gpt-4o-mini',
    debug: true,
    temperature: 0.7,
  },
  production: {
    apiKey: process.env.OPENROUTER_API_KEY!,
    provider: 'openrouter',
    model: 'anthropic/claude-3-haiku',
    debug: false,
    temperature: 0.5,
  },
  test: {
    apiKey: 'test-key',
    provider: 'openrouter',
    model: 'gpt-4o-mini',
    debug: false,
    temperature: 0.1,
  }
};

export function createAI(env: keyof typeof AI_CONFIG = 'development'): AIModel {
  return new AIModel(AI_CONFIG[env]);
}
```

### 2. Error Handling

```typescript
class SafeAIModel {
  constructor(private ai: AIModel) {}
  
  async safeSend(prompt: string, fallback = 'Sorry, I cannot process that right now.'): Promise<string> {
    try {
      this.ai.addUserMessage(prompt);
      const response = await this.ai.send();
      return response.content;
    } catch (error) {
      console.error('AI Error:', error);
      
      // Log error details
      if (process.env.NODE_ENV === 'development') {
        console.error('Full error:', error);
      }
      
      return fallback;
    }
  }
  
  async safeStream(
    prompt: string, 
    onChunk: (chunk: string) => void,
    fallback = 'Response interrupted.'
  ): Promise<string> {
    try {
      this.ai.addUserMessage(prompt);
      return await this.ai.stream(onChunk);
    } catch (error) {
      console.error('Streaming error:', error);
      onChunk(fallback);
      return fallback;
    }
  }
}
```

### 3. Token Management

```typescript
class TokenManager {
  private totalTokens = 0;
  private budget: number;
  
  constructor(budget: number) {
    this.budget = budget;
  }
  
  canAfford(estimatedTokens: number): boolean {
    return this.totalTokens + estimatedTokens <= this.budget;
  }
  
  trackUsage(usage: { totalTokens: number }): void {
    this.totalTokens += usage.totalTokens;
    console.log(`Tokens used: ${this.totalTokens}/${this.budget}`);
  }
  
  getRemainingBudget(): number {
    return Math.max(0, this.budget - this.totalTokens);
  }
  
  reset(): void {
    this.totalTokens = 0;
  }
}

// Usage
const tokenManager = new TokenManager(100000); // 100k token budget

const ai = new AIModel({
  apiKey: process.env.OPENROUTER_API_KEY!,
  provider: 'openrouter',
});

// Check before sending
if (tokenManager.canAfford(1000)) {
  const response = await ai.send();
  tokenManager.trackUsage(response.usage);
} else {
  console.log('Token budget exceeded');
}
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. API Key Errors
```typescript
// Bad
const ai = new AIModel({ apiKey: undefined });

// Good
const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  throw new Error('OPENROUTER_API_KEY environment variable is required');
}
const ai = new AIModel({ apiKey });
```

#### 2. Model Not Found
```typescript
// Check available models for the provider
const ai = new AIModel({
  apiKey: process.env.OPENROUTER_API_KEY!,
  provider: 'openrouter',
  model: 'non-existent-model', // This will fail
});

// Solution: Use correct model names
const validModels = {
  openrouter: ['gpt-4o-mini', 'anthropic/claude-3-haiku', 'mistralai/mistral-small-3.1-24b-instruct:free'],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229']
};
```

#### 3. Timeout Issues
```typescript
// For long responses, increase timeout
const ai = new AIModel({
  apiKey: process.env.OPENROUTER_API_KEY!,
  timeout: 120000, // 2 minutes
});
```

#### 4. Rate Limiting
```typescript
// Implement exponential backoff
const ai = new AIModel({
  apiKey: process.env.OPENROUTER_API_KEY!,
  retryAttempts: 5, // More retries
});
```

### Debug Mode Tips

Enable debug mode to see detailed logs:

```typescript
const ai = new AIModel({
  apiKey: process.env.OPENROUTER_API_KEY!,
  debug: true, // Shows all requests/responses
});

// Or enable dynamically
ai.enableDebug(true);
```

Debug output shows:
- Request details
- Response metadata
- Token usage
- Timing information
- Error details

---

## 📝 Summary

This AI Model Library provides:

✅ **Multi-provider support** - Switch between AI services easily  
✅ **Type-safe API** - Full TypeScript support with IntelliSense  
✅ **Conversation management** - Built-in message history  
✅ **Streaming support** - Real-time response streaming  
✅ **Vision capabilities** - Image analysis support  
✅ **Flexible configuration** - Per-request overrides  
✅ **Debug logging** - Detailed request/response logging  
✅ **Error handling** - Graceful error recovery  
✅ **Token tracking** - Monitor usage and costs  

The library is designed to be:
- **Simple** for basic use cases
- **Flexible** for advanced scenarios
- **Reliable** for production applications
- **Extensible** for custom needs

Start with the basic examples, then explore advanced patterns as your needs grow!