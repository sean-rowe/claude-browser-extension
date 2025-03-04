import { LoggerService } from '../shared/services/loggerService';
import { MessageService } from '../content/events/messageService';
import { BannerService } from '../content/ui/bannerService';
import { ArtifactState } from '../shared/models/artifact';
import { ArtifactExtractor } from '../shared/utils/artifactExtractor';

/**
 * Popup UI for artifact selection and management
 */
export class ArtifactPopup {
    private static instance: ArtifactPopup;
    private readonly logger = LoggerService.getInstance();
    private readonly messageService = MessageService.getInstance();
    private readonly bannerService = BannerService.getInstance();

    private popupElement: HTMLElement | null = null;
    private artifactList: ArtifactState[] = [];
    private selectedArtifacts: Set<string> = new Set();
    private isVisible = false;

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Get the singleton instance of the artifact popup
     */
    public static getInstance(): ArtifactPopup {
        if (!ArtifactPopup.instance) {
            ArtifactPopup.instance = new ArtifactPopup();
        }
        return ArtifactPopup.instance;
    }

    /**
     * Initialize the popup component
     */
    public async init(): Promise<void> {
        try {
            // Register message handler
            this.messageService.registerHandler('showArtifactPopup', this.handleShowPopup.bind(this));

            this.logger.debug('ArtifactPopup: Initialized');
        } catch (error) {
            this.logger.error('ArtifactPopup: Initialization error', error);
        }
    }

    /**
     * Show the artifact popup
     */
    public async show(): Promise<void> {
        if (this.isVisible) return;

        try {
            // Extract artifacts from the DOM
            this.artifactList = ArtifactExtractor.extractArtifactsFromDOM();

            if (this.artifactList.length === 0) {
                this.bannerService.showInfo('No artifacts found in this conversation');
                return;
            }

            // Create popup if it doesn't exist
            if (!this.popupElement) {
                this.createPopup();
            }

            // Update list of artifacts
            this.updateArtifactList();

            // Show popup
            document.body.appendChild(this.popupElement!);

            // Add animation
            setTimeout(() => {
                if (this.popupElement) {
                    this.popupElement.style.opacity = '1';
                    this.popupElement.style.transform = 'translate(-50%, -50%) scale(1)';
                }
            }, 10);

            this.isVisible = true;
        } catch (error) {
            this.logger.error('ArtifactPopup: Error showing popup', error);
            this.bannerService.showError('Failed to show artifact popup');
        }
    }

    /**
     * Hide the artifact popup
     */
    public hide(): void {
        if (!this.isVisible || !this.popupElement) return;

        // Add animation
        this.popupElement.style.opacity = '0';
        this.popupElement.style.transform = 'translate(-50%, -50%) scale(0.9)';

        // Remove after animation
        setTimeout(() => {
            if (this.popupElement && this.popupElement.parentNode) {
                this.popupElement.parentNode.removeChild(this.popupElement);
            }
            this.isVisible = false;
        }, 300);
    }

