// ai-model-lib.ts
import OpenAI from 'openai';

// ============================================
// CORE TYPES AND INTERFACES
// ============================================

/**
 * Configuration for AI providers like OpenAI, Anthropic, OpenRouter, etc.
 * @interface AIProviderConfig
 */
export interface AIProviderConfig {
  /** Human-readable provider name */
  name: string;
  /** API base URL */
  baseURL: string;
  /** Default model to use */
  defaultModel: string;
  /** Optional default headers */
  headers?: Record<string, string>;
}

/**
 * Main configuration for AI model instances
 * @interface AIModelConfig
 */
export interface AIModelConfig {
  /** API key for authentication (required) */
  apiKey: string;
  /** Provider ID - 'openai', 'anthropic', 'openrouter', or custom */
  provider?: string;
  /** Specific model name override */
  model?: string;
  /** Creativity level: 0.0 (deterministic) to 1.0 (creative) */
  temperature?: number;
  /** Maximum tokens in response */
  maxTokens?: number;
  /** System context/personality prompt */
  systemPrompt?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts for failed requests */
  retryAttempts?: number;
}

/**
 * Per-request options that override model defaults
 * @interface RequestOptions
 */
export interface RequestOptions {
  /** Model override for this request */
  model?: string;
  /** Temperature override */
  temperature?: number;
  /** Max tokens override */
  maxTokens?: number;
  /** Enable streaming mode */
  stream?: boolean;
}

/**
 * Represents content in a message - can be text or image
 * @interface MessageContent
 */
export interface MessageContent {
  /** Content type */
  type: 'text' | 'image_url';
  /** Text content (for text type) */
  text?: string;
  /** Image data (for image type) */
  image_url?: {
    /** Image URL */
    url: string;
  };
}

/**
 * A message in the conversation history
 * @interface Message
 */
export interface Message {
  /** Who sent the message */
  role: 'system' | 'user' | 'assistant';
  /** The message content */
  content: string | MessageContent[];
}

/**
 * Complete response from AI model
 * @interface AIResponse
 */
export interface AIResponse {
  /** The generated text response */
  content: string;
  /** Token usage statistics */
  usage: {
    /** Input tokens used */
    promptTokens: number;
    /** Output tokens used */
    completionTokens: number;
    /** Total tokens used */
    totalTokens: number;
  };
  /** Model that generated the response */
  model: string;
  /** Why the generation stopped */
  finishReason?: string;
}

// ============================================
// LOGGING SYSTEM
// ============================================

/**
 * Logger interface for flexible logging implementations
 * @interface Logger
 */
export interface Logger {
  /**
   * Log a message with data
   * @param type - Log category
   * @param message - Log message
   * @param data - Optional additional data
   */
  log(type: string, message: string, data?: unknown): void;
  
  /**
   * Enable/disable logging
   * @param enabled - Logging state
   */
  enable(enabled: boolean): void;
}

/**
 * Default console logger with colored output
 * @class DefaultLogger
 * @implements {Logger}
 */
export class DefaultLogger implements Logger {
  private enabled = false;
  
  private readonly colors = {
    REQUEST: '\x1b[36m',    // Cyan
    RESPONSE: '\x1b[32m',   // Green
    STREAM: '\x1b[33m',     // Yellow
    ERROR: '\x1b[31m',      // Red
    CONFIG: '\x1b[35m',     // Magenta
    MESSAGE: '\x1b[34m',    // Blue
    reset: '\x1b[0m',
  };

