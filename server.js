const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to Render PostgreSQL or Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Auto-initialize table
pool.query(`
  CREATE TABLE IF NOT EXISTS inquiries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(120),
    site_location TEXT NOT NULL,
    material_type VARCHAR(100),
    rmc_grade VARCHAR(50),
    casting_date VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).catch(err => console.error("Database initialization error:", err));

// Ingest quote submission
app.post('/api/inquiries', async (req, res) => {
  const { name, phone, email, site_location, material_type, rmc_grade, casting_date, notes } = req.body;
  
  if (!name || !phone || !site_location) {
    return res.status(400).json({ error: 'Name, phone, and site location are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO inquiries (name, phone, email, site_location, material_type, rmc_grade, casting_date, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, phone, email || null, site_location, material_type || 'General Inquiry', rmc_grade || null, casting_date || null, notes || null]
    );
    res.status(201).json({ success: true, inquiry: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database server error' });
  }
});

// Health check route
app.get('/', (req, res) => res.send('A2 Infra API is running'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));