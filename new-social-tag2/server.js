require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('./configpassport');
const authRoutes = require('./routesauth');
const apiRoutes = require('./routesapi');
const peraWalletRoutes = require('./peraWalletRoutes');
const cors = require('cors');
const themePurchaseRoutes = require('./themePurchaseRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize MongoDB connection before setting up session
let mongoStore;

// Establish MongoDB connection first
const initializeMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas successfully');
    
    // Only create MongoStore after successful connection
    mongoStore = MongoStore.create({ 
      mongoUrl: process.env.MONGODB_URI,
      ttl: 24 * 60 * 60, // Session TTL in seconds
      autoRemove: 'native',
    });

    return true;
  } catch (err) {
    console.error('MongoDB connection error:', {
      name: err.name,
      message: err.message,
      code: err.code
    });
    return false;
  }
};

// CORS configuration
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

// Initialize application after MongoDB connection
const initializeApp = async () => {
  const isConnected = await initializeMongoDB();

  if (!isConnected) {
    console.error('Failed to connect to MongoDB. Exiting...');
    process.exit(1);
  }

  // Setup session after MongoDB connection is confirmed
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false, // Changed to false to avoid creating unnecessary sessions
    store: mongoStore,
    cookie: { 
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      domain: '.vercel.app'
    },
    proxy: true
  }));

  // Initialize Passport after session setup
  app.use(passport.initialize());
  app.use(passport.session());

  // Routes
  app.use('/api/theme', themePurchaseRoutes);
  app.use('/api/pera', peraWalletRoutes);
  app.use('/api/leaderboard', apiRoutes);
  app.use('/auth', authRoutes);
  app.use('/api', apiRoutes);
  app.use('/peraWalletRoutes', peraWalletRoutes);

  // Logging middleware
  app.use((req, res, next) => {
    console.log('Incoming request to:', req.path);
    console.log('Session:', req.session);
    console.log('Is Authenticated:', req.isAuthenticated());
    console.log('User:', req.user);
    console.log('Cookies:', req.cookies);
    next();
  });

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

  // Start server
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

// Start the application
initializeApp().catch(console.error);
