import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { exec } from 'child_process'; // Import exec untuk menjalankan perintah shell

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve file statis (index.html, style.css, script.js)
app.use(express.static(__dirname));

const RAM_LIMIT_MB = 3000;

// Helper function to get disk space
function getDiskSpace() {
  return new Promise((resolve) => {
    if (os.platform() === 'win32') {
      // Untuk Windows, parsing wmic lebih kompleks.
      // Dalam skenario nyata, Anda akan mem-parsing `wmic logicaldisk get size,freespace,caption`
      // Namun, untuk Vercel, monitoring disk space seperti ini tidak relevan.
      resolve({
        total: 'N/A',
        free: 'N/A',
        used: 'N/A'
      });
    } else {
      // Untuk Linux/macOS: Menggunakan df -k (kilobyte)
      exec('df -k /', (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return resolve({ total: 'N/A', free: 'N/A', used: 'N/A' });
        }
        // Contoh output df -k:
        // Filesystem     1K-blocks    Used Available Use% Mounted on
        // /dev/sda1       48058588 8459420  37098484  19% /
        const lines = stdout.split('\n');
        if (lines.length > 1) {
          const parts = lines[1].split(/\s+/).filter(Boolean); // Memisahkan kolom
          if (parts.length >= 4) {
            const totalKB = parseInt(parts[1], 10);
            const usedKB = parseInt(parts[2], 10);
            const freeKB = parseInt(parts[3], 10);
            resolve({
              total: `${Math.round(totalKB / 1024 / 1024)} GB`,
              free: `${Math.round(freeKB / 1024 / 1024)} GB`,
              used: `${Math.round(usedKB / 1024 / 1024)} GB`
            });
          }
        }
        resolve({ total: 'N/A', free: 'N/A', used: 'N/A' });
      });
    }
  });
}

// Background Task: Otomatis jalankan Garbage Collection setiap 1 menit 
setInterval(() => {
  if (global.gc) {
    const mem = process.memoryUsage();
    const rssMB = Math.round(mem.rss / 1024 / 1024);
    const usedPercent = (rssMB / RAM_LIMIT_MB) * 100;
    
    if (usedPercent > 80) {
      console.log(`[Auto-GC] RAM usage threshold reached (${rssMB}MB / ${RAM_LIMIT_MB}MB). Cleaning...`);
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
app.get('/api/monitor', async (req, res) => { // Jadikan async untuk await getDiskSpace
  const cpus = os.cpus();
  const memoryUsage = process.memoryUsage();
  const diskSpace = await getDiskSpace(); // Ambil informasi disk space

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
    },
    storage: diskSpace // Tambahkan informasi storage ke respons
  });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});