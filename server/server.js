require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://ritvikrajipl:7BpA6PRvWMJiVY1z@cluster0.lcrcado.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// --- Simple Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: Date.now() });
});

// // server/server.js (add below health-check)

const txns = require('./routes/transactions');
const insights = require('./routes/insights');
const advisor = require('./routes/advisor');
const authRoutes = require('./routes/auth');
const plannerRoutes = require('./routes/planner');
app.use('/api/auth', authRoutes);
app.use('/api/transactions', txns);
app.use('/api/insights', insights);
app.use('/api/advisor', advisor);
app.use('/api/planner', plannerRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
