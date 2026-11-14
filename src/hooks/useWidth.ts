import { useLayoutEffect, useRef, useState } from 'react';

/** Tracks an element's width so SVG charts can lay out in real pixels. */
export function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  // Layout effect: measure before the first paint so charts never flash at the fallback width.
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (element.clientWidth > 0) setWidth(element.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}
