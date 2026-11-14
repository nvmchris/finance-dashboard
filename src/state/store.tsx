import { createContext, useContext, useEffect, useReducer } from 'react';
import type { Dispatch, ReactNode } from 'react';
import { loadData, saveData } from '../lib/storage';
import type { AppData } from '../lib/types';
import { reducer } from './reducer';
import type { Action } from './reducer';

interface Store {
  data: AppData;
  dispatch: Dispatch<Action>;
}

const StoreContext = createContext<Store | null>(null);

interface StoreProviderProps {
  /** Starting data; defaults to whatever is saved in this browser. */
  initial?: AppData;
  /** Set to `false` for throwaway sessions such as the demo mode. */
  persist?: boolean;
  children: ReactNode;
}

export function StoreProvider({ initial, persist = true, children }: StoreProviderProps) {
  const [data, dispatch] = useReducer(reducer, initial, (seed) => seed ?? loadData());

  useEffect(() => {
    if (persist) saveData(data);
  }, [data, persist]);

  return <StoreContext value={{ data, dispatch }}>{children}</StoreContext>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <StoreProvider>');
  return store;
}

/** Looks up category names, falling back to the id for unknown categories. */
export function useCategoryName(): (id: string) => string {
  const { categories } = useStore().data;
  return (id) => categories.find((c) => c.id === id)?.name ?? id;
}
