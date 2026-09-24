import { buildApp } from './app.js';
import { env } from './config/env.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

const app = await buildApp();

async function shutdown(signal: string): Promise<void> {
  app.log.info({ signal }, 'Shutting down gracefully');

  // Force exit if in-flight requests or connections do not finish in time.
  setTimeout(() => {
    app.log.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();

  try {
    await app.close(); // stops accepting connections, runs onClose hooks (Prisma disconnect)
    process.exit(0);
  } catch (err) {
    app.log.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => void shutdown(signal));
}

process.on('unhandledRejection', (reason) => {
  app.log.fatal({ err: reason }, 'Unhandled promise rejection');
  void shutdown('unhandledRejection');
});

try {
  await app.listen({ port: env.PORT, host: env.HOST });
} catch (err) {
  app.log.fatal({ err }, 'Failed to start server');
  process.exit(1);
}
