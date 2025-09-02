const { DodoClient } = require('../src/lib/dodo.cjs');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { plan = 'pro-500', orgId = 'test-org' } = req.query;
  
  try {
    const dodo = new DodoClient();
    const session = await dodo.createCheckoutSession(plan, orgId);
    
    return res.status(200).json({
      success: true,
      checkoutUrl: session.checkout_url,
      sessionId: session.id,
      plan: plan
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}