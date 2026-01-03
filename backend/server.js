const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tasktracker';

mongoose.connect(MONGODB_URI)
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => console.error('MongoDB connection error:', err));

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    required: true,
    default: 'Medium'
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

const Task = mongoose.model('Task', taskSchema);

app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching tasks', error: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, priority, dueDate, status } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    if (!dueDate) {
      return res.status(400).json({ success: false, message: 'Due date is required' });
    }

    const task = new Task({
      title,
      description,
      priority: priority || 'Medium',
      dueDate,
      status: status || 'Pending'
    });

    await task.save();
    res.status(201).json({ success: true, data: task, message: 'Task created successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error creating task', error: error.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = await Task.findByIdAndUpdate(id, updates, { 
      new: true, 
      runValidators: true 
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, data: task, message: 'Task updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error updating task', error: error.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error deleting task', error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});