import { LoggerService } from '../shared/services/loggerService';
import { UiInjector } from './ui/UiInjector';
import { BannerService } from './ui/bannerService';
import { MessageService } from './events/messageService';
import { StorageService } from '../shared/services/storageService';
import { CompilerService } from './editor/compilerService';

/**
 * Main entry point for the content script
 */
class ContentScript {
    private readonly logger = LoggerService.getInstance();
    private readonly uiInjector = UiInjector.getInstance();
    private readonly bannerService = BannerService.getInstance();
    private readonly messageService = MessageService.getInstance();
    private readonly storageService = StorageService.getInstance();
    private readonly compilerService = CompilerService.getInstance();

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

            // Initialize UI injector
            await this.uiInjector.init();

            // Notification on successful initialization
            if (settings.uiSettings.showNotifications) {
                this.bannerService.showSuccess('Claude Artifacts extension initialized', 2000);
            }

            this.logger.info('ContentScript: Initialization complete');
        } catch (error) {
            this.logger.error('ContentScript: Initialization failed', error);
        }
    }

    /**
     * Register handlers for background script messages
     */
    private registerMessageHandlers(): void {
        // Handler for showing settings UI
        this.messageService.registerHandler('showSettings', async () => {
            // Implemented in settings UI module
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
    }
}

// Initialize content script
new ContentScript();
