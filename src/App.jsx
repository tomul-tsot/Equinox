import { useState, useEffect, useRef } from "react";
import { analyzeDisasterSignals } from "./services/gemini";
import "./index.css";

const API_BASE = "http://localhost:5001/api";

// ─── helpers ─────────────────────────────────────────────────────────────────
function Clock() {
  const [t, setT] = useState(new Date().toLocaleTimeString());
  useEffect(() => {
    const id = setInterval(() => setT(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="topbar-clock">{t}</span>;
}

// ─── Map panel ────────────────────────────────────────────────────────────────
function MapPanel({ scenario }) {
  if (!scenario) {
    return (
      <div className="map-placeholder">
        <div style={{ fontSize: "2rem", opacity: 0.2 }}>🗺</div>
        <div style={{ color: "var(--text2)", fontWeight: 500 }}>No incident selected</div>
        <div>Select a disaster from the Incident Feed to see its location.</div>
      </div>
    );
  }
  const src = `https://maps.google.com/maps?q=${scenario.lat},${scenario.lng}&z=11&output=embed`;
  return (
    <>
      <div className="map-meta">
        <div>📍 <strong>{scenario.name}</strong></div>
        <div className="map-coords">{scenario.lat.toFixed(4)}°N, {Math.abs(scenario.lng).toFixed(4)}°E</div>
      </div>
      <iframe key={scenario.id} className="map-iframe" src={src} title={scenario.name} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
    </>
  );
}

// ─── Signal row ───────────────────────────────────────────────────────────────
function SignalRow({ signal }) {
  const cls = `src-${signal.source.replace(/\s/g, "_")}`;
  return (
    <div className="signal-row">
      <span style={{ color: "var(--text3)", fontFamily: "monospace" }}>{signal.timestamp}</span>
      <span className={cls}>{signal.source.replace(/_/g, " ")}</span>
      <span style={{ color: "var(--text2)" }}>{signal.value}</span>
    </div>
  );
}

// ─── AI Analysis panel ────────────────────────────────────────────────────────
function AnalysisPanel({ scenario, onHandled }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);       // "failed"
  const [insufficient, setInsufficient] = useState(false);
  const prevId = useRef(null);

  useEffect(() => {
    if (!scenario) {
      setAnalysis(null);
      setError(null);
      setInsufficient(false);
      prevId.current = null;
      return;
    }
    if (scenario.id === prevId.current) return; // already loaded
    prevId.current = scenario.id;

    setLoading(true);
    setAnalysis(null);
    setError(null);
    setInsufficient(false);

    // Simulation logic to force states for test scenarios
    if (scenario.id === 99) {
      setTimeout(() => {
        setInsufficient(true);
        setLoading(false);
      }, 800);
      return;
    }
    if (scenario.id === 100) {
      setTimeout(() => {
        setError(true);
        setLoading(false);
      }, 800);
      return;
    }

    analyzeDisasterSignals(scenario.signals, scenario.name)
      .then((result) => {
        if (!result?.threat_level) {
          setInsufficient(true);
        } else {
          setAnalysis(result);
        }
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [scenario?.id]);

  // ── empty ──
  if (!scenario) {
    return (
      <div className="col-body" style={{ display: "flex", flexDirection: "column" }}>
        <div className="analysis-empty">
          <div className="analysis-empty-icon">⬡</div>
          <div className="analysis-empty-title">No incident selected</div>
          <div className="analysis-empty-sub">Click a disaster from the Incident Feed to begin analysis.</div>
        </div>
      </div>
    );
  }

  // ── loading ──
  if (loading) {
    return (
      <div className="col-body" style={{ display: "flex", flexDirection: "column" }}>
        <div className="loading-state">
          <div className="spinner" />
          <div className="loading-text">Analyzing crisis signal using Gemini…</div>
          <div className="loading-sub">Processing {scenario.signals.length} signals</div>
        </div>
      </div>
    );
  }

  const threatColors = { CRITICAL: "var(--red)", HIGH: "var(--orange)", MEDIUM: "var(--yellow)", LOW: "var(--green)" };
  const threatColor = analysis ? (threatColors[analysis.threat_level] ?? "var(--cyan)") : null;

  return (
    <div className="col-body">
      <div className="analysis-section">

        {/* ── Error state ── */}
        {error && (
          <div className="banner banner-red">
            <span style={{ fontSize: "1.1rem" }}>✕</span>
            <div>
              <div className="banner-title">Analysis Failed</div>
              Gemini service unavailable — check your <code style={{ background: "rgba(239,68,68,0.1)", padding: "1px 4px", borderRadius: "3px" }}>VITE_GEMINI_API_KEY</code> in <code style={{ background: "rgba(239,68,68,0.1)", padding: "1px 4px", borderRadius: "3px" }}>.env</code>.
            </div>
          </div>
        )}

        {/* ── Insufficient data ── */}
        {insufficient && (
          <div className="banner banner-yellow">
            <span style={{ fontSize: "1.1rem" }}>⚠</span>
            <div>
              <div className="banner-title">Insufficient Data to Classify</div>
              The signals are too weak or ambiguous for a confident classification. Try adding more specific signals with location and severity details.
            </div>
          </div>
        )}

        {/* ── Full analysis ── */}
        {analysis && (
          <>
            {/* Threat summary */}
            <div className="acard" style={{ borderColor: `${threatColor}30`, background: `${threatColor}06` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "1rem" }}>{scenario.emoji}</span>
                <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{scenario.name}</span>
                <span className={`sev sev-${analysis.threat_level}`}>{analysis.threat_level}</span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text2)", lineHeight: 1.6 }}>{analysis.primary_threat}</div>
            </div>

            {/* Gemini reasoning */}
            <div className="acard-gemini">
              <div className="gemini-label">
                <span className="gemini-dot" />
                Gemini AI Reasoning
                <span style={{ fontWeight: 400, fontSize: "0.58rem", color: "rgba(34,211,238,0.6)", letterSpacing: 0 }}>— Explanation Generated by Gemini</span>
              </div>
              <div className="reasoning-text">{analysis.reasoning}</div>
              {analysis.next_6_hours_prediction && (
                <div className="prediction-block">
                  <div className="prediction-label">⚠ Prediction — If No Action Taken</div>
                  {analysis.next_6_hours_prediction}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="acard">
              <div className="acard-label">Immediate Actions</div>
              {analysis.immediate_actions?.map((a, i) => (
                <div key={i} className="action-row">
                  <div className="action-num">{a.priority}</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: "0.78rem" }}>{a.action}</span>
                    {a.time_sensitive && <span className="urgent-tag">urgent</span>}
                    <div style={{ fontSize: "0.65rem", color: "var(--text2)", marginTop: "2px" }}>{a.sector}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Resources */}
            <div className="acard">
              <div className="acard-label">Resource Allocation</div>
              <div className="stat-grid">
                {[
                  { val: analysis.resource_allocation?.rescue_units, lbl: "Rescue Units", color: "var(--cyan)" },
                  { val: analysis.resource_allocation?.medical_teams, lbl: "Medical Teams", color: "var(--green)" },
                  { val: analysis.resource_allocation?.supply_drops, lbl: "Supply Drops", color: "var(--yellow)" },
                  { val: analysis.resource_allocation?.evacuation_buses, lbl: "Evac. Buses", color: "var(--orange)" },
                ].map(({ val, lbl, color }) => (
                  <div key={lbl} className="stat-cell">
                    <div className="stat-val" style={{ color }}>{val ?? "—"}</div>
                    <div className="stat-lbl">{lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Affected info */}
            <div className="acard" style={{ fontSize: "0.75rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <div className="acard-label">Est. Affected</div>
                  <div style={{ color: "var(--orange)", fontWeight: 700 }}>{analysis.estimated_affected_population ?? "—"}</div>
                </div>
                <div>
                  <div className="acard-label">Credibility</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ color: "var(--green)" }}>● {analysis.signal_credibility?.high ?? 0} High</span>
                    <span style={{ color: "var(--yellow)" }}>● {analysis.signal_credibility?.medium ?? 0} Medium</span>
                    <span style={{ color: "var(--red)" }}>● {analysis.signal_credibility?.low ?? 0} Low</span>
                  </div>
                </div>
              </div>
              {analysis.affected_zones?.length > 0 && (
                <div style={{ marginTop: "0.65rem" }}>
                  <div className="acard-label" style={{ marginBottom: "0.35rem" }}>Affected Zones</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {analysis.affected_zones.map((z, i) => (
                      <span key={i} style={{ fontSize: "0.62rem", padding: "2px 7px", border: "1px solid var(--border2)", borderRadius: "3px", color: "var(--text2)" }}>{z}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Signal feed */}
            <div className="acard">
              <div className="acard-label">Signal Feed ({scenario.signals.length})</div>
              <div style={{ maxHeight: "160px", overflowY: "auto" }}>
                {scenario.signals.map((s, i) => <SignalRow key={i} signal={s} />)}
              </div>
            </div>
          </>
        )}

        {/* ── Mark as Handled ── (show when there's any result state or error) */}
        {(analysis || error || insufficient) && (
          <button className="handled-btn" onClick={() => onHandled(scenario)}>
            ✓ &nbsp; Disaster Handled — Move to History
          </button>
        )}

      </div>
    </div>
  );
}

// ─── History view ─────────────────────────────────────────────────────────────
function HistoryView({ items, onRestore }) {
  if (items.length === 0) {
    return (
      <div className="history-empty">
        <div style={{ fontSize: "2rem", opacity: 0.2 }}>✓</div>
        <div style={{ color: "var(--text2)", fontWeight: 500 }}>No incidents resolved yet</div>
        <div>Handled disasters will appear here.</div>
      </div>
    );
  }
  return (
    <div>
      {items.map((item) => (
        <div key={item.id + item.resolved_at} className="history-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div className="history-check">✓</div>
            <div>
              <div className="history-name">{item.emoji} {item.name}</div>
              <div className="history-meta">{item.location}</div>
              <div className="history-meta" style={{ marginTop: "2px", color: "var(--text3)" }}>
                Resolved at {item.resolved_at}
              </div>
            </div>
          </div>
          <button
            className="restore-btn"
            onClick={() => onRestore(item)}
            title="Restore to Incident Feed"
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text2)',
              fontSize: '0.6rem',
              padding: '4px 8px',
              borderRadius: '3px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Restore to Feed
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── EarthCanvas ──────────────────────────────────────────────────────────────
// Renders a proper 3D rotating sphere via per-pixel UV mapping onto a Canvas.
function EarthCanvas() {
  const canvasRef = useRef(null);
  const textureDataRef = useRef(null);
  const angleRef = useRef(0);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });

    // RENDER RESOLUTION: 190x190 (4x fewer pixels than 380x380) for massive performance boost
    const renderDim = 190;
    const R = renderDim / 2;
    const cx = R, cy = R;

    const drawGlobe = () => {
      ctx.clearRect(0, 0, renderDim, renderDim);
      const angle = angleRef.current;

      if (textureDataRef.current) {
        const { data: texData, width: tw, height: th } = textureDataRef.current;
        const imageData = ctx.createImageData(renderDim, renderDim);
        const data = imageData.data;

        // Light direction (upper-left)
        const lx = -0.35, ly = -0.6, lz = 0.72;

        for (let py = 0; py < renderDim; py++) {
          const ny = (py - cy) / R;
          const ny2 = ny * ny;
          const pyRow = py * renderDim;

          for (let px = 0; px < renderDim; px++) {
            const nx = (px - cx) / R;
            const d2 = nx * nx + ny2;
            if (d2 > 1) continue;

            const nz = Math.sqrt(1 - d2);

            // Shading
            const dot = nx * lx + ny * ly + nz * lz;
            const light = Math.min(1.6, 0.1 + Math.max(0, dot) * 0.9 + Math.pow(Math.max(0, nz * 0.3 + Math.max(0, dot) * 0.7), 16) * 0.5);

            // UV mapping
            const theta = Math.atan2(nx, nz) + angle;
            const phi = Math.asin(Math.max(-1, Math.min(1, ny)));
            let u = ((theta / (Math.PI * 2)) + 0.5) % 1;
            if (u < 0) u += 1;
            const v = 0.5 - phi / Math.PI;

            const tx = (u * tw | 0) % tw;
            const ty = (v * th | 0) % th;
            const ti = (ty * tw + tx) << 2;

            const idx = (pyRow + px) << 2;
            data[idx] = (texData[ti] * light) | 0;
            data[idx + 1] = (texData[ti + 1] * light) | 0;
            data[idx + 2] = (texData[ti + 2] * light) | 0;
            data[idx + 3] = 255;
          }
        }
        ctx.putImageData(imageData, 0, 0);
      } else {
        // Fallback
        const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.05, cx, cy, R);
        g.addColorStop(0, '#1a5a8a');
        g.addColorStop(1, '#000510');
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }

      // Fast Overlays (Gradients are cheap)
      const atmo = ctx.createRadialGradient(cx, cy, R * 0.82, cx, cy, R);
      atmo.addColorStop(0, 'rgba(34,211,238,0)');
      atmo.addColorStop(1, 'rgba(34,211,238,0.25)');
      ctx.fillStyle = atmo;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

      const shadow = ctx.createRadialGradient(cx + R * 0.55, cy + R * 0.35, R * 0.1, cx + R * 0.55, cy + R * 0.35, R * 1.15);
      shadow.addColorStop(0, 'rgba(0,0,0,0)');
      shadow.addColorStop(1, 'rgba(0,0,10,0.7)');
      ctx.fillStyle = shadow;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

      // Outer rim glow
      ctx.save();
      ctx.shadowColor = 'rgba(34,211,238,0.7)'; ctx.shadowBlur = 20;
      ctx.strokeStyle = 'rgba(34,211,238,0.15)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, R - 1, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/earth_texture.png';
    img.onload = () => {
      const tCanvas = document.createElement('canvas');
      tCanvas.width = img.width; tCanvas.height = img.height;
      const tCtx = tCanvas.getContext('2d');
      tCtx.drawImage(img, 0, 0);
      textureDataRef.current = tCtx.getImageData(0, 0, img.width, img.height);

      const animate = () => {
        angleRef.current += 0.004;
        drawGlobe();
        animFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    };

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={190}
      height={190}
      style={{
        width: '380px',
        height: '380px',
        borderRadius: '50%',
        display: 'block',
        position: 'relative',
        zIndex: 2,
        filter: 'drop-shadow(0 0 40px rgba(34,211,238,0.4))',
        animation: 'globe-float 7s ease-in-out infinite',
      }}
    />
  );
}

// ─── TelemetryStream ──────────────────────────────────────────────────────────
function TelemetryStream() {
  const stream = 'SYNC_0x9A2F ▸ DATA_ENCRYPTED ▸ LAT:28.6139 LON:77.2090 ▸ NEURAL_LINK:OK ▸ SIGINT_UPLINK ▸ GRID_SCAN:INV7 ▸ NODE:ALPHA-9 ▸ CLASSIFY_PRIORITY:RED ▸ ';
  return (
    <div className="telemetry-stream">
      <div className="telemetry-line">
        {stream}{stream}
      </div>
    </div>
  );
}

// ─── SplashScreen ──────────────────────────────────────────────────────────────
function SplashScreen() {
  const [status, setStatus] = useState('Cold Booting Core Alpha-9...');

  useEffect(() => {
    const sequence = [
      { t: 0, s: 'Cold Booting Core Alpha-9...' },
      { t: 900, s: 'Synchronizing Global Node Grid...' },
      { t: 2100, s: 'Deciphering Cryptographic Stream...' },
      { t: 3300, s: 'Calibrating Neural Perception AI...' },
      { t: 4600, s: 'Mapping Geo-Temporal Flux Fields...' },
      { t: 5900, s: 'Operational Assets: STANDBY' },
      { t: 6800, s: '▶  INTELMAP v2.0 PRO: ONLINE' },
    ];
    sequence.forEach(item => setTimeout(() => setStatus(item.s), item.t));
  }, []);

  return (
    <div className="splash">
      <div className="intro-container">
        <div className="flare" />
        <EarthCanvas />
        <div className="universal-brand">INTELMAP</div>
      </div>
      <div className="splash-status-container">
        <div className="splash-status">{status}</div>
        <div className="splash-progress-container">
          <div className="splash-progress-bar" style={{ animationDuration: '7s' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [appLoading, setAppLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");          // "dashboard" | "history"
  const [activeScenarios, setActiveScenarios] = useState([]);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);       // currently viewed scenario
  const [seen, setSeen] = useState(new Set());          // local IDs that have been clicked (backup)

  // Fetch data from backend
  const fetchData = async () => {
    try {
      const [feedRes, histRes] = await Promise.all([
        fetch(`${API_BASE}/incidents/feed`),
        fetch(`${API_BASE}/incidents/history`)
      ]);
      const feedData = await feedRes.json();
      const histData = await histRes.json();
      setActiveScenarios(feedData);
      setHistory(histData);
    } catch (err) {
      console.error("Error fetching incidents:", err);
    }
  };

  useEffect(() => {
    fetchData();
    // Cinematic Intro Sequence - Overwhelming Duration
    const timer = setTimeout(() => setAppLoading(false), 7200);
    return () => clearTimeout(timer);
  }, []);

  const handleSelect = async (s) => {
    setSelected(s);
    if (s.is_new) {
      try {
        await fetch(`${API_BASE}/incidents/${s.id}/see`, { method: 'PATCH' });
        // Update local state to remove badge immediately
        setActiveScenarios(prev => prev.map(item =>
          item.id === s.id ? { ...item, is_new: 0 } : item
        ));
      } catch (err) {
        console.error("Error marking incident as seen:", err);
      }
    }
  };

  const handleHandled = async (scenario) => {
    try {
      const res = await fetch(`${API_BASE}/incidents/${scenario.id}/manage`, { method: 'PATCH' });
      const { resolvedAt } = await res.json();

      const resolved = { ...scenario, is_new: 0, status: 'history', resolved_at: resolvedAt };
      setHistory((h) => [resolved, ...h]);
      setActiveScenarios((list) => list.filter((s) => s.id !== scenario.id));
      setSelected(null);
    } catch (err) {
      console.error("Error managing disaster:", err);
    }
  };

  const handleRestore = async (scenario) => {
    try {
      await fetch(`${API_BASE}/incidents/${scenario.id}/restore`, { method: 'PATCH' });

      const restored = { ...scenario, status: 'feed', resolved_at: null };
      setActiveScenarios((prev) => [...prev, restored]);
      setHistory((h) => h.filter((s) => s.id !== scenario.id));
    } catch (err) {
      console.error("Error restoring disaster:", err);
    }
  };

  return (
    <>
      {appLoading && <SplashScreen />}
      <div className="app">
        {/* ── Top bar ── */}
        <div className="topbar">
          <div className="topbar-brand">
            <div className="topbar-brand-icon">⬡</div>
            INTELMAP
            <span style={{ fontSize: "0.6rem", color: "var(--text3)", fontWeight: 400, letterSpacing: "0.04em" }} className="mono">
              v2.0 PRO
            </span>
          </div>

          <nav className="topbar-tabs">
            <button
              className={`tab ${tab === "dashboard" ? "active" : ""}`}
              onClick={() => setTab("dashboard")}
            >
              Main Dashboard
            </button>
            <button
              className={`tab ${tab === "history" ? "active" : ""}`}
              onClick={() => setTab("history")}
            >
              History
              {history.length > 0 && (
                <span style={{ marginLeft: "6px", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "var(--green)", borderRadius: "10px", padding: "0 5px", fontSize: "0.6rem", fontWeight: 700 }}>
                  {history.length}
                </span>
              )}
            </button>
          </nav>

          <Clock />
        </div>

        {/* ── History tab ── */}
        {tab === "history" && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <div className="col-header">
              Resolved Incidents
            </div>
            <HistoryView items={history} onRestore={handleRestore} />
          </div>
        )}

        {/* ── Dashboard tab ── */}
        {tab === "dashboard" && (
          <div className="main">

            {/* ── Column 1: Incident Feed ── */}
            <div className="col">
              <div className="col-header">Incident Feed</div>
              <div className="col-body">
                {activeScenarios.length === 0 && (
                  <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text3)", fontSize: "0.75rem" }}>
                    <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem", opacity: 0.3 }}>✓</div>
                    All incidents handled
                  </div>
                )}
                {activeScenarios.map((s) => {
                  const isNew = s.is_new === 1;
                  const isSelected = selected?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      className={`incident-card ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSelect(s)}
                    >
                      {isNew && <div className="new-badge">● New</div>}
                      <div className="incident-name" style={{ color: isSelected ? s.color : "var(--text)" }}>
                        {s.emoji} {s.name}
                      </div>
                      <div className="incident-meta">{s.location}</div>
                      <div className="incident-meta mono" style={{ marginTop: "3px", fontSize: '0.6rem', opacity: 0.6 }}>
                        {s.signals.length} Signals Captured
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Column 2: AI Analysis ── */}
            <div className="col">
              <div className="col-header">
                AI Analysis
                {selected && (
                  <span style={{ marginLeft: "0.5rem", opacity: 0.5, fontWeight: 400, letterSpacing: 0, textTransform: "none", fontSize: "0.65rem" }} className="mono">
                    [{selected.name}]
                  </span>
                )}
              </div>
              <AnalysisPanel
                scenario={selected}
                onHandled={handleHandled}
              />
            </div>

            {/* ── Column 3: Map ── */}
            <div className="col" style={{ borderRight: "none" }}>
              <div className="col-header">Map Location</div>
              <MapPanel scenario={selected} />
            </div>

          </div>
        )}
      </div>
    </>
  );
}
