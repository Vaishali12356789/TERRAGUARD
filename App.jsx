import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const initialHotspots = [
  { id: 1, state: 'Sikkim', location: 'Teesta River Valley (NH-10)', lat: 27.3389, lng: 88.6065, risk: 'CRITICAL', threat: 'Major Landslide & Road Blockage', moisture: '92%', rain: '140mm', criticalHours: '0 - 8 Hours', normalTime: 'After 36 Hours', progressPct: 20 },
  { id: 2, state: 'Assam', location: 'Guwahati Zoo Road', lat: 26.1445, lng: 91.7362, risk: 'HIGH', threat: 'Urban Flash Flood Hazard', moisture: '85%', rain: '95mm', criticalHours: '0 - 5 Hours', normalTime: 'After 24 Hours', progressPct: 45 },
  { id: 3, state: 'Meghalaya', location: 'Cherrapunji Bypass', lat: 25.2986, lng: 91.7321, risk: 'MEDIUM', threat: 'Soil Erosion & Slope Instability', moisture: '74%', rain: '60mm', criticalHours: '0 - 3 Hours', normalTime: 'After 18 Hours', progressPct: 70 },
  { id: 4, state: 'Arunachal Pradesh', location: 'Itanagar Highway', lat: 27.0844, lng: 93.6053, risk: 'HIGH', threat: 'Mudslide & Falling Rocks', moisture: '88%', rain: '110mm', criticalHours: '0 - 6 Hours', normalTime: 'After 24 Hours', progressPct: 40 },
  { id: 5, state: 'Nagaland', location: 'Kohima Bypass Road', lat: 25.6751, lng: 94.1086, risk: 'MEDIUM', threat: 'Minor Landslide Activity', moisture: '68%', rain: '45mm', criticalHours: '0 - 2 Hours', normalTime: 'After 12 Hours', progressPct: 80 },
  { id: 6, state: 'Manipur', location: 'Imphal West Highway', lat: 24.8170, lng: 93.9368, risk: 'CRITICAL', threat: 'River Overflow & Inundation', moisture: '95%', rain: '160mm', criticalHours: '0 - 10 Hours', normalTime: 'After 48 Hours', progressPct: 15 }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('nlp');
  const [hotspots, setHotspots] = useState(initialHotspots);
  
  // Search & Parsing State
  const [searchWhere, setSearchWhere] = useState('Teesta River Highway, Sikkim');
  const [searchWhen, setSearchWhen] = useState('5:00 PM Today');
  const [searchWhat, setSearchWhat] = useState('Heavy rockfall & landslide causing total road block');
  const [parsedData, setParsedData] = useState(null);

  // SMS Terminal State
  const [customMsg, setCustomMsg] = useState('');
  const [dispatchStatus, setDispatchStatus] = useState(null);

  useEffect(() => {
    handleIncidentSearch();
    fetch('https://terraguard-etyf.onrender.com/api/hotspots')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) setHotspots(data);
      })
      .catch((err) => console.error('Backend connection check:', err));
  }, []);

  const analyzeIncident = (whereInput, whenInput, whatInput) => {
    const text = (whatInput || '').toLowerCase();
    const queryTime = new Date().toLocaleTimeString();
    
    let calculatedRisk = 'MEDIUM';
    let threatProgress = 70;
    let dynamicTimeline = {
      searchTime: queryTime,
      criticalWindow: '0 - 3 Hours (Immediate Action Needed)',
      stabilizationWindow: '3 - 12 Hours (Disaster Control Active)',
      normalizationWindow: 'After 18 Hours (Safe Normalization)'
    };
    let dynamicPrecautions = [];

    if (text.includes('block') || text.includes('landslide') || text.includes('flood') || text.includes('cloudburst') || text.includes('overflow')) {
      calculatedRisk = 'CRITICAL';
      threatProgress = 20; 
      dynamicTimeline = {
        searchTime: queryTime,
        criticalWindow: '0 - 8 Hours (High Severe Hazard Phase)',
        stabilizationWindow: '8 - 24 Hours (Clearing & Rescue Ops)',
        normalizationWindow: 'After 36 Hours (Expected Normal Traffic Flow)'
      };
    } else if (text.includes('rain') || text.includes('crack') || text.includes('mud') || text.includes('water')) {
      calculatedRisk = 'HIGH';
      threatProgress = 45;
      dynamicTimeline = {
        searchTime: queryTime,
        criticalWindow: '0 - 5 Hours (High Risk Warning Window)',
        stabilizationWindow: '5 - 16 Hours (Active Site Monitoring)',
        normalizationWindow: 'After 24 Hours (Expected Normalization)'
      };
    }

    if (text.includes('block') || text.includes('landslide') || text.includes('road')) {
      dynamicPrecautions = [
        'Deploy heavy earthmovers (JCB/Bulldozers) for emergency highway clearing.',
        'Issue immediate traffic diversion advisory for all heavy & commercial vehicles.',
        'Station BRO and Highway Patrol units near unstable slope edges.',
        'Establish emergency transit shelter and supply tents for stranded commuters.'
      ];
    } else {
      dynamicPrecautions = [
        'Deploy NDRF inflatable rescue boats along low-lying embankment settlements.',
        'Trigger local siren emergency alerts for immediate resident evacuation.',
        'Distribute emergency drinking water, ration kits, and first-aid supplies.',
        'Setup elevated relief camps equipped with emergency medical stations.'
      ];
    }

    return {
      id: Date.now(),
      where: whereInput || 'Teesta Valley, Sikkim',
      when: whenInput || 'Current Query Time',
      what: whatInput || 'Road blockage and severe weather incident',
      riskLevel: calculatedRisk,
      progressPct: threatProgress,
      timeline: dynamicTimeline,
      precautions: dynamicPrecautions,
      timestamp: queryTime
    };
  };

  const handleIncidentSearch = () => {
    if (!searchWhere && !searchWhat) return;
    const result = analyzeIncident(searchWhere, searchWhen, searchWhat);
    setParsedData(result);
  };

  const handleDispatch = (e) => {
    e.preventDefault();
    setDispatchStatus('🚨 Emergency SMS Alert Broadcasted to Target Region Nodes!');
    setTimeout(() => setDispatchStatus(null), 4500);
  };

  const getRiskColor = (risk) => {
    if (risk === 'CRITICAL') return '#ef4444';
    if (risk === 'HIGH') return '#f97316';
    if (risk === 'MEDIUM') return '#eab308';
    return '#22c55e';
  };

  const handleDownloadPDFReport = () => {
    window.print();
  };

  return (
    <div style={styles.container}>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background-color: #ffffff !important;
            color: #0f172a !important;
            border: 2px solid #0284c7 !important;
            padding: 20px !important;
          }
          .no-print {
            display: none !important;
          }
          .print-text-dark {
            color: #0f172a !important;
          }
          .print-bg-light {
            background-color: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
          }
        }
      `}</style>

      {/* NAVBAR & HEADER */}
      <header style={styles.header} className="no-print">
        <div style={styles.logoBox}>
          <span style={styles.badge}>SIH 26001</span>
          <h1 style={styles.title}>TerraGuard GIS Platform</h1>
        </div>
        <p style={styles.subtitle}>Regional Hazard & Incident Monitoring System - NER Zone</p>
      </header>

      <nav style={styles.nav} className="no-print">
        <button style={activeTab === 'dashboard' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('dashboard')}>
          📊 Live Risk Dashboard
        </button>
        <button style={activeTab === 'nlp' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('nlp')}>
          🔍 Public Incident & PDF Report
        </button>
        <button style={activeTab === 'sos' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('sos')}>
          📱 Emergency Alert SMS
        </button>
        <button style={activeTab === 'reports' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('reports')}>
          📁 Analytics & Detailed Reports
        </button>
      </nav>

      <main style={styles.main}>
        {/* TAB 1: LIVE DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div style={styles.grid} className="no-print">
            <div style={styles.mapCard}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={{ margin: 0 }}>Interactive Telemetry Risk Map (NER Zone)</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Real-time satellite & sensor GIS overlay</p>
                </div>
                <span style={styles.liveTag}>LIVE API FEED</span>
              </div>
              <div style={{ height: '520px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155' }}>
                <MapContainer center={[26.2006, 92.9376]} zoom={6} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  {hotspots.map((h) => (
                    <Marker key={h.id} position={[h.lat, h.lng]}>
                      <Popup>
                        <div style={{ color: '#0f172a' }}>
                          <strong>{h.location} ({h.state})</strong><br />
                          Risk Level: <span style={{ color: getRiskColor(h.risk), fontWeight: 'bold' }}>{h.risk}</span><br />
                          Threat: {h.threat}<br />
                          Critical: {h.criticalHours}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>

            <div style={styles.sideCard}>
              <h3 style={{ margin: '0 0 16px 0' }}>Active Risk Hotspots ({hotspots.length})</h3>
              <div style={styles.alertList}>
                {hotspots.map((h) => (
                  <div key={h.id} style={styles.alertItem}>
                    <div>
                      <strong>{h.location}</strong>
                      <p style={styles.stateTag}>{h.state} • Critical: {h.criticalHours}</p>
                      <p style={styles.threatText}>{h.threat}</p>
                    </div>
                    <span style={{ ...styles.riskTag, backgroundColor: getRiskColor(h.risk) }}>
                      {h.risk}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REGION SEARCH & DYNAMIC PDF REPORT */}
        {activeTab === 'nlp' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
            <div style={styles.card} className="no-print">
              <h3>🔍 Search Specific Region Hazard</h3>
              <p style={styles.desc}>Enter incident details to render the dynamic graphical timeline & printable PDF report.</p>

              <div style={{ marginBottom: '12px' }}>
                <label style={styles.label}>📍 Region / Location:</label>
                <input
                  type="text"
                  style={styles.inputStyle}
                  value={searchWhere}
                  onChange={(e) => setSearchWhere(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={styles.label}>⏰ Incident Occurrence Time:</label>
                <input
                  type="text"
                  style={styles.inputStyle}
                  value={searchWhen}
                  onChange={(e) => setSearchWhen(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={styles.label}>📝 Hazard Details / Description:</label>
                <textarea
                  rows="3"
                  style={styles.inputStyle}
                  value={searchWhat}
                  onChange={(e) => setSearchWhat(e.target.value)}
                />
              </div>

              <button style={styles.searchBtn} onClick={handleIncidentSearch}>
                ⚡ Generate Graphical & Text Assessment Report
              </button>
            </div>

            {parsedData && (
              <div style={styles.graphicReportCard} id="printable-report">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0284c7', paddingBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 'bold' }}>OFFICIAL REGIONAL DISASTER ASSESSMENT REPORT</span>
                    <h2 style={{ margin: '4px 0 0 0', color: '#fff', fontSize: '20px' }} className="print-text-dark">{parsedData.where}</h2>
                  </div>
                  <span style={{ backgroundColor: getRiskColor(parsedData.riskLevel), color: '#fff', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px' }}>
                    {parsedData.riskLevel} RISK
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '14px' }}>
                  <div style={styles.metricBox} className="print-bg-light">
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Search Enquiry Time</span>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#f8fafc' }} className="print-text-dark">{parsedData.timeline.searchTime}</strong>
                  </div>
                  <div style={styles.metricBox} className="print-bg-light">
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Incident Time</span>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#f8fafc' }} className="print-text-dark">{parsedData.when}</strong>
                  </div>
                </div>

                <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#0f172a', borderRadius: '6px', border: '1px solid #334155' }} className="print-bg-light">
                  <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 'bold' }}>📝 INCIDENT SUMMARY:</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#cbd5e1' }} className="print-text-dark">{parsedData.what}</p>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>📊 GRAPHICAL RECOVERY PROGRESS</span>
                    <strong style={{ color: getRiskColor(parsedData.riskLevel) }}>{parsedData.progressPct}% Normalcy Restored</strong>
                  </div>
                  
                  <div style={{ width: '100%', height: '18px', backgroundColor: '#0f172a', borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155' }} className="print-bg-light">
                    <div style={{ width: `${parsedData.progressPct}%`, height: '100%', backgroundColor: getRiskColor(parsedData.riskLevel), transition: 'width 0.5s ease' }}></div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '16px' }}>
                  <div style={styles.phaseCardRed}>
                    <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold' }}>🔴 PHASE 1: CRITICAL</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', fontWeight: 'bold', color: '#fca5a5' }} className="print-text-dark">{parsedData.timeline.criticalWindow}</p>
                  </div>
                  <div style={styles.phaseCardYellow}>
                    <span style={{ fontSize: '10px', color: '#eab308', fontWeight: 'bold' }}>🟡 PHASE 2: CLEARING</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', fontWeight: 'bold', color: '#fef08a' }} className="print-text-dark">{parsedData.timeline.stabilizationWindow}</p>
                  </div>
                  <div style={styles.phaseCardGreen}>
                    <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: 'bold' }}>🟢 PHASE 3: SAFE NORMAL</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', fontWeight: 'bold', color: '#86efac' }} className="print-text-dark">{parsedData.timeline.normalizationWindow}</p>
                  </div>
                </div>

                <div style={{ marginTop: '18px', backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }} className="print-bg-light">
                  <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold' }}>🛡️ RECOMMENDED ACTIONABLE PRECAUTIONS:</span>
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '12px', color: '#cbd5e1' }} className="print-text-dark">
                    {parsedData.precautions.map((p, idx) => (
                      <li key={idx} style={{ marginBottom: '6px' }}>{p}</li>
                    ))}
                  </ul>
                </div>

                <button style={styles.downloadBtn} className="no-print" onClick={handleDownloadPDFReport}>
                  📄 Download Complete Graphical & Text PDF Report
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EMERGENCY ALERT SMS */}
        {activeTab === 'sos' && (
          <div style={styles.card} className="no-print">
            <h3>📱 Emergency Alert SMS & Dispatch Terminal</h3>
            <p style={styles.desc}>Dispatch instant geo-targeted SMS emergency alerts directly to regional emergency nodes.</p>

            {dispatchStatus && <div style={styles.successBanner}>{dispatchStatus}</div>}

            <form onSubmit={handleDispatch}>
              <div style={{ marginBottom: '16px' }}>
                <label style={styles.label}>Broadcast Message Payload:</label>
                <textarea
                  rows="4"
                  placeholder="Enter custom emergency broadcast message..."
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  style={styles.inputStyle}
                  required
                />
              </div>

              <button type="submit" style={styles.dispatchBtn}>🚨 Broadcast Emergency SMS Alert</button>
            </form>
          </div>
        )}

        {/* TAB 4: ANALYTICS & REPORTS */}
        {activeTab === 'reports' && (
          <div style={styles.card} className="no-print">
            <h3>📁 Regional Hazard Timeline Analytics</h3>
            <p style={styles.desc}>Summary breakdown of all monitored locations across North East Region (NER).</p>

            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHead}>
                    <th style={styles.th}>State</th>
                    <th style={styles.th}>Location</th>
                    <th style={styles.th}>Risk Level</th>
                    <th style={styles.th}>Critical Window</th>
                    <th style={styles.th}>Normalization</th>
                  </tr>
                </thead>
                <tbody>
                  {hotspots.map((h) => (
                    <tr key={h.id} style={styles.tableRow}>
                      <td style={styles.td}>{h.state}</td>
                      <td style={styles.td}>{h.location}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.riskTag, backgroundColor: getRiskColor(h.risk) }}>{h.risk}</span>
                      </td>
                      <td style={{ ...styles.td, color: '#fca5a5' }}>{h.criticalHours}</td>
                      <td style={{ ...styles.td, color: '#4ade80' }}>{h.normalTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#0b1120', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' },
  header: { padding: '16px 32px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155' },
  logoBox: { display: 'flex', alignItems: 'center', gap: '10px' },
  badge: { backgroundColor: '#2563eb', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' },
  title: { margin: 0, fontSize: '20px' },
  subtitle: { margin: '2px 0 0 0', color: '#94a3b8', fontSize: '12px' },
  nav: { display: 'flex', gap: '8px', padding: '10px 32px', backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b' },
  tab: { padding: '8px 14px', backgroundColor: '#1e293b', color: '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  activeTab: { padding: '8px 14px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
  main: { padding: '24px 32px' },
  grid: { display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '20px', alignItems: 'start' },
  mapCard: { backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  liveTag: { fontSize: '11px', color: '#38bdf8', border: '1px solid #0284c7', padding: '2px 6px', borderRadius: '4px' },
  sideCard: { backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155', maxHeight: '580px', overflowY: 'auto' },
  alertList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  alertItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #1e293b' },
  stateTag: { fontSize: '11px', color: '#38bdf8', margin: '2px 0 0 0' },
  threatText: { fontSize: '11px', color: '#fca5a5', margin: '2px 0 0 0' },
  card: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' },
  graphicReportCard: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '2px solid #0284c7', boxShadow: '0 4px 20px rgba(2, 132, 199, 0.2)' },
  desc: { color: '#94a3b8', fontSize: '13px', marginBottom: '14px' },
  label: { display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' },
  inputStyle: { width: '100%', padding: '8px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', boxSizing: 'border-box', fontSize: '13px' },
  searchBtn: { width: '100%', padding: '10px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  metricBox: { backgroundColor: '#0f172a', padding: '10px', borderRadius: '6px', border: '1px solid #334155' },
  phaseCardRed: { backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '10px', borderRadius: '6px' },
  phaseCardYellow: { backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid #eab308', padding: '10px', borderRadius: '6px' },
  phaseCardGreen: { backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', padding: '10px', borderRadius: '6px' },
  downloadBtn: { width: '100%', marginTop: '20px', padding: '12px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  dispatchBtn: { padding: '12px 24px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  successBanner: { padding: '12px', backgroundColor: '#15803d', color: '#fff', borderRadius: '6px', marginBottom: '16px' },
  riskTag: { padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', color: '#fff' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '8px' },
  tableHead: { backgroundColor: '#0f172a', borderBottom: '2px solid #334155' },
  th: { padding: '10px', textAlign: 'left', fontSize: '12px', color: '#94a3b8' },
  tableRow: { borderBottom: '1px solid #334155' },
  td: { padding: '10px', fontSize: '13px', color: '#cbd5e1' }
};