    /**
     * Create the popup UI
     */
    private createPopup(): void {
        // Create popup container
        const popup = document.createElement('div');
        popup.className = 'claude-artifacts-popup';
        popup.setAttribute('role', 'dialog');
        popup.setAttribute('aria-labelledby', 'popup-title');

        // Style popup
        Object.assign(popup.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) scale(0.9)',
            width: '600px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            zIndex: '10000',
            display: 'flex',
            flexDirection: 'column',
            opacity: '0',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            overflow: 'hidden'
        });

        // Add header
        const header = document.createElement('div');
        Object.assign(header.style, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0'
        });

        const title = document.createElement('h2');
        title.id = 'popup-title';
        title.textContent = 'Download Artifacts';
        Object.assign(title.style, {
            margin: '0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#1e293b'
        });

        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.title = 'Close';
        Object.assign(closeButton.style, {
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '0',
            color: '#64748b',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });

        closeButton.addEventListener('click', () => {
            this.hide();
        });

        header.appendChild(title);
        header.appendChild(closeButton);
        popup.appendChild(header);

        // Add content area
        const content = document.createElement('div');
        content.className = 'popup-content';
        Object.assign(content.style, {
            flex: '1',
            overflow: 'auto',
            padding: '20px'
        });

        // Add artifact list container
        const listContainer = document.createElement('div');
        listContainer.className = 'artifact-list';
        content.appendChild(listContainer);

        popup.appendChild(content);

        // Add footer with actions
        const footer = document.createElement('div');
        Object.assign(footer.style, {
            padding: '16px 20px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        });

        const selectAllContainer = document.createElement('div');

        const selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';
        selectAllCheckbox.id = 'select-all-artifacts';

        const selectAllLabel = document.createElement('label');
        selectAllLabel.htmlFor = 'select-all-artifacts';
        selectAllLabel.textContent = 'Select all';
        selectAllLabel.style.marginLeft = '8px';

        selectAllCheckbox.addEventListener('change', () => {
            const isChecked = selectAllCheckbox.checked;
            this.selectAll(isChecked);
        });

        selectAllContainer.appendChild(selectAllCheckbox);
        selectAllContainer.appendChild(selectAllLabel);

        const actionsContainer = document.createElement('div');
        Object.assign(actionsContainer.style, {
            display: 'flex',
            gap: '8px'
        });

        // Add download selected button
        const downloadButton = document.createElement('button');
        downloadButton.textContent = 'Download Selected';
        downloadButton.disabled = true;
        Object.assign(downloadButton.style, {
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
            opacity: '0.5'
        });

        downloadButton.addEventListener('click', () => {
            this.downloadSelected();
        });

        // Add stitch and download button
        const stitchButton = document.createElement('button');
        stitchButton.textContent = 'Stitch & Download';
        stitchButton.disabled = true;
        Object.assign(stitchButton.style, {
            padding: '8px 16px',
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
            opacity: '0.5'
        });

        stitchButton.addEventListener('click', () => {
            this.stitchAndDownload();
        });

        // Add event listener to update button state
        const updateButtonState = () => {
            const hasSelection = this.selectedArtifacts.size > 0;
            downloadButton.disabled = !hasSelection;
            stitchButton.disabled = !hasSelection || this.selectedArtifacts.size < 2;

            downloadButton.style.opacity = hasSelection ? '1' : '0.5';
            stitchButton.style.opacity = (hasSelection && this.selectedArtifacts.size >= 2) ? '1' : '0.5';
        };

        // Store update function for later use
        (this as any).updateButtonState = updateButtonState;

        actionsContainer.appendChild(stitchButton);
        actionsContainer.appendChild(downloadButton);

        footer.appendChild(selectAllContainer);
        footer.appendChild(actionsContainer);

        popup.appendChild(footer);

        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'popup-backdrop';
        Object.assign(backdrop.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: '9999',
            opacity: '0',
            transition: 'opacity 0.3s ease'
        });

        setTimeout(() => {
            backdrop.style.opacity = '1';
        }, 10);

        backdrop.addEventListener('click', () => {
            this.hide();
        });

        // Store references
        this.popupElement = popup;

        // Add elements to the DOM
        document.body.appendChild(backdrop);
    }

    /**
     * Update the list of artifacts in the popup
     */
    private updateArtifactList(): void {
        if (!this.popupElement) return;

        const listContainer = this.popupElement.querySelector('.artifact-list');
        if (!listContainer) return;

        // Clear existing list
        listContainer.innerHTML = '';

        // Add each artifact
        this.artifactList.forEach((artifact, index) => {
            const item = document.createElement('div');
            item.className = 'artifact-item';
            Object.assign(item.style, {
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white'
            });

            // Add checkbox for selection
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `artifact-${artifact.id}`;
            checkbox.className = 'artifact-checkbox';
            checkbox.checked = this.selectedArtifacts.has(artifact.id);
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    this.selectedArtifacts.add(artifact.id);
                } else {
                    this.selectedArtifacts.delete(artifact.id);
                }

                // Update select all checkbox
                const selectAllCheckbox = document.getElementById('select-all-artifacts') as HTMLInputElement;
                if (selectAllCheckbox) {
                    selectAllCheckbox.checked = this.selectedArtifacts.size === this.artifactList.length;
                }

                // Update button states
                (this as any).updateButtonState();
            });

            // Add artifact info
            const info = document.createElement('div');
            info.className = 'artifact-info';
            Object.assign(info.style, {
                marginLeft: '12px',
                flex: '1'
            });

            const title = document.createElement('div');
            title.className = 'artifact-title';
            title.textContent = artifact.title;
            Object.assign(title.style, {
                fontWeight: '600',
                color: '#1e293b'
            });

            const type = document.createElement('div');
            type.className = 'artifact-type';
            type.textContent = `Type: ${artifact.type}${artifact.language ? ` (${artifact.language})` : ''}`;
            Object.assign(type.style, {
                fontSize: '14px',
                color: '#64748b'
            });

            info.appendChild(title);
            info.appendChild(type);

            // Add download button
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'artifact-download-btn';
            downloadBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
            `;
            downloadBtn.title = 'Download';
            Object.assign(downloadBtn.style, {
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '4px',
                color: '#3b82f6'
            });

            downloadBtn.addEventListener('click', () => {
                this.downloadSingle(artifact);
            });

            // Add to item
            item.appendChild(checkbox);
            item.appendChild(info);
            item.appendChild(downloadBtn);

            // Add to list
            listContainer.appendChild(item);
        });
    }

    /**
     * Select or deselect all artifacts
     */
    private selectAll(select: boolean): void {
        // Clear or fill selected set
        this.selectedArtifacts.clear();

        if (select) {
            this.artifactList.forEach(artifact => {
                this.selectedArtifacts.add(artifact.id);
            });
        }

        // Update all checkboxes
        const checkboxes = document.querySelectorAll('.artifact-checkbox') as NodeListOf<HTMLInputElement>;
        checkboxes.forEach(checkbox => {
            checkbox.checked = select;
        });

        // Update button states
        (this as any).updateButtonState();
    }

    /**
     * Download a single artifact
     */
    private async downloadSingle(artifact: ArtifactState): Promise<void> {
        try {
            const response = await this.messageService.sendMessage({
                action: 'downloadSingleArtifact',
                artifact: artifact.toObject()
            });

            if (response.success) {
                this.bannerService.showSuccess(`Downloaded: ${response.data.filename}`);
            } else {
                throw new Error(response.error || 'Failed to download artifact');
            }
        } catch (error) {
            this.logger.error('ArtifactPopup: Error downloading single artifact', error);
            this.bannerService.showError('Failed to download artifact');
        }
    }

    /**
     * Download selected artifacts
     */
    private async downloadSelected(): Promise<void> {
        try {
            if (this.selectedArtifacts.size === 0) {
                this.bannerService.showInfo('No artifacts selected');
                return;
            }

            // Filter artifacts to only selected ones
            const selectedArtifacts = this.artifactList.filter(artifact =>
                this.selectedArtifacts.has(artifact.id)
            );

            // Get settings
            const response = await this.messageService.sendMessage({ action: 'getSettings' });
            const settings = response.success ? response.data : null;

            // Download artifacts
            const result = await this.messageService.sendMessage({
                action: 'downloadArtifacts',
                artifacts: selectedArtifacts.map(a => a.toObject()),
                options: {
                    stitchArtifacts: false,
                    flatStructure: settings?.flatFileStructure || false
                }
            });

            if (result.success) {
                this.bannerService.showSuccess(`Downloaded ${result.data.count} artifacts successfully`);
                this.hide();
            } else {
                throw new Error(result.error || 'Failed to download artifacts');
            }
        } catch (error) {
            this.logger.error('ArtifactPopup: Error downloading selected artifacts', error);
            this.bannerService.showError('Failed to download artifacts');
        }
    }

    /**
     * Stitch and download selected artifacts
     * This uses the currently unused methods in ArtifactService
     */
    private async stitchAndDownload(): Promise<void> {
        try {
            if (this.selectedArtifacts.size < 2) {
                this.bannerService.showInfo('Select at least 2 artifacts to stitch');
                return;
            }

            // Filter artifacts to only selected ones
            const selectedArtifacts = this.artifactList.filter(artifact =>
                this.selectedArtifacts.has(artifact.id)
            );

            // Get settings
            const response = await this.messageService.sendMessage({ action: 'getSettings' });
            const settings = response.success ? response.data : null;

            // Download artifacts with stitching enabled
            const result = await this.messageService.sendMessage({
                action: 'downloadArtifacts',
                artifacts: selectedArtifacts.map(a => a.toObject()),
                options: {
                    stitchArtifacts: true,
                    flatStructure: settings?.flatFileStructure || false
                }
            });

            if (result.success) {
                this.bannerService.showSuccess(`Stitched and downloaded ${result.data.count} artifact(s) successfully`);
                this.hide();
            } else {
                throw new Error(result.error || 'Failed to stitch and download artifacts');
            }
        } catch (error) {
            this.logger.error('ArtifactPopup: Error stitching artifacts', error);
            this.bannerService.showError('Failed to stitch and download artifacts');
        }
    }

    /**
     * Handle show popup message
     */
    private async handleShowPopup(): Promise<boolean> {
        await this.show();
        return true;
    }

    /**
     * Destroy the popup component
     */
    public destroy(): void {
        this.hide();
        this.popupElement = null;
        this.artifactList = [];
        this.selectedArtifacts.clear();
        this.logger.debug('ArtifactPopup: Destroyed');
    }
}