  /**
   * Log with colored formatting and structured data
   * @param type - Log type for color coding
   * @param message - Main log message
   * @param data - Optional structured data
   */
  log(type: string, message: string, data?: unknown): void {
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
   * Enable or disable logging output
   * @param enabled - Whether logging should be active
   */
  enable(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// ============================================
// PROVIDER MANAGEMENT
// ============================================

/**
 * Global registry for AI provider configurations
 * Manages built-in providers and allows custom provider registration
 * @class ProviderRegistry
 * @example
 * // Register custom provider
 * ProviderRegistry.registerProvider('my-ai', {
 *   name: 'My AI Service',
 *   baseURL: 'https://api.my-ai.com/v1',
 *   defaultModel: 'my-model-v1'
 * });
 */
export class ProviderRegistry {
  /** Internal storage of provider configurations */
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
   * Register a new AI provider or update existing one
   * @param id - Unique provider identifier
   * @param config - Provider configuration
   * @throws {Error} If configuration is invalid
   */
  static registerProvider(id: string, config: AIProviderConfig): void {
    if (!id || !config.name || !config.baseURL || !config.defaultModel) {
      throw new Error('Provider configuration requires id, name, baseURL, and defaultModel');
    }
    this.providers.set(id, config);
  }

  /**
   * Retrieve provider configuration by ID
   * @param id - Provider identifier
   * @returns Provider config or undefined if not found
   */
  static getProvider(id: string): AIProviderConfig | undefined {
    return this.providers.get(id);
  }

  /**
   * Get all registered providers
   * @returns Read-only map of all providers
   */
  static getAllProviders(): Map<string, AIProviderConfig> {
    return new Map(this.providers);
  }

  /**
   * Update existing provider configuration
   * @param id - Provider identifier
   * @param config - Partial configuration to merge
   * @returns True if provider was updated, false if not found
   */
  static updateProvider(id: string, config: Partial<AIProviderConfig>): boolean {
    const existing = this.providers.get(id);
    if (!existing) return false;
    
    this.providers.set(id, { ...existing, ...config });
    return true;
  }

  /**
   * Check if provider exists
   * @param id - Provider identifier
   * @returns True if provider is registered
   */
  static hasProvider(id: string): boolean {
    return this.providers.has(id);
  }

  /**
   * Remove a provider from registry
   * @param id - Provider identifier
   * @returns True if provider was removed
   */
  static removeProvider(id: string): boolean {
    return this.providers.delete(id);
  }
}

// ============================================
// MAIN AI MODEL CLASS
// ============================================

/**
 * Primary class for interacting with AI models across multiple providers
 * Supports chat completion, streaming, image analysis, and conversation management
 * @class AIModel
 * @example
 * // Basic usage
 * const ai = new AIModel({
 *   apiKey: 'your-key',
 *   provider: 'openrouter',
 *   debug: true
 * });
 * 
 * // Chain messages and send
 * const response = await ai
 *   .addUserMessage('Hello!')
 *   .addUserMessage('How are you?')
 *   .send();
 * 
 * // Quick single message
 * const quickResponse = await ai.sendTextMessage('Tell me a joke');
 */
export class AIModel {
  private client: OpenAI;
  private messages: Message[] = [];
  private config: Required<Omit<AIModelConfig, 'apiKey' | 'provider'>>;
  private provider: AIProviderConfig;
  private logger: Logger;

  /**
   * Create new AI model instance
   * @param config - Model configuration
   * @param logger - Optional custom logger
   * @throws {Error} If API key missing or provider not found
   */
  constructor(config: AIModelConfig, logger?: Logger) {
    // Validate required configuration
    if (!config.apiKey?.trim()) {
      throw new Error('API key is required and cannot be empty');
    }

    // Initialize logging
    this.logger = logger || new DefaultLogger();
    this.logger.enable(!!config.debug);

    // Resolve provider configuration
    const providerId = config.provider || 'openrouter';
    const provider = ProviderRegistry.getProvider(providerId);
    
    if (!provider) {
      const available = Array.from(ProviderRegistry.getAllProviders().keys()).join(', ');
      throw new Error(
        `Provider '${providerId}' not found. Available providers: ${available}. ` +
        'Use ProviderRegistry.registerProvider() to add custom providers.'
      );
    }
    
    this.provider = provider;

    // Initialize OpenAI client (works with any OpenAI-compatible API)
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
      timeout: config.timeout || 30000,
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
  // CONFIGURATION MANAGEMENT
  // ============================================

  /**
   * Set or update the system prompt (context/role for AI)
   * @param prompt - System prompt text
   * @returns This instance for chaining
   * @example
   * ai.setSystemPrompt('You are a helpful assistant that speaks like a pirate.');
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
   * Get current system prompt
   * @returns Current system prompt
   */
  getSystemPrompt(): string {
    return this.config.systemPrompt;
  }

  /**
   * Update model configuration
   * @param config - Configuration changes
   * @returns This instance for chaining
   * @example
   * ai.updateConfig({
   *   temperature: 0.9, // More creative
   *   maxTokens: 2000   // Longer responses
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
   * Get current configuration
   * @returns Read-only copy of current configuration
   */
  getConfig(): Required<Omit<AIModelConfig, 'apiKey' | 'provider'>> {
    return { ...this.config };
  }

  /**
   * Enable or disable debug logging
   * @param enable - Debug state (default: true)
   * @returns This instance for chaining
   */
  enableDebug(enable = true): this {
    this.config.debug = enable;
    this.logger.enable(enable);
    this.logger.log('CONFIG', `🔧 Debug ${enable ? 'enabled' : 'disabled'}`);
    return this;
  }

  // ============================================
  // MESSAGE MANAGEMENT
  // ============================================

  /**
   * Add message to conversation history
   * @param content - Message content (text or structured)
   * @param role - Message sender role
   * @returns This instance for chaining
   * @example
   * // Text message
   * ai.addMessage('Hello world!', 'user');
   * 
   * // Structured message with image
   * ai.addMessage([
   *   { type: 'text', text: 'Describe this image' },
   *   { type: 'image_url', image_url: { url: 'https://example.com/image.jpg' } }
   * ], 'user');
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
   * Add user message (convenience method)
   * @param content - Message content
   * @returns This instance for chaining
   */
  addUserMessage(content: string | MessageContent[]): this {
    return this.addMessage(content, 'user');
  }

  /**
   * Add assistant message (convenience method)
   * @param content - Message content
   * @returns This instance for chaining
   */
  addAssistantMessage(content: string | MessageContent[]): this {
    return this.addMessage(content, 'assistant');
  }

  /**
   * Add simple text message
   * @param text - Text content
   * @param role - Message role (default: user)
   * @returns This instance for chaining
   */
  addTextMessage(text: string, role: 'user' | 'assistant' = 'user'): this {
    return this.addMessage(text, role);
  }

  /**
   * Add message with text and image
   * @param text - Text description or question
   * @param imageUrl - URL of image to analyze
   * @returns This instance for chaining
   * @example
   * ai.addImageMessage(
   *   'What is in this image?',
   *   'https://example.com/photo.jpg'
   * );
   */
  addImageMessage(text: string, imageUrl: string): this {
    const content: MessageContent[] = [
      { type: 'text', text },
      { type: 'image_url', image_url: { url: imageUrl } }
    ];
    return this.addMessage(content, 'user');
  }

  /**
   * Get all messages in current conversation
   * @returns Copy of message history
   */
  getMessages(): Message[] {
    return [...this.messages];
  }

  /**
   * Clear conversation history
   * @returns This instance for chaining
   */
  clearMessages(): this {
    const count = this.messages.length;
    this.messages = [];
    this.logger.log('CONFIG', '🗑️ Messages cleared', { clearedCount: count });
    return this;
  }

  /**
   * Reset model to initial state (clears messages and system prompt)
   * @returns This instance for chaining
   */
  reset(): this {
    this.messages = [];
    this.config.systemPrompt = '';
    this.logger.log('CONFIG', '🔄 Model reset', {
      message: 'Cleared all messages and system prompt',
    });
    return this;
  }

  // ============================================
  // QUICK MESSAGE METHODS (ONE-LINERS)
  // ============================================

  /**
   * Send single text message and get response (convenience method)
   * @param text - Message text
   * @param options - Request options override
   * @returns AI response
   * @example
   * const response = await ai.sendTextMessage('Hello!');
   * console.log(response.content);
   */
  async sendTextMessage(text: string, options?: RequestOptions): Promise<AIResponse> {
    return this.addUserMessage(text).send(options);
  }

  /**
   * Send image with text description and get response
   * @param text - Text question/description
   * @param imageUrl - Image URL
   * @param options - Request options override
   * @returns AI response
   * @example
   * const response = await ai.sendImageMessage(
   *   'What do you see?',
   *   'https://example.com/image.jpg'
   * );
   */
  async sendImageMessage(text: string, imageUrl: string, options?: RequestOptions): Promise<AIResponse> {
    return this.addImageMessage(text, imageUrl).send(options);
  }

  /**
   * Send multiple pre-defined messages and get response
   * @param messages - Array of message objects
   * @param options - Request options override
   * @returns AI response
   * @example
   * const response = await ai.sendMultipleMessages([
   *   { role: 'user', content: 'Hello' },
   *   { role: 'assistant', content: 'Hi there!' },
   *   { role: 'user', content: 'How are you?' }
   * ]);
   */
  async sendMultipleMessages(
    messages: Array<{ role: 'user' | 'assistant', content: string }>, 
    options?: RequestOptions
  ): Promise<AIResponse> {
    this.clearMessages();
    messages.forEach(msg => this.addMessage(msg.content, msg.role));
    return this.send(options);
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /** Build complete message array including system prompt */
  private buildMessages(): Message[] {
    const msgs: Message[] = [];
    
    if (this.config.systemPrompt) {
      msgs.push({ role: 'system', content: this.config.systemPrompt });
    }
    
    msgs.push(...this.messages);
    return msgs;
  }

  /** Validate that we have messages to send */
  private validateMessages(): void {
    const messages = this.buildMessages();
    if (messages.length === 0) {
      throw new Error('No messages to send. Add at least one message or set a system prompt.');
    }

    // Check if there's at least one user message
    const hasUserMessage = messages.some(msg => msg.role === 'user');
    if (!hasUserMessage) {
      throw new Error('No user messages to send. Add at least one user message.');
    }
  }

  /** Merge request options with model defaults */
  private mergeOptions(options?: RequestOptions) {
    return {
      model: options?.model || this.config.model,
      temperature: options?.temperature ?? this.config.temperature,
      maxTokens: options?.maxTokens || this.config.maxTokens,
      stream: options?.stream || false,
    };
  }

  /** Execute request with retry logic and exponential backoff */
  private async makeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.config.retryAttempts) {
          const delayMs = 2 ** attempt * 1000;
          this.logger.log('ERROR', `❌ Request failed (attempt ${attempt}/${this.config.retryAttempts})`, {
            error: lastError.message,
            retryIn: `${delayMs}ms`,
          });
          
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    
    this.logger.log('ERROR', '❌ All retry attempts failed', {
      error: lastError?.message,
      attempts: this.config.retryAttempts,
    });
    
    throw lastError || new Error('Request failed after all retry attempts');
  }

  // ============================================
  // CORE API METHODS
  // ============================================

  /**
   * Send conversation to AI model and get response
   * @param options - Request-specific options
   * @returns Structured AI response
   * @throws {Error} On API errors or invalid requests
   * @example
   * const response = await ai.send({
   *   temperature: 0.8,
   *   maxTokens: 1500
   * });
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
          messages: messages as OpenAI.ChatCompletionMessageParam[],
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          stream: false,
        })
      );

      const content = completion.choices[0]?.message?.content || '';
      const duration = Date.now() - startTime;
      
      // Auto-add assistant response to conversation history
      this.messages.push({ role: 'assistant', content });

      const response: AIResponse = {
        content,
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
        model: completion.model,
        finishReason: completion.choices[0]?.finish_reason,
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
   * Stream response from AI model in real-time
   * @param onChunk - Callback for each text chunk
   * @param options - Request options override
   * @returns Complete response content
   * @example
   * const fullText = await ai.stream(
   *   (chunk) => process.stdout.write(chunk)
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
    });

    try {
      const startTime = Date.now();
      
      const stream = await this.makeRequest(() => 
        this.client.chat.completions.create({
          model: config.model,
          messages: messages as OpenAI.ChatCompletionMessageParam[],
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

      // Add complete response to history
      this.messages.push({ role: 'assistant', content: fullContent });

      this.logger.log('STREAM', '✅ Streaming completed', {
        duration: `${duration}ms`,
        model: config.model,
        chunksReceived: chunkCount,
        totalLength: fullContent.length,
        avgChunkSize: Math.round(fullContent.length / Math.max(chunkCount, 1)),
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
   * Create new AI model instance (static factory)
   * @param config - Model configuration
   * @param logger - Optional custom logger
   * @returns New AIModel instance
   */
  static create(config: AIModelConfig, logger?: Logger): AIModel {
    return new AIModel(config, logger);
  }

  /**
   * Create AI model using environment variables
   * @param provider - Provider name (defaults to 'openrouter')
   * @param overrides - Configuration overrides
   * @param logger - Optional custom logger
   * @returns New AIModel instance
   * @throws {Error} If API key not found in environment
   * @example
   * // Uses OPENROUTER_API_KEY or OPENAI_API_KEY from env
   * const ai = AIModel.createFromEnv('openrouter', {
   *   model: 'gpt-4',
   *   debug: true
   * });
   */
  static createFromEnv(
    provider?: string, 
    overrides?: Partial<AIModelConfig>, 
    logger?: Logger
  ): AIModel {
    const providerId = provider || 'openrouter';
    const envKey = providerId.toUpperCase();
    const apiKey = process.env[`${envKey}_API_KEY`] || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error(
        `${envKey}_API_KEY or OPENAI_API_KEY environment variable is not set. ` +
        `Please set it to use the ${providerId} provider.`
      );
    }

    return new AIModel({
      apiKey,
      provider: providerId,
      ...overrides,
    }, logger);
  }

  /**
   * Create AI model for specific provider with API key
   * @param providerId - Provider identifier
   * @param apiKey - Provider API key
   * @param overrides - Configuration overrides
   * @param logger - Optional custom logger
   * @returns New AIModel instance
   */
  static createForProvider(
    providerId: string, 
    apiKey: string, 
    overrides?: Partial<AIModelConfig>, 
    logger?: Logger
  ): AIModel {
    return new AIModel({
      apiKey,
      provider: providerId,
      ...overrides,
    }, logger);
  }
}

// ============================================
// CONFIGURATION MANAGER (SINGLETON)
// ============================================

/**
 * Global configuration manager for AI library
 * Provides singleton access to default configurations and provider management
 * @class ConfigManager
 * @example
 * const config = ConfigManager.getInstance();
 * config.setDefaultConfig({ temperature: 0.7, debug: true });
 * 
 * const ai = config.createModel({
 *   apiKey: 'your-key',
 *   model: 'gpt-4'
 * });
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private defaultConfig: Partial<AIModelConfig> = {};
  private customProviders: Map<string, AIProviderConfig> = new Map();

  /** Private constructor for singleton pattern */
  private constructor() {}

  /**
   * Get singleton instance
   * @returns ConfigManager instance
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Set default configuration for all created models
   * @param config - Default configuration values
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
   * Get current default configuration
   * @returns Copy of default configuration
   */
  getDefaultConfig(): Partial<AIModelConfig> {
    return { ...this.defaultConfig };
  }

  /**
   * Register custom provider with configuration manager
   * @param id - Provider identifier
   * @param config - Provider configuration
   */
  registerProvider(id: string, config: AIProviderConfig): void {
    this.customProviders.set(id, config);
    ProviderRegistry.registerProvider(id, config);
  }

  /**
   * Get provider configuration
   * @param id - Provider identifier
   * @returns Provider config or undefined
   */
  getProvider(id: string): AIProviderConfig | undefined {
    return this.customProviders.get(id) || ProviderRegistry.getProvider(id);
  }

  /**
   * Create AI model with default configuration and overrides
   * @param overrides - Configuration overrides
   * @param logger - Optional custom logger
   * @returns New AIModel instance
   * @throws {Error} If API key not provided
   */
  createModel(overrides?: Partial<AIModelConfig>, logger?: Logger): AIModel {
    const config = { ...this.defaultConfig, ...overrides };
    
    if (!config.apiKey) {
      throw new Error('API key is required. Provide it in config or set via setDefaultConfig().');
    }
    
    return new AIModel(config as AIModelConfig, logger);
  }

  /**
   * Get all available providers (built-in + custom)
   * @returns Map of all provider configurations
   */
  getAllProviders(): Map<string, AIProviderConfig> {
    const allProviders = new Map(ProviderRegistry.getAllProviders());
    this.customProviders.forEach((config, id) => allProviders.set(id, config));
    return allProviders;
  }
}

// ============================================
// CONVENIENCE EXPORTS AND DEFAULT INSTANCE
// ============================================

/**
 * Default library export with all major components
 * Provides easy access to all functionality from single import
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

/**
 * Quick-start function for common use cases
 * Creates pre-configured AI model instance
 * @param apiKey - API key for authentication
 * @param provider - Provider ID (default: 'openrouter')
 * @param options - Additional configuration options
 * @returns New AIModel instance
 * @example
 * const ai = createAI(process.env.OPENAI_API_KEY, 'openai', {
 *   temperature: 0.8,
 *   debug: true
 * });
 */
export function createAI(
  apiKey: string,
  provider: string = 'openrouter',
  options: Partial<AIModelConfig> = {}
): AIModel {
  return new AIModel({
    apiKey,
    provider,
    ...options,
  });
}

/**
 * Utility function to validate provider configuration
 * @param providerId - Provider identifier to check
 * @returns Validation result with status and message
 */
export function validateProvider(providerId: string): { valid: boolean; message: string } {
  if (!ProviderRegistry.hasProvider(providerId)) {
    return {
      valid: false,
      message: `Provider '${providerId}' not found. Available: ${Array.from(ProviderRegistry.getAllProviders().keys()).join(', ')}`
    };
  }
  
  return {
    valid: true,
    message: `Provider '${providerId}' is available`
  };
}