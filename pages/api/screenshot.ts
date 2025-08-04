import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

const SCREENSHOTONE_API_KEY = process.env.SCREENSHOTONE_API_KEY;

type ScreenshotResult = {
  url: string;
  imageUrl?: string;
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { urls } = req.body;

  if (!Array.isArray(urls)) {
    return res.status(400).json({ error: 'Invalid request: "urls" must be an array' });
  }

  const results: ScreenshotResult[] = [];

  for (const url of urls) {
    try {
      const apiUrl = `https://api.screenshotone.com/take?url=${encodeURIComponent(url)}&output=image&viewport_height=4000&viewport_width=1920`;

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${SCREENSHOTONE_API_KEY}`,
        },
      });

      if (!response.ok) {
        const err = await response.text();
        results.push({ url, error: `Screenshot failed: ${err}` });
        continue;
      }

      const buffer = await response.buffer();

      // Optional: You could upload to Cloudinary or another CDN here
      // For now, we'll use base64 for testing
      const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

      results.push({ url, imageUrl: base64Image });
    } catch (err: any) {
      results.push({ url, error: err.message || 'Unknown error' });
    }
  }

  res.status(200).json(results);
}
