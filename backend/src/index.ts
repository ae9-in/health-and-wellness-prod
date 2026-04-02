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

// --- AI ROUTES (TOP OF STACK FOR RELIABILITY) ---
const handleGenerateAI = async (req: any, res: any) => {
  try {
    const { goal, ageGroup, gender, dietPreference, activityLevel, focusArea } = req.body;
    const systemPrompt = "You are a professional AI health assistant. Provide structured, practical, and safe health advice including diet plans, workout routines, mental wellness tips, and product suggestions.";
    const userPrompt = `User Details:\nGoal: ${goal}\nAge: ${ageGroup}\nGender: ${gender}\nDiet: ${dietPreference}\nActivity Level: ${activityLevel}\nFocus: ${focusArea}\n\nGenerate:\n- Diet Plan\n- Workout Plan\n- Mental Wellness Tips\n- Supplements / Herbal Suggestions\n- Product Recommendations\n- Daily Tips\n\nKeep output structured and easy to read.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2048,
    });
    res.json({ result: chatCompletion.choices[0]?.message?.content || '' });
  } catch (error: any) {
    console.error('Groq AI Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate AI plan.' });
  }
};

const handleFollowUp = async (req: any, res: any) => {
  try {
    const { question, previousContext } = req.body;
    const systemPrompt = "You are a certified AI Health Assistant. Answer user follow-up questions safely and practically.";
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...((previousContext || []).map((msg: any) => ({ role: msg.role, content: msg.content }))),
        { role: 'user', content: question },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    });
    res.json({ result: chatCompletion.choices[0]?.message?.content || '' });
  } catch (error: any) {
    console.error('Groq AI Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate follow-up.' });
  }
};

// Health Check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/api/ai-ping', (_req, res) => res.json({ status: 'ok', message: 'AI Routes are active' }));

// NEW PATHS
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