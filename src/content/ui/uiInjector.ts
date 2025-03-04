import { LoggerService } from '@/shared/services/loggerService.ts';
import { BannerService } from './bannerService';
import { MessageService } from '../events/messageService';
import { ArtifactExtractor } from '@/shared/utils/artifactExtractor.ts';

/**
 * Service responsible for injecting custom UI elements into Claude's interface
 */
export class UiInjector {
    private static instance: UiInjector;
    private readonly logger = LoggerService.getInstance();
    private readonly bannerService = BannerService.getInstance();
    private readonly messageService = MessageService.getInstance();

    private observer: MutationObserver | null = null;
    private downloadButton: HTMLButtonElement | null = null;
    private settingsButton: HTMLButtonElement | null = null;
    private headerContainer: HTMLElement | null = null;
    private isInitialized = false;

    // Selectors for Claude's interface
    private readonly SELECTORS = {
        HEADER: '.claude-header',
        CONTROLS: '.claude-controls',
        ARTIFACT_CONTAINER: '.antml-artifact-container',
        CONVERSATION_CONTAINER: '.conversation-container'
    };

    private constructor() {
        // Private constructor for singleton pattern
    }

    /**
     * Get the singleton instance of the UI injector
     */
    public static getInstance(): UiInjector {
        if (!UiInjector.instance) {
            UiInjector.instance = new UiInjector();
        }
        return UiInjector.instance;
    }

