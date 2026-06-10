export default function Loading() {
  return (
    <div className="page-stack">
      <div className="page-loading" role="status" aria-live="polite">
        <div className="loading-spinner" aria-hidden="true" />
        <div>
          <strong>Wird geladen...</strong>
          <span>Daten werden vorbereitet.</span>
        </div>
      </div>
      <div className="loading-skeleton-grid" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
