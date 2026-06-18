import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve file statis (index.html, style.css, script.js)
app.use(express.static(__dirname));

// Replikasi endpoint API Vercel untuk jalankan lokal
app.get('/api/monitor', (req, res) => {
  const cpus = os.cpus();
  const memoryUsage = process.memoryUsage();

  res.json({
    server: {
      cpu: {
        model: cpus.length > 0 ? cpus[0].model : 'Unknown',
        cores: cpus.length,
        speed: `${cpus.length > 0 ? cpus[0].speed : 0} MHz`,
        arch: os.arch(),
      },
      memory: {
        total: `${Math.round(os.totalmem() / 1024 / 1024)} MB`,
        free: `${Math.round(os.freemem() / 1024 / 1024)} MB`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        percentUsed: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      loadAvg: os.loadavg(),
      platform: os.platform(),
      uptime: os.uptime()
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});