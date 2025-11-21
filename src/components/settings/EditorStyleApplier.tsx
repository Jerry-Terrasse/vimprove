import { useEffect } from 'react';
import { useSettingsContext } from '@/contexts/SettingsContext';

export const EditorStyleApplier = () => {
  const { settings } = useSettingsContext();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--editor-font-family', settings.editor.fontFamily);
    root.style.setProperty('--editor-font-size', `${settings.editor.fontSize}px`);
  }, [settings.editor.fontFamily, settings.editor.fontSize]);

  return null;
};
