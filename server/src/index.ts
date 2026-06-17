import * as dotenv from 'dotenv';
import app from './app';

// Load environment configurations
dotenv.config();

const PORT = process.env.PORT || 5055;

const server = app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(` AfyaMama Backend Server Running            `);
  console.log(` Port: http://localhost:${PORT}             `);
  console.log(` Health Check: http://localhost:${PORT}/api/health `);
  console.log(` Time: ${new Date().toISOString()}         `);
  console.log(`=============================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing REST server gracefully...');
  server.close(() => {
    console.log('REST server closed.');
    process.exit(0);
  });
});
