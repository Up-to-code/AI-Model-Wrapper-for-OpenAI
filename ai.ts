import { OpenAI } from 'openai';

// ============================================
// TYPES
// ============================================

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

interface BaseConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  debug?: boolean;
}

interface RequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// ============================================
// MAIN AI MODEL CLASS
// ============================================

export class AIModel {
  private client: OpenAI;
  private messages: Message[] = [];
  private baseConfig: Required<Omit<BaseConfig, 'apiKey'>>;
  private debug: boolean;

  constructor(config: BaseConfig) {
    // Validate API key
    if (!config.apiKey) {
      throw new Error('API key is required');
    }

    this.client = new OpenAI({ apiKey: config.apiKey });
    
    // Set base configuration with defaults
    this.baseConfig = {
      model: config.model || 'gpt-3.5-turbo', // Fixed model name
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens || 1000,
      systemPrompt: config.systemPrompt || '',
      debug: config.debug ?? false,
    };

    this.debug = this.baseConfig.debug;

    if (this.debug) {
      this.log('CONFIG', '🚀 AIModel initialized', {
        model: this.baseConfig.model,
        temperature: this.baseConfig.temperature,
        maxTokens: this.baseConfig.maxTokens,
        systemPrompt: this.baseConfig.systemPrompt.substring(0, 100) + '...',
      });
    }
  }

  // ============================================
  // LOGGING METHODS
  // ============================================

  private log(type: string, message: string, data?: any): void {
    if (!this.debug) return;

    const timestamp = new Date().toISOString();
    const colors = {
      REQUEST: '\x1b[36m',    // Cyan
      RESPONSE: '\x1b[32m',   // Green
      STREAM: '\x1b[33m',     // Yellow
      ERROR: '\x1b[31m',      // Red
      CONFIG: '\x1b[35m',     // Magenta
      MESSAGE: '\x1b[34m',    // Blue
      reset: '\x1b[0m',
    };

    const color = colors[type as keyof typeof colors] || colors.reset;
    
    console.log(`\n${color}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${color}[${timestamp}] ${type}${colors.reset}`);
    console.log(`${color}${message}${colors.reset}`);
    
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
    
    console.log(`${color}═══════════════════════════════════════════════════════${colors.reset}\n`);
  }

  enableDebug(enable: boolean = true): this {
    this.debug = enable;
    this.baseConfig.debug = enable;
    
    if (enable) {
      console.log('✅ Debug mode enabled');
    } else {
      console.log('❌ Debug mode disabled');
    }
    
    return this;
  }

  // ============================================
  // CONFIGURATION METHODS
  // ============================================

  setSystemPrompt(prompt: string): this {
    this.baseConfig.systemPrompt = prompt;
    
    if (this.debug) {
      this.log('CONFIG', '📝 System prompt updated', {
        promptLength: prompt.length,
        promptPreview: prompt.substring(0, 150) + '...',
      });
    }
    
    return this;
  }

  getSystemPrompt(): string {
    return this.baseConfig.systemPrompt;
  }

  updateConfig(config: Partial<Omit<BaseConfig, 'apiKey'>>): this {
    const oldConfig = { ...this.baseConfig };
    this.baseConfig = { ...this.baseConfig, ...config };
    
    if (this.debug) {
      this.log('CONFIG', '⚙️ Configuration updated', {
        changes: config,
        before: oldConfig,
        after: this.baseConfig,
      });
    }
    
    return this;
  }

  getConfig(): Required<Omit<BaseConfig, 'apiKey'>> {
    return { ...this.baseConfig };
  }

  // ============================================
  // MESSAGE MANAGEMENT
  // ============================================

  addMessage(content: string, role: 'user' | 'assistant' = 'user'): this {
    this.messages.push({ role, content });
    
    if (this.debug) {
      this.log('MESSAGE', `💬 Message added (${role})`, {
        role,
        contentLength: content.length,
        contentPreview: content.substring(0, 200),
        totalMessages: this.messages.length,
      });
    }
    
    return this;
  }

  addUserMessage(content: string): this {
    return this.addMessage(content, 'user');
  }

