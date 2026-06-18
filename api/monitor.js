import os from 'os';

export default function handler(req, res) {
  // Mengambil info CPU dari OS
  const cpus = os.cpus();
  const cpuModel = cpus.length > 0 ? cpus[0].model : 'Unknown';
  const cpuSpeed = cpus.length > 0 ? cpus[0].speed : 0;
  
  // Mengambil info memori dari proses Node.js yang sedang berjalan
  const memoryUsage = process.memoryUsage();

  res.status(200).json({
    server: {
      cpu: {
        model: cpuModel,
        cores: cpus.length,
        speed: `${cpuSpeed} MHz`,
        arch: os.arch(),
      },
      memory: {
        total: `${Math.round(os.totalmem() / 1024 / 1024)} MB`,
        free: `${Math.round(os.freemem() / 1024 / 1024)} MB`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        percentUsed: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      loadAvg: os.loadavg(),
      platform: os.platform(),
      uptime: os.uptime()
    }
  });
}