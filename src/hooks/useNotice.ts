import { useEffect, useState } from 'react';

const NOTICE_DURATION_MS = 6000;

export interface Notice {
  kind: 'info' | 'error';
  text: string;
}

/** A single transient message that dismisses itself. */
export function useNotice() {
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  return [notice, setNotice] as const;
}
