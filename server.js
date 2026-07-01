const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// Initial default data if db.json doesn't exist
const getInitialData = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 4);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return {
    tasks: [
      {
        id: 'task-1',
        title: 'Bimbingan Bab 3 Skripsi',
        deadline: tomorrow.toISOString(),
        category: 'Skripsi',
        completed: false,
        priority: 'penting',
      },
      {
        id: 'task-2',
        title: 'Tugas Praktikum Jaringan Komputer',
        deadline: nextWeek.toISOString(),
        category: 'Kuliah',
        completed: false,
        priority: 'sedang',
      },
      {
        id: 'task-3',
        title: 'Submit Proposal PKM-KC',
        deadline: yesterday.toISOString(),
        category: 'Kompetisi',
        completed: false,
        priority: 'penting',
      }
    ],
    categories: [
      { id: 'cat-skripsi', name: 'Skripsi', color: '#ef4444' },
      { id: 'cat-kuliah', name: 'Kuliah', color: '#3b82f6' },
      { id: 'cat-kompetisi', name: 'Kompetisi', color: '#f59e0b' },
      { id: 'cat-pribadi', name: 'Pribadi', color: '#10b981' },
    ],
    lastUpdated: Date.now()
  };
};

// Helper to read database
const readDB = () => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading db file:', error);
    return getInitialData();
  }
};

// Helper to write database
const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing db file:', error);
    return false;
  }
};

// Routes
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'Academic Flow Sync Server is running' });
});

// Sync endpoint: GET fetches tasks and categories with the current timestamp
app.get('/api/sync', (req, res) => {
  const dbData = readDB();
  res.json({
    tasks: dbData.tasks || [],
    categories: dbData.categories || [],
    lastUpdated: dbData.lastUpdated || Date.now()
  });
});

// Sync endpoint: POST updates the database with new tasks/categories
app.post('/api/sync', (req, res) => {
  const { tasks, categories } = req.body;
  
  if (!Array.isArray(tasks) || !Array.isArray(categories)) {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  const updatedData = {
    tasks,
    categories,
    lastUpdated: Date.now()
  };

  const success = writeDB(updatedData);
  if (success) {
    res.json(updatedData);
  } else {
    res.status(500).json({ error: 'Failed to write to database' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(`Academic Flow Backend Server is running!`);
  console.log(`- Local Address:   http://localhost:${PORT}`);
  console.log(`- Sync endpoint:   http://localhost:${PORT}/api/sync`);
  console.log(`==================================================`);
});
