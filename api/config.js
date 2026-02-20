
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    const KV_KEY = 'calendars:v1';
    const API_KEY_STORAGE_KEY = 'gemini_api_key';

    try {
        if (req.method === 'GET') {
            const { type } = req.query;

            if (type === 'api_key') {
                const apiKey = await kv.get(API_KEY_STORAGE_KEY);
                return res.status(200).json({ apiKey: apiKey || '' });
            }

            const calendars = await kv.get(KV_KEY);
            return res.status(200).json(calendars || null);
        }

        if (req.method === 'POST') {
            const { type, data } = req.body;

            if (type === 'api_key') {
                await kv.set(API_KEY_STORAGE_KEY, data);
                return res.status(200).json({ success: true });
            }

            await kv.set(KV_KEY, data);
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Config API Error:', error);
        return res.status(500).json({ error: 'Failed to handle config', details: error.message });
    }
}
