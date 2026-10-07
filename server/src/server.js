require('dotenv').config();
const app = require('./app');
const { initDatabase, close } = require('./config/database');

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  try {
    console.log('Initializing database connection...');
    await initDatabase();

    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  Delta State Election Results Server Running`);
      console.log(`  Port: http://localhost:${PORT}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`  LGAs Endpoint: http://localhost:${PORT}/api/lgas`);
      console.log(`====================================================`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await close();
        console.log('HTTP server closed and database connections terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Fatal error during server startup:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = startServer;
