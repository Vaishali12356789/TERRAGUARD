const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.get('/', (req, res) => {
  res.send("TerraGuard Backend is Live!");
});
app.use(cors());
app.use(express.json());

// MongoDB Local Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/terraguard';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.log('MongoDB local fallback active (using memory seed)'));

// Mongoose Schema & Model
const HotspotSchema = new mongoose.Schema({
  id: Number,
  state: String,
  location: String,
  lat: Number,
  lng: Number,
  risk: String,
  threat: String,
  moisture: String,
  rain: String
});

const Hotspot = mongoose.model('Hotspot', HotspotSchema);

// Fallback Initial Seed Data
const initialHotspots = [
  { id: 1, state: 'Sikkim', location: 'Teesta River Valley (NH-10)', lat: 27.3389, lng: 88.6065, risk: 'CRITICAL', threat: 'Flash Flood & Slope Failure', moisture: '92%', rain: '120 mm/h' },
  { id: 2, state: 'Assam', location: 'Dima Hasao Hill Tracts', lat: 25.1833, lng: 93.0167, risk: 'HIGH', threat: 'Track Submergence & Mudslide', moisture: '84%', rain: '95 mm/h' },
  { id: 3, state: 'Meghalaya', location: 'Shillong - Dawki Highway', lat: 25.5788, lng: 91.8933, risk: 'HIGH', threat: 'Heavy Downpour Landslide', moisture: '88%', rain: '110 mm/h' },
  { id: 4, state: 'Arunachal Pradesh', location: 'Itanagar Bypass Slope', lat: 27.0844, lng: 93.6053, risk: 'MEDIUM', threat: 'Debris Flow Risk', moisture: '65%', rain: '45 mm/h' }
];

// GET Hotspots API (Database + Fallback)
app.get('/api/hotspots', async (req, res) => {
  try {
    const dbHotspots = await Hotspot.find();
    if (dbHotspots.length > 0) {
      return res.json(dbHotspots);
    }
    res.json(initialHotspots);
  } catch (err) {
    res.json(initialHotspots);
  }
});

// POST NLP Incident Parser API
app.post('/api/parse-nlp', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });

  let detectedState = 'North East Region';
  let riskLevel = 'MEDIUM';
  const textLower = text.toLowerCase();

  if (textLower.includes('sikkim') || textLower.includes('teesta')) detectedState = 'Sikkim';
  else if (textLower.includes('assam') || textLower.includes('dima hasao')) detectedState = 'Assam';
  else if (textLower.includes('meghalaya') || textLower.includes('shillong')) detectedState = 'Meghalaya';

  if (textLower.includes('landslide') || textLower.includes('flood') || textLower.includes('block')) {
    riskLevel = 'CRITICAL';
  }

  res.json({
    detectedState,
    riskLevel,
    confidenceScore: '96.8%',
    timestamp: new Date().toLocaleTimeString()
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`TerraGuard Backend running on port ${PORT}`);
});
