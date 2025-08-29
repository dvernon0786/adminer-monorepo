import { useEffect } from 'react';

export default function DashboardPage() {
  useEffect(() => {
    // Redirect to the static SPA file
    window.location.href = '/index.html';
  }, []);

  return (
    <div>
      <p>Redirecting to dashboard...</p>
    </div>
  );
} 