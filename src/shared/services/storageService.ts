import {LoggerService} from './loggerService';
import {Artifact, ArtifactState} from '../models/artifact';
import {ArtifactSettings, DEFAULT_SETTINGS, SettingsState} from '../models/settings';

/**
 * Service for managing Chrome storage
 */
export class StorageService {
    private static instance: StorageService;
    private readonly logger = LoggerService.getInstance();
    private cachedSettings: SettingsState | null = null;

    private constructor() {
        // Private constructor to enforce singleton pattern
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
     * Get a value from storage
     */
    public async get<T>(key: string): Promise<T | null> {
        try {
            const result = await chrome.storage.local.get(key);
            return result[key] || null;
        } catch (error) {
            this.logger.error(`StorageService: Error getting '${key}'`, error);
            return null;
        }
    }

    /**
     * Set a value in storage
     */
    public async set<T>(key: string, value: T): Promise<void> {
        try {
            await chrome.storage.local.set({ [key]: value });
        } catch (error) {
            this.logger.error(`StorageService: Error setting '${key}'`, error);
            throw error;
        }
    }

    /**
     * Remove a value from storage
     */
    public async remove(key: string): Promise<void> {
        try {
            await chrome.storage.local.remove(key);
        } catch (error) {
            this.logger.error(`StorageService: Error removing '${key}'`, error);
            throw error;
        }
    }

    /**
     * Clear all stored data
     */
    public async clear(): Promise<void> {
        try {
            await chrome.storage.local.clear();
            this.cachedSettings = null;
        } catch (error) {
            this.logger.error('StorageService: Error clearing storage', error);
            throw error;
        }
    }

    /**
     * Get all stored data
     */
    public async getAll(): Promise<Record<string, any>> {
        try {
            return await chrome.storage.local.get(null);
        } catch (error) {
            this.logger.error('StorageService: Error getting all data', error);
            return {};
        }
    }

    /**
     * Get settings from storage
     */
    public async getSettings(): Promise<SettingsState> {
        try {
            if (this.cachedSettings) {
                return this.cachedSettings;
            }

            const settings = await this.get<ArtifactSettings>('settings');

            if (!settings) {
                // If no settings found, use defaults
                this.cachedSettings = new SettingsState(DEFAULT_SETTINGS);

                // Save default settings to storage
                await this.saveSettings(this.cachedSettings);

                return this.cachedSettings;
            }

            this.cachedSettings = new SettingsState(settings);
            return this.cachedSettings;
        } catch (error) {
            this.logger.error('StorageService: Error getting settings', error);

            // Return default settings if there's an error
            return new SettingsState(DEFAULT_SETTINGS);
        }
    }

    /**
     * Save settings to storage
     */
    public async saveSettings(settings: SettingsState | ArtifactSettings): Promise<void> {
        try {
            const settingsToSave = settings instanceof SettingsState
                ? settings.toObject()
                : settings;

            await this.set<ArtifactSettings>('settings', settingsToSave);

            // Update cache
            this.cachedSettings = settings instanceof SettingsState
                ? settings
                : new SettingsState(settings);

            this.logger.debug('StorageService: Settings saved');
        } catch (error) {
            this.logger.error('StorageService: Error saving settings', error);
            throw error;
        }
    }

    /**
     * Save an artifact to storage
     */
    public async saveArtifact(key: string, artifact: ArtifactState | Artifact): Promise<void> {
        try {
            const artifactToSave = artifact instanceof ArtifactState
                ? artifact.toObject()
                : artifact;

            await this.set<Artifact>(key, artifactToSave);
            this.logger.debug(`StorageService: Artifact '${key}' saved`);
        } catch (error) {
            this.logger.error(`StorageService: Error saving artifact '${key}'`, error);
            throw error;
        }
    }

    /**
     * Get an artifact from storage
     */
    public async getArtifact(key: string): Promise<ArtifactState | null> {
        try {
            const artifact = await this.get<Artifact>(key);

            if (!artifact) {
                return null;
            }

            return new ArtifactState(artifact);
        } catch (error) {
            this.logger.error(`StorageService: Error getting artifact '${key}'`, error);
            return null;
        }
    }
}
