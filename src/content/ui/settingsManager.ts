import { StorageService } from '@/background/storageService';
import {LoggerService} from '@/shared/services/loggerService';

export class SettingsManager {
    private static instance: SettingsManager;
    private readonly logger: LoggerService;
    private readonly storageService: StorageService;
    private settings: ISettings = {
        enabled: true
    };

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
        this.settings = await this.storageService.get<ISettings>('settings') || this.settings;
    }

    /**
     * Save settings to storage
     */
    private async saveSettings(): Promise<void> {
        await this.storageService.set<ISettings>('settings', this.settings);

        // Notify listeners of the updated settings
        this.notifyListeners();
    }

    /**
     * Get the current settings
     */
    public getSettings(): ISettings {
        return this.settings;
    }

    /**
     * Update the settings
     * @param settings New settings
     */
    public async updateSettings(settings: ISettings): Promise<void> {
        this.settings = settings;
        await this.saveSettings();
    }

    // Listener functionality
    private listeners: Set<SettingsListener> = new Set();

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
        this.listeners.forEach(listener => {
            try {
                listener(this.settings);
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
