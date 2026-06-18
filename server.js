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

// Background Task: Otomatis jalankan Garbage Collection setiap 1 menit 
// jika penggunaan heap melebihi 70% atau dijalankan secara berkala
setInterval(() => {
  if (global.gc) {
    const mem = process.memoryUsage();
    const usedPercent = (mem.heapUsed / mem.heapTotal) * 100;
    
    // Jika penggunaan heap di atas 70%, bersihkan otomatis
    if (usedPercent > 70) {
      console.log(`[Auto-GC] Memory threshold reached (${usedPercent.toFixed(2)}%). Cleaning...`);
      global.gc();
    }
  }
}, 60000); // Cek setiap 60 detik

// Endpoint untuk membersihkan memori (Garbage Collection)
app.post('/api/clear-memory', (req, res) => {
  if (global.gc) {
    global.gc();
    res.json({ success: true, message: 'Garbage Collection berhasil dijalankan' });
  } else {
    res.status(400).json({ success: false, message: 'GC tidak diekspos. Jalankan node dengan --expose-gc' });
  }
});

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