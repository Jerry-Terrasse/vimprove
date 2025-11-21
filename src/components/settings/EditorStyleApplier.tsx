import { useEffect } from 'react';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { useFontLoader, getFontFamily } from '@/hooks/useFontLoader';

export const EditorStyleApplier = () => {
  const { settings } = useSettingsContext();
  useFontLoader(settings.editor.fontFamily);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--editor-font-family', getFontFamily(settings.editor.fontFamily));
    root.style.setProperty('--editor-font-size', `${settings.editor.fontSize}px`);
  }, [settings.editor.fontFamily, settings.editor.fontSize]);

  return null;
};
