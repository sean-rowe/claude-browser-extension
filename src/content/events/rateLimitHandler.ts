import { LoggerService } from '../../shared/services/loggerService';
import { MessageService } from './messageService';
import { BannerService } from '../ui/bannerService';
import { StorageService } from '../../shared/services/storageService';

/**
 * Handler for Claude rate limit detection and API continuation
 */
export class RateLimitHandler {
    private static instance: RateLimitHandler;
    private readonly logger = LoggerService.getInstance();
    private readonly messageService = MessageService.getInstance();
    private readonly bannerService = BannerService.getInstance();
    private readonly storageService = StorageService.getInstance();

    private observer: MutationObserver | null = null;
    private isApiContinuationEnabled = false;
    private isRateLimited = false;
    private continueButton: HTMLButtonElement | null = null;

    private readonly RATE_LIMIT_SELECTORS = [
        '.rate-limit-message',
        '.rate-limited-container',
        '.message-error:contains("rate limit")'
    ];

    private constructor() {
        this.init().catch(error => {
            console.error('RateLimitHandler: Initialization error', error);
        });
    }

    /**
     * Get the singleton instance of the rate limit handler
     */
    public static getInstance(): RateLimitHandler {
        if (!RateLimitHandler.instance) {
            RateLimitHandler.instance = new RateLimitHandler();
        }
        return RateLimitHandler.instance;
    }

    /**
     * Initialize the rate limit handler
     */
    private async init(): Promise<void> {
        try {
            // Load settings
            const settings = await this.storageService.getSettings();
            this.isApiContinuationEnabled = settings.apiSettings.enableApiContinuation;

            // Start observing for rate limit messages
            this.startObserver();

            this.logger.debug('RateLimitHandler: Initialized');
        } catch (error) {
            this.logger.error('RateLimitHandler: Initialization failed', error);
        }
    }

    /**
     * Start observing for rate limit messages
     */
    private startObserver(): void {
        if (this.observer) {
            this.observer.disconnect();
        }

        this.observer = new MutationObserver(this.handleDomMutations.bind(this));
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Also check immediately
        this.checkForRateLimit();
    }

    /**
     * Handle DOM mutations
     */
    private handleDomMutations(mutations: MutationRecord[]): void {
        // Only process if we have new nodes added
        const hasNewNodes = mutations.some(mutation =>
            mutation.type === 'childList' && mutation.addedNodes.length > 0);

        if (hasNewNodes) {
            this.checkForRateLimit();
        }
    }

    /**
     * Check for rate limit messages in the DOM
     */
    private checkForRateLimit(): void {
        // Skip if already handling rate limit or API continuation disabled
        if (this.isRateLimited || !this.isApiContinuationEnabled) {
            return;
        }

        // Check for rate limit messages
        for (const selector of this.RATE_LIMIT_SELECTORS) {
            const element = document.querySelector(selector);
            if (element) {
                this.handleRateLimit(element as HTMLElement);
                break;
            }
        }
    }

    /**
     * Handle rate limit detection
     */
    private async handleRateLimit(element: HTMLElement): Promise<void> {
        try {
            this.isRateLimited = true;
            this.logger.info('RateLimitHandler: Rate limit detected');

            // Check if API continuation is enabled and API key is set
            const settings = await this.storageService.getSettings();
            if (!settings.apiSettings.enableApiContinuation) {
                this.logger.debug('RateLimitHandler: API continuation disabled in settings');
                return;
            }

            if (!settings.apiSettings.apiKey) {
                this.bannerService.showWarning('API key not set. Please configure in settings to continue via API.');
                return;
            }

            // Add continue button
            this.addContinueButton(element);
        } catch (error) {
            this.logger.error('RateLimitHandler: Error handling rate limit', error);
        }
    }

    /**
     * Add a button to continue conversation via API
     */
    private addContinueButton(container: HTMLElement): void {
        // Check if button already exists
        if (this.continueButton || container.querySelector('.api-continue-button')) {
            return;
        }

        // Create button
        const button = document.createElement('button');
        button.className = 'api-continue-button';
        button.textContent = 'Continue with API';

        // Add styling
        Object.assign(button.style, {
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            marginTop: '12px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px'
        });

        // Add event listener
        button.addEventListener('click', this.handleContinueClick.bind(this));

        // Add to container
        container.appendChild(button);
        this.continueButton = button;
    }

    /**
     * Handle continue button click
     */
    private async handleContinueClick(): Promise<void> {
        try {
            if (!this.continueButton) return;

            // Update button state
            this.continueButton.disabled = true;
            this.continueButton.textContent = 'Continuing...';

            // Extract current conversation context
            const conversationContext = this.extractConversationContext();

            // Send to background script for API continuation
            const response = await this.messageService.sendMessage({
                action: 'apiRequest',
                prompt: conversationContext.lastMessage,
                options: {
                    context: conversationContext.history
                }
            });

            if (response.success) {
                // Display API response
                this.displayApiResponse(response.data);

                // Clear rate limited state
                this.isRateLimited = false;

                // Show success message
                this.bannerService.showSuccess('Successfully continued with API');
            } else {
                throw new Error(response.error || 'Failed to continue with API');
            }
        } catch (error) {
            this.logger.error('RateLimitHandler: Error continuing with API', error);
            this.bannerService.showError('Failed to continue with API');

            // Reset button
            if (this.continueButton) {
                this.continueButton.disabled = false;
                this.continueButton.textContent = 'Continue with API';
            }
        }
    }

    /**
     * Extract conversation context
     */
    private extractConversationContext(): { history: string[], lastMessage: string } {
        // Implementation would extract conversation history from DOM
        const history: string[] = [];
        let lastMessage = '';

        // Find conversation container
        const conversationContainer = document.querySelector('.conversation-container');
        if (conversationContainer) {
            // Extract message elements
            const messageElements = conversationContainer.querySelectorAll('.message');

            messageElements.forEach(element => {
                const content = element.textContent || '';
                history.push(content);
            });

            // Extract last user message
            const lastUserMessage = conversationContainer.querySelector('.message.user:last-child');
            if (lastUserMessage) {
                lastMessage = lastUserMessage.textContent || '';
            }
        }

        return { history, lastMessage };
    }

    /**
     * Display API response in the UI
     */
    private displayApiResponse(apiResponse: any): void {
        // Implementation would display the API response in the UI
        // This could be complex and would interact with Claude's UI

        // For now, just show a message with the API result
        this.bannerService.showInfo('API response received. Displaying would require deep integration.');

        // Log the response
        this.logger.debug('RateLimitHandler: API response', apiResponse);
    }

    /**
     * Destroy the rate limit handler
     */
    public destroy(): void {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        if (this.continueButton && this.continueButton.parentNode) {
            this.continueButton.parentNode.removeChild(this.continueButton);
        }

        this.continueButton = null;
        this.isRateLimited = false;

        this.logger.debug('RateLimitHandler: Destroyed');
    }
}
