import { LoggerService } from '../../shared/services/loggerService';
import { StorageService } from '../../shared/services/storageService';
import { MessageService } from '../events/messageService';
import { BannerService } from './bannerService';
import { ArtifactSettings, DEFAULT_SETTINGS } from '../../shared/models/settings';

/**
 * UI for managing extension settings
 */
export class SettingsUI {
    private static instance: SettingsUI;
    private readonly logger = LoggerService.getInstance();
    private readonly storageService = StorageService.getInstance();
    private readonly messageService = MessageService.getInstance();
    private readonly bannerService = BannerService.getInstance();

    private settingsPanel: HTMLElement | null = null;
    private isVisible = false;
    private settings: ArtifactSettings | null = null;

    private constructor() {
        // Register message handler for showing settings
        this.messageService.registerHandler('showSettings', this.handleShowSettings.bind(this));
    }

    /**
     * Get the singleton instance of the settings UI
     */
    public static getInstance(): SettingsUI {
        if (!SettingsUI.instance) {
            SettingsUI.instance = new SettingsUI();
        }
        return SettingsUI.instance;
    }

    /**
     * Show the settings panel
     */
    public async show(): Promise<void> {
        if (this.isVisible) return;

        try {
            // Load settings
            this.settings = await this.storageService.getSettings();

            // Create panel if it doesn't exist
            if (!this.settingsPanel) {
                this.createSettingsPanel();
            }

            // Show the panel
            if (this.settingsPanel) {
                document.body.appendChild(this.settingsPanel);

                // Add animation
                setTimeout(() => {
                    if (this.settingsPanel) {
                        this.settingsPanel.style.opacity = '1';
                        this.settingsPanel.style.transform = 'translateY(0)';
                    }
                }, 10);

                this.isVisible = true;
            }
        } catch (error) {
            this.logger.error('SettingsUI: Error showing settings', error);
            this.bannerService.showError('Failed to load settings');
        }
    }

    /**
     * Hide the settings panel
     */
    public hide(): void {
        if (!this.isVisible || !this.settingsPanel) return;

        // Add animation
        this.settingsPanel.style.opacity = '0';
        this.settingsPanel.style.transform = 'translateY(20px)';

        // Remove after animation
        setTimeout(() => {
            if (this.settingsPanel && this.settingsPanel.parentNode) {
                this.settingsPanel.parentNode.removeChild(this.settingsPanel);
            }
            this.isVisible = false;
        }, 300);
    }

