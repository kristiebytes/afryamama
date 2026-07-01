import * as dotenv from 'dotenv';
import path from 'path';
import app from './app';

// Load environment configurations
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const PORT = Number(process.env.PORT || 5055);
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`=============================================`);
  console.log(` AfyaMama Backend Server Running            `);
  console.log(` Listening on: ${HOST}:${PORT}              `);
  console.log(` Local Health Check: http://localhost:${PORT}/api/health `);
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
