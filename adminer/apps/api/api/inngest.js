// Created at: Mon Sep  8 02:13:44 PM AEST 2025
// Timestamp: 1757304824

export default async function handler(req, res) {
  // Add timestamp to force cache busting
  const deployedAt = "1757304824";
  const createdAt = "Mon Sep  8 02:13:44 PM AEST 2025";
  
  if (req.method !== 'PUT') {
    return res.status(405).json({
      error: 'Method not allowed',
      deployedAt,
      createdAt
    });
  }

  // Return ONLY the format expected by Inngest Cloud
  return res.status(200).json({
    functions: [
      {
        id: "job/created",
        name: "Process Job Creation",
        triggers: ["job/created"]
      },
      {
        id: "scrape/process", 
        name: "Process Scrape Job",
        triggers: ["scrape/process"]
      }
    ],
    appId: "adminer-jobs-1757304824",
    appName: "Adminer Job Pipeline"
  });
}
// Manual deployment trigger - Mon Sep  8 05:57:04 PM AEST 2025
// Root directory fix test - Mon Sep  8 06:03:07 PM AEST 2025
// Configuration updated test - Mon Sep  8 06:17:22 PM AEST 2025
