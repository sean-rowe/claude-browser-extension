import {LoggerService} from '@/shared/services/loggerService.ts';
import {StorageService} from '@/shared/services/storageService.ts';

/**
 * Service for interacting with the Claude API
 */
export class ApiService {
    private static instance: ApiService;
    private readonly logger = LoggerService.getInstance();
    private readonly storageService = StorageService.getInstance();
    private apiKey: string = '';

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
            // Load settings
            const settings = await this.storageService.getSettings();
            this.apiKey = settings.apiSettings.apiKey;

            this.logger.debug('ApiService: Initialized');
        } catch (error) {
            this.logger.error('ApiService: Initialization error', error);
        }
    }

    /**
     * Send a prompt to Claude API
     */
    public async sendPrompt(prompt: string, options?: any): Promise<any> {
        try {
            // Load settings to get the latest API key
            const settings = await this.storageService.getSettings();
            const apiKey = settings.apiSettings.apiKey;

            if (!apiKey) {
                throw new Error('API key not configured');
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
                throw new Error(`API error (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            this.logger.error('ApiService: Error sending prompt', error);
            throw error;
        }
    }

    /**
     * Continue a conversation with the Claude API
     */
    public async continueConversation(conversationHistory: any[], prompt: string): Promise<any> {
        try {
            // Load settings
            const settings = await this.storageService.getSettings();
            const apiKey = settings.apiSettings.apiKey;

            if (!apiKey) {
                throw new Error('API key not configured');
            }

            if (!settings.apiSettings.enableApiContinuation) {
                throw new Error('API continuation is disabled in settings');
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
                    messages
                })
            };

            // Make API request
            const response = await fetch(settings.apiSettings.apiEndpoint, requestOptions);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API error (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            this.logger.error('ApiService: Error continuing conversation', error);
            throw error;
        }
    }
}
