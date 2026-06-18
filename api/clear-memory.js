import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const mem = process.memoryUsage();
  const usedPercent = (mem.heapUsed / mem.heapTotal) * 100;
  
  // Threshold internal: Hanya jalankan GC jika penggunaan > 75%
  // Ini mencegah spamming GC jika fungsi dipanggil terlalu sering
  const threshold = 75;
  
  const memoryBefore = mem;
  let gcExecuted = false;

  // Jalankan GC jika didukung dan memori melebihi batas
  if (global.gc && usedPercent > threshold) {
    global.gc();
    gcExecuted = true;
  }

  const memoryAfter = process.memoryUsage();
  const logEntry = {
    timestamp: Date.now(),
    event: 'Manual GC Triggered',
    success: gcExecuted || (usedPercent <= threshold),
    heapBefore: `${Math.round(memoryBefore.heapUsed / 1024 / 1024)} MB`,
    heapAfter: `${Math.round(memoryAfter.heapUsed / 1024 / 1024)} MB`
  };

  try {
    // Simpan aktivitas pembersihan ke database KV
    await kv.lpush('system_logs', logEntry);
    await kv.ltrim('system_logs', 0, 99);
  } catch (error) {
    console.error('Failed to log memory clear event:', error);
  }

  res.status(200).json({ 
    success: true, 
    message: gcExecuted ? 'Garbage Collection executed.' : 'Memory is within safe limits, no cleanup needed.',
    percentUsed: usedPercent.toFixed(2),
    stats: logEntry
  });
}