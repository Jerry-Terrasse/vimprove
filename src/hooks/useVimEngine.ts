import { useReducer } from 'react';
import { vimReducer, INITIAL_VIM_STATE } from '@/core/vimReducer';
import type { VimState, VimAction } from '@/core/types';

export const useVimEngine = (initialState?: Partial<VimState>) => {
  const [state, dispatch] = useReducer(
    vimReducer,
    { ...INITIAL_VIM_STATE, ...initialState }
  );

  return { state, dispatch };
};
