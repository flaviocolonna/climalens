import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { SERVER_TEXT } from './api/_lib/serverText';

/**
 * Serves the same discovery handler the Vercel function uses, so local and
 * deployed behaviour cannot drift. The API key is read here, in the Node
 * process — it never reaches the client bundle.
 */
function discoveryApi(env: Record<string, string>): Plugin {
  return {
    name: 'climalens-discovery-api',
    configureServer(server) {
      // Set once, before the handler module is first loaded — it reads these
      // at module scope.
      for (const name of ['OPENROUTER_API_KEY', 'OPENROUTER_EU', 'OPENROUTER_MODEL']) {
        if (env[name]) process.env[name] = env[name];
      }

      server.middlewares.use('/api/discover-projects', async (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };

        // Prima ancora di leggere il corpo: non c'è una lingua da scegliere, si
        // usa l'inglese come per ogni default di infrastruttura in questo progetto.
        if (req.method !== 'POST') return send(405, { error: SERVER_TEXT.en.methodNotAllowed });

        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const raw = Buffer.concat(chunks).toString('utf8');

          const { handleDiscovery } = await server.ssrLoadModule('/api/_lib/handler.ts');
          const { status, body } = await handleDiscovery(
            raw ? JSON.parse(raw) : {},
            req.socket.remoteAddress ?? 'local',
          );
          send(status, body);
        } catch (err) {
          console.error('[discover-projects:dev]', err);
          send(500, { error: SERVER_TEXT.en.internalError });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Third arg '' loads vars with no prefix filter — ANTHROPIC_API_KEY has no
  // VITE_ prefix precisely so Vite will not inline it into the bundle.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), discoveryApi(env)],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    build: {
      rollupOptions: {
        output: {
          // The map engine and the chart library are both heavy and independent;
          // splitting them lets the browser cache them across deploys.
          manualChunks: {
            maplibre: ['maplibre-gl'],
            charts: ['recharts'],
          },
        },
      },
    },
  };
});
