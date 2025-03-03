import { ArtifactSettings, DEFAULT_SETTINGS } from '../models/settings';
import { LoggerService } from './loggerService';

/**
 * Service for interacting with Chrome storage
 */
export class StorageService {
    private static instance: StorageService;
    private readonly logger = LoggerService.getInstance();

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Get the singleton instance of the storage service
     */
    public static getInstance(): StorageService {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }

    /**
     * Get the user settings from storage or return defaults
     */
    public async getSettings(): Promise<ArtifactSettings> {
        try {
            const result = await chrome.storage.sync.get('artifactSettings');

            if (result.artifactSettings) {
                // Handle potential schema upgrades here
                const storedSettings = result.artifactSettings as ArtifactSettings;
                const currentVersion = DEFAULT_SETTINGS.version;

                if (storedSettings.version !== currentVersion) {
                    this.logger.info(`Migrating settings from version ${storedSettings.version} to ${currentVersion}`);
                    return this.migrateSettings(storedSettings, currentVersion);
                }

                return storedSettings;
            } else {
                // No settings found, save and return defaults
                await this.saveSettings(DEFAULT_SETTINGS);
                return DEFAULT_SETTINGS;
            }
        } catch (error) {
            this.logger.error('Failed to get settings', error);
            return DEFAULT_SETTINGS;
        }
    }

    /**
     * Save settings to storage
     */
    public async saveSettings(settings: ArtifactSettings): Promise<boolean> {
        try {
            await chrome.storage.sync.set({ artifactSettings: settings });
            this.logger.debug('Settings saved successfully');
            return true;
        } catch (error) {
            this.logger.error('Failed to save settings', error);
            return false;
        }
    }

    /**
     * Update specific settings and save
     */
    public async updateSettings(partialSettings: Partial<ArtifactSettings>): Promise<boolean> {
        try {
            const currentSettings = await this.getSettings();
            const updatedSettings = {
                ...currentSettings,
                ...partialSettings
            };
            return this.saveSettings(updatedSettings);
        } catch (error) {
            this.logger.error('Failed to update settings', error);
            return false;
        }
    }

    /**
     * Migrate settings from a previous version
     */
    private migrateSettings(oldSettings: ArtifactSettings, newVersion: number): ArtifactSettings {
        // Start with current defaults
        const newSettings = { ...DEFAULT_SETTINGS };

        // Copy over as many properties as possible from old settings
        Object.keys(newSettings).forEach(key => {
            if (key in oldSettings && key !== 'version') {
                (newSettings as any)[key] = (oldSettings as any)[key];
            }
        });

        // Set the new version
        newSettings.version = newVersion;

        // Save the migrated settings
        this.saveSettings(newSettings).catch(error => {
            this.logger.error('Failed to save migrated settings', error);
        });

        return newSettings;
    }

    /**
     * Save an artifact to local storage (used for stitching)
     */
    public async saveArtifact(key: string, data: any): Promise<void> {
        try {
            await chrome.storage.local.set({ [key]: data });
            this.logger.debug(`Artifact saved: ${key}`);
        } catch (error) {
            this.logger.error(`Failed to save artifact: ${key}`, error);
            throw error;
        }
    }

    /**
     * Get an artifact from local storage
     */
    public async getArtifact(key: string): Promise<any> {
        try {
            const result = await chrome.storage.local.get(key);
            return result[key];
        } catch (error) {
            this.logger.error(`Failed to get artifact: ${key}`, error);
            throw error;
        }
    }

    /**
     * Remove an artifact from local storage
     */
    public async removeArtifact(key: string): Promise<void> {
        try {
            await chrome.storage.local.remove(key);
            this.logger.debug(`Artifact removed: ${key}`);
        } catch (error) {
            this.logger.error(`Failed to remove artifact: ${key}`, error);
            throw error;
        }
    }

    /**
     * Clear all stored artifacts (but keep settings)
     */
    public async clearArtifacts(): Promise<void> {
        try {
            await chrome.storage.local.clear();
            this.logger.info('All artifacts cleared from storage');
        } catch (error) {
            this.logger.error('Failed to clear artifacts', error);
            throw error;
        }
    }
}
