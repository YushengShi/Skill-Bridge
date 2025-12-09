// backend/index.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
const PORT = 3000;

// mongoDB connection
const mongoDB_URI = 'mongodb://localhost:27017/a8';

mongoose
  .connect(mongoDB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// we write our routes here
// import userRoutes from './routes/userRoutes.js';
// import jobRoutes from './routes/jobRoutes.js';

// app.use('/user', userRoutes);
// app.use('/api/jobs', jobRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
