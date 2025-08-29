import { readFileSync } from 'fs';
import { join } from 'path';

export default function CatchAllPage() {
  // Read our SPA index.html and serve it for all routes
  try {
    const publicDir = join(process.cwd(), 'public');
    const indexPath = join(publicDir, 'index.html');
    const html = readFileSync(indexPath, 'utf8');
    
    return (
      <div dangerouslySetInnerHTML={{ __html: html }} />
    );
  } catch (error) {
    console.error('Failed to read SPA index.html:', error);
    return (
      <div>
        <h1>Application Loading Error</h1>
        <p>Failed to load the application. Please try again.</p>
      </div>
    );
  }
} 