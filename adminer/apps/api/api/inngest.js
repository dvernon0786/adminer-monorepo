import { Inngest } from "inngest";

const inngest = new Inngest({ 
  id: "adminer-jobs",
  name: "Adminer Job Pipeline"
});

export default async function handler(req, res) {
  const isDev = process.env.NODE_ENV === 'development';
  const baseUrl = isDev 
    ? 'http://localhost:3000' 
    : 'https://adminer-api.vercel.app';

  // Register functions with Inngest
  const functions = [
    {
      id: "job/created",
      name: "Process Job Creation"
    },
    {
      id: "scrape/process",
      name: "Process Scrape Job"
    }
  ];

  // Return the format expected by Inngest Cloud
  return res.status(200).json({
    functions: functions,
    appId: "adminer-jobs", 
    appName: "Adminer Job Pipeline"
  });
}
