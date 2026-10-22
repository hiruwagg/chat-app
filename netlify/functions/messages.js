import { getStore } from '@netlify/blobs';

export default async (req) => {
    const store = getStore('chat-messages');
    const key = 'history';

    if (req.method === 'GET') {
        const data = await store.get(key, { type: 'json' }) || [];
        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (req.method === 'POST') {
        try {
            const body = await req.json();
            const existingMessages = await store.get(key, { type: 'json' }) || [];
            
            existingMessages.push(body);
            // Keep last 30 messages to manage storage limit efficiently
            if (existingMessages.length > 30) existingMessages.shift();

            await store.setJSON(key, existingMessages);

            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), { status: 500 });
        }
    }

    return new Response('Method Not Allowed', { status: 405 });
};
