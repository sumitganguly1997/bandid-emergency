'use client';

import dynamic from 'next/dynamic';

const DevModeOverlay = dynamic(() => import('./DevModeOverlay'), { ssr: false });

export default function DevModeWrapper() {
  if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') return null;
  return <DevModeOverlay />;
}
