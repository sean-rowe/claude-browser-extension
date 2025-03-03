import { LoggerService } from '../../shared/services/loggerService';
import { ArtifactService } from './artifactService';
import { DownloadService } from './downloadService';
import { ApiService } from './apiService';

/**
 * Router for handling messages from content scripts
 */
export class MessageRouter {
    private static instance: MessageRouter;
    private readonly logger = LoggerService.getInstance();
    private readonly artifactService = ArtifactService.getInstance();
    private readonly downloadService = DownloadService.getInstance();
    private readonly apiService = ApiService.getInstance();

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Get the singleton instance of the message router
     */
    public static getInstance(): MessageRouter {
        if (!MessageRouter.instance) {
            MessageRouter.instance = new MessageRouter();
        }
        return MessageRouter.instance;
    }

    /**
     * Initialize the message router
     */
    public init(): void {
        // Set up message listener
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

        this.logger.debug('MessageRouter: Initialized');
    }

    /**
     * Handle messages from content scripts
     */
    private handleMessage(
        message: any,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: any) => void
    ): boolean {
        if (!message || !message.action) {
            sendResponse({ success: false, error: 'Invalid message format' });
            return false;
        }

        this.logger.debug('MessageRouter: Received message', message);

        // Process message based on action
        switch (message.action) {
            case 'downloadArtifacts':
                this.handleDownloadArtifacts(message, sendResponse);
                return true; // Keep connection open for async response

            case 'remoteCompile':
                this.handleRemoteCompile(message, sendResponse);
                return true; // Keep connection open for async response

            case 'apiRequest':
                this.handleApiRequest(message, sendResponse);
                return true; // Keep connection open for async response

            default:
                sendResponse({ success: false, error: `Unknown action: ${message.action}` });
                return false;
        }
    }

    /**
     * Handle artifact download request
     */
    private async handleDownloadArtifacts(message: any, sendResponse: (response?: any) => void): Promise<void> {
        try {
            const { artifacts, options } = message;

            if (!artifacts || !Array.isArray(artifacts)) {
                sendResponse({ success: false, error: 'No artifacts provided' });
                return;
            }

            // Process artifacts
            const files = await this.artifactService.processArtifacts(
                artifacts,
                options?.stitchArtifacts || false,
                options?.flatStructure || false
            );

            // Download as ZIP
            const filename = await this.downloadService.downloadArtifactsAsZip(files);

            sendResponse({
                success: true,
                filename,
                count: files.length
            });
        } catch (error) {
            this.logger.error('MessageRouter: Error handling download artifacts', error);
            sendResponse({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Handle remote code compilation request
     */
    private async handleRemoteCompile(message: any, sendResponse: (response?: any) => void): Promise<void> {
        try {
            const { code, language } = message;

            if (!code) {
                sendResponse({ success: false, error: 'No code provided' });
                return;
            }

            // Use API service to compile code
            const result = await this.apiService.compileCode(code, language);

            sendResponse({
                success: true,
                data: result
            });
        } catch (error) {
            this.logger.error('MessageRouter: Error handling remote compile', error);
            sendResponse({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Handle Claude API request
     */
    private async handleApiRequest(message: any, sendResponse: (response?: any) => void): Promise<void> {
        try {
            const { prompt, options } = message;

            if (!prompt) {
                sendResponse({ success: false, error: 'No prompt provided' });
                return;
            }

            // Use API service to make Claude API request
            const result = await this.apiService.sendPrompt(prompt, options);

            sendResponse({
                success: true,
                data: result
            });
        } catch (error) {
            this.logger.error('MessageRouter: Error handling API request', error);
            sendResponse({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
