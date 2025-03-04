import {ArtifactSettings, DEFAULT_SETTINGS} from '../shared/models/settings';

/**
 * Options page script for the Claude Artifacts Helper extension
 */
class OptionsPage {
    private settings: ArtifactSettings = DEFAULT_SETTINGS;
    private messageTimeout: number | null = null;

    constructor() {
        document.addEventListener('DOMContentLoaded', this.init.bind(this));
    }

    /**
     * Initialize the options page
     */
    private async init(): Promise<void> {
        try {
            // Load settings
            await this.loadSettings();

            // Set up event listeners
            this.setupEventListeners();

            // Set form values from settings
            this.populateFormValues();

            // Show success message
            this.showMessage('Settings loaded successfully', 'success');
        } catch (error) {
            console.error('Error initializing options page:', error);
            this.showMessage('Failed to load settings', 'error');
        }
    }

    /**
     * Load settings from Chrome storage
     */
    private async loadSettings(): Promise<void> {
        try {
            const result = await chrome.storage.local.get('settings');

            if (result.settings) {
                this.settings = result.settings;
            } else {
                // If no settings found, use defaults
                this.settings = DEFAULT_SETTINGS;

                // Save default settings
                await this.saveSettings();
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            throw error;
        }
    }

    /**
     * Save settings to Chrome storage
     */
    private async saveSettings(): Promise<void> {
        try {
            await chrome.storage.local.set({ settings: this.settings });
        } catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    }

    /**
     * Set up event listeners for form elements
     */
    private setupEventListeners(): void {
        // Save button
        document.getElementById('saveBtn')?.addEventListener('click', this.handleSave.bind(this));

        // Reset button
        document.getElementById('resetBtn')?.addEventListener('click', this.handleReset.bind(this));
    }

    /**
     * Populate form values from current settings
     */
    private populateFormValues(): void {
        // Artifact settings
        this.setCheckboxValue('stitchArtifacts', this.settings.stitchArtifacts);
        this.setCheckboxValue('flatFileStructure', this.settings.flatFileStructure);
        this.setCheckboxValue('includeTimestampInFilename', this.settings.includeTimestampInFilename);
        this.setCheckboxValue('replaceInvalidChars', this.settings.replaceInvalidChars);
        this.setInputValue('maxFilenameLength', this.settings.maxFilenameLength.toString());

        // Editor settings
        this.setSelectValue('editorTheme', this.settings.editorSettings.theme);
        this.setInputValue('fontSize', this.settings.editorSettings.fontSize.toString());
        this.setInputValue('tabSize', this.settings.editorSettings.tabSize.toString());
        this.setCheckboxValue('insertSpaces', this.settings.editorSettings.insertSpaces);
        this.setCheckboxValue('wordWrap', this.settings.editorSettings.wordWrap === 'on');
        this.setCheckboxValue('lineNumbers', this.settings.editorSettings.lineNumbers === 'on');
        this.setCheckboxValue('minimap', this.settings.editorSettings.minimap);
        this.setCheckboxValue('folding', this.settings.editorSettings.folding);

        // API settings
        this.setCheckboxValue('enableApiContinuation', this.settings.apiSettings.enableApiContinuation);
        this.setInputValue('apiKey', this.settings.apiSettings.apiKey);
        this.setInputValue('apiEndpoint', this.settings.apiSettings.apiEndpoint);
        this.setSelectValue('modelName', this.settings.apiSettings.modelName);
        this.setInputValue('maxTokens', this.settings.apiSettings.maxTokens.toString());
        this.setInputValue('temperature', this.settings.apiSettings.temperature.toString());

        // UI settings
        this.setCheckboxValue('showNotifications', this.settings.uiSettings.showNotifications);
        this.setInputValue('notificationDurationMs', this.settings.uiSettings.notificationDurationMs.toString());
        this.setCheckboxValue('darkMode', this.settings.uiSettings.darkMode);
    }

    /**
     * Handle save button click
     */
    private async handleSave(): Promise<void> {
        try {
            // Update settings from form values
            this.updateSettingsFromForm();

            // Save settings
            await this.saveSettings();

            // Show success message
            this.showMessage('Settings saved successfully', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showMessage('Failed to save settings', 'error');
        }
    }

    /**
     * Handle reset button click
     */
    private async handleReset(): Promise<void> {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            try {
                // Reset to defaults
                this.settings = DEFAULT_SETTINGS;

                // Save settings
                await this.saveSettings();

                // Update form
                this.populateFormValues();

                // Show success message
                this.showMessage('Settings reset to defaults', 'success');
            } catch (error) {
                console.error('Error resetting settings:', error);
                this.showMessage('Failed to reset settings', 'error');
            }
        }
    }

    /**
     * Update settings object from form values
     */
    private updateSettingsFromForm(): void {
        // Artifact settings
        this.settings.stitchArtifacts = this.getCheckboxValue('stitchArtifacts');
        this.settings.flatFileStructure = this.getCheckboxValue('flatFileStructure');
        this.settings.includeTimestampInFilename = this.getCheckboxValue('includeTimestampInFilename');
        this.settings.replaceInvalidChars = this.getCheckboxValue('replaceInvalidChars');
        this.settings.maxFilenameLength = this.getNumberValue('maxFilenameLength', 255);

        // Editor settings
        this.settings.editorSettings.theme = this.getSelectValue('editorTheme') as 'vs' | 'vs-dark' | 'hc-black';
        this.settings.editorSettings.fontSize = this.getNumberValue('fontSize', 14);
        this.settings.editorSettings.tabSize = this.getNumberValue('tabSize', 2);
        this.settings.editorSettings.insertSpaces = this.getCheckboxValue('insertSpaces');
        this.settings.editorSettings.wordWrap = this.getCheckboxValue('wordWrap') ? 'on' : 'off';
        this.settings.editorSettings.lineNumbers = this.getCheckboxValue('lineNumbers') ? 'on' : 'off';
        this.settings.editorSettings.minimap = this.getCheckboxValue('minimap');
        this.settings.editorSettings.folding = this.getCheckboxValue('folding');

        // API settings
        this.settings.apiSettings.enableApiContinuation = this.getCheckboxValue('enableApiContinuation');
        this.settings.apiSettings.apiKey = this.getInputValue('apiKey');
        this.settings.apiSettings.apiEndpoint = this.getInputValue('apiEndpoint');
        this.settings.apiSettings.modelName = this.getSelectValue('modelName');
        this.settings.apiSettings.maxTokens = this.getNumberValue('maxTokens', 4000);
        this.settings.apiSettings.temperature = this.getNumberValue('temperature', 0.7, true);

        // UI settings
        this.settings.uiSettings.showNotifications = this.getCheckboxValue('showNotifications');
        this.settings.uiSettings.notificationDurationMs = this.getNumberValue('notificationDurationMs', 3000);
        this.settings.uiSettings.darkMode = this.getCheckboxValue('darkMode');
    }

    /**
     * Show a message on the page
     */
    private showMessage(text: string, type: 'success' | 'error'): void {
        const container = document.getElementById('message-container');
        if (!container) return;

        // Clear any existing timeout
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }

        // Update container
        container.textContent = text;
        container.className = `message ${type}`;
        container.classList.remove('hidden');

        // Hide after delay
        this.messageTimeout = window.setTimeout(() => {
            container.classList.add('hidden');
        }, 3000);
    }

