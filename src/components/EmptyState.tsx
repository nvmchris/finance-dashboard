import { ImportButton } from './ImportButton';

interface EmptyStateProps {
  onFile: (text: string) => void;
  onDemo: () => void;
}

export function EmptyState({ onFile, onDemo }: EmptyStateProps) {
  return (
    <section className="empty-state">
      <h2>See where your money goes</h2>
      <p>
        Import a CSV export from your bank to get started. Everything stays in this browser —
        nothing is uploaded.
      </p>
      <div className="empty-state__actions">
        <ImportButton onFile={onFile} className="button button--primary" />
        <button type="button" className="button" onClick={onDemo}>
          Load demo data
        </button>
      </div>
    </section>
  );
}
