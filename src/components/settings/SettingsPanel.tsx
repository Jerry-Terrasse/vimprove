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
      <div className="relative bg-stone-900 rounded-2xl border border-stone-700 shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-stone-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">{t('title', 'Settings')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-800 rounded-lg transition-colors text-stone-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="border-b border-stone-800 px-6 flex gap-2">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors border-b-2 ${
              activeTab === 'appearance'
                ? 'border-green-500 text-white'
                : 'border-transparent text-stone-400 hover:text-white'
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
