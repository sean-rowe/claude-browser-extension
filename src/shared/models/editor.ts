/**
 * Types related to the Monaco Editor integration
 */

export interface IEditorInstance {
    id: string;
    editor: monaco.editor.IStandaloneCodeEditor;
    language: string;
    originalContent: string;
    isDirty: boolean;
}

export interface ICompilationResult {
    success: boolean;
    output?: string;
    error?: string;
    language: string;
    executionTime?: number;
}

export interface IEditorOptions {
    theme?: string;
    fontSize?: number;
    wordWrap?: 'on' | 'off';
    lineNumbers?: 'on' | 'off';
    minimap?: {
        enabled: boolean;
    };
}

export interface IMonacoEditorService {
    /**
     * Initialize the Monaco Editor
     * @returns Promise that resolves when initialization is complete
     */
    initialize(): Promise<void>;

    /**
     * Create a new editor instance
     * @param container DOM element to contain the editor
     * @param content Initial content
     * @param language Programming language
     * @param id Unique identifier for the editor
     * @param options Editor options
     */
    createEditor(
        container: HTMLElement,
        content: string,
        language: string,
        id: string,
        options?: IEditorOptions
    ): Promise<monaco.editor.IStandaloneCodeEditor | null>;

    /**
     * Get content from an editor
     * @param id Editor ID
     */
    getContent(id: string): string | null;

    /**
     * Update the content of an editor
     * @param id Editor ID
     * @param content New content
     */
    updateContent(id: string, content: string): boolean;

    /**
     * Dispose of an editor instance
     * @param id Editor ID
     */
    disposeEditor(id: string): void;

    /**
     * Dispose of all editor instances
     */
    disposeAll(): void;

    /**
     * Check if an editor with the given ID exists
     * @param id Editor ID
     */
    hasEditor(id: string): boolean;
}

export interface ICompilerService {
    /**
     * Compile and run code
     * @param code The code to compile/run
     * @param language The programming language
     */
    compileAndRun(code: string, language: string): Promise<ICompilationResult>;

    /**
     * Check if a language is supported for compilation
     * @param language The programming language to check
     */
    isLanguageSupported(language: string): boolean;
}
