import { useState, useEffect, useRef } from "react";
import { analyzeDisasterSignals, analyzeCustomSignal } from "./services/gemini";
import { disasterScenarios } from "./data/mockSignals";
import "./index.css";

// ─── Ticker ───────────────────────────────────────────────────────────────────
function Ticker() {
  const items = [
    "● EQUINOX SYSTEM ONLINE",
    "◈ GEMINI AI ENGINE ACTIVE",
    "▸ SATELLITE FEEDS: NOMINAL",
    "▸ IOT SENSOR NETWORK: 1,247 NODES ACTIVE",
    "◈ SIGNAL FUSION IN PROGRESS",
    "▸ RESPONSE TEAMS ON STANDBY",
    "● 24/7 MONITORING ACTIVE",
    "◈ PRESS CTRL+A FOR AUTO-ANALYSIS",
  ];
  const repeated = [...items, ...items];
  return (
    <div className="ticker-wrap" style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.12em" }}>
      <div className="ticker-inner mono">
        {repeated.map((t, i) => (
          <span key={i} style={{ marginRight: "3rem" }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Signal Row ───────────────────────────────────────────────────────────────
function SignalRow({ signal, index }) {
  const srcClass = `src-${signal.source.replace(/\s/g, "_")}`;
  return (
    <div
      className="animate-fadeInUp"
      style={{
        animationDelay: `${index * 60}ms`,
        display: "grid",
        gridTemplateColumns: "5rem 8rem 1fr auto",
        gap: "0.75rem",
        alignItems: "flex-start",
        padding: "0.5rem 0",
        borderBottom: "1px solid var(--border)",
        fontSize: "0.72rem",
      }}
    >
      <span className="mono" style={{ color: "var(--cyan)", opacity: 0.8 }}>{signal.timestamp}</span>
      <span className={`mono font-bold ${srcClass}`}>{signal.source.replace(/_/g, " ")}</span>
      <span style={{ color: "var(--text-primary)" }}>{signal.value}</span>
      <span style={{ color: "var(--text-muted)", textAlign: "right", whiteSpace: "nowrap" }}>{signal.location}</span>
    </div>
  );
}

// ─── Action Item ──────────────────────────────────────────────────────────────
function ActionItem({ action, index }) {
  return (
    <div
      className="animate-fadeInUp"
      style={{
        animationDelay: `${index * 80}ms`,
        display: "flex",
        gap: "0.75rem",
        alignItems: "flex-start",
        padding: "0.6rem 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{
        width: "22px", height: "22px", borderRadius: "50%",
        background: "var(--cyan-dim)", color: "var(--cyan)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.65rem", fontWeight: 700, flexShrink: 0,
        border: "1px solid var(--cyan)",
      }}>{action.priority}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>
          {action.action}
          {action.time_sensitive && (
            <span style={{
              marginLeft: "8px", fontSize: "0.6rem", color: "var(--red)",
              border: "1px solid var(--red)", borderRadius: "3px",
              padding: "1px 5px", verticalAlign: "middle"
            }}>URGENT</span>
          )}
        </div>
        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{action.sector}</div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ value, label, color }) {
  return (
    <div style={{ textAlign: "center", padding: "0.75rem" }}>
      <div style={{ fontSize: "2rem", fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      <div className="label" style={{ marginTop: "4px" }}>{label}</div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customSignal, setCustomSignal] = useState("");
  const [customLoading, setCustomLoading] = useState(false);
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const customRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleAnalyze = async (scenario) => {
    setSelectedScenario(scenario);
    setLoading(true);
    setAnalysis(null);
    setError(null);
    try {
      const result = await analyzeDisasterSignals(scenario.signals, scenario.name, scenario.id);
      setAnalysis(result);
    } catch (err) {
      console.error("Gemini error:", err);
      setError("Gemini API error — check your API key in the .env file.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSignal = async () => {
    if (!customSignal.trim() || !selectedScenario) return;
    setCustomLoading(true);
    setError(null);
    try {
      const result = await analyzeCustomSignal(customSignal, selectedScenario.signals);
      setAnalysis(result);
      setCustomSignal("");
    } catch (err) {
      console.error("Custom signal error:", err);
      setError("Gemini API error — check your API key.");
    } finally {
      setCustomLoading(false);
    }
  };

  const threatColors = {
    CRITICAL: "var(--red)",
    HIGH: "var(--orange)",
    MEDIUM: "var(--yellow)",
    LOW: "var(--green)",
  };
  const threatColor = analysis ? (threatColors[analysis.threat_level] ?? "var(--cyan)") : "var(--cyan)";

  return (
    <div className="grid-bg" style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>

      {/* ── Header ── */}
      <header style={{
        padding: "1rem 1.5rem",
        borderBottom: "1px solid var(--border)",
        background: "rgba(3,7,18,0.88)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: "36px", height: "36px",
            border: "2px solid var(--cyan)",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.1rem",
            boxShadow: "0 0 12px rgba(34,211,238,0.4)",
          }}>⬡</div>
          <div>
            <div style={{
              fontSize: "1.3rem", fontWeight: 800,
              color: "var(--cyan)", letterSpacing: "0.08em", lineHeight: 1.1,
            }}>EQUINOX</div>
            <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", letterSpacing: "0.1em" }}>
              DISASTER OPERATIONS INTELLIGENCE SYSTEM
            </div>
          </div>
        </div>

        <div style={{ flex: 1, margin: "0 2rem" }}>
          <Ticker />
        </div>

        <div style={{ textAlign: "right" }}>
          <div className="mono" style={{ fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 600 }}>{time}</div>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}>
            <span style={{ color: "var(--green)" }}>● </span>
            <span style={{ color: "var(--text-muted)" }}>GEMINI ONLINE</span>
          </div>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <main style={{ display: "grid", gridTemplateColumns: "300px 1fr", height: "calc(100vh - 60px)" }}>

        {/* LEFT SIDEBAR — Scenario Selector */}
        <aside style={{
          borderRight: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          overflowY: "auto",
          padding: "1rem",
          display: "flex", flexDirection: "column", gap: "0.5rem",
        }}>
          <div className="label" style={{ marginBottom: "0.5rem", padding: "0 0.25rem" }}>ACTIVE INCIDENT FEEDS</div>

          {disasterScenarios.map((s) => {
            const active = selectedScenario?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => handleAnalyze(s)}
                disabled={loading}
                style={{
                  background: active ? "rgba(34,211,238,0.06)" : "transparent",
                  border: `1px solid ${active ? s.color : "var(--border)"}`,
                  borderRadius: "8px",
                  padding: "0.9rem",
                  textAlign: "left",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  color: "var(--text-primary)",
                  width: "100%",
                }}
              >
                <div style={{ fontSize: "1.2rem", marginBottom: "4px" }}>{s.emoji}</div>
                <div style={{ fontWeight: 600, fontSize: "0.82rem", color: active ? s.color : "var(--text-primary)" }}>
                  {s.name}
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {s.location}
                </div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  {s.signals.length} signals
                </div>
              </button>
            );
          })}

          {/* Custom Signal */}
          {selectedScenario && (
            <div style={{
              marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "1rem"
            }}>
              <div className="label" style={{ marginBottom: "0.5rem" }}>INJECT CUSTOM SIGNAL</div>
              <textarea
                ref={customRef}
                value={customSignal}
                onChange={(e) => setCustomSignal(e.target.value)}
                placeholder='e.g. "Dam breach reported near Sector 9 — 800 families at risk"'
                rows={3}
                style={{
                  width: "100%",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  padding: "0.6rem",
                  color: "var(--text-primary)",
                  fontSize: "0.72rem",
                  fontFamily: "inherit",
                  resize: "vertical",
                  outline: "none",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) handleCustomSignal();
                }}
              />
              <button
                onClick={handleCustomSignal}
                disabled={customLoading || !customSignal.trim()}
                style={{
                  marginTop: "0.5rem",
                  width: "100%",
                  padding: "0.5rem",
                  background: "rgba(34,211,238,0.1)",
                  border: "1px solid var(--cyan)",
                  borderRadius: "6px",
                  color: "var(--cyan)",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: customLoading || !customSignal.trim() ? "not-allowed" : "pointer",
                  letterSpacing: "0.08em",
                  opacity: !customSignal.trim() ? 0.4 : 1,
                }}
              >
                {customLoading ? "ANALYZING..." : "⬡ INJECT & ANALYZE (Ctrl+Enter)"}
              </button>
            </div>
          )}
        </aside>

        {/* RIGHT — Dashboard */}
        <div style={{ overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Empty state */}
          {!selectedScenario && !loading && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              textAlign: "center", color: "var(--text-muted)",
            }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.4 }}>⬡</div>
              <div style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-secondary)" }}>
                Select an incident feed
              </div>
              <div style={{ fontSize: "0.78rem" }}>
                Choose a disaster scenario from the left panel to begin Gemini AI analysis
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: "1rem",
            }}>
              <div className="spinner" style={{ width: "40px", height: "40px", borderWidth: "3px" }} />
              <div style={{ color: "var(--cyan)", fontSize: "0.85rem", letterSpacing: "0.1em" }}>
                GEMINI ANALYZING CRISIS SIGNALS...
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                Cross-referencing {selectedScenario?.signals.length} signals · Generating response plan
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: "8px", padding: "1rem",
              color: "var(--red)", fontSize: "0.82rem",
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Analysis results */}
          {analysis && !loading && (
            <>
              {/* Demo mode badge */}
              {analysis._source === "demo" && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.4rem 0.75rem",
                  background: "rgba(251,191,36,0.06)",
                  border: "1px solid rgba(251,191,36,0.25)",
                  borderRadius: "6px",
                  fontSize: "0.68rem", color: "var(--yellow)",
                  letterSpacing: "0.08em",
                }}>
                  ◈ GEMINI DEMO MODE — Pre-seeded analysis (live API quota exceeded, rotate key to enable live)
                </div>
              )}
              {/* Row 1 — Threat + Resources + Population */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>

                {/* Threat Level */}
                <div className="card animate-fadeInUp" style={{
                  border: `1px solid ${threatColor}22`,
                  background: `linear-gradient(135deg, rgba(0,0,0,0) 0%, ${threatColor}08 100%)`,
                  gridColumn: "1 / 2",
                }}>
                  <div className="label" style={{ marginBottom: "0.5rem" }}>THREAT LEVEL</div>
                  <div style={{ fontSize: "2.2rem", fontWeight: 900, color: threatColor, lineHeight: 1.1, letterSpacing: "0.04em" }}>
                    {analysis.threat_level}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.5rem", lineHeight: 1.5 }}>
                    {analysis.primary_threat}
                  </div>
                </div>

                {/* Resources */}
                <div className="card animate-fadeInUp" style={{ animationDelay: "80ms" }}>
                  <div className="label" style={{ marginBottom: "0.75rem" }}>RESOURCE ALLOCATION</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    <StatCard value={analysis.resource_allocation?.rescue_units ?? "—"} label="Rescue Units" color="var(--cyan)" />
                    <StatCard value={analysis.resource_allocation?.medical_teams ?? "—"} label="Medical Teams" color="var(--green)" />
                    <StatCard value={analysis.resource_allocation?.supply_drops ?? "—"} label="Supply Drops" color="var(--yellow)" />
                    <StatCard value={analysis.resource_allocation?.evacuation_buses ?? "—"} label="Evac Buses" color="var(--orange)" />
                  </div>
                </div>

                {/* Affected Zone + Population */}
                <div className="card animate-fadeInUp" style={{ animationDelay: "160ms" }}>
                  <div className="label" style={{ marginBottom: "0.75rem" }}>IMPACT ASSESSMENT</div>

                  <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>Est. Affected Population</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--orange)" }}>
                      {analysis.estimated_affected_population ?? "Calculating..."}
                    </div>
                  </div>

                  <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>Affected Zones</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {analysis.affected_zones?.map((z, i) => (
                        <span key={i} className="badge" style={{ color: "var(--text-secondary)", borderColor: "var(--border-active)" }}>{z}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>Signal Credibility</div>
                    <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.72rem" }}>
                      <span style={{ color: "var(--green)" }}>● {analysis.signal_credibility?.high ?? 0} High</span>
                      <span style={{ color: "var(--yellow)" }}>● {analysis.signal_credibility?.medium ?? 0} Medium</span>
                      <span style={{ color: "var(--red)" }}>● {analysis.signal_credibility?.low ?? 0} Low</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2 — Actions + Reasoning */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

                {/* Action Orders */}
                <div className="card animate-fadeInUp" style={{ animationDelay: "200ms" }}>
                  <div className="label" style={{ marginBottom: "0.75rem" }}>IMMEDIATE ACTION ORDERS</div>
                  {analysis.immediate_actions?.map((a, i) => (
                    <ActionItem key={i} action={a} index={i} />
                  ))}
                </div>

                {/* Gemini Reasoning */}
                <div className="card animate-fadeInUp" style={{
                  animationDelay: "260ms",
                  border: "1px solid rgba(34,211,238,0.2)",
                  background: "linear-gradient(135deg, rgba(34,211,238,0.02) 0%, transparent 100%)",
                }}>
                  <div className="label" style={{ marginBottom: "0.75rem", color: "var(--cyan)" }}>
                    ⬡ GEMINI AI REASONING
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                    {analysis.reasoning}
                  </p>

                  {analysis.next_6_hours_prediction && (
                    <div style={{
                      marginTop: "1rem",
                      padding: "0.75rem",
                      background: "rgba(239,68,68,0.06)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: "6px",
                    }}>
                      <div style={{ fontSize: "0.65rem", color: "var(--red)", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "4px" }}>
                        ⚠ PREDICTION: IF NO ACTION TAKEN
                      </div>
                      <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                        {analysis.next_6_hours_prediction}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3 — Signal Feed */}
              <div className="card animate-fadeInUp" style={{ animationDelay: "320ms" }}>
                <div className="label" style={{ marginBottom: "0.75rem" }}>INCOMING SIGNAL FEED — {selectedScenario?.name}</div>
                <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {selectedScenario?.signals.map((s, i) => (
                    <SignalRow key={i} signal={s} index={i} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
