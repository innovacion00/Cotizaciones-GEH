import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';
import { initSocket } from './realtime/socket.js';
import http from 'http';

const server = http.createServer(app);
initSocket(server);

async function bootstrap() {
  await connectDB();
  server.listen(env.PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Error al iniciar servidor:', err);
  process.exit(1);
});
