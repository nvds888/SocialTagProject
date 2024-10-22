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

const isProduction = process.env.NODE_ENV === 'production';
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL 

mongoose.connect(process.env.MONGODB_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  // If you're using Mongoose 6.0 or later, you don't need these options:
  // useCreateIndex: true,
  // useFindAndModify: false
})
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Could not connect to MongoDB Atlas:', err));

  const corsOptions = {
    origin: [
      process.env.NEXT_PUBLIC_FRONTEND_URL,
      'https://social-tag.vercel.app',
      'https://vercel.live/link/social-tag-nielsvdschepop12367-gmailcoms-projects.vercel.app',
      'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
  
  app.use(cors(corsOptions));

  app.options('*', cors(corsOptions));

  const MongoStore = require('connect-mongo');

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: { 
    secure: isProduction, // true in production
    sameSite: 'none',  // Important for cross-site cookies
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined
  },
  proxy: true
}));

app.set('trust proxy', 1);

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/theme', themePurchaseRoutes);
app.use('/api/pera', peraWalletRoutes);
app.use('/api/leaderboard', apiRoutes);
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/peraWalletRoutes', peraWalletRoutes);

app.use((req, res, next) => {
  console.log('Incoming request to:', req.path);
  console.log('Session:', req.session);
  console.log('Is Authenticated:', req.isAuthenticated());
  console.log('User:', req.user);
  console.log('Cookies:', req.cookies);
  next();
});

// Route to check authentication status
app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ isAuthenticated: true, user: req.user });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// New route for Pera Wallet account info
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

// New route for Pera Wallet transactions
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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
