import { useState, useEffect } from 'react';

export type EditorSettings = {
  fontSize: number;
  fontFamily: string;
};

export type Settings = {
  editor: EditorSettings;
};

const DEFAULT_SETTINGS: Settings = {
  editor: {
    fontSize: 16,
    fontFamily: 'Consolas'
  }
};

const STORAGE_KEY = 'vimprove-settings';

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateEditorSettings = (updates: Partial<EditorSettings>) => {
    setSettings(prev => ({
      ...prev,
      editor: { ...prev.editor, ...updates }
    }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateEditorSettings,
    resetToDefaults
  };
};
