import express, { Request, Response } from 'express';
import cors from 'cors';
import prisma from './db';
import authRouter from './routes/auth';
import coreRouter from './routes/core';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic Health Check Endpoint (PostgreSQL status, uptime)
const startTime = Date.now();
app.get('/api/health', async (req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    // Attempt database query with a timeout
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timed out')), 2000)
    );
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      timeout
    ]);
    dbStatus = 'connected';
  } catch (error: any) {
    dbStatus = `disconnected (${error.message || 'connection error'})`;
  }

  res.status(200).json({
    status: 'healthy',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
});

// Mounted Routes
app.use('/api/auth', authRouter);
app.use('/api', coreRouter);

// Fallback Route for Undefined Paths
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: `API Endpoint ${req.method} ${req.url} not found` });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    message: 'An internal server error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

export default app;
