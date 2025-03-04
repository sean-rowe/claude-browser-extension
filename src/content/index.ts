import { LoggerService } from '../shared/services/loggerService';
import { UiInjector } from './ui/uiInjector';
import { BannerService } from './ui/bannerService';
import { MessageService } from './events/messageService';
import { StorageService } from '../shared/services/storageService';
import { ArtifactUIHandler } from './editor/artifactUIHandler';
import { EditorManager } from './editor/editorManager';
import { CompilerService } from './editor/compilerService';
import { SettingsUI } from './ui/settingsUI';
import {ArtifactExtractor} from '@/shared/utils/artifactExtractor.ts';

/**
 * Main entry point for the content script
 * Responsible for initializing services and handling DOM interactions
 */
class ContentScript {
    private readonly logger = LoggerService.getInstance();
    private readonly uiInjector = UiInjector.getInstance();
    private readonly bannerService = BannerService.getInstance();
    private readonly messageService = MessageService.getInstance();
    private readonly storageService = StorageService.getInstance();
    private readonly artifactUIHandler = ArtifactUIHandler.getInstance();
    private readonly editorManager = EditorManager.getInstance();
    private readonly compilerService = CompilerService.getInstance();
    private readonly settingsUI = SettingsUI.getInstance();

    constructor() {
        this.init().catch(error => {
            console.error('ContentScript: Initialization error', error);
        });
    }

    /**
     * Initialize the content script
     */
    private async init(): Promise<void> {
        try {
            this.logger.info('ContentScript: Initializing');

            // Load settings
            const settings = await this.storageService.getSettings();

            // Set notification duration from settings
            this.bannerService.setNotificationDuration(
                settings.uiSettings.notificationDurationMs
            );

            // Register message handlers
            this.registerMessageHandlers();

            // Initialize UI components
            await this.uiInjector.init();
            this.artifactUIHandler.init();

            // Notification on successful initialization (if enabled)
            if (settings.uiSettings.showNotifications) {
                this.bannerService.showSuccess('Claude Artifacts helper initialized', 2000);
            }

            this.logger.info('ContentScript: Initialization complete');
        } catch (error) {
            this.logger.error('ContentScript: Initialization failed', error);
            this.bannerService.showError('Failed to initialize extension');
        }
    }

    /**
     * Register handlers for background script messages
     */
    private registerMessageHandlers(): void {
        // Handler for showing settings UI
        this.messageService.registerHandler('showSettings', async () => {
            await this.settingsUI.show();
            return true;
        });

        // Handler for showing notifications
        this.messageService.registerHandler('showNotification', async (message) => {
            const { type, text, duration } = message;

            switch (type) {
                case 'success':
                    this.bannerService.showSuccess(text, duration);
                    break;
                case 'error':
                    this.bannerService.showError(text, duration);
                    break;
                case 'info':
                    this.bannerService.showInfo(text, duration);
                    break;
                case 'warning':
                    this.bannerService.showWarning(text, duration);
                    break;
                default:
                    this.bannerService.showInfo(text, duration);
            }

            return true;
        });

        // Handler for downloading all artifacts
        this.messageService.registerHandler('downloadAllArtifacts', async (message) => {
            try {
                const options = message.options || {};

                // Extract artifacts from the DOM
                const artifacts = ArtifactExtractor.extractArtifactsFromDOM();

                if (artifacts.length === 0) {
                    this.bannerService.showInfo('No artifacts found in this conversation');
                    return { count: 0 };
                }

                // Send to background script for download
                const result = await this.messageService.sendMessage({
                    action: 'downloadArtifacts',
                    artifacts: artifacts.map(a => a.toObject()),
                    options: {
                        stitchArtifacts: options.stitchArtifacts || false,
                        flatStructure: options.flatStructure || false
                    }
                });

                if (result.success) {
                    this.bannerService.showSuccess(`${result.data.count} artifacts downloaded successfully`);
                    return { count: result.data.count };
                } else {
                    throw new Error(result.error || 'Failed to download artifacts');
                }
            } catch (error) {
                this.logger.error('ContentScript: Download artifacts error', error);
                this.bannerService.showError('Failed to download artifacts');
                return { count: 0, error: error instanceof Error ? error.message : 'Unknown error' };
            }
        });
    }
}

// Initialize content script
new ContentScript();
