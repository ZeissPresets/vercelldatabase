import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Menyimpan data ke database
    const { data } = req.body;
    try {
      const timestamp = Date.now();
      // Simpan log dengan key 'system_logs' dalam bentuk list
      await kv.lpush('system_logs', { timestamp, ...data });
      // Batasi hanya simpan 100 log terakhir agar hemat storage
      await kv.ltrim('system_logs', 0, 99);
      
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'GET') {
    // Mengambil data dari database
    try {
      const logs = await kv.lrange('system_logs', 0, -1);
      return res.status(200).json(logs);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}