import React, { useState } from 'react';

export default function Home() {
  const [urls, setUrls] = useState('');
  const [screenshots, setScreenshots] = useState<any[]>([]);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setScreenshots([]);
    try {
      const res = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urls.split('\n').map((u) => u.trim()).filter(Boolean) }),
      });

      const data = await res.json();

      if (res.ok && Array.isArray(data.results)) {
        setScreenshots(data.results);
      } else {
        setError(data.message || 'Something went wrong');
      }
    } catch (err: any) {
      setError(err.message || 'Request failed');
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>📸 Website Screenshot App</h1>
      <p>Enter URLs (one per line):</p>
      <textarea
        rows={10}
        cols={60}
        placeholder="https://example.com"
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        style={{ padding: '1rem', fontSize: '1rem' }}
      />
      <br />
      <button onClick={handleSubmit} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
        Generate Screenshots
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginTop: '2rem' }}>
        {Array.isArray(screenshots) &&
          screenshots.map((item, i) => (
            <div key={i} style={{ marginBottom: '2rem' }}>
              <p>{item.url}</p>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={`Screenshot of ${item.url}`} style={{ width: '100%', maxWidth: '960px' }} />
              ) : (
                <p style={{ color: 'red' }}>❌ Failed to capture screenshot</p>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
