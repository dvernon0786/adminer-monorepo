import { useEffect } from 'react'

export default function IndexPage() {
  useEffect(() => {
    // This is the SPA entry point
    // For production, this should serve the built SPA from public/index.html
    console.log('SPA index page loaded')
  }, [])

  return (
    <div>
      <h1>Adminer SPA</h1>
      <p>This is the SPA entry point for all client-side routes.</p>
      <p>In production, this should serve the built SPA from public/index.html</p>
    </div>
  )
} 