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
  { id: 1, state: 'Sikkim', location: 'Teesta River Valley (NH-10)', lat: 27.3389, lng: 88.6065, risk: 'CRITICAL', threat: 'Major Landslide & Road Blockage', moisture: '92%', rain: '140mm', criticalHours: '0 - 8 Hours', normalTime: 'After 36 Hours' },
  { id: 2, state: 'Assam', location: 'Guwahati Zoo Road', lat: 26.1445, lng: 91.7362, risk: 'HIGH', threat: 'Urban Flash Flood Hazard', moisture: '85%', rain: '95mm', criticalHours: '0 - 5 Hours', normalTime: 'After 24 Hours' },
  { id: 3, state: 'Meghalaya', location: 'Cherrapunji Bypass', lat: 25.2986, lng: 91.7321, risk: 'MEDIUM', threat: 'Soil Erosion & Slope Instability', moisture: '74%', rain: '60mm', criticalHours: '0 - 3 Hours', normalTime: 'After 18 Hours' },
  { id: 4, state: 'Arunachal Pradesh', location: 'Itanagar Highway', lat: 27.0844, lng: 93.6053, risk: 'HIGH', threat: 'Mudslide & Falling Rocks', moisture: '88%', rain: '110mm', criticalHours: '0 - 6 Hours', normalTime: 'After 24 Hours' },
  { id: 5, state: 'Nagaland', location: 'Kohima Bypass Road', lat: 25.6751, lng: 94.1086, risk: 'MEDIUM', threat: 'Minor Landslide Activity', moisture: '68%', rain: '45mm', criticalHours: '0 - 2 Hours', normalTime: 'After 12 Hours' },
  { id: 6, state: 'Manipur', location: 'Imphal West Highway', lat: 24.8170, lng: 93.9368, risk: 'CRITICAL', threat: 'River Overflow & Inundation', moisture: '95%', rain: '160mm', criticalHours: '0 - 10 Hours', normalTime: 'After 48 Hours' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hotspots, setHotspots] = useState(initialHotspots);
  
  // NLP / Search State
  const [searchWhere, setSearchWhere] = useState('');
  const [searchWhen, setSearchWhen] = useState('');
  const [searchWhat, setSearchWhat] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);

  // SMS / SOS State
  const [customMsg, setCustomMsg] = useState('');
  const [selectedRiskType, setSelectedRiskType] = useState('Flood & Submergence Alert');
  const [dispatchStatus, setDispatchStatus] = useState(null);

  useEffect(() => {
    fetch('https://terraguard-etyf.onrender.com/api/hotspots')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) setHotspots(data);
      })
      .catch((err) => console.error('Error fetching backend data:', err));
  }, []);

  const analyzeIncident = (whereInput, whenInput, whatInput) => {
    const text = (whatInput || '').toLowerCase();
    const queryTime = new Date().toLocaleTimeString();
    
    let calculatedRisk = 'MEDIUM';
    let dynamicTimeline = {
      searchTime: queryTime,
      criticalUntil: '0 to 3 Hours (Immediate Action)',
      mediumUntil: '3 to 12 Hours (Stabilization Phase)',
      normalBy: 'After 18 Hours (Safe Return Expected)'
    };
    let dynamicPrecautions = [];

    if (text.includes('block') || text.includes('landslide') || text.includes('flood') || text.includes('cloudburst') || text.includes('overflow')) {
      calculatedRisk = 'CRITICAL';
      dynamicTimeline = {
        searchTime: queryTime,
        criticalUntil: 'Next 0 to 8 Hours (High Threat / Severe Hazard)',
        mediumUntil: '8 to 24 Hours (Clearing & Emergency Work)',
        normalBy: 'After 36 Hours (Full Normalcy Restored)'
      };
    } else if (text.includes('rain') || text.includes('crack') || text.includes('mud') || text.includes('water')) {
      calculatedRisk = 'HIGH';
      dynamicTimeline = {
        searchTime: queryTime,
        criticalUntil: 'Next 0 to 5 Hours (Caution Required)',
        mediumUntil: '5 to 16 Hours (Active Monitoring)',
        normalBy: 'After 24 Hours (Safe Return Expected)'
      };
    }

    if (text.includes('block') || text.includes('landslide') || text.includes('road')) {
      dynamicPrecautions = [
        'Deploy heavy JCB/Bulldozers for highway clearing.',
        'Divert commercial traffic via alternate state roads.',
        'Station BRO patrol units near high-risk slopes.',
        'Set up emergency transit tents for commuters.'
      ];
    } else if (text.includes('flood') || text.includes('overflow') || text.includes('water') || text.includes('river')) {
      dynamicPrecautions = [
        'Deploy NDRF motorboats along riverbank settlements.',
        'Trigger local siren alarms for immediate evacuation.',
        'Distribute drinking water and emergency dry ration.',
        'Setup high-ground relief camps with medical kits.'
      ];
    } else {
      dynamicPrecautions = [
        'Maintain continuous satellite and sensor telemetry.',
        'Keep SDRF rapid deployment teams on standby.',
        'Maintain open VHF communication lines.',
        'Advise citizens against non-essential travel.'
      ];
    }

    return {
      id: Date.now(),
      where: whereInput || 'Teesta Valley, Sikkim',
      when: whenInput || 'Current Query Time',
      what: whatInput || 'Road blockage and severe weather incident',
      riskLevel: calculatedRisk,
      timeline: dynamicTimeline,
      precautions: dynamicPrecautions,
      timestamp: queryTime
    };
  };

  const handleIncidentSearch = () => {
    if (!searchWhere && !searchWhat) return;
    const result = analyzeIncident(searchWhere, searchWhen, searchWhat);
    setParsedData(result);
    setSearchHistory([result, ...searchHistory]);
  };

  const loadQuickScenario = (whereVal, whenVal, whatVal) => {
    setSearchWhere(whereVal);
    setSearchWhen(whenVal);
    setSearchWhat(whatVal);
    const result = analyzeIncident(whereVal, whenVal, whatVal);
    setParsedData(result);
    setSearchHistory([result, ...searchHistory]);
  };

  const handleDispatch = (e) => {
    e.preventDefault();
    setDispatchStatus('Emergency SMS Alert Broadcasted to Target Region Nodes!');
    setTimeout(() => setDispatchStatus(null), 4500);
  };

  const getRiskColor = (risk) => {
    if (risk === 'CRITICAL') return '#dc2626';
    if (risk === 'HIGH') return '#ea580c';
    if (risk === 'MEDIUM') return '#eab308';
    return '#16a34a';
  };

  // DETAILED TIMELINE REPORT GENERATION
  const downloadTextReport = () => {
    const timestamp = new Date().toLocaleString();

    let reportContent = `================================================================================
               TERRAGUARD GIS PLATFORM - REGIONAL HAZARD REPORT
================================================================================
Generated On         : ${timestamp}
System Classification: SIH 26001 - Early Warning & Disaster Assessment System
Issuing Authority     : NDRF & State Disaster Management Authority (SDMA) Node
================================================================================

1. SEARCH QUERY ASSESSMENT & HAZARD TIMELINE
--------------------------------------------------------------------------------\n`;

    if (parsedData) {
      reportContent += `Target Location / Region : ${parsedData.where.toUpperCase()}
Query Search Time        : ${parsedData.timeline.searchTime}
Event Occurrence Time    : ${parsedData.when}
Incident Summary         : ${parsedData.what}
Assessed Risk Level      : [ ${parsedData.riskLevel} ]

DETAILED PHASED TIMELINE FOR SEARCHED REGION:
  [1] 🔴 Critical Hazard Phase   : ${parsedData.timeline.criticalUntil}
  [2] 🟡 Stabilization Phase     : ${parsedData.timeline.mediumUntil}
  [3] 🟢 Normalization / Safe    : ${parsedData.timeline.normalBy}

RECOMMENDED ACTIONABLE PRECAUTIONS:
${parsedData.precautions.map((p, idx) => `  * ${idx + 1}. ${p}`).join('\n')}
--------------------------------------------------------------------------------\n`;
    } else {
      reportContent += `No active region query filtered. Showing all active monitored zones below.\n\n`;
    }

    reportContent += `2. ALL MONITORED REGIONS HAZARD & RECOVERY TIMELINES
--------------------------------------------------------------------------------\n`;

    hotspots.forEach((h, index) => {
      reportContent += `[${index + 1}] REGION / LOCATION: ${h.location.toUpperCase()} (${h.state.toUpperCase()})
    - Threat Type            : ${h.threat}
    - Current Risk Severity  : ${h.risk}
    - 🔴 Critical Window     : ${h.criticalHours}
    - 🟢 Safe Normalization  : ${h.normalTime}
    - Telemetry Metrics      : Soil Moisture ${h.moisture} | Rain ${h.rain}
--------------------------------------------------------------------------------\n`;
    });

    reportContent += `\n3. EMERGENCY DIRECTORY
--------------------------------------------------------------------------------
  - NDRF Central Control Room : 011-24363260 / +91-9711077372
  - State Emergency Helpline  : 1070 / 1077
  - Emergency Central Desk    : 112

================================================================================
                             END OF OFFICIAL ADVISORY
================================================================================`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TerraGuard_Disaster_Timeline_Report_${Date.now()}.txt`;
    a.click();
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logoBox}>
          <span style={styles.badge}>SIH 26001</span>
          <h1 style={styles.title}>TerraGuard GIS Platform</h1>
        </div>
        <p style={styles.subtitle}>Early Warning & Disaster Incident Monitoring System - NER Zone</p>
      </header>

      <nav style={styles.nav}>
        <button style={activeTab === 'dashboard' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('dashboard')}>
          📊 Live Risk Dashboard
        </button>
        <button style={activeTab === 'nlp' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('nlp')}>
          🔍 Public Incident & News Search
        </button>
        <button style={activeTab === 'sos' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('sos')}>
          📱 Emergency Alert SMS
        </button>
        <button style={activeTab === 'reports' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('reports')}>
          📁 Analytics & Detailed Reports
        </button>
      </nav>

      <main style={styles.main}>
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div style={styles.grid}>
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
                          Critical: {h.criticalHours} | Normal: {h.normalTime}
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

        {/* TAB 2: INCIDENT & NEWS SEARCH */}
        {activeTab === 'nlp' && (
          <div style={styles.singleCard}>
            <h3>🔍 Search Public Incident & Disaster Reports</h3>
            <p style={styles.desc}>Search or input specific news/social reports by location, time, and incident details.</p>

            <div style={{ marginBottom: '16px', padding: '10px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>⚡ Quick Demo Scenarios (One-Click Auto Fill):</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  style={styles.demoBtn} 
                  onClick={() => loadQuickScenario('Teesta River Highway, Sikkim', '5:00 PM Today', 'Heavy rockfall & landslide causing total road block')}
                >
                  🚧 Landslide Roadblock (Sikkim)
                </button>
                <button 
                  style={styles.demoBtn} 
                  onClick={() => loadQuickScenario('Guwahati Zoo Road, Assam', '3:30 PM Today', 'Continuous heavy rainfall causing urban flash flood')}
                >
                  🌊 Urban Flash Flood (Assam)
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={styles.label}>📍 Where (Region / Location):</label>
                <input
                  type="text"
                  style={styles.inputStyle}
                  placeholder="e.g. Teesta Valley, Sikkim"
                  value={searchWhere}
                  onChange={(e) => setSearchWhere(e.target.value)}
                />
              </div>
              <div>
                <label style={styles.label}>⏰ When (Time / Date):</label>
                <input
                  type="text"
                  style={styles.inputStyle}
                  placeholder="e.g. Today 5:00 PM"
                  value={searchWhen}
                  onChange={(e) => setSearchWhen(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>📝 What Happened (Incident Details):</label>
              <textarea
                rows="3"
                style={styles.inputStyle}
                placeholder="e.g. Road block due to landslide near river bank."
                value={searchWhat}
                onChange={(e) => setSearchWhat(e.target.value)}
              />
            </div>

            <button style={styles.nlpBtn} onClick={handleIncidentSearch}>🔍 Search & Parse Incident Risk</button>

            {parsedData && (
              <div style={styles.parsedResult}>
                <h4>📌 Parsed Risk Summary:</h4>
                <p><strong>Region / Location:</strong> {parsedData.where}</p>

                <hr style={{ borderColor: '#334155', margin: '12px 0' }} />
                
                <h4>⏱️ Detailed Hazard Time Windows:</h4>
                <ul style={{ paddingLeft: '20px', color: '#cbd5e1', fontSize: '13px' }}>
                  <li>🕒 <strong>Query Execution Time:</strong> {parsedData.timeline.searchTime}</li>
                  <li>🔴 <strong>Critical Hazard Phase:</strong> {parsedData.timeline.criticalUntil}</li>
                  <li>🟡 <strong>Stabilization Phase:</strong> {parsedData.timeline.mediumUntil}</li>
                  <li>🟢 <strong>Safe Return Expected:</strong> {parsedData.timeline.normalBy}</li>
                </ul>

                <hr style={{ borderColor: '#334155', margin: '12px 0' }} />

                <h4>🛡️ Recommended Field Precautions:</h4>
                <ul style={{ paddingLeft: '20px', color: '#38bdf8', fontSize: '13px' }}>
                  {parsedData.precautions.map((p, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EMERGENCY ALERT SMS */}
        {activeTab === 'sos' && (
          <div style={styles.singleCard}>
            <h3>📱 Emergency Alert SMS & Dispatch Terminal</h3>
            <p style={styles.desc}>Dispatch instant geo-targeted SMS emergency alerts directly to local units.</p>

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

        {/* TAB 4: ANALYTICS & DETAILED REPORTS */}
        {activeTab === 'reports' && (
          <div style={styles.singleCardLarge}>
            <h3>📁 Regional Telemetry & Hazard Timeline Analytics</h3>
            <p style={styles.desc}>Complete breakdown of active locations along with critical threat hours and safe normalization times.</p>

            {/* TABULAR PRESENTATION */}
            <h4 style={{ color: '#38bdf8', marginTop: '16px' }}>📊 Regional Timeline Table</h4>
            <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHead}>
                    <th style={styles.th}>State</th>
                    <th style={styles.th}>Location</th>
                    <th style={styles.th}>Risk Severity</th>
                    <th style={styles.th}>Critical Hazard Window</th>
                    <th style={styles.th}>Safe Normalization Time</th>
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

            <button style={styles.downloadBtn} onClick={downloadTextReport}>
              📄 Download Hazard Timeline Report (.TXT)
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#0b1120', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' },
  header: { padding: '20px 32px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155' },
  logoBox: { display: 'flex', alignItems: 'center', gap: '12px' },
  badge: { backgroundColor: '#2563eb', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' },
  title: { margin: 0, fontSize: '22px' },
  subtitle: { margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' },
  nav: { display: 'flex', gap: '8px', padding: '12px 32px', backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b' },
  tab: { padding: '8px 14px', backgroundColor: '#1e293b', color: '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  activeTab: { padding: '8px 14px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
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
  riskTag: { padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', color: '#fff' },
  singleCard: { backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155', maxWidth: '750px' },
  singleCardLarge: { backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155', maxWidth: '1000px' },
  desc: { color: '#94a3b8', marginBottom: '16px', fontSize: '14px' },
  inputStyle: { width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', boxSizing: 'border-box' },
  nlpBtn: { marginTop: '8px', padding: '10px 20px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  demoBtn: { padding: '6px 12px', backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #0284c7', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  parsedResult: { marginTop: '20px', padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #0284c7' },
  dispatchBtn: { padding: '12px 24px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  downloadBtn: { padding: '12px 24px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  label: { display: 'block', marginBottom: '6px', color: '#cbd5e1', fontSize: '13px' },
  successBanner: { padding: '12px', backgroundColor: '#15803d', color: '#fff', borderRadius: '6px', marginBottom: '16px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '8px' },
  tableHead: { backgroundColor: '#0f172a', borderBottom: '2px solid #334155' },
  th: { padding: '10px', textAlign: 'left', fontSize: '12px', color: '#94a3b8' },
  tableRow: { borderBottom: '1px solid #334155' },
  td: { padding: '10px', fontSize: '13px', color: '#cbd5e1' }
};
