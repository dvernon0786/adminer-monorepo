import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "node:crypto";
import { withInternalSecurity } from "../../middleware/internal-security";

function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const signature = req.headers["dodo-signature"] || req.headers["x-dodo-signature"];
    const timestamp = req.headers["dodo-timestamp"] || req.headers["x-dodo-timestamp"];
    
    if (!signature || !timestamp) {
      return res.status(400).json({ 
        ok: false, 
        reason: "missing-headers",
        required: ["dodo-signature", "dodo-timestamp"],
        received: {
          signature: !!signature,
          timestamp: !!timestamp
        }
      });
    }

    // Parse signature format (supports both raw hex and t=timestamp,v1=hex)
    let sigHex: string;
    let ts: string;
    
    if (typeof signature === "string" && signature.includes(",")) {
      // Format: t=timestamp,v1=hex
      const parts = signature.split(",");
      const tsPart = parts.find(p => p.startsWith("t="));
      const sigPart = parts.find(p => p.startsWith("v1="));
      
      if (!tsPart || !sigPart) {
        return res.status(400).json({ 
          ok: false, 
          reason: "invalid-signature-format",
          expected: "t=timestamp,v1=hex or raw hex",
          received: signature
        });
      }
      
      ts = tsPart.substring(2);
      sigHex = sigPart.substring(3);
    } else {
      // Raw hex format
      sigHex = signature as string;
      ts = timestamp as string;
    }

    // Validate timestamp (5 minute tolerance)
    const now = Math.floor(Date.now() / 1000);
    const tsNum = parseInt(ts, 10);
    if (isNaN(tsNum) || Math.abs(now - tsNum) > 300) {
      return res.status(400).json({ 
        ok: false, 
        reason: "timestamp-expired",
        tolerance: "5 minutes",
        received: tsNum,
        now: now,
        diff: Math.abs(now - tsNum)
      });
    }

    // Validate signature format (should be hex)
    if (!/^[0-9a-f]+$/i.test(sigHex)) {
      return res.status(400).json({ 
        ok: false, 
        reason: "invalid-signature-format",
        expected: "hexadecimal string",
        received: sigHex
      });
    }

    // If we have the webhook secret, we could verify the actual signature
    // For now, just validate the format
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
    if (webhookSecret) {
      const expectedSig = crypto
        .createHmac("sha256", webhookSecret)
        .update(`${ts}.${JSON.stringify(req.body)}`)
        .digest("hex");
      
      if (!crypto.timingSafeEqual(
        Buffer.from(sigHex, "hex"),
        Buffer.from(expectedSig, "hex")
      )) {
        return res.status(400).json({ 
          ok: false, 
          reason: "signature-mismatch",
          expected: expectedSig,
          received: sigHex
        });
      }
    }

    return res.status(204).end();
  } catch (error) {
    return res.status(400).json({ 
      ok: false, 
      reason: "validation-error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

// Export with security middleware
export default withInternalSecurity(handler); 