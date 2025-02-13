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
const { initializeDistributionScheduler } = require('./token_distribution_wrapper');
// const { runRewardProcessor} = require('./immersveWrapper');




const app = express();
const PORT = process.env.PORT || 5000;

// Initialize token distribution scheduler
initializeDistributionScheduler();
// Initialize Immersve reward processor
// runRewardProcessor();


// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

  app.set('trust proxy', 1);

  const corsOptions = {
    origin: [
      'https://social-tag.xyz',
      process.env.NEXT_PUBLIC_FRONTEND_URL
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  };
  
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

app.use(express.json());

// Session configuration with MongoStore
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60
  }),
  cookie: { 
    secure: true,
    sameSite: 'none',  // Important for cross-origin
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    // Remove domain restriction or make it more specific
    // domain: '.vercel.app'  // Remove this line
  },
  name: 'socialtagsession',
  proxy: true
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());



// Debug middleware
app.use((req, res, next) => {
  console.log('Incoming Request Debug:', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path,
    baseUrl: req.baseUrl,
    headers: req.headers,
    sessionID: req.sessionID,
    isAuthenticated: req.isAuthenticated(),
    user: req.user ? req.user.id : 'No user'
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

app.get('/checkAuth', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ 
      isAuthenticated: true, 
      username: req.user.twitter?.username || null 
    });
  } else {
    res.json({ 
      isAuthenticated: false, 
      username: null 
    });
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
  console.log('Using MongoStore for sessions');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
