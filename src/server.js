const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory fallback / sample routes
let tasks = [
  { id: 1, title: 'Setup MERN Project Foundation', status: 'completed', category: 'Dev' },
  { id: 2, title: 'Implement Task API Endpoints', status: 'in-progress', category: 'Backend' },
];

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'DevPulse API', timestamp: new Date().toISOString() });
});

app.get('/api/tasks', (req, res) => {
  res.json({ success: true, count: tasks.length, data: tasks });
});

app.post('/api/tasks', (req, res) => {
  const { title, category } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, message: 'Task title is required' });
  }
  const newTask = {
    id: tasks.length + 1,
    title,
    category: category || 'General',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  tasks.push(newTask);
  res.status(201).json({ success: true, data: newTask });
});

app.patch('/api/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }
  Object.assign(task, req.body);
  res.json({ success: true, data: task });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DevPulse API server running on port ${PORT}`);
  });
}

module.exports = app;
