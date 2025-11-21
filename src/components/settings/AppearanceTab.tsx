import { tokenizeLine, getTokenClassName } from '@/core/syntaxHighlight';
import type { EditorSettings } from '@/hooks/useSettings';
import { useTranslationSafe } from '@/hooks/useI18n';

type AppearanceTabProps = {
  settings: EditorSettings;
  onUpdate: (updates: Partial<EditorSettings>) => void;
};

const FONT_OPTIONS = [
  'Consolas',
  'JetBrains Mono',
  'Fira Code',
  'Source Code Pro',
  'Menlo',
  'Monaco',
  'Courier New'
];

export const AppearanceTab = ({ settings, onUpdate }: AppearanceTabProps) => {
  const { t } = useTranslationSafe('settings');

  const renderPreview = () => {
    const code = [
      'function hello() {',
      '  console.log("Hello, Vim!");',
      '}'
    ];

    return code.map((line, idx) => {
      const tokens = tokenizeLine(line, 'javascript', code);
      return (
        <div key={idx}>
          {tokens.map((token, tokenIdx) => (
            <span key={tokenIdx} className={getTokenClassName(token.type)}>
              {token.content}
            </span>
          ))}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Font Family */}
      <div>
        <label className="block text-sm font-semibold text-stone-200 mb-3">
          {t('appearance.fontFamily', 'Font Family')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {FONT_OPTIONS.map(font => (
            <button
              key={font}
              onClick={() => onUpdate({ fontFamily: font })}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                settings.fontFamily === font
                  ? 'bg-green-600 text-white'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
              style={{ fontFamily: font }}
            >
              {font}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-sm font-semibold text-stone-200 mb-3">
          {t('appearance.fontSize', 'Font Size')}: {settings.fontSize}px
        </label>
        <div className="flex items-center gap-4">
          <span className="text-stone-500 text-sm">12px</span>
          <input
            type="range"
            min="12"
            max="20"
            value={settings.fontSize}
            onChange={e => onUpdate({ fontSize: Number(e.target.value) })}
            className="flex-1 h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer slider"
            style={{
              '--range-progress': `${((settings.fontSize - 12) / (20 - 12)) * 100}%`
            } as React.CSSProperties}
          />
          <span className="text-stone-500 text-sm">20px</span>
        </div>
      </div>

      {/* Preview */}
      <div>
        <label className="block text-sm font-semibold text-stone-200 mb-3">
          {t('appearance.preview', 'Preview')}
        </label>
        <div className="bg-stone-900 rounded-lg p-4 border border-stone-700">
          <div
            style={{
              fontFamily: settings.fontFamily,
              fontSize: `${settings.fontSize}px`,
              lineHeight: 1.5
            }}
          >
            {renderPreview()}
          </div>
        </div>
      </div>
    </div>
  );
};
