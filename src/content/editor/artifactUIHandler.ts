import {LoggerService} from '../../shared/services/loggerService';
import {BannerService} from '../ui/bannerService';
import {EditorManager} from './editorManager';
import {CompilerService} from './compilerService';

/**
 * Handler for artifact UI interactions
 */
export class ArtifactUIHandler {
    private static instance: ArtifactUIHandler;
    private readonly logger = LoggerService.getInstance();
    private readonly bannerService = BannerService.getInstance();
    private readonly editorManager = EditorManager.getInstance();
    private readonly compilerService = CompilerService.getInstance();

    private observer: MutationObserver | null = null;

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Get the singleton instance of the artifact UI handler
     */
    public static getInstance(): ArtifactUIHandler {
        if (!ArtifactUIHandler.instance) {
            ArtifactUIHandler.instance = new ArtifactUIHandler();
        }
        return ArtifactUIHandler.instance;
    }

    /**
     * Initialize the artifact UI handler
     */
    public init(): void {
        this.startObserver();
        this.logger.debug('ArtifactUIHandler: Initialized');
    }

    /**
     * Start the mutation observer to watch for new artifacts
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

        // Process existing artifacts
        this.processExistingArtifacts();
    }

    /**
     * Handle DOM mutations
     */
    private handleDomMutations(mutations: MutationRecord[]): void {
        // Only process if we have new nodes added
        const hasNewNodes = mutations.some(mutation =>
            mutation.type === 'childList' && mutation.addedNodes.length > 0);

        if (hasNewNodes) {
            // Look for new artifacts
            const addedArtifacts = mutations
                .filter(mutation => mutation.type === 'childList' && mutation.addedNodes.length > 0)
                .reduce((nodes: HTMLElement[], mutation) => {
                    mutation.addedNodes.forEach(node => {
                        if (node instanceof HTMLElement) {
                            // Check if this is an artifact container
                            if (node.classList.contains('antml-artifact-container')) {
                                nodes.push(node);
                            } else {
                                // Check for artifact containers within this node
                                const containers = node.querySelectorAll('.antml-artifact-container');
                                containers.forEach(container => nodes.push(container as HTMLElement));
                            }
                        }
                    });
                    return nodes;
                }, []);

            // Process any new artifacts found
            if (addedArtifacts.length > 0) {
                this.processNewArtifacts(addedArtifacts);
            }
        }
    }

    /**
     * Process existing artifacts in the DOM
     */
    private processExistingArtifacts(): void {
        const artifacts = document.querySelectorAll('.antml-artifact-container');

        if (artifacts.length > 0) {
            this.logger.debug(`ArtifactUIHandler: Found ${artifacts.length} existing artifacts`);
            this.processNewArtifacts(Array.from(artifacts) as HTMLElement[]);
        }
    }

    /**
     * Process new artifacts
     */
    private processNewArtifacts(artifacts: HTMLElement[]): void {
        artifacts.forEach(artifact => {
            // Skip already processed artifacts
            if (artifact.querySelector('.artifact-controls')) {
                return;
            }

            this.enhanceArtifact(artifact);
        });
    }

    /**
     * Enhance an artifact with additional controls
     */
    private enhanceArtifact(container: HTMLElement): void {
        try {
            // Find the title element to add controls next to
            const titleElement = container.querySelector('.antml-artifact-title');
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

            // Add edit button
            const editButton = this.createEditButton();
            controlsContainer.appendChild(editButton);

            // Add copy button
            const copyButton = this.createCopyButton();
            controlsContainer.appendChild(copyButton);

            // Add run button for code artifacts
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

            // Store artifact data
            this.storeArtifactData(container);

            this.logger.debug('ArtifactUIHandler: Enhanced artifact', container);
        } catch (error) {
            this.logger.error('ArtifactUIHandler: Error enhancing artifact', error);
        }
    }

