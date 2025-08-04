import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  message: string;
  urls?: string[];
  error?: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ 
        message: 'Bad request',
        error: 'URLs must be provided as an array' 
      });
    }

    if (urls.length === 0) {
      return res.status(400).json({ 
        message: 'Bad request',
        error: 'At least one URL must be provided' 
      });
    }

    // Log the URLs for now
    console.log('Received URLs for screenshot generation:');
    urls.forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });

    // TODO: Implement actual screenshot logic here

    res.status(200).json({ 
      message: 'URLs received successfully',
      urls: urls 
    });
  } catch (error) {
    console.error('Error processing screenshot request:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
