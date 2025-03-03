import { LoggerService } from '../../shared/services/loggerService';
import { StorageService } from '../../shared/services/storageService';

/**
 * Service for interacting with external APIs
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
                    ]
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
     * Compile code using remote service
     */
    public async compileCode(code: string, language: string): Promise<any> {
        try {
            // Load settings
            const settings = await this.storageService.getSettings();
            const apiKey = settings.compilerSettings.compilationApiKey;

            if (!settings.compilerSettings.enableCompilation) {
                throw new Error('Code compilation is disabled in settings');
            }

            if (!settings.compilerSettings.useRemoteCompilation) {
                throw new Error('Remote compilation is disabled in settings');
            }

            if (!settings.compilerSettings.supportedLanguages.includes(language)) {
                throw new Error(`Language not supported: ${language}`);
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
                throw new Error(`Compilation error (${response.status}): ${errorText}`);
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
