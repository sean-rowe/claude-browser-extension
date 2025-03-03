import { LoggerService } from '../../shared/services/loggerService';

/**
 * Service for managing Monaco editor instances
 */
export class MonacoEditorService {
    private static instance: MonacoEditorService;
    private readonly logger = LoggerService.getInstance();
    private isMonacoLoaded = false;
    private loadPromise: Promise<void> | null = null;

    // CDN URL for Monaco editor
    private readonly MONACO_CDN_BASE = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.40.0/min';

    // List of editors created by this service
    private editors: monaco.editor.IStandaloneCodeEditor[] = [];

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Get the singleton instance of the Monaco editor service
     */
    public static getInstance(): MonacoEditorService {
        if (!MonacoEditorService.instance) {
            MonacoEditorService.instance = new MonacoEditorService();
        }
        return MonacoEditorService.instance;
    }

    /**
     * Ensure Monaco editor is loaded
     */
    public ensureMonacoLoaded(): Promise<void> {
        if (this.isMonacoLoaded) {
            return Promise.resolve();
        }

        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = this.loadMonaco();
        return this.loadPromise;
    }

    /**
     * Load Monaco editor from CDN
     */
    private async loadMonaco(): Promise<void> {
        this.logger.debug('MonacoEditorService: Loading Monaco editor from CDN');

        try {
            // Add Monaco loader script
            await this.loadScript(`${this.MONACO_CDN_BASE}/vs/loader.js`);

            // Configure AMD loader for Monaco
            (window as any).require.config({
                paths: {
                    vs: `${this.MONACO_CDN_BASE}/vs`
                }
            });

            // Load Monaco editor
            return new Promise<void>((resolve, reject) => {
                try {
                    (window as any).require(['vs/editor/editor.main'], () => {
                        this.isMonacoLoaded = true;
                        this.logger.info('MonacoEditorService: Monaco editor loaded successfully');
                        resolve();
                    });
                } catch (error) {
                    reject(error);
                }
            });
        } catch (error) {
            this.logger.error('MonacoEditorService: Failed to load Monaco editor', error);
            this.loadPromise = null;
            throw error;
        }
    }

    /**
     * Load a script from URL
     */
    private loadScript(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => resolve();
            script.onerror = (e) => reject(new Error(`Failed to load script: ${url}`));
            document.head.appendChild(script);
        });
    }

    /**
     * Create a Monaco editor instance
     */
    public createEditor(
        container: HTMLElement,
        options: monaco.editor.IStandaloneEditorConstructionOptions
    ): monaco.editor.IStandaloneCodeEditor {
        if (!this.isMonacoLoaded) {
            throw new Error('Monaco editor not loaded. Call ensureMonacoLoaded() first.');
        }

        const defaultOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
            minimap: { enabled: true },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            theme: 'vs',
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true
        };

        const editorOptions = { ...defaultOptions, ...options };
        const editor = monaco.editor.create(container, editorOptions);

        // Store editor reference for cleanup
        this.editors.push(editor);

        return editor;
    }

    /**
     * Set theme for all editors
     */
    public setTheme(theme: 'vs' | 'vs-dark' | 'hc-black'): void {
        if (!this.isMonacoLoaded) return;

        monaco.editor.setTheme(theme);
        this.logger.debug(`MonacoEditorService: Set theme to ${theme}`);
    }

    /**
     * Dispose of a specific editor
     */
    public disposeEditor(editor: monaco.editor.IStandaloneCodeEditor): void {
        if (!editor) return;

        editor.dispose();
        this.editors = this.editors.filter(e => e !== editor);
        this.logger.debug('MonacoEditorService: Editor disposed');
    }

    /**
     * Dispose of all editors
     */
    public disposeAllEditors(): void {
        this.editors.forEach(editor => editor.dispose());
        this.editors = [];
        this.logger.info('MonacoEditorService: All editors disposed');
    }

    /**
     * Register a custom language for Monaco
     */
    public registerLanguage(languageId: string, configuration: any): void {
        if (!this.isMonacoLoaded) return;

        monaco.languages.register({ id: languageId });
        monaco.languages.setMonarchTokensProvider(languageId, configuration);
        this.logger.debug(`MonacoEditorService: Registered custom language ${languageId}`);
    }
}
