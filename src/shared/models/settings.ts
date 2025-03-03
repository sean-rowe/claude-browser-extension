/**
 * Settings model for the Claude Artifacts extension
 */

/**
 * Main settings interface for artifact handling
 */
export interface ArtifactSettings {
    /**
     * Whether to automatically combine artifacts with the same title/type that may have been split
     * due to Claude response limitations
     */
    stitchArtifacts: boolean;

    /**
     * Whether to save all files in a flat structure (true) or organize by conversation/date (false)
     */
    flatFileStructure: boolean;

    /**
     * Whether to include the timestamp in filenames
     */
    includeTimestampInFilename: boolean;

    /**
     * Whether to replace invalid filename characters (true) or just remove them (false)
     */
    replaceInvalidChars: boolean;

    /**
     * Maximum filename length (including extension)
     */
    maxFilenameLength: number;

    /**
     * API-related settings
     */
    apiSettings: ApiSettings;

    /**
     * Monaco editor settings
     */
    editorSettings: EditorSettings;

    /**
     * Compiler settings
     */
    compilerSettings: CompilerSettings;

    /**
     * UI settings
     */
    uiSettings: UISettings;

    /**
     * The version of the settings schema, for handling migrations
     */
    version: number;
}

/**
 * Settings for Claude API access
 */
export interface ApiSettings {
    /**
     * Whether to enable API continuation when rate limited
     */
    enableApiContinuation: boolean;

    /**
     * Claude API key (stored encrypted)
     */
    apiKey: string;

    /**
     * API endpoint for Claude conversations
     */
    apiEndpoint: string;

    /**
     * The model to use for API requests
     */
    modelName: string;

    /**
     * Max tokens to generate in API responses
     */
    maxTokens: number;

    /**
     * Temperature setting for API requests
     */
    temperature: number;
}

/**
 * Settings for the Monaco code editor
 */
export interface EditorSettings {
    /**
     * Theme for the Monaco editor
     */
    theme: 'vs' | 'vs-dark' | 'hc-black';

    /**
     * Font size for the editor
     */
    fontSize: number;

    /**
     * Line numbers visibility
     */
    lineNumbers: 'on' | 'off' | 'relative';

    /**
     * Word wrap settings
     */
    wordWrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded';

    /**
     * Whether to enable minimap
     */
    minimap: boolean;

    /**
     * Tab size
     */
    tabSize: number;

    /**
     * Insert spaces when pressing Tab
     */
    insertSpaces: boolean;

    /**
     * Whether to enable auto bracket pairs
     */
    autoClosingBrackets: boolean;

    /**
     * Whether to auto indent when pressing Enter
     */
    autoIndent: boolean;

    /**
     * Whether to enable code folding
     */
    folding: boolean;

    /**
     * Whether to automatically load editor for all code artifacts
     */
    autoLoadForCode: boolean;
}

/**
 * Settings for the code compiler/runner
 */
export interface CompilerSettings {
    /**
     * Whether to enable the code compilation feature
     */
    enableCompilation: boolean;

    /**
     * Whether to use a local sandbox or remote compilation service
     */
    useRemoteCompilation: boolean;

    /**
     * Endpoint for remote compilation if enabled
     */
    remoteCompilationEndpoint: string;

    /**
     * Timeout in milliseconds for code execution
     */
    executionTimeoutMs: number;

    /**
     * Whether to show line numbers in compiler output
     */
    showLineNumbers: boolean;

    /**
     * Whether to show execution time in compiler output
     */
    showExecutionTime: boolean;

    /**
     * Languages supported for compilation
     */
    supportedLanguages: string[];

    /**
     * API key for remote compilation service (stored encrypted)
     */
    compilationApiKey: string;
}

/**
 * Settings for UI customization
 */
export interface UISettings {
    /**
     * Whether to show the download button
     */
    showDownloadButton: boolean;

    /**
     * Whether to show the settings button
     */
    showSettingsButton: boolean;

    /**
     * Whether to show the edit button on artifacts
     */
    showEditButton: boolean;

    /**
     * Whether to show the run button on code artifacts
     */
    showRunButton: boolean;

    /**
     * Whether to show success/error notifications
     */
    showNotifications: boolean;

    /**
     * Duration in milliseconds to show notifications
     */
    notificationDurationMs: number;

    /**
     * Whether to show confirmation dialogs for actions
     */
    showConfirmations: boolean;

    /**
     * Custom CSS for UI elements
     */
    customCSS: string;
}

/**
 * UI element references used internally
 */
export interface UIElements {
    downloadButton: HTMLButtonElement | null;
    settingsButton: HTMLButtonElement | null;
    headerContainer: HTMLElement | null;
}

/**
 * Default settings object
 */
export const DEFAULT_SETTINGS: ArtifactSettings = {
    stitchArtifacts: true,
    flatFileStructure: false,
    includeTimestampInFilename: true,
    replaceInvalidChars: true,
    maxFilenameLength: 255,
    apiSettings: {
        enableApiContinuation: false,
        apiKey: '',
        apiEndpoint: 'https://api.anthropic.com/v1/messages',
        modelName: 'claude-3-haiku-20240307',
        maxTokens: 4096,
        temperature: 0.7
    },
    editorSettings: {
        theme: 'vs',
        fontSize: 14,
        lineNumbers: 'on',
        wordWrap: 'on',
        minimap: true,
        tabSize: 2,
        insertSpaces: true,
        autoClosingBrackets: true,
        autoIndent: true,
        folding: true,
        autoLoadForCode: false
    },
    compilerSettings: {
        enableCompilation: true,
        useRemoteCompilation: true,
        remoteCompilationEndpoint: 'https://api.compilers.io',
        executionTimeoutMs: 5000,
        showLineNumbers: true,
        showExecutionTime: true,
        supportedLanguages: [
            'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp',
            'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'scala'
        ],
        compilationApiKey: ''
    },
    uiSettings: {
        showDownloadButton: true,
        showSettingsButton: true,
        showEditButton: true,
        showRunButton: true,
        showNotifications: true,
        notificationDurationMs: 3000,
        showConfirmations: true,
        customCSS: ''
    },
    version: 1
};
