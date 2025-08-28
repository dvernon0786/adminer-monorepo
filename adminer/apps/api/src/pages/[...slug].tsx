import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CatchAllPage() {
  const router = useRouter();

  useEffect(() => {
    // This is a catch-all route that should serve the SPA
    // The SPA will handle its own routing
  }, []);

  // Return the SPA content
  return (
    <div id="root">
      {/* This will be replaced by the SPA */}
      <div>Loading SPA...</div>
    </div>
  );
}

// This ensures the page is statically generated
export async function getStaticProps() {
  return {
    props: {},
  };
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  };
} 