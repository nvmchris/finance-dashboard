import { useRef } from 'react';
import type { ChangeEvent } from 'react';

interface ImportButtonProps {
  onFile: (text: string) => void;
  className?: string;
}

/** A button that opens the file picker and hands the CSV text to `onFile`. */
export function ImportButton({ onFile, className = 'button' }: ImportButtonProps) {
  const input = useRef<HTMLInputElement>(null);

  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so picking the same file again still fires a change event.
    event.target.value = '';
    if (file) onFile(await file.text());
  };

  return (
    <>
      <button type="button" className={className} onClick={() => input.current?.click()}>
        Import CSV
      </button>
      <input
        ref={input}
        type="file"
        accept=".csv,text/csv,text/plain"
        aria-label="CSV file"
        hidden
        onChange={onChange}
      />
    </>
  );
}