    /**
     * Create the settings panel UI
     */
    private createSettingsPanel(): void {
        // Create panel container
        const panel = document.createElement('div');
        panel.className = 'claude-artifacts-settings';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-labelledby', 'settings-title');

        // Base styling
        Object.assign(panel.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) translateY(20px)',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            zIndex: '10000',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            opacity: '0',
            transition: 'opacity 0.3s ease, transform 0.3s ease'
        });

        // Add content
        panel.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
        <h2 id="settings-title" style="margin: 0; font-size: 18px; font-weight: 600; color: #1e293b;">Claude Artifacts Settings</h2>
        <button id="close-settings" style="background: none; border: none; cursor: pointer; padding: 4px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div style="flex: 1; overflow-y: auto; padding: 20px;">
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <!-- Artifact Download Settings -->
          <section>
            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #334155;">Artifact Download</h3>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="stitch-artifacts" ${this.settings?.stitchArtifacts ? 'checked' : ''}>
                <span>Automatically stitch related artifacts</span>
              </label>
              
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="flat-structure" ${this.settings?.flatFileStructure ? 'checked' : ''}>
                <span>Use flat file structure (no folders)</span>
              </label>
              
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="include-timestamp" ${this.settings?.includeTimestampInFilename ? 'checked' : ''}>
                <span>Include timestamp in filenames</span>
              </label>
            </div>
          </section>
          
          <!-- Editor Settings -->
          <section>
            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #334155;">Editor</h3>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div>
                <label for="editor-theme" style="display: block; margin-bottom: 4px;">Theme</label>
                <select id="editor-theme" style="width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px;">
                  <option value="vs" ${this.settings?.editorSettings.theme === 'vs' ? 'selected' : ''}>Light</option>
                  <option value="vs-dark" ${this.settings?.editorSettings.theme === 'vs-dark' ? 'selected' : ''}>Dark</option>
                  <option value="hc-black" ${this.settings?.editorSettings.theme === 'hc-black' ? 'selected' : ''}>High Contrast</option>
                </select>
              </div>
              
              <div>
                <label for="font-size" style="display: block; margin-bottom: 4px;">Font Size</label>
                <input type="number" id="font-size" min="10" max="24" value="${this.settings?.editorSettings.fontSize || 14}" style="width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px;">
              </div>
              
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="line-numbers" ${this.settings?.editorSettings.lineNumbers === 'on' ? 'checked' : ''}>
                <span>Show line numbers</span>
              </label>
              
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="word-wrap" ${this.settings?.editorSettings.wordWrap === 'on' ? 'checked' : ''}>
                <span>Word wrap</span>
              </label>
              
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="minimap" ${this.settings?.editorSettings.minimap ? 'checked' : ''}>
                <span>Show minimap</span>
              </label>
            </div>
          </section>
          
          <!-- API Settings -->
          <section>
            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #334155;">API Settings</h3>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="enable-api" ${this.settings?.apiSettings.enableApiContinuation ? 'checked' : ''}>
                <span>Enable API continuation when rate limited</span>
              </label>
              
              <div>
                <label for="api-key" style="display: block; margin-bottom: 4px;">Claude API Key</label>
                <input type="password" id="api-key" value="${this.settings?.apiSettings.apiKey || ''}" placeholder="sk-..." style="width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px;">
              </div>
              
              <div>
                <label for="model-name" style="display: block; margin-bottom: 4px;">Model</label>
                <select id="model-name" style="width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px;">
                  <option value="claude-3-haiku-20240307" ${this.settings?.apiSettings.modelName === 'claude-3-haiku-20240307' ? 'selected' : ''}>Claude 3 Haiku</option>
                  <option value="claude-3-sonnet-20240229" ${this.settings?.apiSettings.modelName === 'claude-3-sonnet-20240229' ? 'selected' : ''}>Claude 3 Sonnet</option>
                  <option value="claude-3-opus-20240229" ${this.settings?.apiSettings.modelName === 'claude-3-opus-20240229' ? 'selected' : ''}>Claude 3 Opus</option>
                </select>
              </div>
            </div>
          </section>
          
          <!-- Reset Settings -->
          <section>
            <button id="reset-settings" style="padding: 8px 16px; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; color: #334155; font-weight: 500;">
              Reset to Defaults
            </button>
          </section>
        </div>
      </div>
      
      <div style="padding: 16px 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px;">
        <button id="cancel-settings" style="padding: 8px 16px; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; color: #334155; font-weight: 500;">
          Cancel
        </button>
        <button id="save-settings" style="padding: 8px 16px; background-color: #2563eb; border: none; border-radius: 4px; cursor: pointer; color: white; font-weight: 500;">
          Save Changes
        </button>
      </div>
    `;

        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.style.position = 'fixed';
        backdrop.style.top = '0';
        backdrop.style.left = '0';
        backdrop.style.width = '100%';
        backdrop.style.height = '100%';
        backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        backdrop.style.zIndex = '9999';
        backdrop.style.opacity = '0';
        backdrop.style.transition = 'opacity 0.3s ease';

        // Add handlers
        setTimeout(() => {
            backdrop.style.opacity = '1';
        }, 10);

        backdrop.addEventListener('click', () => {
            this.hide();
        });

        // Add event listeners
        panel.querySelector('#close-settings')?.addEventListener('click', () => {
            this.hide();
        });

        panel.querySelector('#cancel-settings')?.addEventListener('click', () => {
            this.hide();
        });

        panel.querySelector('#save-settings')?.addEventListener('click', () => {
            this.saveSettings();
        });

        panel.querySelector('#reset-settings')?.addEventListener('click', () => {
            this.resetSettings();
        });

        // Prevent clicks inside panel from closing
        panel.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Store references
        this.settingsPanel = panel;

        // Add panel and backdrop to the DOM
        document.body.appendChild(backdrop);
    }

    /**
     * Save settings changes
     */
    private async saveSettings(): Promise<void> {
        if (!this.settings) return;

        try {
            // Get values from form elements
            const stitchArtifacts = (document.getElementById('stitch-artifacts') as HTMLInputElement)?.checked ?? this.settings.stitchArtifacts;
            const flatStructure = (document.getElementById('flat-structure') as HTMLInputElement)?.checked ?? this.settings.flatFileStructure;
            const includeTimestamp = (document.getElementById('include-timestamp') as HTMLInputElement)?.checked ?? this.settings.includeTimestampInFilename;

            // Editor settings
            const editorTheme = (document.getElementById('editor-theme') as HTMLSelectElement)?.value as 'vs' | 'vs-dark' | 'hc-black';
            const fontSize = parseInt((document.getElementById('font-size') as HTMLInputElement)?.value || '14');
            const lineNumbers = (document.getElementById('line-numbers') as HTMLInputElement)?.checked ? 'on' : 'off';
            const wordWrap = (document.getElementById('word-wrap') as HTMLInputElement)?.checked ? 'on' : 'off';
            const minimap = (document.getElementById('minimap') as HTMLInputElement)?.checked ?? this.settings.editorSettings.minimap;

            // API settings
            const enableApi = (document.getElementById('enable-api') as HTMLInputElement)?.checked ?? this.settings.apiSettings.enableApiContinuation;
            const apiKey = (document.getElementById('api-key') as HTMLInputElement)?.value || '';
            const modelName = (document.getElementById('model-name') as HTMLSelectElement)?.value || this.settings.apiSettings.modelName;

            // Update settings
            const updatedSettings: ArtifactSettings = {
                ...this.settings,
                stitchArtifacts,
                flatFileStructure: flatStructure,
                includeTimestampInFilename: includeTimestamp,
                editorSettings: {
                    ...this.settings.editorSettings,
                    theme: editorTheme,
                    fontSize,
                    lineNumbers: lineNumbers as 'on' | 'off' | 'relative',
                    wordWrap: wordWrap as 'on' | 'off',
                    minimap
                },
                apiSettings: {
                    ...this.settings.apiSettings,
                    enableApiContinuation: enableApi,
                    apiKey,
                    modelName
                }
            };

            // Save settings
            await this.storageService.saveSettings(updatedSettings);

            // Show success message
            this.bannerService.showSuccess('Settings saved successfully');

            // Hide panel
            this.hide();
        } catch (error) {
            this.logger.error('SettingsUI: Error saving settings', error);
            this.bannerService.showError('Failed to save settings');
        }
    }

    /**
     * Reset settings to defaults
     */
    private async resetSettings(): Promise<void> {
        try {
            // Confirm reset
            if (!confirm('Reset all settings to defaults?')) {
                return;
            }

            // Save default settings
            await this.storageService.saveSettings(DEFAULT_SETTINGS);

            // Update reference
            this.settings = DEFAULT_SETTINGS;

            // Show success message
            this.bannerService.showSuccess('Settings reset to defaults');

            // Hide and recreate panel to show updated values
            if (this.settingsPanel && this.settingsPanel.parentNode) {
                this.settingsPanel.parentNode.removeChild(this.settingsPanel);
            }
            this.settingsPanel = null;
            this.isVisible = false;

            // Show settings again
            this.show();
        } catch (error) {
            this.logger.error('SettingsUI: Error resetting settings', error);
            this.bannerService.showError('Failed to reset settings');
        }
    }

    /**
     * Handle showSettings message
     */
    private async handleShowSettings(): Promise<boolean> {
        await this.show();
        return true;
    }
}
