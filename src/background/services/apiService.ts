import {LoggerService} from '@/shared/services/loggerService.ts';
import {StorageService} from '@/shared/services/storageService.ts';

/**
 * Service for interacting with external APIs
 */
export class ApiService {
    private static instance: ApiService;
    private readonly logger = LoggerService.getInstance();
    private readonly storageService = StorageService.getInstance();

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Get the singleton instance of the API service
     */
    public static getInstance(): ApiService {
        if (!ApiService.instance) {
            ApiService.instance = new ApiService();
        }
        return ApiService.instance;
    }

    /**
     * Initialize the API service
     */
    public async init(): Promise<void> {
        try {
            this.logger.debug('ApiService: Initialized');
        } catch (error) {
            this.logger.error('ApiService: Initialization error', error);
        }
    }

    /**
     * Send a prompt to Claude API
     * @param prompt The user prompt to send
     * @param options Additional API options
     */
    public async sendPrompt(prompt: string, options: any = {}): Promise<any> {
        try {
            // Load settings to get the latest API key
            const settings = await this.storageService.getSettings();
            const apiKey = settings.apiSettings.apiKey;

            if (!apiKey) {
                this.logger.error('ApiService: API key not configured');
                return {
                    error: true,
                    message: 'API key not configured'
                };
            }

            // Prepare request options
            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: settings.apiSettings.modelName,
                    max_tokens: settings.apiSettings.maxTokens,
                    temperature: settings.apiSettings.temperature,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    ...options
                })
            };

            // Make API request
            const response = await fetch(settings.apiSettings.apiEndpoint, requestOptions);

            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`ApiService: API error (${response.status}): ${errorText}`);
                return {
                    error: true,
                    status: response.status,
                    message: errorText
                };
            }

            return await response.json();
        } catch (error) {
            this.logger.error('ApiService: Error sending prompt', error);
            return {
                error: true,
                message: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Continue a conversation with the Claude API
     * @param conversationHistory Previous messages in the conversation
     * @param prompt New user prompt to send
     * @param options Additional API options
     */
    public async continueConversation(
        conversationHistory: any[],
        prompt: string,
        options: any = {}
    ): Promise<any> {
        try {
            // Load settings
            const settings = await this.storageService.getSettings();
            const apiKey = settings.apiSettings.apiKey;

            if (!apiKey) {
                this.logger.error('ApiService: API key not configured');
                return {
                    error: true,
                    message: 'API key not configured'
                };
            }

            if (!settings.apiSettings.enableApiContinuation) {
                this.logger.error('ApiService: API continuation is disabled in settings');
                return {
                    error: true,
                    message: 'API continuation is disabled in settings'
                };
            }

            // Prepare messages from conversation history
            const messages = [
                ...conversationHistory,
                {
                    role: 'user',
                    content: prompt
                }
            ];

            // Prepare request options
            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: settings.apiSettings.modelName,
                    max_tokens: settings.apiSettings.maxTokens,
                    temperature: settings.apiSettings.temperature,
                    messages,
                    ...options
                })
            };

            // Make API request
            const response = await fetch(settings.apiSettings.apiEndpoint, requestOptions);

            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`ApiService: API error (${response.status}): ${errorText}`);
                return {
                    error: true,
                    status: response.status,
                    message: errorText
                };
            }

            return await response.json();
        } catch (error) {
            this.logger.error('ApiService: Error continuing conversation', error);
            return {
                error: true,
                message: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Compile code using remote service
     * @param code Code to compile
     * @param language Programming language of the code
     */
    public async compileCode(code: string, language: string): Promise<any> {
        try {
            // Load settings
            const settings = await this.storageService.getSettings();

            if (!settings.compilerSettings.enableCompilation) {
                this.logger.warn('ApiService: Code compilation is disabled in settings');
                return {
                    error: true,
                    message: 'Code compilation is disabled in settings'
                };
            }

            if (!settings.compilerSettings.useRemoteCompilation) {
                this.logger.warn('ApiService: Remote compilation is disabled in settings');
                return {
                    error: true,
                    message: 'Remote compilation is disabled in settings'
                };
            }

            if (!settings.compilerSettings.supportedLanguages.includes(language)) {
                this.logger.warn(`ApiService: Language not supported: ${language}`);
                return {
                    error: true,
                    message: `Language not supported: ${language}`
                };
            }

            const apiKey = settings.compilerSettings.compilationApiKey;
            if (!apiKey) {
                this.logger.error('ApiService: Compilation API key not configured');
                return {
                    error: true,
                    message: 'Compilation API key not configured'
                };
            }

            // Prepare request options
            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    language,
                    code,
                    timeout: settings.compilerSettings.executionTimeoutMs
                })
            };

            // Make API request
            const response = await fetch(settings.compilerSettings.remoteCompilationEndpoint, requestOptions);

            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`ApiService: Compilation error (${response.status}): ${errorText}`);
                return {
                    error: true,
                    message: `Compilation error: ${errorText}`
                };
            }

            const data = await response.json();
            return {
                output: data.output,
                error: data.error,
                executionTime: data.executionTime
            };
        } catch (error) {
            this.logger.error('ApiService: Error compiling code', error);

            // Return a simulated result for demonstration
            return {
                output: 'Remote compilation unavailable. This is a simulated response.',
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTime: 0
            };
        }
    }
}
