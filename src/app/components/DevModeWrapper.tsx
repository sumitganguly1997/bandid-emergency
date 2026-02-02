'use client';

import dynamic from 'next/dynamic';

const DevModeOverlay = dynamic(() => import('./DevModeOverlay'), { ssr: false });

const IS_DEV = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export default function DevModeWrapper() {
  if (!IS_DEV) return null;
  return <DevModeOverlay />;
}
