import {MessageService} from '../events/messageService';
import {BannerService} from './bannerService';
import {LoggerService} from '../../shared/services/loggerService';
import {ArtifactExtractor} from '../../shared/utils/artifactExtractor';
import {EditorManager} from '../editor/editorManager';

/**
 * UI Injector for Claude interface
 * Responsible for injecting UI elements into the Claude interface
 */
export class UiInjector {
    private static instance: UiInjector;
    private readonly logger = LoggerService.getInstance();
    private readonly messageService = MessageService.getInstance();
    private readonly bannerService = BannerService.getInstance();
    private readonly editorManager = EditorManager.getInstance();

    private observer: MutationObserver | null = null;
    private downloadButton: HTMLButtonElement | null = null;
    private settingsButton: HTMLButtonElement | null = null;
    private headerContainer: HTMLElement | null = null;
    private isInitialized = false;

    // UI Element selectors
    private readonly SELECTORS = {
        CLAUDE_HEADER: '.claude-header',
        CLAUDE_CONTROLS: '.claude-controls',
        ARTIFACT_CONTAINER: '.antml-artifact-container',
        ARTIFACT_TITLE: '.antml-artifact-title',
        MESSAGE_CONTAINER: '.prose',
        CONVERSATION_CONTAINER: '.conversation-container'
    };

