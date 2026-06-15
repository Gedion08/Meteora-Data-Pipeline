import http from 'http';
import { metricsMetrics, register } from './metrics.ts';
import dotenv from 'dotenv';

dotenv.config();

const PORT = Number(process.env.METRICS_PORT || 9091);

const server = http.createServer(async (req, res) => {
  if (!req) return;
  const url = req.url || '/';
  if (url === '/metrics') {
    try {
      const body = await metricsMetrics();
      res.writeHead(200, { 'Content-Type': register.contentType });
      res.end(body);
    } catch (e) {
      res.writeHead(500);
      res.end('error');
    }
    return;
  }
  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', time: Date.now() }));
    return;
  }
  res.writeHead(404);
  res.end('not found');
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Metrics server listening on http://0.0.0.0:${PORT}`);
});
