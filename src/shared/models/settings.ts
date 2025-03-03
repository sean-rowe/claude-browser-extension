/**
 * Editor settings for Monaco editor
 */
export interface EditorSettings {
    theme: 'vs' | 'vs-dark' | 'hc-black';
    fontSize: number;
    tabSize: number;
    insertSpaces: boolean;
    wordWrap: 'on' | 'off';
    lineNumbers: 'on' | 'off' | 'relative';
    minimap: boolean;
    folding: boolean;
}

/**
 * API settings for Claude API integration
 */
export interface ApiSettings {
    enableApiContinuation: boolean;
    apiKey: string;
    apiEndpoint: string;
    modelName: string;
    maxTokens: number;
    temperature: number;
}

/**
 * Compiler settings for code execution
 */
export interface CompilerSettings {
    enableCompilation: boolean;
    useRemoteCompilation: boolean;
    remoteCompilationEndpoint: string;
    compilationApiKey: string;
    executionTimeoutMs: number;
    supportedLanguages: string[];
}

/**
 * UI settings for the extension
 */
export interface UISettings {
    showNotifications: boolean;
    notificationDurationMs: number;
    darkMode: boolean;
}

/**
 * Main settings for artifacts functionality
 */
export interface ArtifactSettings {
    // Artifact download settings
    stitchArtifacts: boolean;
    flatFileStructure: boolean;
    includeTimestampInFilename: boolean;
    replaceInvalidChars: boolean;
    maxFilenameLength: number;

    // Editor settings
    editorSettings: EditorSettings;

    // API settings
    apiSettings: ApiSettings;

    // Compiler settings
    compilerSettings: CompilerSettings;

    // UI settings
    uiSettings: UISettings;
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: ArtifactSettings = {
    stitchArtifacts: false,
    flatFileStructure: false,
    includeTimestampInFilename: true,
    replaceInvalidChars: true,
    maxFilenameLength: 255,

    editorSettings: {
        theme: 'vs',
        fontSize: 14,
        tabSize: 2,
        insertSpaces: true,
        wordWrap: 'on',
        lineNumbers: 'on',
        minimap: true,
        folding: true
    },

    apiSettings: {
        enableApiContinuation: false,
        apiKey: '',
        apiEndpoint: 'https://api.anthropic.com/v1/messages',
        modelName: 'claude-3-sonnet-20240229',
        maxTokens: 4000,
        temperature: 0.7
    },

    compilerSettings: {
        enableCompilation: true,
        useRemoteCompilation: false,
        remoteCompilationEndpoint: '',
        compilationApiKey: '',
        executionTimeoutMs: 5000,
        supportedLanguages: ['javascript', 'typescript', 'html', 'css', 'python', 'java']
    },

    uiSettings: {
        showNotifications: true,
        notificationDurationMs: 3000,
        darkMode: false
    }
};

/**
 * Settings state class following Team Pattern
 */
export class SettingsState {
    readonly stitchArtifacts: boolean;
    readonly flatFileStructure: boolean;
    readonly includeTimestampInFilename: boolean;
    readonly replaceInvalidChars: boolean;
    readonly maxFilenameLength: number;
    readonly editorSettings: EditorSettings;
    readonly apiSettings: ApiSettings;
    readonly compilerSettings: CompilerSettings;
    readonly uiSettings: UISettings;
    readonly previousState?: SettingsState;

    constructor(settings: ArtifactSettings, previousState?: SettingsState) {
        this.stitchArtifacts = settings.stitchArtifacts;
        this.flatFileStructure = settings.flatFileStructure;
        this.includeTimestampInFilename = settings.includeTimestampInFilename;
        this.replaceInvalidChars = settings.replaceInvalidChars;
        this.maxFilenameLength = settings.maxFilenameLength;
        this.editorSettings = { ...settings.editorSettings };
        this.apiSettings = { ...settings.apiSettings };
        this.compilerSettings = { ...settings.compilerSettings };
        this.uiSettings = { ...settings.uiSettings };
        this.previousState = previousState;
    }

    /**
     * Create a new SettingsState with updated properties
     */
    with(updates: Partial<ArtifactSettings>): SettingsState {
        const merged: ArtifactSettings = {
            stitchArtifacts: this.stitchArtifacts,
            flatFileStructure: this.flatFileStructure,
            includeTimestampInFilename: this.includeTimestampInFilename,
            replaceInvalidChars: this.replaceInvalidChars,
            maxFilenameLength: this.maxFilenameLength,
            editorSettings: { ...this.editorSettings },
            apiSettings: { ...this.apiSettings },
            compilerSettings: { ...this.compilerSettings },
            uiSettings: { ...this.uiSettings },
            ...updates
        };

        // Handle nested objects
        if (updates.editorSettings) {
            merged.editorSettings = { ...this.editorSettings, ...updates.editorSettings };
        }

        if (updates.apiSettings) {
            merged.apiSettings = { ...this.apiSettings, ...updates.apiSettings };
        }

        if (updates.compilerSettings) {
            merged.compilerSettings = { ...this.compilerSettings, ...updates.compilerSettings };
        }

        if (updates.uiSettings) {
            merged.uiSettings = { ...this.uiSettings, ...updates.uiSettings };
        }

        return new SettingsState(merged, this);
    }

    /**
     * Convert state to a plain object (useful for storage)
     */
    toObject(): ArtifactSettings {
        return {
            stitchArtifacts: this.stitchArtifacts,
            flatFileStructure: this.flatFileStructure,
            includeTimestampInFilename: this.includeTimestampInFilename,
            replaceInvalidChars: this.replaceInvalidChars,
            maxFilenameLength: this.maxFilenameLength,
            editorSettings: { ...this.editorSettings },
            apiSettings: { ...this.apiSettings },
            compilerSettings: { ...this.compilerSettings },
            uiSettings: { ...this.uiSettings }
        };
    }
}

// Type for a settings change listener
export type SettingsListener = (settings: ArtifactSettings) => void;
