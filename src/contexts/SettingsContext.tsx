import { createContext, useContext, type ReactNode } from 'react';
import { useSettings, type Settings } from '@/hooks/useSettings';
import type { EditorSettings } from '@/hooks/useSettings';

type SettingsContextType = {
  settings: Settings;
  updateEditorSettings: (updates: Partial<EditorSettings>) => void;
  resetToDefaults: () => void;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const settingsHook = useSettings();

  return (
    <SettingsContext.Provider value={settingsHook}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within SettingsProvider');
  }
  return context;
};