  addAssistantMessage(content: string): this {
    return this.addMessage(content, 'assistant');
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  clearMessages(): this {
    const count = this.messages.length;
    this.messages = [];
    
    if (this.debug) {
      this.log('CONFIG', '🗑️ Messages cleared', {
        clearedCount: count,
      });
    }
    
    return this;
  }

  reset(): this {
    this.messages = [];
    this.baseConfig.systemPrompt = '';
    
    if (this.debug) {
      this.log('CONFIG', '🔄 Reset complete', {
        message: 'All messages and system prompt cleared',
      });
    }
    
    return this;
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private buildMessages(): Message[] {
    const msgs: Message[] = [];
    
    if (this.baseConfig.systemPrompt) {
      msgs.push({ role: 'system', content: this.baseConfig.systemPrompt });
    }
    
    msgs.push(...this.messages);
    
    return msgs;
  }

  private validateMessages(): void {
    if (this.buildMessages().length === 0) {
      throw new Error('No messages to send. Add at least one message or set a system prompt.');
    }
  }

  private mergeOptions(options?: RequestOptions) {
    return {
      model: options?.model || this.baseConfig.model,
      temperature: options?.temperature ?? this.baseConfig.temperature,
      maxTokens: options?.maxTokens || this.baseConfig.maxTokens,
    };
  }

  // ============================================
  // CORE API METHODS
  // ============================================

  async send(options?: RequestOptions): Promise<AIResponse> {
    this.validateMessages();
    const messages = this.buildMessages();
    const config = this.mergeOptions(options);

    if (this.debug) {
      this.log('REQUEST', '📤 Sending request to OpenAI', {
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        messageCount: messages.length,
        messages: messages.map(m => ({
          role: m.role,
          contentLength: m.content.length,
          contentPreview: m.content.substring(0, 150),
        })),
      });
    }

    try {
      const startTime = Date.now();
      
      const completion = await this.client.chat.completions.create({
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      });

      const content = completion.choices[0].message?.content || '';
      const duration = Date.now() - startTime;
      
      // Auto-add assistant response to history
      this.messages.push({ role: 'assistant', content });

      const response: AIResponse = {
        content,
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
        model: completion.model,
      };

      if (this.debug) {
        this.log('RESPONSE', '📥 Received response from OpenAI', {
          duration: `${duration}ms`,
          model: response.model,
          finishReason: completion.choices[0].finish_reason,
          usage: {
            promptTokens: response.usage.promptTokens,
            completionTokens: response.usage.completionTokens,
            totalTokens: response.usage.totalTokens,
            estimatedCost: `$${((response.usage.totalTokens / 1000) * 0.0001).toFixed(6)}`,
          },
          responseLength: content.length,
          responsePreview: content.substring(0, 200),
        });
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (this.debug) {
        this.log('ERROR', '❌ API Error occurred', {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
      
      throw new Error(`AI API Error: ${errorMessage}`);
    }
  }

  async stream(
    onChunk: (chunk: string) => void,
    options?: RequestOptions
  ): Promise<string> {
    this.validateMessages();
    const messages = this.buildMessages();
    const config = this.mergeOptions(options);

    if (this.debug) {
      this.log('REQUEST', '📤 Starting streaming request', {
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        messageCount: messages.length,
        messages: messages.map(m => ({
          role: m.role,
          contentLength: m.content.length,
          contentPreview: m.content.substring(0, 150),
        })),
      });
    }

    try {
      const startTime = Date.now();
      
      const stream = await this.client.chat.completions.create({
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: true,
      });

      let fullContent = '';
      let chunkCount = 0;

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          chunkCount++;
          onChunk(content);
        }
      }

      const duration = Date.now() - startTime;

      // Auto-add assistant response to history
      this.messages.push({ role: 'assistant', content: fullContent });

      if (this.debug) {
        this.log('STREAM', '✅ Streaming completed', {
          duration: `${duration}ms`,
          model: config.model,
          chunksReceived: chunkCount,
          totalLength: fullContent.length,
          avgChunkSize: Math.round(fullContent.length / chunkCount),
          contentPreview: fullContent.substring(0, 200),
        });
      }

      return fullContent;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (this.debug) {
        this.log('ERROR', '❌ Streaming error occurred', {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
      
      throw new Error(`AI Stream Error: ${errorMessage}`);
    }
  }

  // ============================================
  // STATIC UTILITY METHODS
  // ============================================

  static async quickChat(
    config: BaseConfig,
    prompt: string,
    options?: RequestOptions
  ): Promise<string> {
    const ai = new AIModel(config);
    const response = await ai.addUserMessage(prompt).send(options);
    return response.content;
  }

  static createFromEnv(overrides?: Partial<BaseConfig>): AIModel {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    return new AIModel({
      apiKey,
      ...overrides,
    });
  }
}

// ============================================
// USAGE EXAMPLES
// ============================================

// Example 1: Basic debug to console
export async function example1() {
  const ai = new AIModel({
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-3.5-turbo', // Fixed model name
    systemPrompt: 'You are a helpful assistant.',
    debug: true, // ✅ Enable console logging
  });

  ai.addUserMessage('What is TypeScript?');
  const response = await ai.send();
  
  console.log('\n=== Final Response ===');
  console.log(response.content);
}

// Example 2: Conversation with debug
export async function example2() {
  const ai = new AIModel({
    apiKey: process.env.OPENAI_API_KEY!,
    systemPrompt: 'You are a friendly chatbot.',
    debug: true,
  });

  ai.addUserMessage('My name is John');
  await ai.send();

  ai.addUserMessage('What is my name?');
  const response = await ai.send();
  
  console.log('\n=== Response ===');
  console.log(response.content);
}

// Example 3: Enable/disable debug dynamically
export async function example3() {
  const ai = AIModel.createFromEnv();

  // Start without debug
  ai.addUserMessage('Hello');
  await ai.send();

  // Enable debug for next requests
  ai.enableDebug(true);

  ai.addUserMessage('Tell me a joke');
  await ai.send();

  // Disable debug
  ai.enableDebug(false);
  
  ai.addUserMessage('Another message');
  await ai.send();
}

// Example 4: Streaming with debug
export async function example4() {
  const ai = new AIModel({
    apiKey: process.env.OPENAI_API_KEY!,
    systemPrompt: 'You are a creative writer.',
    debug: true,
    temperature: 0.9,
  });

  ai.addUserMessage('Write a short poem about coding');

  console.log('\n=== Streaming Response ===');
  await ai.stream((chunk) => {
    process.stdout.write(chunk);
  });
  console.log('\n');
}

// Example 5: Debug with method chaining
export async function example5() {
  const ai = AIModel.createFromEnv({ debug: true });

  const response = await ai
    .setSystemPrompt('You are a math tutor.')
    .addUserMessage('What is 15 * 23?')
    .send();

  console.log('\n=== Answer ===');
  console.log(response.content);
}

// Example 6: Debug with custom config
export async function example6() {
  const ai = new AIModel({
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4', // Fixed model name
    temperature: 0.9,
    maxTokens: 2000,
    debug: true,
  });

  ai.setSystemPrompt('You are a creative storyteller.');
  ai.addUserMessage('Write a fantasy story opening');

  const response = await ai.send();
  console.log('\n=== Story ===');
  console.log(response.content);
}

// Example 7: Express.js with debug
/*
import express from 'express';

const app = express();
app.use(express.json());

// Debug enabled for development
const ai = AIModel.createFromEnv({
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
      error: error instanceof Error ? error.message : 'Failed to get response' 
    });
  }
});
*/

// Example 8: Next.js with conditional debug
/*
import { NextRequest, NextResponse } from 'next/server';

const isDevelopment = process.env.NODE_ENV === 'development';

const ai = AIModel.createFromEnv({
  systemPrompt: 'You are a helpful assistant.',
  debug: isDevelopment, // Only debug in development
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
      { error: error instanceof Error ? error.message : 'Failed to get response' }, 
      { status: 500 }
    );
  }
}
*/