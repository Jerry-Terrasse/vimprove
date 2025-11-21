import { useState } from 'react';
import { X, Palette } from 'lucide-react';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { AppearanceTab } from './AppearanceTab';
import { useTranslationSafe } from '@/hooks/useI18n';

type Tab = 'appearance';

type SettingsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const SettingsPanel = ({ isOpen, onClose }: SettingsPanelProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('appearance');
  const { settings, updateEditorSettings, resetToDefaults } = useSettingsContext();
  const { t } = useTranslationSafe('settings');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-stone-900 rounded-2xl border border-stone-700 shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-stone-800 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">{t('title', 'Settings')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-800 rounded-lg transition-colors text-stone-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-stone-800 p-4 flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
              activeTab === 'appearance'
                ? 'bg-stone-800 text-white'
                : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
              }`}
            >
              <Palette size={18} />
              {t('appearance.tab', 'Appearance')}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'appearance' && (
              <AppearanceTab
                settings={settings.editor}
                onUpdate={updateEditorSettings}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-stone-800 p-4 flex justify-between items-center">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-sm text-stone-400 hover:text-white transition-colors"
          >
            {t('reset', 'Reset to Defaults')}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-colors"
          >
            {t('done', 'Done')}
          </button>
        </div>
      </div>
    </div>
  );
};
