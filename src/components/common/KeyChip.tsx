import type { KeyAtom } from '@/core/keyHistory.types';
import { useTranslationSafe } from '@/hooks/useI18n';

type KeyChipProps = {
  keyAtom: KeyAtom;
  groupStatus: 'pending' | 'applied' | 'ignored' | 'cancelled';
};

const getKeyKindColor = (kind: KeyAtom['kind']): string => {
  switch (kind) {
    case 'operator': return 'bg-orange-600/20 text-orange-300 border-orange-500/40';
    case 'motion': return 'bg-blue-600/20 text-blue-300 border-blue-500/40';
    case 'count': return 'bg-cyan-600/20 text-cyan-300 border-cyan-500/40';
    case 'textObjectPrefix': return 'bg-purple-600/20 text-purple-300 border-purple-500/40';
    case 'insert': return 'bg-green-600/20 text-green-300 border-green-500/40';
    case 'replace': return 'bg-orange-600/20 text-orange-300 border-orange-500/40';
    case 'findChar': return 'bg-blue-600/20 text-blue-300 border-blue-500/40';
    case 'searchControl': return 'bg-purple-600/20 text-purple-300 border-purple-500/40';
    case 'searchChar': return 'bg-purple-600/20 text-purple-300 border-purple-500/40';
    case 'enter': return 'bg-stone-600/20 text-stone-300 border-stone-500/40';
    case 'escape': return 'bg-red-600/20 text-red-300 border-red-500/40';
    case 'control': return 'bg-yellow-600/20 text-yellow-300 border-yellow-500/40';
    default: return 'bg-stone-600/20 text-stone-300 border-stone-500/40';
  }
};

const getStatusStyle = (status: KeyAtom['status']): string => {
  switch (status) {
    case 'pending': return 'animate-pulse';
    case 'ignored': return 'opacity-40 line-through';
    case 'cancelled': return 'opacity-50';
    default: return '';
  }
};

export const KeyChip: React.FC<KeyChipProps> = ({ keyAtom, groupStatus }) => {
  const { t } = useTranslationSafe(['keyHistory']);

  const kindColor = getKeyKindColor(keyAtom.kind);
  const statusStyle = getStatusStyle(keyAtom.status);

  const getTooltipContent = () => {
    const role = keyAtom.roleInGroup || keyAtom.kind;
    const roleText = t(`role.${role}`, role, { ns: 'keyHistory' });
    const kindText = t(`kind.${keyAtom.kind}`, keyAtom.kind, { ns: 'keyHistory' });
    const desc = keyAtom.description || '';

    return `${keyAtom.display} - ${roleText} (${kindText})${desc ? '\n' + desc : ''}`;
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center
        px-1.5 py-0.5 rounded
        text-[11px] font-mono
        border
        ${kindColor}
        ${statusStyle}
        transition-all
      `}
      title={getTooltipContent()}
    >
      {keyAtom.display}
    </span>
  );
};
