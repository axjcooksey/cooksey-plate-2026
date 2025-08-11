import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import squiggleRoutes from './routes/squiggle';
import userRoutes from './routes/users';
import familyGroupRoutes from './routes/family-groups';
import roundRoutes from './routes/rounds';
import tipRoutes from './routes/tips';
import ladderRoutes from './routes/ladder';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Cooksey Plate Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Cooksey Plate API v1.0',
    endpoints: {
      squiggle: '/api/squiggle/*',
      users: '/api/users/*',
      familyGroups: '/api/family-groups/*',
      rounds: '/api/rounds/*',
      tips: '/api/tips/*',
      ladder: '/api/ladder/*'
    },
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/squiggle', squiggleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/family-groups', familyGroupRoutes);
app.use('/api/rounds', roundRoutes);
app.use('/api/tips', tipRoutes);
app.use('/api/ladder', ladderRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: error.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Cooksey Plate backend running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api/`);
});