    /**
     * Helper: Set checkbox value
     */
    private setCheckboxValue(id: string, value: boolean): void {
        const element = document.getElementById(id) as HTMLInputElement;
        if (element) {
            element.checked = value;
        }
    }

    /**
     * Helper: Set input value
     */
    private setInputValue(id: string, value: string): void {
        const element = document.getElementById(id) as HTMLInputElement;
        if (element) {
            element.value = value;
        }
    }

    /**
     * Helper: Set select value
     */
    private setSelectValue(id: string, value: string): void {
        const element = document.getElementById(id) as HTMLSelectElement;
        if (element) {
            element.value = value;
        }
    }

    /**
     * Helper: Get checkbox value
     */
    private getCheckboxValue(id: string): boolean {
        const element = document.getElementById(id) as HTMLInputElement;
        return element ? element.checked : false;
    }

    /**
     * Helper: Get input value
     */
    private getInputValue(id: string): string {
        const element = document.getElementById(id) as HTMLInputElement;
        return element ? element.value : '';
    }

    /**
     * Helper: Get select value
     */
    private getSelectValue(id: string): string {
        const element = document.getElementById(id) as HTMLSelectElement;
        return element ? element.value : '';
    }

    /**
     * Helper: Get number value from input
     */
    private getNumberValue(id: string, defaultValue: number, allowFloat: boolean = false): number {
        const element = document.getElementById(id) as HTMLInputElement;
        if (!element || element.value === '') {
            return defaultValue;
        }

        const value = allowFloat ? parseFloat(element.value) : parseInt(element.value, 10);
        return isNaN(value) ? defaultValue : value;
    }
}

// Initialize the options page
new OptionsPage();
