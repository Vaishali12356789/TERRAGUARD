import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Expanded mock hotspots list
const initialHotspots = [
  { id: 1, state: 'Sikkim', location: 'Teesta Valley NH-10', lat: 27.3389, lng: 88.6065, risk: 'CRITICAL', threat: 'Major Landslide & Road Blockage', moisture: '92%', rain: '140mm' },
  { id: 2, state: 'Assam', location: 'Guwahati Zoo Road', lat: 26.1445, lng: 91.7362, risk: 'HIGH', threat: 'Urban Flash Flood Hazard', moisture: '85%', rain: '95mm' },
  { id: 3, state: 'Meghalaya', location: 'Cherrapunji Bypass', lat: 25.2986, lng: 91.7321, risk: 'MEDIUM', threat: 'Soil Erosion & Slope Instability', moisture: '74%', rain: '60mm' },
  { id: 4, state: 'Arunachal Pradesh', location: 'Itanagar Highway', lat: 27.0844, lng: 93.6053, risk: 'HIGH', threat: 'Mudslide & Falling Rocks', moisture: '88%', rain: '110mm' },
  { id: 5, state: 'Nagaland', location: 'Kohima Bypass Road', lat: 25.6751, lng: 94.1086, risk: 'MEDIUM', threat: 'Minor Landslide Activity', moisture: '68%', rain: '45mm' },
  { id: 6, state: 'Manipur', location: 'Imphal West Highway', lat: 24.8170, lng: 93.9368, risk: 'CRITICAL', threat: 'River Overflow & Inundation', moisture: '95%', rain: '160mm' }
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

  // Dynamic Incident Logic Engine
  const analyzeIncident = (whereInput, whenInput, whatInput) => {
    const text = (whatInput || '').toLowerCase();
    
    let calculatedRisk = 'MEDIUM';
    let dynamicTimeline = {
      criticalUntil: 'Next 0 to 3 Hours',
      mediumUntil: '3 to 12 Hours',
      normalBy: 'After 18 Hours'
    };
    let dynamicPrecautions = [];

    // Critical condition matching
    if (text.includes('block') || text.includes('landslide') || text.includes('flood') || text.includes('cloudburst') || text.includes('overflow')) {
      calculatedRisk = 'CRITICAL';
      dynamicTimeline = {
        criticalUntil: 'Next 0 to 8 Hours (Immediate Active Hazard)',
        mediumUntil: '8 to 24 Hours (Clearing & Stabilizing)',
        normalBy: 'After 36 Hours (Full Operations)'
      };
    } else if (text.includes('rain') || text.includes('crack') || text.includes('mud') || text.includes('water')) {
      calculatedRisk = 'HIGH';
      dynamicTimeline = {
        criticalUntil: 'Next 0 to 5 Hours (High Caution Required)',
        mediumUntil: '5 to 16 Hours (Monitoring Phase)',
        normalBy: 'After 24 Hours (Expected Normalcy)'
      };
    }

    // Dynamic Precautions based on keywords
    if (text.includes('block') || text.includes('landslide') || text.includes('road')) {
      dynamicPrecautions = [
        'Dispatch heavy earthmovers (JCB/Bulldozers) to clear highway debris.',
        'Issue immediate traffic diversion advisory for all heavy & commercial vehicles.',
        'Deploy Highway Patrol & BRO personnel to secure landslide periphery.',
        'Set up emergency transit tents for stranded commuters.'
      ];
    } else if (text.includes('flood') || text.includes('overflow') || text.includes('water') || text.includes('river')) {
      dynamicPrecautions = [
        'Deploy NDRF inflatable rescue motorboats along low-lying riverbanks.',
        'Issue high-decibel Siren Siren alarms for immediate local evacuation.',
        'Distribute purified drinking water and emergency dry ration packets.',
        'Establish elevated relief camps equipped with emergency medical kits.'
      ];
    } else {
      dynamicPrecautions = [
        'Maintain continuous satellite and ground sensor monitoring.',
        'Alert local Disaster Response Force (SDRF) rapid deployment teams.',
        'Keep emergency communication channels & VHF radios operational.',
        'Advise citizens to restrict non-essential travel in the region.'
      ];
    }

    return {
      id: Date.now(),
      where: whereInput || 'Teesta River Zone, Sikkim',
      when: whenInput || 'Current Live Report',
      what: whatInput || 'Road blockage and severe weather incident',
      riskLevel: calculatedRisk,
      timeline: dynamicTimeline,
      precautions: dynamicPrecautions,
      timestamp: new Date().toLocaleTimeString()
    };
  };

  const handleIncidentSearch = () => {
    if (!searchWhere && !searchWhat) return;
    const result = analyzeIncident(searchWhere, searchWhen, searchWhat);
    setParsedData(result);
    setSearchHistory([result, ...searchHistory]);
  };

  // Quick Demo Auto-Fill Handlers
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
    setDispatchStatus('Emergency SMS Alert Broadcasted to State Disaster Nodes & Hotlines successfully!');
    setTimeout(() => setDispatchStatus(null), 4500);
  };

  const getRiskColor = (risk) => {
    if (risk === 'CRITICAL') return '#dc2626'; // Red
    if (risk === 'HIGH') return '#ea580c';     // Dark Orange
    if (risk === 'MEDIUM') return '#eab308';   // Yellow/Amber
    return '#16a34a';                          // Green
  };

  const downloadTextReport = () => {
    const timestamp = new Date().toLocaleString();
    
    let reportContent = `================================================================================
               TERRAGUARD GIS PLATFORM - DISASTER ASSESSMENT REPORT
================================================================================
Generated On       : ${timestamp}
System Classification: SIH 26001 - Early Warning & Incident Monitoring System
Target Region       : North Eastern Region (NER) Zone
Issuing Authority   : NDRF & State Disaster Management Authority (SDMA) Node
================================================================================

1. EXECUTIVE SUMMARY
--------------------------------------------------------------------------------
This document provides a comprehensive situation and telemetry risk analysis for 
the monitored North Eastern Region zones. Real-time satellite imagery, ground-sensor
hydrological telemetry, and public incident parsing have been synthesized to formulate
this operational advisory.

2. ACTIVE REGIONAL HAZARD ASSESSMENT
--------------------------------------------------------------------------------\n`;

    hotspots.forEach((h, index) => {
      reportContent += `[${index + 1}] LOCATION: ${h.location.toUpperCase()} (${h.state.toUpperCase()})
    - Threat Classification : ${h.threat}
    - Risk Level Assigned   : ${h.risk}
    - Coordinates           : Lat ${h.lat}, Lng ${h.lng}
    - Soil Moisture Level   : ${h.moisture}
    - Recorded Rainfall     : ${h.rain}
--------------------------------------------------------------------------------\n`;
    });

    reportContent += `\n3. INCIDENT QUERY & PARSED AI THREAT SUMMARY
--------------------------------------------------------------------------------\n`;

    if (parsedData) {
      reportContent += `Query Target Region  : ${parsedData.where}
Query Timestamp      : ${parsedData.when}
Incident Description : ${parsedData.what}
Assessed Risk Status : ${parsedData.riskLevel}

STABILIZATION & HAZARD TIMELINE:
  * Critical Window  : ${parsedData.timeline.criticalUntil}
  * Moderate Window  : ${parsedData.timeline.mediumUntil}
  * Expected Normalcy: ${parsedData.timeline.normalBy}

RECOMMENDED EMERGENCY PRECAUTIONS:
${parsedData.precautions.map((p, idx) => `  (${idx + 1}) ${p}`).join('\n')}
--------------------------------------------------------------------------------\n`;
    } else {
      reportContent += `No active incident search queries recorded for this session.
--------------------------------------------------------------------------------\n`;
    }

    reportContent += `\n4. EMERGENCY DIRECTORY & STANDARD OPERATING PROCEDURES
--------------------------------------------------------------------------------
PRIMARY CONTACT HELPLINES:
  - NDRF Control Room           : 011-24363260 / +91-9711077372
  - State Disaster Response     : 1070 / 1077
  - Emergency Central Helpline  : 112

================================================================================
                             END OF OFFICIAL ADVISORY
================================================================================`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TerraGuard_Official_Report_${Date.now()}.txt`;
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
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {hotspots.map((h) => (
                    <Marker key={h.id} position={[h.lat, h.lng]}>
                      <Popup>
                        <div style={{ color: '#0f172a' }}>
                          <strong>{h.location} ({h.state})</strong><br />
                          Risk Level: <span style={{ color: getRiskColor(h.risk), fontWeight: 'bold' }}>{h.risk}</span><br />
                          Threat: {h.threat}<br />
                          Moisture: {h.moisture} | Rain: {h.rain}
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
                      <p style={styles.stateTag}>{h.state} • Moisture: {h.moisture} • Rain: {h.rain}</p>
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

            {/* DEMO AUTO-FILL BUTTONS */}
            <div style={{ marginBottom: '16px', padding: '10px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>⚡ Quick Demo Scenarios (One-Click Auto Fill):</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  style={styles.demoBtn} 
                  onClick={() => loadQuickScenario('Teesta River Highway, Sikkim', '5:00 PM Today', 'Heavy rockfall & landslide causing total road block')}
                >
                  🚧 Landslide Roadblock
                </button>
                <button 
                  style={styles.demoBtn} 
                  onClick={() => loadQuickScenario('Guwahati Zoo Road, Assam', '3:30 PM Today', 'Continuous heavy rainfall causing urban flash flood and waterlogging')}
                >
                  🌊 Urban Flash Flood
                </button>
                <button 
                  style={styles.demoBtn} 
                  onClick={() => loadQuickScenario('Imphal West Highway, Manipur', '12:00 PM Today', 'River embankment overflow threatening nearby residential colonies')}
                >
                  🏠 River Overflow
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
                  placeholder="e.g. Today 2:00 PM"
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
                placeholder="e.g. Heavy rainfall triggered landslide, blocking highway traffic."
                value={searchWhat}
                onChange={(e) => setSearchWhat(e.target.value)}
              />
            </div>

            <button style={styles.nlpBtn} onClick={handleIncidentSearch}>🔍 Search & Parse Incident Risk</button>

            {parsedData && (
              <div style={styles.parsedResult}>
                <h4>📌 Parsed Risk Summary:</h4>
                <p><strong>Region / Location:</strong> {parsedData.where}</p>
                <p><strong>Time of Event:</strong> {parsedData.when}</p>
                <p><strong>Incident Description:</strong> {parsedData.what}</p>
                <p><strong>Assessed Risk Level:</strong> <span style={{ color: getRiskColor(parsedData.riskLevel), fontWeight: 'bold' }}>{parsedData.riskLevel}</span></p>

                <hr style={{ borderColor: '#334155', margin: '12px 0' }} />
                
                <h4>⏱️ Projected Recovery Timeline:</h4>
                <ul style={{ paddingLeft: '20px', color: '#cbd5e1', fontSize: '13px' }}>
                  <li>🔴 <strong>Critical Hazard Window:</strong> {parsedData.timeline.criticalUntil}</li>
                  <li>🟡 <strong>Moderate Risk Window:</strong> {parsedData.timeline.mediumUntil}</li>
                  <li>🟢 <strong>Expected Normalization:</strong> {parsedData.timeline.normalBy}</li>
                </ul>

                <hr style={{ borderColor: '#334155', margin: '12px 0' }} />

                <h4>🛡️ Recommended Safety & Evacuation Precautions:</h4>
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
            <p style={styles.desc}>Dispatch instant geo-targeted SMS emergency alerts directly to local residents and disaster management units.</p>

            <div style={styles.contactBox}>
              <h4 style={{ margin: '0 0 8px 0', color: '#f8fafc' }}>📞 Emergency Helplines & Hotline Contacts</h4>
              <p style={{ margin: '4px 0', fontSize: '13px', color: '#cbd5e1' }}>🚨 <strong>NDRF National Control Room:</strong> 011-24363260, 9711077372</p>
              <p style={{ margin: '4px 0', fontSize: '13px', color: '#cbd5e1' }}>📢 <strong>State Disaster Management Helpline:</strong> 1070 / 1077</p>
              <p style={{ margin: '4px 0', fontSize: '13px', color: '#cbd5e1' }}>🚑 <strong>Emergency Police & Medical Response:</strong> 112</p>
            </div>

            {dispatchStatus && <div style={styles.successBanner}>{dispatchStatus}</div>}

            <form onSubmit={handleDispatch}>
              <div style={{ marginBottom: '16px' }}>
                <label style={styles.label}>Select Hazard Category:</label>
                <select 
                  style={{ ...styles.inputStyle, cursor: 'pointer' }} 
                  value={selectedRiskType} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedRiskType(val);
                    if (val.includes('Flood')) setCustomMsg('URGENT: Flash flood warning issued for riverbank zones. Move to higher ground immediately.');
                    else if (val.includes('Landslide')) setCustomMsg('ALERT: Landslide roadblock reported on main highway corridor. Avoid travelling until further notice.');
                    else setCustomMsg('EMERGENCY: Severe weather advisory in effect. Follow safety instructions from local authorities.');
                  }}
                >
                  <option>Flood & Submergence Alert</option>
                  <option>Landslide & Highway Blockage</option>
                  <option>Heavy Storm & Cloudburst</option>
                  <option>General Safety Evacuation</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={styles.label}>Broadcast SMS Message Payload:</label>
                <textarea
                  rows="4"
                  placeholder="Enter custom emergency broadcast message or evacuation order..."
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
            <h3>📁 Regional Telemetry & Incident Analytics Report</h3>
            <p style={styles.desc}>Complete tabular presentation of active regions, search history, risk levels, and timeline projections.</p>

            {/* TABULAR PRESENTATION */}
            <h4 style={{ color: '#38bdf8', marginTop: '20px' }}>📊 Active Region Telemetry Table</h4>
            <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHead}>
                    <th style={styles.th}>State</th>
                    <th style={styles.th}>Location</th>
                    <th style={styles.th}>Risk Level</th>
                    <th style={styles.th}>Threat Type</th>
                    <th style={styles.th}>Moisture</th>
                    <th style={styles.th}>Rainfall</th>
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
                      <td style={styles.td}>{h.threat}</td>
                      <td style={styles.td}>{h.moisture}</td>
                      <td style={styles.td}>{h.rain}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* GRAPHICAL REPRESENTATION BAR */}
            <h4 style={{ color: '#38bdf8' }}>📈 Risk Severity Projections & Stabilization Timeline</h4>
            <div style={styles.chartContainer}>
              <div style={styles.chartBarGroup}>
                <div style={{ fontSize: '12px', width: '120px' }}>Teesta Valley</div>
                <div style={styles.barBackground}>
                  <div style={{ ...styles.barFill, width: '90%', backgroundColor: '#dc2626' }}>Critical (0 - 8 Hours)</div>
                </div>
              </div>

              <div style={styles.chartBarGroup}>
                <div style={{ fontSize: '12px', width: '120px' }}>Guwahati Highway</div>
                <div style={styles.barBackground}>
                  <div style={{ ...styles.barFill, width: '70%', backgroundColor: '#ea580c' }}>High (6 - 12 Hours)</div>
                </div>
              </div>

              <div style={styles.chartBarGroup}>
                <div style={{ fontSize: '12px', width: '120px' }}>Cherrapunji Bypass</div>
                <div style={styles.barBackground}>
                  <div style={{ ...styles.barFill, width: '45%', backgroundColor: '#eab308', color: '#000' }}>Medium (12 - 18 Hours)</div>
                </div>
              </div>

              <div style={styles.chartBarGroup}>
                <div style={{ fontSize: '12px', width: '120px' }}>Kohima Road</div>
                <div style={styles.barBackground}>
                  <div style={{ ...styles.barFill, width: '25%', backgroundColor: '#16a34a' }}>Normalizing (24+ Hours)</div>
                </div>
              </div>
            </div>

            <button style={{ ...styles.downloadBtn, marginTop: '24px' }} onClick={downloadTextReport}>
              📄 Download Official Detailed Disaster Report (.TXT)
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
  contactBox: { backgroundColor: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #334155', marginBottom: '20px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '8px' },
  tableHead: { backgroundColor: '#0f172a', borderBottom: '2px solid #334155' },
  th: { padding: '10px', textAlign: 'left', fontSize: '12px', color: '#94a3b8' },
  tableRow: { borderBottom: '1px solid #334155' },
  td: { padding: '10px', fontSize: '13px', color: '#cbd5e1' },
  chartContainer: { backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', marginTop: '12px', border: '1px solid #334155' },
  chartBarGroup: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  barBackground: { flex: 1, backgroundColor: '#1e293b', borderRadius: '6px', overflow: 'hidden', height: '24px' },
  barFill: { height: '100%', display: 'flex', alignItems: 'center', paddingLeft: '8px', fontSize: '11px', fontWeight: 'bold', color: '#fff' }
};
