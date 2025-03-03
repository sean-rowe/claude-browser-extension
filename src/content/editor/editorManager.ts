import { MonacoService } from './monacoService';
import { LoggerService } from '../../shared/services/loggerService';
import { BannerService } from '../ui/bannerService';
import { StorageService } from '../../shared/services/storageService';
import { ArtifactSettings } from '../../shared/models/settings';

/**
 * Manages Monaco editors for artifacts
 */
export class EditorManager {
    private static instance: EditorManager;
    private readonly logger = LoggerService.getInstance();
    private readonly bannerService = BannerService.getInstance();
    private readonly storageService = StorageService.getInstance();
    private readonly monacoService = MonacoService.getInstance();

    // Map of artifact container elements to their editor instances
    private editorMap = new Map<HTMLElement, monaco.editor.IStandaloneCodeEditor>();
    private settings: ArtifactSettings | null = null;

    private constructor() {
        this.loadSettings();
    }

    /**
     * Get the singleton instance of the editor manager
     */
    public static getInstance(): EditorManager {
        if (!EditorManager.instance) {
            EditorManager.instance = new EditorManager();
        }
        return EditorManager.instance;
    }

    /**
     * Load settings from storage
     */
    private async loadSettings(): Promise<void> {
        try {
            this.settings = (await this.storageService.getSettings()).toObject();
        } catch (error) {
            this.logger.error('EditorManager: Failed to load settings', error);
        }
    }

    /**
     * Create a Monaco editor for an artifact container
     */
    public async createEditor(container: HTMLElement): Promise<monaco.editor.IStandaloneCodeEditor | null> {
        if (!container) {
            this.logger.error('EditorManager: Container element is required');
            return null;
        }

        // Check if an editor already exists for this container
        if (this.editorMap.has(container)) {
            this.logger.debug('EditorManager: Editor already exists for this container');
            return this.editorMap.get(container) ?? null;
        }

        try {
            // Reload settings to ensure we have the latest
            await this.loadSettings();

            // Extract artifact metadata
            const metadata = this.extractArtifactMetadata(container);

            // Get the content to edit
            const content = this.extractArtifactContent(container);

            // Determine language from metadata or try to detect it
            const language = metadata?.language || this.detectLanguage(container, content);

            // Create editor container element
            const editorContainer = document.createElement('div');
            editorContainer.className = 'monaco-editor-container';
            Object.assign(editorContainer.style, {
                width: '100%',
                height: '300px',
                minHeight: '100px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                overflow: 'hidden',
                marginTop: '8px'
            });

            // Find where to insert the editor
            const codeElement = container.querySelector('pre');
            if (codeElement) {
                // Hide the original code element
                codeElement.style.display = 'none';

                // Insert editor after the code element
                codeElement.parentNode?.insertBefore(editorContainer, codeElement.nextSibling);
            } else {
                // No code element found, append to container
                container.appendChild(editorContainer);
            }

            // Ensure Monaco is loaded
            await this.monacoService.ensureMonacoLoaded();

            // Create editor with settings
            const editor = this.monacoService.createEditor(editorContainer, {
                value: content,
                language: language,
                theme: this.settings?.editorSettings.theme || 'vs',
                automaticLayout: true,
                minimap: {
                    enabled: this.settings?.editorSettings.minimap || true
                },
                lineNumbers: this.settings?.editorSettings.lineNumbers || 'on',
                wordWrap: this.settings?.editorSettings.wordWrap || 'on',
                fontSize: this.settings?.editorSettings.fontSize || 14,
                tabSize: this.settings?.editorSettings.tabSize || 2,
                insertSpaces: this.settings?.editorSettings.insertSpaces || true,
                folding: this.settings?.editorSettings.folding || true,
                scrollBeyondLastLine: false,
                roundedSelection: true,
                renderWhitespace: 'none',
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                renderLineHighlight: 'all'
            });

            // Mark container as in editing mode
            container.classList.add('editing-mode');

            // Store editor reference
            this.editorMap.set(container, editor);

            // Add resize handle
            this.addResizeHandle(editorContainer, editor);

            // Update layout after a brief delay to ensure proper sizing
            setTimeout(() => {
                editor.layout();
                editor.focus();
            }, 100);

            this.logger.info(`EditorManager: Created editor for language ${language}`);
            return editor;
        } catch (error) {
            this.logger.error('EditorManager: Failed to create editor', error);
            this.bannerService.showError('Failed to create editor');
            return null;
        }
    }

    /**
     * Extract content from an artifact container
     */
    private extractArtifactContent(container: HTMLElement): string {
        // Try to find a code element first
        const codeElement = container.querySelector('pre code');
        if (codeElement) {
            return codeElement.textContent || '';
        }

        // Try pre element next
        const preElement = container.querySelector('pre');
        if (preElement) {
            return preElement.textContent || '';
        }

        // For SVGs, get the innerHTML of the SVG element
        const svgElement = container.querySelector('svg');
        if (svgElement) {
            return svgElement.outerHTML || '';
        }

        // For other types, get all text content
        return container.textContent || '';
    }

    /**
     * Extract metadata from an artifact container
     */
    private extractArtifactMetadata(container: HTMLElement): any {
        try {
            const metadataStr = container.dataset.artifactMetadata;
            if (metadataStr) {
                return JSON.parse(metadataStr);
            }
        } catch (error) {
            this.logger.error('EditorManager: Failed to parse artifact metadata', error);
        }
        return null;
    }

