import {StorageService} from '@/shared/services/storageService.ts';
import {LoggerService} from '@/shared/services/loggerService.ts';
import {ArtifactSettings, SettingsListener} from '@/shared/models/settings.ts';

/**
 * Manages settings for the extension
 */
export class SettingsManager {
    private static instance: SettingsManager;
    private readonly logger: LoggerService;
    private readonly storageService: StorageService;
    private settings: ArtifactSettings | null = null;
    private listeners: Set<SettingsListener> = new Set();

    /**
     * Private constructor to enforce singleton pattern
     */
    private constructor() {
        this.logger = LoggerService.getInstance();
        this.storageService = StorageService.getInstance();
    }

    /**
     * Get the singleton instance
     */
    public static getInstance(): SettingsManager {
        if (!SettingsManager.instance) {
            SettingsManager.instance = new SettingsManager();
        }
        return SettingsManager.instance;
    }

    /**
     * Initialize the settings manager
     */
    public async initialize(): Promise<void> {
        await this.loadSettings();
        this.logger.info('SettingsManager initialized');
    }

    /**
     * Load settings from storage
     */
    private async loadSettings(): Promise<void> {
        try {
            const settingsState = await this.storageService.getSettings();
            this.settings = settingsState.toObject();
            this.notifyListeners();
        } catch (error) {
            this.logger.error('SettingsManager: Failed to load settings', error);
            throw error;
        }
    }

    /**
     * Save settings to storage
     */
    private async saveSettings(): Promise<void> {
        if (!this.settings) return;

        try {
            await this.storageService.saveSettings(this.settings);
            this.notifyListeners();
        } catch (error) {
            this.logger.error('SettingsManager: Failed to save settings', error);
            throw error;
        }
    }

    /**
     * Get the current settings
     */
    public getSettings(): ArtifactSettings | null {
        return this.settings;
    }

    /**
     * Update the settings
     * @param settings New settings
     */
    public async updateSettings(settings: ArtifactSettings): Promise<void> {
        this.settings = settings;
        await this.saveSettings();
    }

    /**
     * Add a listener for settings changes
     * @param listener The listener to add
     */
    public addListener(listener: SettingsListener): void {
        this.listeners.add(listener);
    }

    /**
     * Remove a listener for settings changes
     * @param listener The listener to remove
     */
    public removeListener(listener: SettingsListener): void {
        this.listeners.delete(listener);
    }

    /**
     * Notify all listeners of settings changes
     */
    private notifyListeners(): void {
        if (!this.settings) return;

        this.listeners.forEach(listener => {
            try {
                listener(this.settings!);
            } catch (error) {
                this.logger.error('Error in settings listener:', error);
            }
        });
    }

    /**
     * Clean up resources
     */
    public destroy(): void {
        this.listeners.clear();
        this.logger.info('SettingsManager destroyed');
    }
}
