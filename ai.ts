// ai-model-lib.ts
import OpenAI from 'openai';

// ============================================
// CONFIGURATION TYPES
// ============================================

/**
 * Configuration for an AI provider
 * @interface AIProviderConfig
 */
export interface AIProviderConfig {
  /** Human-readable name of the provider */
  name: string;
  /** Base URL for the provider's API */
  baseURL: string;
  /** Default model to use for this provider */
  defaultModel: string;
  /** Optional default headers to include in requests */
  headers?: Record<string, string>;
}

/**
 * Configuration options for AI model initialization
 * @interface AIModelConfig
 */
export interface AIModelConfig {
  /** API key for authentication */
  apiKey: string;
  /** Provider identifier (e.g., 'openrouter', 'openai', 'anthropic') */
  provider?: string;
  /** Model name to use (overrides provider default) */
  model?: string;
  /** Temperature for response generation (0.0 to 1.0) */
  temperature?: number;
  /** Maximum tokens in response */
  maxTokens?: number;
  /** System prompt to set context */
  systemPrompt?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts for failed requests */
  retryAttempts?: number;
}

/**
 * Options for individual requests
 * @interface RequestOptions
 */
export interface RequestOptions {
  /** Model name for this request */
  model?: string;
  /** Temperature for this request */
  temperature?: number;
  /** Maximum tokens for this request */
  maxTokens?: number;
  /** Enable streaming response */
  stream?: boolean;
}

/**
 * Content structure for messages with multiple parts
 * @interface MessageContent
 */
export interface MessageContent {
  /** Type of content: text or image */
  type: 'text' | 'image_url';
  /** Text content (when type is 'text') */
  text?: string;
  /** Image URL (when type is 'image_url') */
  image_url?: {
    /** URL of the image */
    url: string;
  };
}

/**
 * Message structure for chat conversations
 * @interface Message
 */
export interface Message {
  /** Role of the message sender */
  role: 'system' | 'user' | 'assistant';
  /** Content of the message (string or array of content parts) */
  content: string | MessageContent[];
}

/**
 * Response structure from AI model
 * @interface AIResponse
 */
export interface AIResponse {
  /** Generated response content */
  content: string;
  /** Token usage information */
  usage: {
    /** Tokens used in the prompt */
    promptTokens: number;
    /** Tokens used in the completion */
    completionTokens: number;
    /** Total tokens used */
    totalTokens: number;
  };
  /** Model that generated the response */
  model: string;
  /** Reason the response finished */
  finishReason?: string;
}

// ============================================
// LOGGER INTERFACE
// ============================================

/**
 * Interface for logging implementations
 * @interface Logger
 */
export interface Logger {
  /**
   * Log a message with optional data
   * @param {string} type - Type of log entry (e.g., 'REQUEST', 'RESPONSE')
   * @param {string} message - Log message
   * @param {any} [data] - Optional data to include in log
   */
  log(type: string, message: string, data?: any): void;
  
  /**
   * Enable or disable logging
   * @param {boolean} enabled - Whether to enable logging
   */
  enable(enabled: boolean): void;
}

/**
 * Default console-based logger implementation
 * @class DefaultLogger
 * @implements {Logger}
 */
export class DefaultLogger implements Logger {
  /** Whether logging is enabled */
  private enabled: boolean = false;
  
  /** Color codes for different log types */
  private colors = {
    REQUEST: '\x1b[36m',    // Cyan
    RESPONSE: '\x1b[32m',   // Green
    STREAM: '\x1b[33m',     // Yellow
    ERROR: '\x1b[31m',      // Red
    CONFIG: '\x1b[35m',     // Magenta
    MESSAGE: '\x1b[34m',    // Blue
    reset: '\x1b[0m',
  };

  /**
   * Log a message with colored formatting
   * @param {string} type - Type of log entry
   * @param {string} message - Log message
   * @param {any} [data] - Optional data to log
   */
  log(type: string, message: string, data?: any): void {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString();
    const color = this.colors[type as keyof typeof this.colors] || this.colors.reset;
    
    console.log(`\n${color}═══════════════════════════════════════════════════════${this.colors.reset}`);
    console.log(`${color}[${timestamp}] ${type}${this.colors.reset}`);
    console.log(`${color}${message}${this.colors.reset}`);
    
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
    
    console.log(`${color}═══════════════════════════════════════════════════════${this.colors.reset}\n`);
  }

