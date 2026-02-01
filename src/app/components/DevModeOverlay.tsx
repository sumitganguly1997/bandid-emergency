'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface ApiLog {
  id: number;
  method: string;
  url: string;
  status: number;
  duration: number;
  timestamp: Date;
}

interface DevState {
  userId: string | null;
  activeBandId: string | null;
  bands: string[];
  seeded: boolean;
}

export default function DevModeOverlay() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<'state' | 'api' | 'actions'>('state');
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [devState, setDevState] = useState<DevState>({ userId: null, activeBandId: null, bands: [], seeded: false });
  const [seeding, setSeeding] = useState(false);
  const logIdRef = useRef(0);
  const interceptedRef = useRef(false);

  // Refresh local state
  const refreshState = useCallback(() => {
    setDevState({
      userId: localStorage.getItem('userId'),
      activeBandId: localStorage.getItem('activeBandId'),
      bands: devState.bands,
      seeded: devState.seeded,
    });
  }, [devState.bands, devState.seeded]);

  // Intercept fetch to log API calls
  useEffect(() => {
    if (interceptedRef.current) return;
    interceptedRef.current = true;
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const req = new Request(...args);
      const url = req.url;
      // Only log API calls
      if (!url.includes('/api/')) return originalFetch(...args);
      const method = req.method;
      const start = performance.now();
      try {
        const res = await originalFetch(...args);
        const duration = Math.round(performance.now() - start);
        setApiLogs(prev => [{ id: ++logIdRef.current, method, url: url.replace(location.origin, ''), status: res.status, duration, timestamp: new Date() }, ...prev].slice(0, 50));
        return res;
      } catch (err) {
        const duration = Math.round(performance.now() - start);
        setApiLogs(prev => [{ id: ++logIdRef.current, method, url: url.replace(location.origin, ''), status: 0, duration, timestamp: new Date() }, ...prev].slice(0, 50));
        throw err;
      }
    };
  }, []);

  // Refresh state on route change
  useEffect(() => {
    refreshState();
  }, [pathname, refreshState]);

  async function handleSeed() {
    setSeeding(true);
    try {
      const res = await fetch('/api/dev/seed', { method: 'POST', credentials: 'same-origin' });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('activeBandId', data.bands[0]);
        setDevState({ userId: data.userId, activeBandId: data.bands[0], bands: data.bands, seeded: true });
      }
    } catch (err) {
      console.error('Dev seed failed', err);
    } finally {
      setSeeding(false);
    }
  }

  function clearDevData() {
    localStorage.removeItem('userId');
    localStorage.removeItem('activeBandId');
    document.cookie = 'bandid_token=; path=/; max-age=0';
    setDevState({ userId: null, activeBandId: null, bands: [], seeded: false });
  }

  const statusColor = (s: number) => s >= 200 && s < 300 ? 'text-green-400' : s >= 400 ? 'text-red-400' : 'text-yellow-400';

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, fontFamily: 'monospace', fontSize: 12 }}>
      {/* Toggle bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{ position: 'fixed', bottom: 8, right: 8, zIndex: 10000, background: '#6366f1', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
        title="Dev Mode"
      >
        <span style={{ fontSize: 18 }}>{expanded ? '\u2715' : '\u2699'}</span>
      </button>

      {expanded && (
        <div style={{ background: '#1e1e2e', color: '#cdd6f4', borderTop: '2px solid #6366f1', maxHeight: '45vh', overflow: 'auto' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #313244', padding: '0 8px' }}>
            {(['state', 'api', 'actions'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', background: 'none', border: 'none', color: tab === t ? '#6366f1' : '#6c7086', fontWeight: tab === t ? 700 : 400, borderBottom: tab === t ? '2px solid #6366f1' : '2px solid transparent', cursor: 'pointer', fontFamily: 'monospace', fontSize: 12 }}>
                {t.toUpperCase()}
              </button>
            ))}
            <div style={{ marginLeft: 'auto', padding: '8px 12px', color: '#6c7086' }}>
              {pathname}
            </div>
          </div>

          <div style={{ padding: 12 }}>
            {tab === 'state' && (
              <div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#6c7086' }}>Route: </span><span style={{ color: '#89b4fa' }}>{pathname}</span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#6c7086' }}>userId: </span><span style={{ color: devState.userId ? '#a6e3a1' : '#f38ba8' }}>{devState.userId || 'null'}</span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#6c7086' }}>activeBandId: </span><span style={{ color: devState.activeBandId ? '#a6e3a1' : '#f38ba8' }}>{devState.activeBandId || 'null'}</span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#6c7086' }}>seeded: </span><span>{devState.seeded ? 'yes' : 'no'}</span>
                </div>
                {devState.bands.length > 0 && (
                  <div>
                    <span style={{ color: '#6c7086' }}>bands: </span>
                    {devState.bands.map(b => (
                      <a key={b} href={`/band/${b}`} style={{ color: '#89b4fa', marginRight: 8, textDecoration: 'underline' }}>{b}</a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'api' && (
              <div>
                {apiLogs.length === 0 && <div style={{ color: '#6c7086' }}>No API calls yet</div>}
                {apiLogs.map(log => (
                  <div key={log.id} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid #313244' }}>
                    <span style={{ color: '#cba6f7', minWidth: 40 }}>{log.method}</span>
                    <span className={statusColor(log.status)} style={{ minWidth: 30 }}>{log.status || 'ERR'}</span>
                    <span style={{ flex: 1, color: '#cdd6f4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.url}</span>
                    <span style={{ color: '#6c7086' }}>{log.duration}ms</span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'actions' && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={handleSeed} disabled={seeding} style={{ padding: '6px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: seeding ? 0.5 : 1 }}>
                  {seeding ? 'Seeding...' : 'Seed DB & Auto-Login'}
                </button>
                <button onClick={clearDevData} style={{ padding: '6px 14px', background: '#f38ba8', color: '#1e1e2e', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                  Clear Auth & Storage
                </button>
                <button onClick={() => { window.location.href = '/edit-profile'; }} style={{ padding: '6px 14px', background: '#313244', color: '#cdd6f4', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                  Go to Edit Profile
                </button>
                <button onClick={() => { window.location.href = `/band/${devState.activeBandId || 'BAND-0001'}`; }} style={{ padding: '6px 14px', background: '#313244', color: '#cdd6f4', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                  View Active Band
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
