import { AVAILABLE_MODELS } from './model';
import { type Settings, type StorageData } from './types';

/**
 * Default settings configuration object containing fallback values
 * for all settings when no user preferences are stored.
 */
export const DEFAULT_SETTINGS: Settings = {
  hotkey: {
    altKey: false,
    ctrlKey: true,
    key: 'L',
    metaKey: false,
    shiftKey: true,
  },
  model: 'Xenova/whisper-base',
};

export class SettingsManager {
  /** In-memory cache of the current settings to avoid repeated storage reads */
  private cache: Settings | null = null;

  /** Singleton instance holder */
  private static instance: SettingsManager;

  /**
   * Gets the singleton instance of SettingsManager.
   * Creates a new instance if one doesn't exist.
   *
   * @returns The singleton SettingsManager instance
   */
  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }

    return SettingsManager.instance;
  }

  /**
   * Retrieves a specific setting value by key.
   *
   * @param key - The setting key to retrieve
   * @returns Promise resolving to the setting value
   *
   * @example
   * ```typescript
   * const hotkey = await settingsManager.getSetting('hotkey');
   * const model = await settingsManager.getSetting('model');
   * ```
   */
  async getSetting<K extends keyof Settings>(key: K): Promise<Settings[K]> {
    return (await this.loadSettings())[key];
  }

  /**
   * Loads all settings from browser storage with caching and validation.
   *
   * @returns Promise resolving to the complete settings object
   * @throws Returns DEFAULT_SETTINGS if storage access fails
   */
  async loadSettings(): Promise<Settings> {
    if (this.cache) {
      return this.cache;
    }

    try {
      const result = (await browser.storage.sync.get(
        'settings'
      )) as StorageData;
      const settings = result.settings || DEFAULT_SETTINGS;

      if (!AVAILABLE_MODELS.find((m) => m.id === settings.model)) {
        settings.model = DEFAULT_SETTINGS.model;
      }

      this.cache = settings;
      return settings;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Saves partial or complete settings to browser storage.
   * Merges provided settings with existing ones and updates the cache.
   *
   * @param settings - Partial settings object with values to update
   * @throws Error if storage write fails
   *
   * @example
   * ```typescript
   * await settingsManager.saveSettings({ model: 'gpt-4' });
   * await settingsManager.saveSettings({ hotkey: 'Ctrl+Shift+A', model: 'claude-3' });
   * ```
   */
  async saveSettings(settings: Partial<Settings>): Promise<void> {
    try {
      const currentSettings = await this.loadSettings();
      const newSettings = { ...currentSettings, ...settings };
      await browser.storage.sync.set({ settings: newSettings });
      this.cache = newSettings;
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw new Error('Failed to save settings');
    }
  }

  /**
   * Registers a callback to be executed when settings change in any browser context.
   * Useful for keeping UI in sync when settings are modified in other tabs or windows.
   *
   * @param callback - Function to call when settings change, receives new settings
   *
   * @example
   * ```typescript
   * settingsManager.onSettingsChanged((newSettings) => {
   *   console.log('Settings updated:', newSettings);
   *   updateUI(newSettings);
   * });
   * ```
   */
  onSettingsChanged(callback: (settings: Settings) => void): void {
    browser.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes.settings) {
        const newSettings = changes.settings.newValue || DEFAULT_SETTINGS;
        this.cache = newSettings;
        callback(newSettings);
      }
    });
  }

  /**
   * Clears the internal settings cache, forcing the next load to fetch from storage.
   *
   * Useful for testing or when you need to ensure fresh data from storage.
   */
  clearCache(): void {
    this.cache = null;
  }
}