    /**
     * Initialize the UI injector
     */
    public async init(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            this.logger.debug('UiInjector: Initializing');

            // Start observer to detect DOM changes
            this.startObserver();

            // Inject custom stylesheet
            this.injectStylesheet();

            this.isInitialized = true;
            this.logger.info('UiInjector: Initialized successfully');
        } catch (error) {
            this.logger.error('UiInjector: Initialization failed', error);
            this.bannerService.showError('Failed to initialize UI components');
        }
    }

    /**
     * Start observing DOM changes
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

        // Check for UI elements immediately in case they're already in the DOM
        this.checkAndInjectElements();
    }

    /**
     * Handle DOM mutations
     */
    private handleDomMutations(mutations: MutationRecord[]): void {
        // Only process if we have new nodes added
        const hasNewNodes = mutations.some(mutation =>
            mutation.type === 'childList' && mutation.addedNodes.length > 0);

        if (hasNewNodes) {
            this.checkAndInjectElements();
        }
    }

    /**
     * Check if Claude elements exist and inject our custom elements
     */
    private checkAndInjectElements(): void {
        // Try to find the Claude header if we don't already have it
        if (!this.headerContainer) {
            this.headerContainer = document.querySelector(this.SELECTORS.HEADER);
        }

        // If we found the header, inject our buttons
        if (this.headerContainer && !this.downloadButton) {
            this.injectButtons();
        }
    }

    /**
     * Inject custom buttons into Claude's header
     */
    private injectButtons(): void {
        const controlsContainer = this.headerContainer?.querySelector(this.SELECTORS.CONTROLS);

        if (!controlsContainer) {
            this.logger.warn('UiInjector: Could not find controls container');
            return;
        }

        // Create container for our buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'claude-artifacts-buttons';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '8px';
        buttonContainer.style.marginLeft = '8px';

        // Create download button
        this.downloadButton = this.createDownloadButton();
        buttonContainer.appendChild(this.downloadButton);

        // Create settings button
        this.settingsButton = this.createSettingsButton();
        buttonContainer.appendChild(this.settingsButton);

        // Add buttons to the controls container
        controlsContainer.appendChild(buttonContainer);
        this.logger.info('UiInjector: Buttons injected');
    }

    /**
     * Create the download button
     */
    private createDownloadButton(): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'claude-download-button';
        button.title = 'Download artifacts from this conversation';
        button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span>Download artifacts</span>
    `;

        // Add styling
        Object.assign(button.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            color: '#334155',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
        });

        // Add hover effect
        button.addEventListener('mouseover', () => {
            Object.assign(button.style, {
                backgroundColor: '#f1f5f9',
                borderColor: '#cbd5e1'
            });
        });

        button.addEventListener('mouseout', () => {
            Object.assign(button.style, {
                backgroundColor: '#f8fafc',
                borderColor: '#e2e8f0'
            });
        });

        // Add click handler
        button.addEventListener('click', this.handleDownloadClick.bind(this));

        return button;
    }

    /**
     * Create the settings button
     */
    private createSettingsButton(): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'claude-settings-button';
        button.title = 'Artifact download settings';
        button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    `;

        // Add styling
        Object.assign(button.style, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            color: '#334155',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
        });

        // Add hover effect
        button.addEventListener('mouseover', () => {
            Object.assign(button.style, {
                backgroundColor: '#f1f5f9',
                borderColor: '#cbd5e1'
            });
        });

        button.addEventListener('mouseout', () => {
            Object.assign(button.style, {
                backgroundColor: '#f8fafc',
                borderColor: '#e2e8f0'
            });
        });

        // Add click handler
        button.addEventListener('click', this.handleSettingsClick.bind(this));

        return button;
    }

    /**
     * Handle download button click
     */
    private async handleDownloadClick(): Promise<void> {
        try {
            if (!this.downloadButton) return;

            // Disable button while processing
            this.downloadButton.disabled = true;

            // Update button appearance
            this.downloadButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path>
        </svg>
        <span>Processing...</span>
      `;

            // Extract artifacts from the DOM
            const container = document.querySelector(this.SELECTORS.CONVERSATION_CONTAINER);
            if (!container) {
                throw new Error('Conversation container not found');
            }

            // Get settings
            const response = await this.messageService.sendMessage({ action: 'getSettings' });
            const settings = response.success ? response.data : null;

            // Extract and process artifacts
            const artifacts = ArtifactExtractor.extractArtifactsFromDOM(this.SELECTORS.CONVERSATION_CONTAINER);

            if (artifacts.length === 0) {
                this.bannerService.showInfo('No artifacts found in this conversation');
                return;
            }

            // Download artifacts
            const result = await this.messageService.sendMessage({
                action: 'downloadArtifacts',
                artifacts: artifacts.map(a => a.toObject()),
                options: {
                    stitchArtifacts: settings?.stitchArtifacts || false,
                    flatStructure: settings?.flatFileStructure || false
                }
            });

            if (result.success) {
                this.bannerService.showSuccess(`Downloaded ${result.data.count} artifacts successfully`);
            } else {
                throw new Error(result.error || 'Failed to download artifacts');
            }
        } catch (error) {
            this.logger.error('UiInjector: Download error', error);
            this.bannerService.showError('Failed to download artifacts');
        } finally {
            // Restore button
            if (this.downloadButton) {
                this.downloadButton.disabled = false;
                this.downloadButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>Download artifacts</span>
        `;
            }
        }
    }

    /**
     * Handle settings button click
     */
    private async handleSettingsClick(): Promise<void> {
        try {
            // Show settings UI (this will be handled by its own component)
            await this.messageService.sendMessage({ action: 'showSettings' });
        } catch (error) {
            this.logger.error('UiInjector: Settings error', error);
            this.bannerService.showError('Failed to open settings');
        }
    }

    /**
     * Inject custom stylesheet
     */
    private injectStylesheet(): void {
        const style = document.createElement('style');
        style.id = 'claude-artifacts-styles';
        style.textContent = `
      /* Button styling */
      .claude-artifacts-buttons button:focus-visible {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      /* Animation for spinner */
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      .animate-spin {
        animation: spin 1s linear infinite;
      }
      
      /* Editor styling */
      .monaco-editor-container {
        width: 100%;
        height: 300px;
        min-height: 100px;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
        margin-top: 8px;
      }
      
      .editor-resize-handle {
        height: 6px;
        background: #e2e8f0;
        cursor: ns-resize;
        width: 100%;
        position: absolute;
        bottom: 0;
        left: 0;
        z-index: 10;
      }
      
      .editor-resize-handle:hover {
        background: #cbd5e1;
      }
      
      /* Code execution output */
      .code-execution-output {
        margin-top: 12px;
        padding: 12px;
        background-color: #f8fafc;
        border-radius: 4px;
        border: 1px solid #e2e8f0;
        max-height: 300px;
        overflow: auto;
        font-size: 14px;
        font-family: monospace;
      }
      
      .code-execution-output pre {
        margin: 0;
        white-space: pre-wrap;
      }
      
      /* Artifact controls */
      .artifact-controls {
        display: flex;
        gap: 8px;
        margin-left: auto;
      }
      
      .artifact-controls button {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid #e2e8f0;
        background-color: #f8fafc;
        color: #334155;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s ease;
      }
      
      .artifact-controls button:hover {
        background-color: #f1f5f9;
        border-color: #cbd5e1;
      }
      
      .artifact-controls .artifact-run-button {
        border-color: #d1fae5;
        background-color: #ecfdf5;
        color: #065f46;
      }
      
      .artifact-controls .artifact-run-button:hover {
        background-color: #d1fae5;
        border-color: #059669;
      }
    `;

        document.head.appendChild(style);
    }

    /**
     * Clean up injected elements
     */
    private removeInjectedElements(): void {
        // Remove buttons
        document.querySelector('.claude-artifacts-buttons')?.remove();

        // Remove styles
        document.getElementById('claude-artifacts-styles')?.remove();

        // Reset state
        this.downloadButton = null;
        this.settingsButton = null;
        this.headerContainer = null;
    }

    /**
     * Clean up resources
     */
    public destroy(): void {
        // Disconnect observer
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        // Remove injected elements
        this.removeInjectedElements();

        this.isInitialized = false;
        this.logger.debug('UiInjector: Destroyed');
    }
}
