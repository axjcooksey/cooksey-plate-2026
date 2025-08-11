import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Cooksey Plate Backend is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Cooksey Plate backend running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});