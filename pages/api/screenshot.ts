import type { NextApiRequest, NextApiResponse } from 'next';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const getBrandName = (url: string) => {
  const { hostname } = new URL(url);
  return hostname.replace(/^www\./, '').split('.')[0];
};

const captureScreenshot = async (url: string): Promise<Buffer> => {
  const res = await fetch('https://api.screenshotone.com/take', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SCREENSHOTONE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      fullPage: true,
      viewportWidth: 1920,
      format: 'png',
    }),
  });

  const data = await res.json();
  console.log("ScreenshotOne raw response for", url, ":", data);

  if (!data?.screenshot?.url) {
    throw new Error(`ScreenshotOne failed for ${url}: ${JSON.stringify(data)}`);
  }

  const imageRes = await fetch(data.screenshot.url);
  const buffer = await imageRes.arrayBuffer();
  return Buffer.from(buffer);
};

const cropAndUpload = async (imageBuffer: Buffer, brand: string) => {
  const metadata = await sharp(imageBuffer).metadata();
  const chunks: string[] = [];
  const width = metadata.width || 1920;
  const height = metadata.height || 4000;

  for (let top = 0, i = 1; top < height; top += 4000, i++) {
    const crop = await sharp(imageBuffer)
      .extract({ left: 0, top, width, height: Math.min(4000, height - top) })
      .toBuffer();

    console.log("Uploading this buffer to Cloudinary for", brand);

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: brand,
          public_id: `part-${i}`,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      stream.end(crop);
    });

    console.log("Cloudinary response:", uploadResult?.secure_url);
    chunks.push(uploadResult.secure_url);
  }

  return chunks;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { urls } = req.body;
  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'No URLs provided' });
  }

  const results: Record<string, string[]> = {};

  for (const url of urls) {
    try {
      const brand = getBrandName(url);
      const screenshot = await captureScreenshot(url);
      const uploads = await cropAndUpload(screenshot, brand);
      results[brand] = uploads;
    } catch (err) {
      console.error(`❌ Error processing ${url}:`, err);
      results[url] = [`Error: ${err instanceof Error ? err.message : String(err)}`];
    }
  }

  console.log("FINAL screenshot results:", results);

  res.status(200).json({ results });
}