    private constructor() {
        this.logger.debug('UiInjector: Initializing');
    }

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
            this.startObserver();
            this.injectStylesheet();
            this.isInitialized = true;
            this.logger.info('UiInjector: Initialized successfully');
        } catch (error) {
            this.logger.error('UiInjector: Failed to initialize', error);
            this.bannerService.showError('Failed to initialize UI components');
        }
    }

    /**
     * Clean up resources when the injector is no longer needed
     */
    public destroy(): void {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.removeInjectedElements();
        this.isInitialized = false;
        this.logger.debug('UiInjector: Destroyed');
    }

    /**
     * Start a mutation observer to watch for changes in the DOM
     * that would indicate we need to inject our UI elements
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

        // Also check immediately in case the elements are already present
        this.checkAndInjectElements();
    }

    /**
     * Handle DOM mutations by checking if we need to inject elements
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
     * Check if relevant Claude elements exist and inject our custom elements if needed
     */
    private checkAndInjectElements(): void {
        // Try to find the Claude header if we don't already have it
        if (!this.headerContainer) {
            this.headerContainer = document.querySelector(this.SELECTORS.CLAUDE_HEADER);
        }

        // If we found the header, inject our buttons
        if (this.headerContainer && !this.downloadButton) {
            this.injectButtons();
        }

        // Process any artifacts that might be on the page
        this.processExistingArtifacts();
    }

    /**
     * Inject the download and settings buttons into the Claude header
     */
    private injectButtons(): void {
        const controlsContainer = this.headerContainer?.querySelector(this.SELECTORS.CLAUDE_CONTROLS);

        if (!controlsContainer) {
            this.logger.warn('UiInjector: Could not find controls container');
            return;
        }

        // Create container for our buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'claude-artifact-buttons';
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
     * Create the download button with appropriate styling and event handling
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

        // Add event listener
        button.addEventListener('click', this.handleDownloadClick.bind(this));

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

        return button;
    }

    /**
     * Create the settings button with appropriate styling and event handling
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

        // Add event listener
        button.addEventListener('click', this.handleSettingsClick.bind(this));

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

        return button;
    }

    /**
     * Process existing artifacts on the page to add edit buttons
     */
    private processExistingArtifacts(): void {
        const artifactContainers = document.querySelectorAll(this.SELECTORS.ARTIFACT_CONTAINER);

        artifactContainers.forEach(container => {
            // Skip already processed containers
            if (container.querySelector('.artifact-edit-button')) {
                return;
            }

            this.addArtifactControls(container as HTMLElement);
        });
    }

    /**
     * Add controls to an artifact container (edit, copy, run buttons)
     */
    private addArtifactControls(container: HTMLElement): void {
        // Find the artifact title element to place our controls next to it
        const titleElement = container.querySelector(this.SELECTORS.ARTIFACT_TITLE);
        if (!titleElement) {
            return;
        }

        // Create controls container
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'artifact-controls';
        Object.assign(controlsContainer.style, {
            display: 'flex',
            gap: '8px',
            marginLeft: 'auto'
        });

        // Create edit button
        const editButton = this.createEditButton();
        controlsContainer.appendChild(editButton);

        // Create copy button
        const copyButton = this.createCopyButton();
        controlsContainer.appendChild(copyButton);

        // Create download button
        const downloadButton = this.createArtifactDownloadButton();
        controlsContainer.appendChild(downloadButton);

        // Create run button for code artifacts
        const isCodeArtifact = container.classList.contains('code-artifact') ||
            container.querySelector('pre code') !== null;

        if (isCodeArtifact) {
            const runButton = this.createRunButton();
            controlsContainer.appendChild(runButton);
        }

        // Add controls to the title element
        Object.assign(titleElement.style, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        });

        titleElement.appendChild(controlsContainer);

        // Store artifact data for later use
        this.storeArtifactData(container);
    }

    /**
     * Create an edit button for an artifact
     */
    private createEditButton(): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'artifact-edit-button';
        button.title = 'Edit this artifact';
        button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
      <span>Edit</span>
    `;

        // Add styling
        Object.assign(button.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            color: '#334155',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500'
        });

        // Add event listener
        button.addEventListener('click', (event) => {
            const artifactContainer = (event.target as HTMLElement)
                .closest(this.SELECTORS.ARTIFACT_CONTAINER) as HTMLElement;

            if (artifactContainer) {
                this.handleArtifactEdit(artifactContainer, button);
            }
        });

        return button;
    }

    /**
     * Create a copy button for an artifact
     */
    private createCopyButton(): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'artifact-copy-button';
        button.title = 'Copy this artifact';
        button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span>Copy</span>
    `;

        // Add styling
        Object.assign(button.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            color: '#334155',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500'
        });

        // Add event listener
        button.addEventListener('click', (event) => {
            const artifactContainer = (event.target as HTMLElement)
                .closest(this.SELECTORS.ARTIFACT_CONTAINER) as HTMLElement;

            if (artifactContainer) {
                this.handleArtifactCopy(artifactContainer, button);
            }
        });

        return button;
    }

    /**
     * Create a download button for an artifact
     */
    private createArtifactDownloadButton(): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'artifact-download-button';
        button.title = 'Download this artifact';
        button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span>Download</span>
    `;

        // Add styling
        Object.assign(button.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            color: '#334155',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500'
        });

        // Add event listener
        button.addEventListener('click', (event) => {
            const artifactContainer = (event.target as HTMLElement)
                .closest(this.SELECTORS.ARTIFACT_CONTAINER) as HTMLElement;

            if (artifactContainer) {
                this.handleArtifactDownload(artifactContainer);
            }
        });

        return button;
    }

    /**
     * Create a run button for code artifacts
     */
    private createRunButton(): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'artifact-run-button';
        button.title = 'Run this code';
        button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
      <span>Run</span>
    `;

        // Add styling
        Object.assign(button.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #d1fae5',
            backgroundColor: '#ecfdf5',
            color: '#065f46',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500'
        });

        // Add event listener
        button.addEventListener('click', (event) => {
            const artifactContainer = (event.target as HTMLElement)
                .closest(this.SELECTORS.ARTIFACT_CONTAINER) as HTMLElement;

            if (artifactContainer) {
                this.handleArtifactRun(artifactContainer);
            }
        });

        return button;
    }

    /**
     * Store artifact data for later reference
     */
    private storeArtifactData(container: HTMLElement): void {
        // Extract artifact metadata
        const titleElement = container.querySelector(this.SELECTORS.ARTIFACT_TITLE) as HTMLElement;
        const title = titleElement?.textContent?.trim() || 'Untitled Artifact';

        // Determine artifact type
        let artifactType = 'markdown';
        if (container.classList.contains('code-artifact') || container.querySelector('pre code')) {
            artifactType = 'code';
        } else if (container.querySelector('svg')) {
            artifactType = 'svg';
        } else if (container.querySelector('table')) {
            artifactType = 'table';
        }

        // Get language for code artifacts
        let language = '';
        const codeElement = container.querySelector('pre code');
        if (codeElement) {
            const classNames = Array.from(codeElement.classList);
            const langClass = classNames.find(cls => cls.startsWith('language-'));
            if (langClass) {
                language = langClass.replace('language-', '');
            }
        }

        // Store the data as a data attribute on the container
        container.dataset.artifactMetadata = JSON.stringify({
            title,
            type: artifactType,
            language,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Handle the download button click
     */
    private async handleDownloadClick(): Promise<void> {
        try {
            this.downloadButton?.setAttribute('disabled', 'true');
            this.downloadButton?.classList.add('loading');

            // Update button text
            const originalText = this.downloadButton?.innerHTML || '';
            this.downloadButton!.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path>
        </svg>
        <span>Processing...</span>
      `;

            // Extract artifacts from the DOM
            const artifacts = ArtifactExtractor.extractArtifactsFromDOM();

            if (artifacts.length === 0) {
                this.bannerService.showInfo('No artifacts found in this conversation');
                return;
            }

            // Get settings
            const settingsResponse = await this.messageService.sendMessage({
                action: 'getSettings'
            });

            const settings = settingsResponse.success
                ? settingsResponse.settings
                : null;

            // Request artifact download from background script
            const result = await this.messageService.sendMessage({
                action: 'downloadArtifacts',
                artifacts: artifacts.map(a => a.toObject()),
                options: {
                    stitchArtifacts: settings?.stitchArtifacts || false,
                    flatStructure: settings?.flatFileStructure || false
                }
            });

            if (result.success) {
                this.bannerService.showSuccess(`${result.count} artifacts downloaded successfully`);
            } else {
                this.bannerService.showError(result.error || 'Failed to download artifacts');
            }
        } catch (error) {
            this.logger.error('UiInjector: Download error', error);
            this.bannerService.showError('Failed to download artifacts');
        } finally {
            // Restore button state
            if (this.downloadButton) {
                this.downloadButton.removeAttribute('disabled');
                this.downloadButton.classList.remove('loading');
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
    private handleSettingsClick(): void {
        // Send message to show settings panel
        // This will be handled by a settings UI component
        this.bannerService.showInfo('Settings functionality coming soon');
    }

    /**
     * Handle artifact edit button click
     */
    private async handleArtifactEdit(container: HTMLElement, button: HTMLButtonElement): Promise<void> {
        try {
            const isEditMode = container.classList.contains('editing-mode');

            if (isEditMode) {
                // Save changes and exit edit mode
                await this.editorManager.saveChanges(container);
                button.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          <span>Edit</span>
        `;
            } else {
                // Enter edit mode
                await this.editorManager.createEditor(container);
                button.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          <span>Save</span>
        `;
            }
        } catch (error) {
            this.logger.error('UiInjector: Edit error', error);
            this.bannerService.showError('Failed to edit artifact');
        }
    }

    /**
     * Handle artifact copy button click
     */
    private handleArtifactCopy(container: HTMLElement, button: HTMLButtonElement): void {
        try {
            // Get content to copy
            let content = '';

            if (container.classList.contains('editing-mode')) {
                // Get from Monaco editor
                content = this.editorManager.getEditorContent(container) || '';
            } else {
                // Get from DOM
                const codeElement = container.querySelector('pre code');
                if (codeElement) {
                    content = codeElement.textContent || '';
                } else {
                    const preElement = container.querySelector('pre');
                    if (preElement) {
                        content = preElement.textContent || '';
                    } else {
                        content = container.textContent || '';
                    }
                }
            }

            // Copy to clipboard
            navigator.clipboard.writeText(content);

            // Update button temporarily
            const originalHTML = button.innerHTML;
            button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Copied!</span>
      `;

            // Reset button after delay
            setTimeout(() => {
                button.innerHTML = originalHTML;
            }, 2000);

            // Show notification
            this.bannerService.showSuccess('Copied to clipboard');
        } catch (error) {
            this.logger.error('UiInjector: Copy error', error);
            this.bannerService.showError('Failed to copy artifact');
        }
    }

    /**
     * Handle artifact download button click
     */
    private async handleArtifactDownload(container: HTMLElement): Promise<void> {
        try {
            // Extract the artifact data
            const artifactMetadata = JSON.parse(container.dataset.artifactMetadata || '{}');

            // Get content
            let content = '';
            if (container.classList.contains('editing-mode')) {
                content = this.editorManager.getEditorContent(container) || '';
            } else {
                // Get from DOM based on type
                if (artifactMetadata.type === 'svg') {
                    const svg = container.querySelector('svg');
                    content = svg?.outerHTML || '';
                } else if (artifactMetadata.type === 'code') {
                    const code = container.querySelector('pre code');
                    content = code?.textContent || '';
                } else {
                    // For other types, get text content
                    content = container.textContent || '';
                }
            }

            // Create artifact object
            const artifact = {
                id: `artifact-${Date.now()}`,
                title: artifactMetadata.title || 'Untitled',
                type: artifactMetadata.type || 'unknown',
                content,
                language: artifactMetadata.language,
                timestamp: new Date()
            };

            // Send to background script for download
            const result = await this.messageService.sendMessage({
                action: 'downloadSingleArtifact',
                artifact
            });

            if (result.success) {
                this.bannerService.showSuccess(`Downloaded ${result.filename}`);
            } else {
                this.bannerService.showError(result.error || 'Failed to download artifact');
            }
        } catch (error) {
            this.logger.error('UiInjector: Download error', error);
            this.bannerService.showError('Failed to download artifact');
        }
    }

    /**
     * Handle artifact run button click
     */
    private async handleArtifactRun(container: HTMLElement): Promise<void> {
        // This will be implemented when we add the compiler service
        this.bannerService.showInfo('Run functionality coming soon');
    }

    /**
     * Inject the stylesheet for custom UI elements
     */
    private injectStylesheet(): void {
        const style = document.createElement('style');
        style.id = 'claude-artifacts-styles';
        style.textContent = `
      .claude-artifact-buttons button:focus-visible {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      .artifact-controls button:focus-visible {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      .editing-mode {
        position: relative;
      }
      
      .monaco-editor {
        min-height: 100px;
        border-radius: 4px;
        overflow: hidden;
      }
      
      .compilation-output::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      .compilation-output::-webkit-scrollbar-track {
        background: #f1f5f9;
      }
      
      .compilation-output::-webkit-scrollbar-thumb {
        background-color: #cbd5e1;
        border-radius: 4px;
      }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      .animate-spin {
        animation: spin 1s linear infinite;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .artifact-notification {
        animation: fadeIn 0.3s ease-out forwards;
      }
    `;

        document.head.appendChild(style);
    }

    /**
     * Remove injected UI elements
     */
    private removeInjectedElements(): void {
        // Remove buttons
        document.querySelector('.claude-artifact-buttons')?.remove();

        // Remove styles
        document.getElementById('claude-artifacts-styles')?.remove();

        // Restore artifact containers
        document.querySelectorAll('.editing-mode').forEach(editor => {
            this.editorManager.removeEditor(editor as HTMLElement);
        });

        // Remove compilation outputs
        document.querySelectorAll('.compilation-output').forEach(output => {
            output.remove();
        });

        // Reset state
        this.downloadButton = null;
        this.settingsButton = null;
        this.headerContainer = null;
    }
}
