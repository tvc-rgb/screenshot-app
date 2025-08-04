import { useState } from 'react';

export default function Home() {
  const [urls, setUrls] = useState('');
  const [results, setResults] = useState<Record<string, string[]> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urls.split('\n').map(u => u.trim()).filter(Boolean) }),
      });

      const data = await res.json();
      setResults(data.results || {});
    } catch (err) {
      console.error('Error:', err);
      setResults({ Error: ['Something went wrong'] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: 800, margin: 'auto' }}>
      <h1>🖼️ Screenshot Cropper</h1>
      <textarea
        rows={10}
        cols={60}
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        placeholder="Paste one URL per line"
        style={{ width: '100%', padding: '1rem', fontSize: '1rem', marginBottom: '1rem' }}
      />
      <br />
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
      >
        {loading ? 'Processing…' : 'Generate Screenshots'}
      </button>

      {results && (
        <div style={{ marginTop: '2rem' }}>
          <h2>📦 Results</h2>
          {Object.entries(results).map(([brand, images]) => (
            <div key={brand} style={{ marginBottom: '2rem' }}>
              <h3>{brand}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {images.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={`Screenshot ${i}`} width="240" style={{ borderRadius: 4 }} />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
