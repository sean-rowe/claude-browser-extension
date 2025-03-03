import {LoggerService} from '../../shared/services/loggerService';
import {ArtifactService} from './artifactService';
import {DownloadService} from './downloadService';
import {ApiService} from './apiService';
import {ArtifactState} from '../../shared/models/artifact';

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

            case 'continueConversation':
                this.handleContinueConversation(message, sendResponse);
                return true; // Keep connection open for async response

            case 'getSettings':
                this.handleGetSettings(sendResponse);
                return true; // Keep connection open for async response

            case 'saveSettings':
                this.handleSaveSettings(message, sendResponse);
                return true; // Keep connection open for async response

            case 'downloadSingleArtifact':
                this.handleDownloadSingleArtifact(message, sendResponse);
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

            // Convert plain objects to ArtifactState instances
            const artifactStates = artifacts.map((a: any) => new ArtifactState(a));

            // Process artifacts
            const files = await this.artifactService.processArtifacts(
                artifactStates,
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
     * Handle download single artifact request
     */
    private async handleDownloadSingleArtifact(message: any, sendResponse: (response?: any) => void): Promise<void> {
        try {
            const { artifact } = message;

            if (!artifact) {
                sendResponse({ success: false, error: 'No artifact provided' });
                return;
            }

            // Convert to ArtifactState
            const artifactState = new ArtifactState(artifact);

            // Process artifact to get file
            const [file] = await this.artifactService.processArtifacts([artifactState]);

            // Download file
            const filename = await this.downloadService.downloadSingleArtifact(file);

            sendResponse({
                success: true,
                filename
            });
        } catch (error) {
            this.logger.error('MessageRouter: Error handling download single artifact', error);
            sendResponse({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Handle continue conversation request
     */
    private async handleContinueConversation(message: any, sendResponse: (response?: any) => void): Promise<void> {
        try {
            const { conversationHistory, prompt } = message;

            if (!conversationHistory || !prompt) {
                sendResponse({ success: false, error: 'Missing conversation history or prompt' });
                return;
            }

            // Call API service to continue conversation
            const result = await this.apiService.continueConversation(conversationHistory, prompt);

            sendResponse({
                success: true,
                data: result
            });
        } catch (error) {
            this.logger.error('MessageRouter: Error handling continue conversation', error);
            sendResponse({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Handle get settings request
     */
    private async handleGetSettings(sendResponse: (response?: any) => void): Promise<void> {
        try {
            const settingsState = await this.artifactService.storageService.getSettings();

            sendResponse({
                success: true,
                settings: settingsState.toObject()
            });
        } catch (error) {
            this.logger.error('MessageRouter: Error handling get settings', error);
            sendResponse({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Handle save settings request
     */
    private async handleSaveSettings(message: any, sendResponse: (response?: any) => void): Promise<void> {
        try {
            const { settings } = message;

            if (!settings) {
                sendResponse({ success: false, error: 'No settings provided' });
                return;
            }

            // Save settings
            await this.artifactService.storageService.saveSettings(settings);

            sendResponse({
                success: true
            });
        } catch (error) {
            this.logger.error('MessageRouter: Error handling save settings', error);
            sendResponse({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