    /**
     * Create an edit button
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
                .closest('.antml-artifact-container') as HTMLElement;

            if (artifactContainer) {
                this.handleArtifactEdit(artifactContainer, button);
            }
        });

        return button;
    }

    /**
     * Create a copy button
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
                .closest('.antml-artifact-container') as HTMLElement;

            if (artifactContainer) {
                this.handleArtifactCopy(artifactContainer, button);
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
                .closest('.antml-artifact-container') as HTMLElement;

            if (artifactContainer) {
                this.handleArtifactRun(artifactContainer);
            }
        });

        return button;
    }

    /**
     * Store artifact data
     */
    private storeArtifactData(container: HTMLElement): void {
        // Extract metadata
        const titleElement = container.querySelector('.antml-artifact-title') as HTMLElement;
        const title = titleElement?.textContent?.trim() || 'Untitled';

        // Determine artifact type
        let type = 'text';
        if (container.classList.contains('code-artifact') || container.querySelector('pre code')) {
            type = 'code';
        } else if (container.querySelector('svg')) {
            type = 'svg';
        } else if (container.querySelector('table')) {
            type = 'table';
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

        // Store as data attribute
        container.dataset.artifactMetadata = JSON.stringify({
            title,
            type,
            language,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Handle edit button click
     */
    private async handleArtifactEdit(container: HTMLElement, button: HTMLButtonElement): Promise<void> {
        try {
            const isEditMode = container.classList.contains('editing-mode');

            if (isEditMode) {
                // Save changes
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
            this.logger.error('ArtifactUIHandler: Edit error', error);
            this.bannerService.showError('Failed to edit artifact');
        }
    }

    /**
     * Handle copy button click
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
            this.logger.error('ArtifactUIHandler: Copy error', error);
            this.bannerService.showError('Failed to copy artifact');
        }
    }

    /**
     * Handle run button click
     */
    private async handleArtifactRun(container: HTMLElement): Promise<void> {
        try {
            // Get metadata
            const metadata = this.extractArtifactMetadata(container);

            if (!metadata || metadata.type !== 'code') {
                this.bannerService.showError('Can only run code artifacts');
                return;
            }

            // Get code content
            let code: string;

            if (container.classList.contains('editing-mode')) {
                // Get from Monaco editor
                code = this.editorManager.getEditorContent(container) || '';
            } else {
                // Get from pre element
                const codeElement = container.querySelector('pre code');
                code = codeElement?.textContent || '';
            }

            if (!code.trim()) {
                this.bannerService.showError('No code to run');
                return;
            }

            // Show compiling message
            this.bannerService.showInfo('Compiling code...');

            // Run the code
            const result = await this.compilerService.compileAndRun(code, metadata.language || 'javascript');

            // Display result
            this.displayCompilationResult(container, result);
        } catch (error) {
            this.logger.error('ArtifactUIHandler: Run error', error);
            this.bannerService.showError('Failed to run code');
        }
    }

    /**
     * Extract artifact metadata
     */
    private extractArtifactMetadata(container: HTMLElement): any {
        try {
            const metadataStr = container.dataset.artifactMetadata;
            if (metadataStr) {
                return JSON.parse(metadataStr);
            }
        } catch (error) {
            this.logger.error('ArtifactUIHandler: Failed to parse metadata', error);
        }
        return null;
    }

    /**
     * Display compilation result
     */
    private displayCompilationResult(container: HTMLElement, result: any): void {
        // Check if output container already exists
        let outputContainer = container.querySelector('.compilation-output');

        if (!outputContainer) {
            // Create new output container
            outputContainer = document.createElement('div');
            outputContainer.className = 'compilation-output';
            Object.assign(outputContainer.style, {
                marginTop: '12px',
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '4px',
                border: '1px solid #e2e8f0',
                maxHeight: '300px',
                overflow: 'auto',
                fontSize: '14px',
                fontFamily: 'monospace'
            });

            container.appendChild(outputContainer);
        }

        // Clear previous content
        outputContainer.innerHTML = '';

        // Add header
        const header = document.createElement('div');
        header.style.fontWeight = 'bold';
        header.style.marginBottom = '8px';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.innerHTML = `
      <span>Execution Results</span>
      <span class="close-output" style="cursor:pointer">×</span>
    `;
        outputContainer.appendChild(header);

        // Add close button handler
        header.querySelector('.close-output')?.addEventListener('click', () => {
            outputContainer?.remove();
        });

        // Add content based on result type
        if (result.error) {
            const errorDiv = document.createElement('div');
            errorDiv.style.color = '#ef4444';
            errorDiv.textContent = result.error;
            outputContainer.appendChild(errorDiv);
        } else {
            // Create content based on result type
            if (typeof result.output === 'string') {
                const outputPre = document.createElement('pre');
                outputPre.style.margin = '0';
                outputPre.style.whiteSpace = 'pre-wrap';
                outputPre.textContent = result.output;
                outputContainer.appendChild(outputPre);
            } else {
                try {
                    const outputPre = document.createElement('pre');
                    outputPre.style.margin = '0';
                    outputPre.style.whiteSpace = 'pre-wrap';
                    outputPre.textContent = JSON.stringify(result.output, null, 2);
                    outputContainer.appendChild(outputPre);
                } catch (e) {
                    const outputDiv = document.createElement('div');
                    outputDiv.textContent = 'Complex output (cannot display)';
                    outputContainer.appendChild(outputDiv);
                }
            }
        }
    }

    /**
     * Destroy the artifact UI handler
     */
    public destroy(): void {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        this.logger.debug('ArtifactUIHandler: Destroyed');
    }
}
