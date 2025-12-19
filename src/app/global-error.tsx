
'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: '2rem' }}>
          <h2>Something went wrong!</h2>
          <p>An unexpected error occurred. Please try again.</p>
          <pre style={{
            background: '#f1f1f1',
            padding: '1rem',
            borderRadius: '0.5rem',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
          }}>
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
          <button onClick={() => reset()}>Try again</button>
        </div>
      </body>
    </html>
  );
}
