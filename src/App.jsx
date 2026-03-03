import { useState, useEffect, useRef } from "react";
import { analyzeDisasterSignals } from "./services/gemini";
import { disasterScenarios } from "./data/mockSignals";
import { demoResponses } from "./data/demoResponses";
import CinematicEarth from "./CinematicEarth";
import "./index.css";
import "./App.css";

// ─── helpers ─────────────────────────────────────────────────────────────────
function Clock() {
  const [t, setT] = useState(new Date().toLocaleTimeString());
  useEffect(() => {
    const id = setInterval(() => setT(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="topbar-clock">{t}</span>;
}

// ─── Cinematic Intro ─────────────────────────────────────────────────────────
function CinematicIntro({ showIntro }) {
  const [activeLine, setActiveLine] = useState("> INITIALIZING DISASTER PREVENTION GRID...");

  useEffect(() => {
    const sequence = [
      { t: 800, msg: "ESTABLISHING SECURE SATCOM LINK..." },
      { t: 1600, msg: "CONNECTING TO GROQ LPU CLUSTER..." },
      { t: 2400, msg: "SYNCING GDELT GLOBAL EVENT DATABASE..." },
      { t: 3200, msg: "ANALYZING TACTICAL SOCIAL SIGNALS (TELEGRAM/REDDIT)..." },
      { t: 4200, msg: "ACCESS GRANTED. BOOTING INTELMAP UI." }
    ];

    sequence.forEach(({ t, msg }) => {
      setTimeout(() => setActiveLine(`> ${msg}`), t);
    });
  }, []);

  return (
    <div className={`cinematic-intro ${!showIntro ? 'fade-out' : ''}`}>
      {/* Three.js Earth + orbiting INTELMAP text */}
      <CinematicEarth />

      <div className="cinematic-loading-ui">
        <div className="cinematic-progress-container">
          <div className="cinematic-progress-bar" />
        </div>

        {/* key={activeLine} forces animation restart on text change */}
        <div key={activeLine} className="cinematic-console-line">
          {activeLine}
        </div>
      </div>
    </div>
  );
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

    // ── NEW: Prioritize Server-side Analysis (Groq) ──
    if (scenario.analysis) {
      setAnalysis(scenario.analysis);
      setLoading(false);
      return;
    }

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
        // Fallback to demo response
        const demo = demoResponses[scenario.id];
        if (demo) {
          setAnalysis(demo);
        } else {
          setError(true);
        }
      })
      .finally(() => setLoading(false));
  }, [scenario?.id, scenario?.analysis]);

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
          <div className="loading-text">Synthesizing intelligence signals...</div>
          <div className="loading-sub">Processing {scenario.signals.length} data streams</div>
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
              <div className="banner-title">Analysis Unavailable</div>
              The intelligence engine encountered a connectivity issue. Please check the backend server terminal for details.
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

            {/* Engine reasoning */}
            <div className="acard-gemini">
              <div className="gemini-label">
                <span className="gemini-dot" />
                INTELMAP Core Engine Reasoning
                <span style={{ fontWeight: 400, fontSize: "0.58rem", color: "rgba(34,211,238,0.6)", letterSpacing: 0 }}>— Powered by Groq LPU</span>
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
function HistoryView({ items, onReactivate }) {
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
        <div key={item.id + item.resolvedAt} className="history-item">
          <div className="history-check">✓</div>
          <div style={{ flex: 1 }}>
            <div className="history-name">{item.emoji} {item.name}</div>
            <div className="history-meta">{item.location}</div>
            <div className="history-meta" style={{ marginTop: "2px", color: "var(--text3)" }}>
              Resolved at {item.resolvedAt}
            </div>
          </div>
          <button
            className="reactivate-btn"
            onClick={() => onReactivate(item)}
            title="Move back to Incident Feed"
            style={{
              background: "transparent",
              border: "1px solid var(--border2)",
              color: "var(--cyan)",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "0.7rem",
              cursor: "pointer",
              marginLeft: "10px",
              transition: "all 0.2s"
            }}
          >
            ↺ Reactivate
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  // ── NEW: Cinematic Intro State ──
  const [showIntro, setShowIntro] = useState(true);
  const [actuallyRenderIntro, setActuallyRenderIntro] = useState(true);

  // Leave exactly at 7s, then unmount after fade completes
  useEffect(() => {
    const timer1 = setTimeout(() => setShowIntro(false), 7000); // Trigger fade 
    const timer2 = setTimeout(() => setActuallyRenderIntro(false), 8000); // Completely remove DOM
    return () => { clearTimeout(timer1); clearTimeout(timer2); }
  }, []);

  const [tab, setTab] = useState("dashboard");          // "dashboard" | "history"
  const [activeScenarios, setActiveScenarios] = useState(disasterScenarios);

  // ── NEW: Initialize history from localStorage ──
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("intelmap_history");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
    }
    return [];
  });

  const [selected, setSelected] = useState(null);       // currently viewed scenario
  const [seen, setSeen] = useState(new Set());          // IDs that have been clicked
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // ── NEW: Save history to localStorage whenever it changes ──
  useEffect(() => {
    localStorage.setItem("intelmap_history", JSON.stringify(history));
  }, [history]);

  // ── Live incident polling (every 5 minutes) ───────────────────────
  const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes in ms

  const fetchLiveIncidents = () => {
    // Try the backend API first (always fresh), fall back to static file
    fetch('http://localhost:5000/api/incidents')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setActiveScenarios(prev => {
            // Keep incidents that the user hasn't handled yet; add new ones
            const existingIds = new Set(prev.map(s => s.id));
            const newOnes = data.filter(s => !existingIds.has(s.id));
            if (newOnes.length === 0) return prev; // nothing changed
            return [...newOnes, ...prev];
          });
        }
      })
      .catch(() => {
        // Backend not running — fall back to the static JSON file
        fetch('/live_incidents.json')
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data) && data.length > 0) {
              setActiveScenarios(prev => {
                const existingIds = new Set(prev.map(s => s.id));
                const newOnes = data.filter(s => !existingIds.has(s.id));
                if (newOnes.length === 0) return prev;
                return [...newOnes, ...prev];
              });
            }
          })
          .catch(err => console.warn("No live incidents available:", err));
      });
  };

  useEffect(() => {
    fetchLiveIncidents(); // immediate load on mount
    const intervalId = setInterval(fetchLiveIncidents, POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch('http://localhost:5000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: searchQuery })
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setActiveScenarios(data);
        if (data.length > 0) handleSelect(data[0]);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
      setSearchQuery("");
    }
  };

  const handleSelect = (s) => {
    setSelected(s);
    setSeen((prev) => new Set([...prev, s.id]));
  };

  const handleHandled = (scenario) => {
    const resolved = { ...scenario, resolvedAt: new Date().toLocaleTimeString() };
    setHistory((h) => [resolved, ...h]);
    setActiveScenarios((list) => list.filter((s) => s.id !== scenario.id));
    setSelected(null);
  };

  const handleReactivate = (scenario) => {
    setHistory((h) => h.filter(s => s.id !== scenario.id));
    setActiveScenarios((list) => {
      // Avoid duplicates just in case
      if (list.find(s => s.id === scenario.id)) return list;
      return [scenario, ...list];
    });
    setTab("dashboard");
    setSelected(scenario); // Auto-select it to show analysis again
  };

  return (
    <>
      {actuallyRenderIntro && <CinematicIntro showIntro={showIntro} />}
      <div className="app">

        {/* ── Top bar ── */}
        <div className="topbar">
          <div className="topbar-brand">
            <div className="topbar-brand-icon">⬡</div>
            INTELMAP
            <span style={{ fontSize: "0.65rem", color: "var(--text3)", fontWeight: 400, letterSpacing: "0.04em" }}>
              Crisis Intelligence
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

          <div className="topbar-helpline">
            <span className="helpline-label">EMERGENCY HELPLINE:</span>
            <span className="helpline-number">112 / 108</span>
          </div>

          <Clock />
        </div>

        {/* ── History tab ── */}
        {tab === "history" && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text3)" }}>
              Resolved Incidents
            </div>
            <HistoryView items={history} onReactivate={handleReactivate} />
          </div>
        )}

        {/* ── Dashboard tab ── */}
        {tab === "dashboard" && (
          <div className="main">

            {/* ── Column 1: Incident Feed ── */}
            <div className="col">
              <div className="col-header" style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: 'auto', padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>Incident Feed</span>
                  {isSearching && <span style={{ color: 'var(--cyan)', fontSize: '0.6rem' }}>● SCANNING...</span>}
                </div>

                <form onSubmit={handleSearch} className="search-bar">
                  <input
                    type="text"
                    placeholder="Analyze City (e.g. Mumbai)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isSearching}
                  />
                  <button type="submit" disabled={isSearching} title="Search">
                    {isSearching ? "..." : "🔍"}
                  </button>
                </form>
              </div>
              <div className="col-body">
                {activeScenarios.length === 0 && (
                  <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text3)", fontSize: "0.75rem" }}>
                    <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem", opacity: 0.3 }}>✓</div>
                    All incidents handled
                  </div>
                )}
                {activeScenarios.map((s) => {
                  const isNew = !seen.has(s.id);
                  const isSelected = selected?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      className={`incident-card ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSelect(s)}
                    >
                      {isNew && <div className="new-badge">● New</div>}
                      {s.isLive && (
                        <div className="new-badge" style={{ background: "rgba(239,68,68,0.15)", color: "var(--red)", border: "1px solid rgba(239,68,68,0.3)", marginLeft: isNew ? "45px" : "0" }}>
                          ● LIVE
                        </div>
                      )}
                      <div className="incident-name" style={{ color: isSelected ? s.color : "var(--text)" }}>
                        {s.emoji} {s.name}
                      </div>
                      <div className="incident-meta">{s.location}</div>
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
                  <span style={{ marginLeft: "0.5rem", opacity: 0.5, fontWeight: 400, letterSpacing: 0, textTransform: "none", fontSize: "0.65rem" }}>
                    — {selected.name}
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
