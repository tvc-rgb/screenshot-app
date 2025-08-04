import type { NextApiRequest, NextApiResponse } from 'next';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// --- Cloudinary upload wrapped in a Promise ---
const uploadToCloudinary = (buffer: Buffer, folder: string) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: 'screenshot-1920x4000',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );
    stream.end(buffer);
  });
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
      screenshot_options: {
        viewport: {
          width: 1920,
          height: 4000,
        },
        format: 'png',
      },
    }),
  });

  const data = await res.json();
  console.log('ScreenshotOne raw response:', data);

  if (!data?.screenshot?.url) {
    throw new Error(`ScreenshotOne failed: ${JSON.stringify(data)}`);
  }

  const imageRes = await fetch(data.screenshot.url);
  const buffer = await imageRes.arrayBuffer();
  return Buffer.from(buffer);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { urls } = req.body;
  if (!Array.isArray(urls)) {
    return res.status(400).json({ message: 'Invalid request body. Expected an array of URLs.' });
  }

  const results = [];

  for (const url of urls) {
    try {
      const imageBuffer = await captureScreenshot(url);
      const processedImage = await sharp(imageBuffer).png().toBuffer();
      const domainName = new URL(url).hostname.replace('www.', '');

      const uploadResult: any = await uploadToCloudinary(processedImage, domainName);
      results.push({ url, cloudinaryUrl: uploadResult.secure_url });
    } catch (error: any) {
      console.error(`Error processing ${url}:`, error);
      results.push({ url, error: error.message });
    }
  }

  return res.status(200).json({ message: 'Processed', results });
}
