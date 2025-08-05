import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const SCREENSHOTONE_API_KEY = process.env.SCREENSHOTONE_API_KEY;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { urls } = req.body;

  if (!Array.isArray(urls)) {
    return res.status(400).json({ message: 'Invalid URL list' });
  }

  const results: any[] = [];

  for (const url of urls) {
    try {
      const apiUrl = `https://api.screenshotone.com/take` +
        `?access_key=${SCREENSHOTONE_API_KEY}` +
        `&url=${encodeURIComponent(url)}` +
        `&viewport_width=1920` +
        `&viewport_height=4000` +
        `&format=png`;

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch screenshot for ${url}`);
      }

      const buffer = await response.arrayBuffer();
      const folderName = url.replace(/^https?:\/\//, '').split('/')[0];
      const fileName = `${folderName}-${Date.now()}.png`;

      const outputPath = path.join(process.cwd(), 'public', 'screenshots');
      await fs.mkdir(outputPath, { recursive: true });
      await fs.writeFile(path.join(outputPath, fileName), Buffer.from(buffer));

      // Optionally: crop vertically into 1000px segments
      const image = sharp(Buffer.from(buffer));
      const metadata = await image.metadata();
      const height = metadata.height ?? 4000;

      const crops: string[] = [];

      for (let i = 0; i < height; i += 1000) {
        const croppedBuffer = await image.extract({
          left: 0,
          top: i,
          width: 1920,
          height: Math.min(1000, height - i)
        }).toBuffer();

        const cropFileName = `${folderName}-crop-${i}.png`;
        await fs.writeFile(path.join(outputPath, cropFileName), croppedBuffer);

        crops.push(`/screenshots/${cropFileName}`);
      }

      results.push({
        url,
        crops
      });

    } catch (error) {
      console.error(`Error processing ${url}:`, error);
      results.push({ url, error: (error as Error).message });
    }
  }

  res.status(200).json({ message: 'Screenshots complete', results });
}
