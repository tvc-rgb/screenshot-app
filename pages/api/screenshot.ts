import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

const SCREENSHOTONE_API_KEY = process.env.SCREENSHOTONE_API_KEY;

type ScreenshotResult = {
  url: string;
  imageUrl?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ScreenshotResult[] | { error: string }>
) {
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
      const apiUrl = `https://api.screenshotone.com/take?url=${encodeURIComponent(
        url
      )}&output=image&viewport_width=1920&viewport_height=4000&format=png`;

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${SCREENSHOTONE_API_KEY}`,
        },
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        console.error(`[ERROR] ScreenshotOne response:`, errorMessage);
        results.push({ url, error: `Screenshot failed: ${errorMessage}` });
        continue;
      }

      const buffer = await response.buffer();
      const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

      results.push({ url, imageUrl: base64Image });
    } catch (error: any) {
      console.error(`[ERROR] Processing ${url}:`, error.message || error);
      results.push({ url, error: error.message || 'Unknown error' });
    }
  }

  res.status(200).json(results);
}
