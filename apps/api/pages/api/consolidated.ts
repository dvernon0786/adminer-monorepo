// apps/api/pages/api/consolidated.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method || 'GET'
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    res.setHeader('Allow', 'GET, HEAD, OPTIONS')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const action = (req.query.action || '').toString()

  if (action === 'health') {
    // ZERO dependencies: no DB, no fetch, no env parsing
    return res.status(200).json({ status: 'healthy' })
  }

  if (action === 'billing/quota') {
    // legacy shim kept as no-op
    return res.status(200).json({ ok: true, shim: true })
  }

  return res.status(400).json({ error: 'Unknown action' })
} 