import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hotspots, setHotspots] = useState([]);
  const [inputText, setInputText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [customMsg, setCustomMsg] = useState('');
  const [dispatchStatus, setDispatchStatus] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/hotspots')
      .then((res) => res.json())
      .then((data) => setHotspots(data))
      .catch((err) => console.error('Error fetching backend data:', err));
  }, []);

  const handleParse = async () => {
    if (!inputText) return;
    try {
      const res = await fetch('http://localhost:5000/api/parse-nlp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await res.json();
      setParsedData(data);
    } catch (err) {
      console.error('NLP Error:', err);
    }
  };

  const handleDispatch = (e) => {
    e.preventDefault();
    setDispatchStatus('Alert broadcasted successfully to state emergency nodes!');
    setTimeout(() => setDispatchStatus(null), 4000);
  };

  const downloadCSV = () => {
    const headers = "ID,State,Location,Latitude,Longitude,Risk,Threat,Moisture,Rainfall\n";
    const rows = hotspots.map(h => `${h.id},"${h.state}","${h.location}",${h.lat},${h.lng},${h.risk},"${h.threat}",${h.moisture},${h.rain}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TerraGuard_Hotspots_Report.csv';
    a.click();
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logoBox}>
          <span style={styles.badge}>SIH 26001</span>
          <h1 style={styles.title}>TerraGuard GIS Platform</h1>
        </div>
        <p style={styles.subtitle}>Early Warning & Incident Monitoring System - NER Zone</p>
      </header>

      <nav style={styles.nav}>
        <button style={activeTab === 'dashboard' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('dashboard')}>
          📊 Live Risk Dashboard
        </button>
        <button style={activeTab === 'nlp' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('nlp')}>
          🧠 NLP Incident Parser
        </button>
        <button style={activeTab === 'sos' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('sos')}>
          🚨 Emergency SOS Dispatch
        </button>
        <button style={activeTab === 'reports' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('reports')}>
          📁 Analytics & Reports
        </button>
      </nav>

      <main style={styles.main}>
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
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  />
                  {hotspots.map((h) => (
                    <Marker key={h.id} position={[h.lat, h.lng]}>
                      <Popup>
                        <div style={{ color: '#0f172a' }}>
                          <strong>{h.location} ({h.state})</strong><br />
                          Risk Level: <span style={{ color: h.risk === 'CRITICAL' ? '#dc2626' : '#d97706', fontWeight: 'bold' }}>{h.risk}</span><br />
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
              <h3 style={{ margin: '0 0 16px 0' }}>Active Hotspot Feeds ({hotspots.length})</h3>
              <div style={styles.alertList}>
                {hotspots.map((h) => (
                  <div key={h.id} style={styles.alertItem}>
                    <div>
                      <strong>{h.location}</strong>
                      <p style={styles.stateTag}>{h.state} • Moisture: {h.moisture} • Rain: {h.rain}</p>
                      <p style={styles.threatText}>{h.threat}</p>
                    </div>
                    <span style={{ ...styles.riskTag, backgroundColor: h.risk === 'CRITICAL' ? '#dc2626' : '#d97706' }}>
                      {h.risk}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'nlp' && (
          <div style={styles.singleCard}>
            <h3>AI/NLP Social & News Parser</h3>
            <p style={styles.desc}>Paste raw emergency tweets, SMS feeds, or news snippets to extract structured geo-threats.</p>
            <textarea
              rows="4"
              style={styles.inputStyle}
              placeholder="e.g., Heavy landslide reported on Teesta Valley Road NH-10 Sikkim. Traffic blocked."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button style={styles.nlpBtn} onClick={handleParse}>Parse Incident Data</button>

            {parsedData && (
              <div style={styles.parsedResult}>
                <h4>Parsed Threat Output:</h4>
                <p><strong>Detected Region:</strong> {parsedData.detectedState}</p>
                <p><strong>Threat Level:</strong> {parsedData.riskLevel}</p>
                <p><strong>Confidence Score:</strong> {parsedData.confidenceScore}</p>
                <p><strong>Timestamp:</strong> {parsedData.timestamp}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sos' && (
          <div style={styles.singleCard}>
            <h3>Emergency Alert Broadcast Terminal</h3>
            <p style={styles.desc}>Dispatch instant geo-fenced SOS broadcasts directly to state disaster management units.</p>
            {dispatchStatus && <div style={styles.successBanner}>{dispatchStatus}</div>}
            <form onSubmit={handleDispatch}>
              <div style={{ marginBottom: '16px' }}>
                <label style={styles.label}>Broadcast Message Payload:</label>
                <textarea
                  rows="4"
                  placeholder="Enter urgent evacuation or safety instructions..."
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  style={styles.inputStyle}
                  required
                />
              </div>
              <button type="submit" style={styles.dispatchBtn}>🚨 Broadcast Alert to NDRF & SDMA</button>
            </form>
          </div>
        )}

        {activeTab === 'reports' && (
          <div style={styles.singleCard}>
            <h3>Export NDRF & SDMA Risk Reports</h3>
            <p style={styles.desc}>Generate official telemetry summaries and GIS disaster hotspot data for state administrative authorities.</p>
            <button style={styles.downloadBtn} onClick={downloadCSV}>
              📥 Download Hotspot CSV Summary
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
  riskTag: { padding: '3px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', color: '#fff' },
  singleCard: { backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155', maxWidth: '700px' },
  desc: { color: '#94a3b8', marginBottom: '16px', fontSize: '14px' },
  inputStyle: { width: '100%', padding: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', boxSizing: 'border-box' },
  nlpBtn: { marginTop: '12px', padding: '10px 20px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  parsedResult: { marginTop: '20px', padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #0284c7' },
  dispatchBtn: { padding: '12px 24px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  downloadBtn: { padding: '12px 24px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  label: { display: 'block', marginBottom: '8px', color: '#cbd5e1' },
  successBanner: { padding: '12px', backgroundColor: '#15803d', color: '#fff', borderRadius: '6px', marginBottom: '16px' }
};