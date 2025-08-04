import React, { useState } from 'react';

export default function Home() {
  const [urls, setUrls] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urls.split('\n').map(u => u.trim()).filter(Boolean) }),
      });

      const data = await res.json();

      // defensive: ensure data.screenshots is an array
      if (Array.isArray(data.screenshots)) {
        setImages(data.screenshots);
      } else {
        setImages([]);
        console.error('Unexpected response:', data);
      }
    } catch (err) {
      console.error('Failed to submit:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Screenshot App</h1>
      <textarea
        rows={6}
        cols={60}
        placeholder="Enter URLs (one per line)"
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
      />
      <br />
      <button onClick={handleSubmit} disabled={loading} style={{ marginTop: '1rem' }}>
        {loading ? 'Generating...' : 'Generate Screenshots'}
      </button>

      <div style={{ marginTop: '2rem' }}>
        {images.length > 0 && <h2>Generated Screenshots:</h2>}
        {images.map((src, idx) => (
          <div key={idx} style={{ marginBottom: '2rem' }}>
            <img src={src} alt={`Screenshot ${idx + 1}`} style={{ maxWidth: '100%', border: '1px solid #ccc' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
