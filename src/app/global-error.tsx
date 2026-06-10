"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  function reloadPage() {
    window.location.reload();
  }

  return (
    <html lang="de">
      <body>
        <main className="error-page">
          <section className="error-panel">
            <span>Finanzmanager</span>
            <h1>Die App muss neu geladen werden.</h1>
            <p>Bitte lade die Seite neu. Falls der Browser noch alte Dateien im Cache hat, hilft ein kompletter Refresh.</p>
            <div className="modal-actions">
              <button className="button secondary" type="button" onClick={reset}>
                Erneut versuchen
              </button>
              <button className="button primary" type="button" onClick={reloadPage}>
                Seite neu laden
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
