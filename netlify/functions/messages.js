import { getStore } from '@netlify/blobs';

export default async (req) => {
    const store = getStore('chat-messages');
    const key = 'history';
    const usersKey = 'users_db';

    if (req.method === 'GET') {
        const data = await store.get(key, { type: 'json' }) || [];
        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (req.method === 'POST') {
        try {
            const body = await req.json();
            let users = await store.get(usersKey, { type: 'json' }) || {};
            let existingMessages = await store.get(key, { type: 'json' }) || [];

            if (body.action === 'signup') {
                if (users[body.username]) {
                    return new Response(JSON.stringify({ success: false, error: 'Username already exists!' }), { headers: { 'Content-Type': 'application/json' } });
                }
                users[body.username] = body.password;
                await store.setJSON(usersKey, users);
                return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
            }

            if (body.action === 'login') {
                if (!users[body.username] || users[body.username] !== body.password) {
                    return new Response(JSON.stringify({ success: false, error: 'Invalid username or password!' }), { headers: { 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
            }

            if (body.action === 'delete') {
                if (existingMessages[body.index]) {
                    existingMessages[body.index].deleted = true;
                    existingMessages[body.index].text = '';
                    existingMessages[body.index].data = '';
                }
            } else if (body.action === 'add' || !body.action) {
                existingMessages.push(body);
                if (existingMessages.length > 40) existingMessages.shift();
            }

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