    /**
     * Detect the language from container classes or content
     */
    private detectLanguage(container: HTMLElement, content: string): string {
        // Check for code element with language class
        const codeElement = container.querySelector('pre code');
        if (codeElement) {
            const classNames = Array.from(codeElement.classList);
            const langClass = classNames.find(cls => cls.startsWith('language-'));
            if (langClass) {
                return langClass.replace('language-', '');
            }
        }

        // Check container classes
        if (container.classList.contains('code-artifact')) {
            // Try to extract language from class
            const classNames = Array.from(container.classList);
            const langClass = classNames.find(cls => cls.startsWith('language-'));
            if (langClass) {
                return langClass.replace('language-', '');
            }
        }

        // Check for SVG
        if (container.querySelector('svg') || content.trim().startsWith('<svg')) {
            return 'xml';
        }

        // Detect from content
        if (content.includes('function') || content.includes('const') || content.includes('var')) {
            return 'javascript';
        }

        if (content.includes('import ') && content.includes('from ')) {
            return 'typescript';
        }

        if (content.includes('def ') && content.includes(':')) {
            return 'python';
        }

        if (content.includes('<html>') || content.includes('<!DOCTYPE html>')) {
            return 'html';
        }

        if (content.includes('<style>') || content.includes('{') && content.includes('}')) {
            return 'css';
        }

        // Default to text
        return 'plaintext';
    }

    /**
     * Add a resize handle to the editor container
     */
    private addResizeHandle(editorContainer: HTMLElement, editor: monaco.editor.IStandaloneCodeEditor): void {
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'editor-resize-handle';
        Object.assign(resizeHandle.style, {
            height: '6px',
            background: '#e2e8f0',
            cursor: 'ns-resize',
            width: '100%',
            position: 'absolute',
            bottom: '0',
            left: '0',
            zIndex: '10'
        });

        editorContainer.appendChild(resizeHandle);
        editorContainer.style.position = 'relative';

        let startY = 0;
        let startHeight = 0;

        const onMouseDown = (e: MouseEvent) => {
            startY = e.clientY;
            startHeight = editorContainer.offsetHeight;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);

            e.preventDefault();
        };

        const onMouseMove = (e: MouseEvent) => {
            const newHeight = startHeight + (e.clientY - startY);
            if (newHeight >= 100) {
                editorContainer.style.height = `${newHeight}px`;
                editor.layout();
            }
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        resizeHandle.addEventListener('mousedown', onMouseDown);
    }

    /**
     * Save changes from the editor back to the artifact
     */
    public async saveChanges(container: HTMLElement): Promise<boolean> {
        const editor = this.editorMap.get(container);
        if (!editor) {
            this.logger.error('EditorManager: No editor found for this container');
            return false;
        }

        try {
            // Get updated content from editor
            const updatedContent = editor.getValue();

            // Find the original content element
            const preElement = container.querySelector('pre');
            const codeElement = container.querySelector('pre code');

            if (codeElement) {
                // Update code element content
                codeElement.textContent = updatedContent;
                // Show the original code element again
                if (preElement) {
                    preElement.style.display = '';
                }
            } else if (container.querySelector('svg')) {
                // Update SVG content - this is more complex
                try {
                    const svgContainer = container.querySelector('svg')?.parentElement;
                    if (svgContainer) {
                        svgContainer.innerHTML = updatedContent;
                    }
                } catch (e) {
                    this.logger.error('EditorManager: Failed to update SVG content', e);
                    this.bannerService.showError('Failed to update SVG: Invalid SVG syntax');
                    return false;
                }
            } else if (preElement) {
                // Update pre element content
                preElement.textContent = updatedContent;
                preElement.style.display = '';
            } else {
                // No suitable element found to update
                this.logger.warn('EditorManager: No suitable element found to update');
                this.bannerService.showWarning('Could not find element to update');
                return false;
            }

            // Remove editor
            this.removeEditor(container);

            // Show success message
            this.bannerService.showSuccess('Changes saved successfully');
            return true;
        } catch (error) {
            this.logger.error('EditorManager: Failed to save changes', error);
            this.bannerService.showError('Failed to save changes');
            return false;
        }
    }

    /**
     * Remove an editor from a container
     */
    public removeEditor(container: HTMLElement): void {
        const editor = this.editorMap.get(container);
        if (editor) {
            // Dispose of the editor
            editor.dispose();
            this.editorMap.delete(container);

            // Remove editor container
            const editorContainer = container.querySelector('.monaco-editor-container');
            editorContainer?.remove();

            // Remove editing mode class
            container.classList.remove('editing-mode');

            // Show any hidden elements
            container.querySelectorAll('pre').forEach(pre => {
                pre.style.display = '';
            });

            this.logger.debug('EditorManager: Removed editor');
        }
    }

    /**
     * Get the content of an editor
     */
    public getEditorContent(container: HTMLElement): string | null {
        const editor = this.editorMap.get(container);
        if (editor) {
            return editor.getValue();
        }
        return null;
    }

    /**
     * Dispose all editors
     */
    public disposeAll(): void {
        this.editorMap.forEach((editor, container) => {
            this.removeEditor(container);
        });
        this.editorMap.clear();
        this.logger.info('EditorManager: Disposed all editors');
    }
}
