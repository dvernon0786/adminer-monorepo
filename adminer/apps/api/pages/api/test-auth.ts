import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(401).json({ error: 'Unauthorized GET' });
  }
  
  if (req.method === 'POST') {
    return res.status(200).json({ ok: true, method: 'POST' });
  }
  
  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: 'Method not allowed' });
} 