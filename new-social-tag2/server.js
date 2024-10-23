require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('./configpassport');
const authRoutes = require('./routesauth');
const apiRoutes = require('./routesapi');
const peraWalletRoutes = require('./peraWalletRoutes');
const cors = require('cors');
const themePurchaseRoutes = require('./themePurchaseRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection for user data only
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas for user data');
  })
  .catch(err => {
    console.error('MongoDB connection error details:', {
      name: err.name,
      message: err.message,
      code: err.code
    });
  });

const corsOptions = {
  origin: [
    process.env.NEXT_PUBLIC_FRONTEND_URL,
    'https://social-tag.vercel.app',
    'https://vercel.live/link/social-tag-nielsvdschepop12367-gmailcoms-projects.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.set('trust proxy', 1);

// Create session store
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    domain: '.vercel.app'
  },
  proxy: true,
  name: 'socialtagsession',
  rolling: true // Resets cookie maxAge on every response
};

// Add session middleware
app.use(session(sessionConfig));

// Initialize Passport after session
app.use(passport.initialize());
app.use(passport.session());

// Debug middleware - log every request
app.use((req, res, next) => {
  console.log('--------------------');
  console.log('Request:', {
    path: req.path,
    sessionId: req.sessionID,
    hasSession: !!req.session,
    isAuthenticated: req.isAuthenticated(),
    sessionKeys: req.session ? Object.keys(req.session) : [],
    cookies: req.cookies
  });
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/theme', themePurchaseRoutes);
app.use('/api/pera', peraWalletRoutes);
app.use('/peraWalletRoutes', peraWalletRoutes);

// Auth status route
app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ isAuthenticated: true, user: req.user });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// Pera Wallet routes
app.get('/api/pera/account/:address', async (req, res) => {
  try {
    const { getAccountInfo } = require('./perawalletservice');
    const accountInfo = await getAccountInfo(req.params.address);
    res.json(accountInfo);
  } catch (error) {
    console.error('Error fetching Pera Wallet account info:', error);
    res.status(500).json({ error: 'Failed to fetch account info' });
  }
});

app.post('/api/pera/transaction', async (req, res) => {
  try {
    const { sendTransaction } = require('./perawalletservice');
    const { fromAddress, toAddress, amount } = req.body;
    const unsignedTxn = await sendTransaction(fromAddress, toAddress, amount);
    res.json({ unsignedTxn: Buffer.from(unsignedTxn).toString('base64') });
  } catch (error) {
    console.error('Error creating Pera Wallet transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Using in-memory session store');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
