import { useState } from 'react';
import type { NextPage } from 'next';

const Home: NextPage = () => {
  const [urls, setUrls] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse('');

    const urlArray = urls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    try {
      const res = await fetch('/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls: urlArray }),
      });

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Screenshot Generator</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="urls" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Enter URLs (one per line):
          </label>
          <textarea
            id="urls"
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder="https://example.com&#10;https://google.com&#10;https://github.com"
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '0.5rem',
              fontSize: '16px',
              fontFamily: 'monospace',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading || urls.trim().length === 0}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '16px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading || urls.trim().length === 0 ? 'not-allowed' : 'pointer',
            opacity: loading || urls.trim().length === 0 ? 0.6 : 1,
          }}
        >
          {loading ? 'Processing...' : 'Generate Screenshots'}
        </button>
      </form>
      {response && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Response:</h3>
          <pre style={{
            backgroundColor: '#f5f5f5',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
          }}>
            {response}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Home;
