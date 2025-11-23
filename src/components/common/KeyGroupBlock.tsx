import type { KeyGroup } from '@/core/keyHistory.types';
import { KeyChip } from './KeyChip';
import { useTranslationSafe } from '@/hooks/useI18n';

type KeyGroupBlockProps = {
  group: KeyGroup;
};

const getGroupTypeColor = (type: KeyGroup['type']): string => {
  switch (type) {
    case 'operatorMotion': return 'bg-orange-950/40 border-orange-700/60';
    case 'replaceChar': return 'bg-orange-950/40 border-orange-700/60';
    case 'findChar': return 'bg-blue-950/40 border-blue-700/60';
    case 'search': return 'bg-purple-950/40 border-purple-700/60';
    case 'countPrefix': return 'bg-cyan-950/40 border-cyan-700/60';
    case 'insertText': return 'bg-green-950/40 border-green-700/60';
    case 'standalone': return 'bg-stone-950/40 border-stone-700/60';
    default: return 'bg-stone-950/40 border-stone-700/60';
  }
};

const getGroupStatusBorder = (status: KeyGroup['status']): string => {
  switch (status) {
    case 'pending': return 'border-dashed border-yellow-500/80 shadow-yellow-500/20';
    case 'ignored': return 'border-stone-600/40 opacity-50';
    case 'cancelled': return 'border-red-600/40 opacity-60';
    default: return '';
  }
};

const getGroupSummary = (group: KeyGroup, t: (key: string, defaultValue?: string, options?: unknown) => string): string => {
  if (group.summary) return group.summary;

  // Generate summary based on type and keys
  const keysStr = group.keys.map(k => k.display).join('');

  if (group.status === 'pending') {
    const pendingMsg = t(`pending.${group.pendingKind || 'unknown'}`, 'Waiting for input', { ns: 'keyHistory' });
    return `${keysStr} - ${pendingMsg}`;
  }

  if (group.status === 'cancelled') {
    return t('cancelled', `${keysStr} - Cancelled`, { ns: 'keyHistory' });
  }

  if (group.status === 'ignored') {
    return t('ignored', `${keysStr} - No effect`, { ns: 'keyHistory' });
  }

  // Applied - try to generate meaningful summary
  const typeLabel = t(`groupType.${group.type}`, group.type, { ns: 'keyHistory' });
  return `${keysStr} - ${typeLabel}`;
};

export const KeyGroupBlock: React.FC<KeyGroupBlockProps> = ({ group }) => {
  const { t } = useTranslationSafe(['keyHistory']);

  const groupColor = getGroupTypeColor(group.type);
  const statusBorder = getGroupStatusBorder(group.status);
  const summary = getGroupSummary(group, t);

  // Single key without border
  if (group.keys.length === 1 && group.type === 'standalone') {
    return <KeyChip keyAtom={group.keys[0]} groupStatus={group.status} />;
  }

  return (
    <div
      className={`
        relative
        px-2 py-1.5
        rounded-md
        border
        ${groupColor}
        ${statusBorder}
        transition-all
        hover:shadow-md
      `}
      title={summary}
    >
      {/* Pending indicator */}
      {group.status === 'pending' && (
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse" />
      )}

      {/* Cancelled indicator */}
      {group.status === 'cancelled' && (
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600/80 rounded-full flex items-center justify-center text-[9px] text-white">
          ×
        </div>
      )}

      {/* Keys */}
      <div className="flex flex-wrap gap-0.5 items-center">
        {group.keys.map((key) => (
          <KeyChip key={key.id} keyAtom={key} groupStatus={group.status} />
        ))}
      </div>

      {/* Summary text (optional, for better UX) */}
      {group.status === 'pending' && (
        <div className="mt-1 text-[9px] text-yellow-400/80">
          {t(`pending.${group.pendingKind || 'unknown'}`, '...', { ns: 'keyHistory' })}
        </div>
      )}
    </div>
  );
};
