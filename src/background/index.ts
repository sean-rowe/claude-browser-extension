import { LoggerService } from '../shared/services/loggerService';
import { StorageService } from '../shared/services/storageService';
import { ArtifactService } from './services/artifactService';
import { DownloadService } from './services/downloadService';
import { MessageRouter } from './services/messageRouter';
import { ApiService } from './services/apiService';

/**
 * Main entry point for the background script
 */
class Background {
    private readonly logger = LoggerService.getInstance();
    private readonly storageService = StorageService.getInstance();
    private readonly artifactService = ArtifactService.getInstance();
    private readonly downloadService = DownloadService.getInstance();
    private readonly apiService = ApiService.getInstance();
    private readonly messageRouter = MessageRouter.getInstance();

    constructor() {
        this.init().catch(error => {
            console.error('Background: Initialization error', error);
        });
    }

    /**
     * Initialize the background script
     */
    private async init(): Promise<void> {
        try {
            this.logger.info('Background: Initializing');

            // Load settings
            await this.storageService.getSettings();

            // Initialize services
            this.messageRouter.init();
            this.artifactService.init();
            this.downloadService.init();
            this.apiService.init();

            // Set up extension icon click handler
            chrome.action.onClicked.addListener(this.handleActionClick.bind(this));

            this.logger.info('Background: Initialization complete');
        } catch (error) {
            this.logger.error('Background: Initialization failed', error);
        }
    }

    /**
     * Handle extension icon click
     */
    private async handleActionClick(tab: chrome.tabs.Tab): Promise<void> {
        if (!tab.id) return;

        try {
            // Check if on Claude site
            const url = tab.url || '';
            if (!url.includes('claude.ai') && !url.includes('anthropic.com')) {
                await chrome.tabs.create({ url: 'https://claude.ai/' });
                return;
            }

            // Send message to show settings
            chrome.tabs.sendMessage(tab.id, { action: 'showSettings' });
        } catch (error) {
            this.logger.error('Background: Error handling action click', error);
        }
    }
}

// Initialize background script
new Background();
