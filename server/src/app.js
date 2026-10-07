require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const lgaRoutes = require('./routes/lgaRoutes');
const pollingUnitRoutes = require('./routes/pollingUnitRoutes');
const partyRoutes = require('./routes/partyRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { getDriver } = require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    databaseDriver: getDriver()
  });
});

// Mount REST API Routes
app.use('/api/lgas', lgaRoutes);
app.use('/api/polling-units', pollingUnitRoutes);
app.use('/api/parties', partyRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Catch 404 for undefined API routes
app.use('/api/*', notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
