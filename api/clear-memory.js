export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  // Di Vercel Serverless, kita tidak bisa memaksa GC secara manual dengan mudah
  // karena instance bersifat ephemeral. Namun endpoint ini disediakan untuk 
  // kompatibilitas interface.
  
  res.status(200).json({ success: true, message: 'Vercel instance memory is managed automatically per request.' });
}