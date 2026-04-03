import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import postRoutes from './routes/postRoutes';
import sessionRoutes from './routes/sessionRoutes';
import paymentRoutes from './routes/paymentRoutes';
import partnershipRoutes from './routes/partnershipRoutes';
import affiliateRoutes from './routes/affiliateRoutes';
import brandRoutes from './routes/brandRoutes';
import adminRoutes from './routes/adminRoutes';
import notificationRoutes from './routes/notificationRoutes';
import productRoutes from './routes/productRoutes';
import settingRoutes from './routes/settingRoutes';
import aiRoutes from './routes/aiRoutes';
import { generateAIPlan as handleGenerateAI, followUpQuestion as handleFollowUp } from './controllers/aiController';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'MISSING_API_KEY',
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined room user_${userId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Attach io to request object for use in controllers
app.use((req: any, _res, next) => {
  req.io = io;
  next();
});
// Health Check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/api/ai-ping', (_req, res) => res.json({ status: 'ok', message: 'AI Routes are active' }));

// AI PATHS (Pointing to consolidated controller)
app.post('/api/generate-ai-plan', handleGenerateAI);
app.post('/api/follow-up', handleFollowUp);

// LEGACY PATHS (FOR COMPATIBILITY)
app.post('/api/ai/generate-ai-plan', handleGenerateAI);
app.post('/api/ai/follow-up', handleFollowUp);

// --- OTHER ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/partnerships', partnershipRoutes);
app.use('/api/affiliates', affiliateRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/products', productRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', aiRoutes);



// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export { app, io };