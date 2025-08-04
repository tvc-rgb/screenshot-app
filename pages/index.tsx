import React, { useState } from 'react';

type ScreenshotResult = {
  url: string;
  imageUrl?: string;
  error?: string;
};

export default function Home() {
  const [urls, setUrls] = useState('');
  const [results, setResults] = useState<ScreenshotResult[]>([]);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setResults([]);

    const urlList = urls
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    try {
      const response = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlList }),
      });

      const data = await response.json();

      if (!Array.isArray(data)) {
        setError('Unexpected response from API');
        return;
      }

      setResults(data);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>🖼 Website Screenshot Tool</h1>
      <textarea
        rows={10}
        cols={60}
        placeholder="Enter one URL per line"
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        style={{ fontSize: '1rem', padding: '1rem' }}
      />
      <br />
      <button onClick={handleSubmit} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
        Capture Screenshots
      </button>

      {error && <p style={{ color: 'red' }}>⚠️ {error}</p>}

      {results.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          {results.map((result, index) => (
            <div key={index} style={{ marginBottom: '2rem' }}>
              <strong>{result.url}</strong>
              {result.imageUrl ? (
                <div>
                  <img src={result.imageUrl} alt="Screenshot" style={{ maxWidth: '100%', border: '1px solid #ccc' }} />
                </div>
              ) : (
                <p style={{ color: 'red' }}>❌ {result.error || 'Failed to capture screenshot'}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
