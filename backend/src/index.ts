import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
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

dotenv.config();

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
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
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

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export { app, io };