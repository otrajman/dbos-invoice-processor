import { DBOS } from '@dbos-inc/dbos-sdk';
import { app } from './api';
import { InvoiceOperations } from './operations'; // Import to register DBOS decorators
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config();

async function main(): Promise<void> {
  try {
    // Set up static file serving for uploaded files BEFORE launching DBOS
    const uploadDir = process.env.UPLOAD_DIR || 'uploads/invoices';
    app.use('/uploads', require('express').static(path.resolve(uploadDir)));

    // Serve static frontend assets from dist/public
    const publicDir = path.resolve(__dirname, '../dist/public');
    app.use(require('express').static(publicDir));

    // Health check endpoint
    app.get('/health', (req, res) => {
      console.log('Health endpoint called!');
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'dbos-invoice-processor'
      });
    });

    console.log('Express app configured with routes');

    // Serve index.html for root path
    app.get('/', (req, res) => {
      return res.sendFile(path.resolve(publicDir, 'index.html'));
    });

    // Initialize DBOS with Express integration
    DBOS.setConfig({
      name: "dbos-invoice-processor",
      databaseUrl: process.env.DBOS_DATABASE_URL
    });
    await DBOS.launch({ expressApp: app });

    // Start Express server (required even with DBOS integration)
    const PORT = process.env.PORT || 3000;

    const server = app.listen(PORT, () => {
      console.log(`🚀 DBOS Invoice Processor with Express integration running on http://localhost:${PORT}`);
      console.log(`📊 Dashboard endpoints:`);
      console.log(`   - Clerk Dashboard: http://localhost:${PORT}/api/dashboard/clerk`);
      console.log(`   - Manager Dashboard: http://localhost:${PORT}/api/dashboard/manager`);
      console.log(`📄 API Documentation: http://localhost:${PORT}/api/invoices`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please check:`);
        console.error(`   1. No other instance of this application is running`);
        console.error(`   2. No other service is using port ${PORT}`);
        console.error(`   3. Set a different PORT environment variable`);
        console.error(`   4. Check if DBOS admin server is conflicting`);
        process.exit(1);
      } else {
        console.error(`❌ Server error:`, error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('Failed to start the application:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  try {
    await DBOS.shutdown();
    console.log('✅ DBOS shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  try {
    await DBOS.shutdown();
    console.log('✅ DBOS shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the application
main().catch((error) => {
  console.error('❌ Application startup failed:', error);
  process.exit(1);
});
