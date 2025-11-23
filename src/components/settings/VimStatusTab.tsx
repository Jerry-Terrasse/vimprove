import { Check, X, Minus } from 'lucide-react';
import { useTranslationSafe } from '@/hooks/useI18n';

type SupportStatus = 'full' | 'partial' | 'none';

type CommandCategory = {
  name: string;
  commands: { cmd: string; status: SupportStatus; note?: string }[];
};

const COMMAND_MATRIX: CommandCategory[] = [
  {
    name: 'Basic Motions',
    commands: [
      { cmd: 'h j k l', status: 'full' },
      { cmd: '0 ^ $ _', status: 'full' },
      { cmd: 'w b e', status: 'full' },
      { cmd: 'W B E', status: 'full' },
      { cmd: 'gg G', status: 'none' },
    ],
  },
  {
    name: 'Find/Till',
    commands: [
      { cmd: 'f F t T', status: 'full' },
      { cmd: '; ,', status: 'full' },
    ],
  },
  {
    name: 'Search',
    commands: [
      { cmd: '/ ?', status: 'full' },
      { cmd: 'n N', status: 'full' },
      { cmd: '* #', status: 'full' },
    ],
  },
  {
    name: 'Operators',
    commands: [
      { cmd: 'd c y', status: 'full' },
      { cmd: 'dd yy', status: 'full' },
      { cmd: 'p P', status: 'full' },
      { cmd: 'x s r', status: 'full' },
      { cmd: '. (dot)', status: 'full' },
      { cmd: 'u Ctrl-r', status: 'full' },
    ],
  },
  {
    name: 'Text Objects',
    commands: [
      { cmd: 'iw aw', status: 'full' },
      { cmd: 'ip ap', status: 'full' },
      { cmd: 'i( a( i{ a{', status: 'full' },
      { cmd: 'i" a" i\' a\'', status: 'full' },
    ],
  },
  {
    name: 'Insert Mode',
    commands: [
      { cmd: 'i a I A', status: 'full' },
      { cmd: 'o O', status: 'full' },
      { cmd: 'Escape', status: 'full' },
    ],
  },
  {
    name: 'Not Supported',
    commands: [
      { cmd: 'Visual mode', status: 'none' },
      { cmd: 'Registers "a', status: 'none' },
      { cmd: 'Marks m\'', status: 'none' },
      { cmd: 'Macros q@', status: 'none' },
    ],
  },
];

const TEST_STATS = {
  basic: { passed: 73, total: 73, name: 'vimParity' },
  exhaustive: { passed: 404, total: 404, name: 'vimParityExhaustive' },
};

const StatusIcon = ({ status }: { status: SupportStatus }) => {
  switch (status) {
    case 'full':
      return <Check size={14} className="text-green-500" />;
    case 'partial':
      return <Minus size={14} className="text-yellow-500" />;
    case 'none':
      return <X size={14} className="text-stone-500" />;
  }
};

const ProgressBar = ({ passed, total }: { passed: number; total: number }) => {
  const percentage = Math.round((passed / total) * 100);
  const isGood = percentage >= 90;
  const isOk = percentage >= 70;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-stone-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            isGood ? 'bg-green-500' : isOk ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-sm font-mono ${
        isGood ? 'text-green-400' : isOk ? 'text-yellow-400' : 'text-red-400'
      }`}>
        {percentage}%
      </span>
    </div>
  );
};

export const VimStatusTab = () => {
  const { t } = useTranslationSafe('settings');

  return (
    <div className="space-y-6">
      {/* Test Results */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-4">
          {t('vimStatus.testResults', 'Neovim Parity Tests')}
        </h3>
        <div className="space-y-4">
          {Object.entries(TEST_STATS).map(([key, stat]) => (
            <div key={key} className="bg-stone-800/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-stone-300 font-mono text-sm">{stat.name}</span>
                <span className="text-stone-400 text-sm">
                  {stat.passed}/{stat.total} passed
                </span>
              </div>
              <ProgressBar passed={stat.passed} total={stat.total} />
            </div>
          ))}
        </div>
      </section>

      {/* Command Matrix */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-4">
          {t('vimStatus.supportMatrix', 'Command Support Matrix')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {COMMAND_MATRIX.map((category) => (
            <div
              key={category.name}
              className="bg-stone-800/50 rounded-lg p-3"
            >
              <h4 className="text-sm font-medium text-stone-400 mb-2">
                {category.name}
              </h4>
              <div className="space-y-1">
                {category.commands.map((cmd, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-sm"
                  >
                    <StatusIcon status={cmd.status} />
                    <code className={`font-mono ${
                      cmd.status === 'full'
                        ? 'text-stone-200'
                        : cmd.status === 'partial'
                        ? 'text-yellow-300'
                        : 'text-stone-500'
                    }`}>
                      {cmd.cmd}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Legend */}
      <section className="flex gap-6 text-sm text-stone-400">
        <div className="flex items-center gap-2">
          <Check size={14} className="text-green-500" />
          <span>{t('vimStatus.supported', 'Supported')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Minus size={14} className="text-yellow-500" />
          <span>{t('vimStatus.partial', 'Partial')}</span>
        </div>
        <div className="flex items-center gap-2">
          <X size={14} className="text-stone-500" />
          <span>{t('vimStatus.notSupported', 'Not Supported')}</span>
        </div>
      </section>
    </div>
  );
};