  /**
   * Enable or disable logging
   * @param {boolean} enabled - Whether to enable logging
   */
  enable(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// ============================================
// PROVIDER REGISTRY
// ============================================

/**
 * Registry for managing AI provider configurations
 * @class ProviderRegistry
 */
export class ProviderRegistry {
  /** Map of registered providers */
  private static providers: Map<string, AIProviderConfig> = new Map([
    ['openrouter', {
      name: 'OpenRouter',
      baseURL: 'https://openrouter.ai/api/v1',
      defaultModel: 'mistralai/mistral-small-3.1-24b-instruct:free',
      headers: {
        'HTTP-Referer': 'https://your-app-url.com',
        'X-Title': 'Your App Name',
      }
    }],
    ['openai', {
      name: 'OpenAI',
      baseURL: 'https://api.openai.com/v1',
      defaultModel: 'gpt-3.5-turbo',
    }],
    ['anthropic', {
      name: 'Anthropic',
      baseURL: 'https://api.anthropic.com/v1',
      defaultModel: 'claude-3-haiku-20240307',
    }],
  ]);

  /**
   * Register a new AI provider
   * @param {string} id - Unique identifier for the provider
   * @param {AIProviderConfig} config - Provider configuration
   * @example
   * ProviderRegistry.registerProvider('custom', {
   *   name: 'Custom AI',
   *   baseURL: 'https://api.custom.ai/v1',
   *   defaultModel: 'custom-model-v1'
   * });
   */
  static registerProvider(id: string, config: AIProviderConfig): void {
    this.providers.set(id, config);
  }

  /**
   * Get a registered provider configuration
   * @param {string} id - Provider identifier
   * @returns {AIProviderConfig | undefined} Provider configuration or undefined if not found
   */
  static getProvider(id: string): AIProviderConfig | undefined {
    return this.providers.get(id);
  }

  /**
   * Get all registered providers
   * @returns {Map<string, AIProviderConfig>} Map of all providers
   */
  static getAllProviders(): Map<string, AIProviderConfig> {
    return new Map(this.providers);
  }

  /**
   * Update an existing provider configuration
   * @param {string} id - Provider identifier
   * @param {Partial<AIProviderConfig>} config - Partial configuration to merge
   * @returns {boolean} True if provider was updated, false if not found
   */
  static updateProvider(id: string, config: Partial<AIProviderConfig>): boolean {
    const existing = this.providers.get(id);
    if (!existing) return false;
    
    this.providers.set(id, { ...existing, ...config });
    return true;
  }
}

// ============================================
// MAIN AI MODEL CLASS
// ============================================

/**
 * Main AI Model class for interacting with various AI providers
 * @class AIModel
 * @example
 * const ai = new AIModel({
 *   apiKey: 'your-api-key',
 *   provider: 'openrouter',
 *   model: 'gpt-3.5-turbo',
 *   debug: true
 * });
 * 
 * const response = await ai
 *   .addUserMessage('Hello, how are you?')
 *   .send();
 * console.log(response.content);
 */
export class AIModel {
  /** OpenAI client instance */
  private client: OpenAI;
  
  /** Array of messages in the conversation */
  private messages: Message[] = [];
  
  /** Model configuration */
  private config: Required<Omit<AIModelConfig, 'apiKey' | 'provider'>>;
  
  /** Provider configuration */
  private provider: AIProviderConfig;
  
  /** Logger instance */
  private logger: Logger;

  /**
   * Create an AI Model instance
   * @param {AIModelConfig} config - Model configuration
   * @param {Logger} [logger] - Optional custom logger
   * @throws {Error} If API key is missing or provider is not found
   */
  constructor(config: AIModelConfig, logger?: Logger) {
    // Validate API key
    if (!config.apiKey) {
      throw new Error('API key is required');
    }

    // Set logger
    this.logger = logger || new DefaultLogger();
    this.logger.enable(!!config.debug);

    // Get provider configuration
    const providerId = config.provider || 'openrouter';
    const provider = ProviderRegistry.getProvider(providerId);
    
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found. Register it first or use a known provider.`);
    }
    
    this.provider = provider;

    // Initialize OpenAI client
    this.client = new OpenAI({ 
      apiKey: config.apiKey,
      baseURL: provider.baseURL,
      defaultHeaders: provider.headers,
      timeout: config.timeout || 30000,
    });
    
    // Set configuration with defaults
    this.config = {
      model: config.model || provider.defaultModel,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens || 1000,
      systemPrompt: config.systemPrompt || '',
      debug: config.debug ?? false,
      retryAttempts: config.retryAttempts || 3,
    };

    this.logger.log('CONFIG', '🚀 AIModel initialized', {
      provider: provider.name,
      model: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      systemPrompt: this.config.systemPrompt.substring(0, 100) + '...',
    });
  }

  // ============================================
  // CONFIGURATION METHODS
  // ============================================

  /**
   * Set the system prompt for the conversation
   * @param {string} prompt - System prompt text
   * @returns {this} Chainable instance
   * @example
   * ai.setSystemPrompt('You are a helpful assistant.')
   *    .addUserMessage('Hello')
   *    .send();
   */
  setSystemPrompt(prompt: string): this {
    this.config.systemPrompt = prompt;
    this.logger.log('CONFIG', '📝 System prompt updated', {
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 150) + '...',
    });
    return this;
  }

  /**
   * Get the current system prompt
   * @returns {string} Current system prompt
   */
  getSystemPrompt(): string {
    return this.config.systemPrompt;
  }

  /**
   * Update model configuration
   * @param {Partial<Omit<AIModelConfig, 'apiKey' | 'provider'>>} config - Configuration updates
   * @returns {this} Chainable instance
   * @example
   * ai.updateConfig({
   *   temperature: 0.9,
   *   maxTokens: 2000
   * });
   */
  updateConfig(config: Partial<Omit<AIModelConfig, 'apiKey' | 'provider'>>): this {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...config };
    
    this.logger.log('CONFIG', '⚙️ Configuration updated', {
      changes: config,
      before: oldConfig,
      after: this.config,
    });
    
    return this;
  }

  /**
   * Get current model configuration
   * @returns {Required<Omit<AIModelConfig, 'apiKey' | 'provider'>>} Current configuration
   */
  getConfig(): Required<Omit<AIModelConfig, 'apiKey' | 'provider'>> {
    return { ...this.config };
  }

  /**
   * Enable or disable debug mode
   * @param {boolean} [enable=true] - Whether to enable debug
   * @returns {this} Chainable instance
   */
  enableDebug(enable: boolean = true): this {
    this.config.debug = enable;
    this.logger.enable(enable);
    console.log(`✅ Debug mode ${enable ? 'enabled' : 'disabled'}`);
    return this;
  }

  // ============================================
  // MESSAGE MANAGEMENT
  // ============================================

  /**
   * Add a message to the conversation
   * @param {string | MessageContent[]} content - Message content
   * @param {'user' | 'assistant'} [role='user'] - Message role
   * @returns {this} Chainable instance
   * @example
   * // Text message
   * ai.addMessage('Hello, world!');
   * 
   * // Message with image
   * ai.addMessage([
   *   { type: 'text', text: 'What do you see?' },
   *   { type: 'image_url', image_url: { url: 'https://example.com/image.jpg' } }
   * ]);
   */
  addMessage(content: string | MessageContent[], role: 'user' | 'assistant' = 'user'): this {
    this.messages.push({ role, content });
    
    const contentPreview = typeof content === 'string' 
      ? content.substring(0, 200)
      : JSON.stringify(content).substring(0, 200);
      
    this.logger.log('MESSAGE', `💬 Message added (${role})`, {
      role,
      contentType: typeof content,
      contentLength: typeof content === 'string' ? content.length : JSON.stringify(content).length,
      contentPreview,
      totalMessages: this.messages.length,
    });
    
    return this;
  }

  /**
   * Add a user message
   * @param {string | MessageContent[]} content - Message content
   * @returns {this} Chainable instance
   */
  addUserMessage(content: string | MessageContent[]): this {
    return this.addMessage(content, 'user');
  }

  /**
   * Add an assistant message
   * @param {string | MessageContent[]} content - Message content
   * @returns {this} Chainable instance
   */
  addAssistantMessage(content: string | MessageContent[]): this {
    return this.addMessage(content, 'assistant');
  }

  /**
   * Add a text message
   * @param {string} text - Text content
   * @param {'user' | 'assistant'} [role='user'] - Message role
   * @returns {this} Chainable instance
   */
  addTextMessage(text: string, role: 'user' | 'assistant' = 'user'): this {
    return this.addMessage(text, role);
  }

  /**
   * Add a message with text and image
   * @param {string} text - Text description
   * @param {string} imageUrl - URL of the image
   * @param {'user'} [role='user'] - Message role (always 'user' for images)
   * @returns {this} Chainable instance
   * @example
   * ai.addImageMessage(
   *   'What is in this image?',
   *   'https://example.com/image.jpg'
   * );
   */
  addImageMessage(text: string, imageUrl: string, role: 'user' = 'user'): this {
    const content: MessageContent[] = [
      { type: 'text', text },
      { type: 'image_url', image_url: { url: imageUrl } }
    ];
    return this.addMessage(content, role);
  }

  /**
   * Get all messages in the conversation
   * @returns {Message[]} Array of messages
   */
  getMessages(): Message[] {
    return [...this.messages];
  }

  /**
   * Clear all messages from the conversation
   * @returns {this} Chainable instance
   */
  clearMessages(): this {
    const count = this.messages.length;
    this.messages = [];
    this.logger.log('CONFIG', '🗑️ Messages cleared', { clearedCount: count });
    return this;
  }

  /**
   * Reset the model state (clears messages and system prompt)
   * @returns {this} Chainable instance
   */
  reset(): this {
    this.messages = [];
    this.config.systemPrompt = '';
    this.logger.log('CONFIG', '🔄 Reset complete', {
      message: 'All messages and system prompt cleared',
    });
    return this;
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Build the complete message array including system prompt
   * @private
   * @returns {Message[]} Complete message array
   */
  private buildMessages(): Message[] {
    const msgs: Message[] = [];
    
    if (this.config.systemPrompt) {
      msgs.push({ role: 'system', content: this.config.systemPrompt });
    }
    
    msgs.push(...this.messages);
    return msgs;
  }

  /**
   * Validate that there are messages to send
   * @private
   * @throws {Error} If no messages are available
   */
  private validateMessages(): void {
    if (this.buildMessages().length === 0) {
      throw new Error('No messages to send. Add at least one message or set a system prompt.');
    }
  }

  /**
   * Merge request options with model configuration
   * @private
   * @param {RequestOptions} [options] - Request options
   * @returns Merged configuration
   */
  private mergeOptions(options?: RequestOptions) {
    return {
      model: options?.model || this.config.model,
      temperature: options?.temperature ?? this.config.temperature,
      maxTokens: options?.maxTokens || this.config.maxTokens,
      stream: options?.stream || false,
    };
  }

  /**
   * Make a request with retry logic
   * @private
   * @template T
   * @param {() => Promise<T>} requestFn - Function that makes the request
   * @returns {Promise<T>} Request result
   */
  private async makeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.config.retryAttempts) {
          this.logger.log('ERROR', `❌ Request failed (attempt ${attempt}/${this.config.retryAttempts})`, {
            message: lastError.message,
            willRetry: true,
          });
          
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    this.logger.log('ERROR', '❌ All retry attempts failed', {
      message: lastError.message,
      attempts: this.config.retryAttempts,
    });
    
    throw lastError;
  }

  // ============================================
  // CORE API METHODS
  // ============================================

  /**
   * Send a request to the AI model
   * @param {RequestOptions} [options] - Optional request overrides
   * @returns {Promise<AIResponse>} AI response
   * @example
   * const response = await ai.send({
   *   temperature: 0.8,
   *   maxTokens: 1500
   * });
   * console.log(response.content);
   */
  async send(options?: RequestOptions): Promise<AIResponse> {
    this.validateMessages();
    const messages = this.buildMessages();
    const config = this.mergeOptions(options);

    this.logger.log('REQUEST', '📤 Sending request', {
      provider: this.provider.name,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      messageCount: messages.length,
      messages: messages.map(m => ({
        role: m.role,
        contentType: typeof m.content,
        contentLength: typeof m.content === 'string' ? m.content.length : JSON.stringify(m.content).length,
        contentPreview: typeof m.content === 'string' 
          ? m.content.substring(0, 150)
          : JSON.stringify(m.content).substring(0, 150),
      })),
    });

    try {
      const startTime = Date.now();
      
      const completion = await this.makeRequest(() => 
        this.client.chat.completions.create({
          model: config.model,
          messages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          stream: false,
        })
      );

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
        finishReason: completion.choices[0].finish_reason,
      };

      this.logger.log('RESPONSE', '📥 Received response', {
        duration: `${duration}ms`,
        model: response.model,
        finishReason: response.finishReason,
        usage: {
          promptTokens: response.usage.promptTokens,
          completionTokens: response.usage.completionTokens,
          totalTokens: response.usage.totalTokens,
          estimatedCost: `$${((response.usage.totalTokens / 1000) * 0.0001).toFixed(6)}`,
        },
        responseLength: content.length,
        responsePreview: content.substring(0, 200),
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.log('ERROR', '❌ API Error occurred', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      throw new Error(`AI API Error: ${errorMessage}`);
    }
  }

  /**
   * Stream a response from the AI model
   * @param {(chunk: string) => void} onChunk - Callback for each chunk
   * @param {RequestOptions} [options] - Optional request overrides
   * @returns {Promise<string>} Complete response content
   * @example
   * const fullResponse = await ai.stream(
   *   (chunk) => process.stdout.write(chunk),
   *   { temperature: 0.9 }
   * );
   */
  async stream(
    onChunk: (chunk: string) => void,
    options?: RequestOptions
  ): Promise<string> {
    this.validateMessages();
    const messages = this.buildMessages();
    const config = this.mergeOptions({ ...options, stream: true });

    this.logger.log('REQUEST', '📤 Starting streaming request', {
      provider: this.provider.name,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      messageCount: messages.length,
      messages: messages.map(m => ({
        role: m.role,
        contentType: typeof m.content,
        contentLength: typeof m.content === 'string' ? m.content.length : JSON.stringify(m.content).length,
        contentPreview: typeof m.content === 'string' 
          ? m.content.substring(0, 150)
          : JSON.stringify(m.content).substring(0, 150),
      })),
    });

    try {
      const startTime = Date.now();
      
      const stream = await this.makeRequest(() => 
        this.client.chat.completions.create({
          model: config.model,
          messages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          stream: true,
        })
      );

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

      this.logger.log('STREAM', '✅ Streaming completed', {
        duration: `${duration}ms`,
        model: config.model,
        chunksReceived: chunkCount,
        totalLength: fullContent.length,
        avgChunkSize: Math.round(fullContent.length / chunkCount),
        contentPreview: fullContent.substring(0, 200),
      });

      return fullContent;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.log('ERROR', '❌ Streaming error occurred', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      throw new Error(`AI Stream Error: ${errorMessage}`);
    }
  }

  // ============================================
  // STATIC FACTORY METHODS
  // ============================================

  /**
   * Create a new AI model instance
   * @param {AIModelConfig} config - Model configuration
   * @param {Logger} [logger] - Optional custom logger
   * @returns {AIModel} New AI model instance
   * @example
   * const ai = AIModel.create({
   *   apiKey: 'your-key',
   *   provider: 'openrouter',
   *   debug: true
   * });
   */
  static create(config: AIModelConfig, logger?: Logger): AIModel {
    return new AIModel(config, logger);
  }

  /**
   * Create an AI model from environment variables
   * @param {string} [provider] - Provider name (defaults to 'openrouter')
   * @param {Partial<AIModelConfig>} [overrides] - Configuration overrides
   * @param {Logger} [logger] - Optional custom logger
   * @returns {AIModel} New AI model instance
   * @example
   * // Uses OPENROUTER_API_KEY or OPENAI_API_KEY
   * const ai = AIModel.createFromEnv('openrouter', {
   *   model: 'gpt-4',
   *   debug: true
   * });
   */
  static createFromEnv(provider?: string, overrides?: Partial<AIModelConfig>, logger?: Logger): AIModel {
    const envKey = provider?.toUpperCase() || 'OPENROUTER';
    const apiKey = process.env[`${envKey}_API_KEY`] || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error(`${envKey}_API_KEY or OPENAI_API_KEY environment variable is not set`);
    }

    return new AIModel({
      apiKey,
      provider: provider || 'openrouter',
      ...overrides,
    }, logger);
  }

  /**
   * Create an AI model for a specific provider
   * @param {string} providerId - Provider identifier
   * @param {string} apiKey - API key for the provider
   * @param {Partial<AIModelConfig>} [overrides] - Configuration overrides
   * @param {Logger} [logger] - Optional custom logger
   * @returns {AIModel} New AI model instance
   * @example
   * const ai = AIModel.createForProvider(
   *   'openai',
   *   'your-openai-key',
   *   { model: 'gpt-4' }
   * );
   */
  static createForProvider(providerId: string, apiKey: string, overrides?: Partial<AIModelConfig>, logger?: Logger): AIModel {
    return new AIModel({
      apiKey,
      provider: providerId,
      ...overrides,
    }, logger);
  }
}

// ============================================
// CONFIGURATION MANAGER
// ============================================

/**
 * Singleton configuration manager for the AI library
 * @class ConfigManager
 * @example
 * const config = ConfigManager.getInstance();
 * config.setDefaultConfig({
 *   temperature: 0.7,
 *   debug: true
 * });
 * 
 * const ai = config.createModel({
 *   apiKey: 'your-key'
 * });
 */
export class ConfigManager {
  /** Singleton instance */
  private static instance: ConfigManager;
  
  /** Default configuration */
  private defaultConfig: Partial<AIModelConfig> = {};
  
  /** Custom providers */
  private providers: Map<string, AIProviderConfig> = new Map();

  /**
   * Private constructor for singleton pattern
   * @private
   */
  private constructor() {}

  /**
   * Get the singleton instance
   * @returns {ConfigManager} Configuration manager instance
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Set default configuration for all models
   * @param {Partial<AIModelConfig>} config - Default configuration
   * @example
   * config.setDefaultConfig({
   *   temperature: 0.8,
   *   maxTokens: 2000,
   *   debug: process.env.NODE_ENV === 'development'
   * });
   */
  setDefaultConfig(config: Partial<AIModelConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  /**
   * Get the current default configuration
   * @returns {Partial<AIModelConfig>} Default configuration
   */
  getDefaultConfig(): Partial<AIModelConfig> {
    return { ...this.defaultConfig };
  }

  /**
   * Register a custom provider
   * @param {string} id - Provider identifier
   * @param {AIProviderConfig} config - Provider configuration
   * @example
   * config.registerProvider('my-provider', {
   *   name: 'My AI Provider',
   *   baseURL: 'https://api.myprovider.com/v1',
   *   defaultModel: 'my-model-v1'
   * });
   */
  registerProvider(id: string, config: AIProviderConfig): void {
    this.providers.set(id, config);
    ProviderRegistry.registerProvider(id, config);
  }

  /**
   * Get a provider configuration
   * @param {string} id - Provider identifier
   * @returns {AIProviderConfig | undefined} Provider configuration
   */
  getProvider(id: string): AIProviderConfig | undefined {
    return this.providers.get(id) || ProviderRegistry.getProvider(id);
  }

  /**
   * Create a new AI model with default configuration
   * @param {Partial<AIModelConfig>} [overrides] - Configuration overrides
   * @param {Logger} [logger] - Optional custom logger
   * @returns {AIModel} New AI model instance
   * @throws {Error} If API key is not provided
   * @example
   * const ai = config.createModel({
   *   apiKey: 'your-key',
   *   model: 'gpt-4'
   * });
   */
  createModel(overrides?: Partial<AIModelConfig>, logger?: Logger): AIModel {
    const config = { ...this.defaultConfig, ...overrides };
    
    if (!config.apiKey) {
      throw new Error('API key is required in config');
    }
    
    return new AIModel(config as AIModelConfig, logger);
  }
}

// ============================================
// EXPORTS
// ============================================

/**
 * Default export containing all library components
 * @namespace
 */
export default {
  /** Main AI Model class */
  AIModel,
  /** Provider registry for managing AI providers */
  ProviderRegistry,
  /** Configuration manager singleton */
  ConfigManager,
  /** Default logger implementation */
  DefaultLogger,
};