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

export function StoreProvider({ initial, children }: { initial?: AppData; children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, initial, (seed) => seed ?? loadData());

  useEffect(() => saveData(data), [data]);

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
