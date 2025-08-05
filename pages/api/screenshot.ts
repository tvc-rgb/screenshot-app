import type { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';

const SCREENSHOTONE_API_KEY = process.env.SCREENSHOTONE_API_KEY;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      const screenshotApi = `https://api.screenshotone.com/take?access_key=${SCREENSHOTONE_API_KEY}&url=${encodeURIComponent(
        url
      )}&viewport_width=1920&viewport_height=4000&format=png`;

      const screenshotRes = await fetch(screenshotApi);

      if (!screenshotRes.ok) {
        throw new Error(`Failed to fetch screenshot for ${url}`);
      }

      const buffer = await screenshotRes.arrayBuffer();
      const fileBuffer = Buffer.from(buffer);
      const fileName = `screenshots/${url.replace(/^https?:\/\//, '').replace(/[^\w.-]/g, '_')}-${Date.now()}.png`;

      const uploadResult = await cloudinary.uploader.upload_stream(
        {
          folder: 'screenshot-app',
          public_id: fileName,
          resource_type: 'image',
          overwrite: true,
        },
        (error, result) => {
          if (error || !result) {
            throw error || new Error('Cloudinary upload failed');
          }

          results.push({
            url,
            screenshotUrl: result.secure_url,
          });
        }
      );

      // Upload the file buffer to the Cloudinary stream
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'screenshot-app',
          public_id: fileName,
          resource_type: 'image',
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary error:', error);
            results.push({ url, error: error.message });
          } else {
            results.push({ url, screenshotUrl: result?.secure_url });
          }
        }
      );

      stream.end(fileBuffer);
    } catch (error: any) {
      console.error(`Error processing ${url}:`, error);
      results.push({ url, error: error.message || 'Unknown error' });
    }
  }

  return res.status(200).json({
    message: 'Screenshots complete',
    results,
  });
}
