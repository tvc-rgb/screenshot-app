import React, { useState } from 'react';

type ScreenshotResult = {
  url: string;
  cloudinaryUrl?: string;
  error?: string;
};

export default function Home() {
  const [urls, setUrls] = useState('');
  const [results, setResults] = useState<ScreenshotResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setResults([]);

    const urlList = urls
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlList }),
      });

      const data = await res.json();

      if (Array.isArray(data.results)) {
        setResults(data.results);
      } else {
        console.error('Unexpected response:', data);
      }
    } catch (err) {
      console.error('Error submitting URLs', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>🖼️ Screenshot App</h1>
      <p>Paste one URL per line:</p>
      <textarea
        rows={6}
        cols={60}
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        placeholder="https://wormhole.com\nhttps://layerzero.network"
      />
      <br />
      <button onClick={handleSubmit} disabled={loading} style={{ marginTop: '1rem' }}>
        {loading ? 'Capturing…' : 'Generate Screenshots'}
      </button>

      <div style={{ marginTop: '2rem' }}>
        {results.map((result, i) => (
          <div key={i} style={{ marginBottom: '2rem' }}>
            <h3>{result.url}</h3>
            {result.cloudinaryUrl ? (
              <img src={result.cloudinaryUrl} alt={`Screenshot for ${result.url}`} style={{ maxWidth: '100%' }} />
            ) : (
              <p style={{ color: 'red' }}>❌ {result.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
