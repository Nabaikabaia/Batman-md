// commands/wormgpt.js
const axios = require('axios');

// Helper: generate random ID (same as backup script)
function rand(n) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < n; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

// Backup API: chat.wrmgpt.com
async function wormgptBackup(query) {
    const messageId = `${rand(8)}-${rand(4)}-${rand(4)}-${rand(4)}-${rand(12)}`;
    const userId = `${rand(8)}-${rand(4)}-${rand(4)}-${rand(4)}-${rand(12)}`;

    const cookie = '__Secure-authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiRnlESjQ1UXFQeDVRSVhoaVNSQk5uNFBHcFBFVnQzbjBZTVhRVGlEZ3hNeS1KaEZCNTJQOWx6d0lvNTRIODU1X3JNVzhWTHE0UUVDUExTWF9aLTh2aXcifQ..BC1-RXYYZM0oVmP7FaXUsw.f5LshHBNgG24G0uaj9te9vcDqm7zynNtVRvuuFjiHJzChQHQ4TYDCG35JXFCtiy29JcTWULM3ynjMp9l3ygwnv4FVIo9BIZBcyUQBzFyPNYcF6FGQEYke-D5ebIXcQi_tXLbxkhLTh9jTJJ4qfqZC13CgeaG-8je-x_dLT7yDe7A0s9QYqk7edr0YT_AmngvgS3MvcvhNmVC35aDurZO3dV2egpNvwgjlJaCn3aNRoiXjmtZow8pX3BUig8pfdE1.TiCtK3B8lnk4_K7R9ZxQvjqd3SVeoBzEUr8V9BKjGN0; __Secure-authjs.callback-url=https%3A%2F%2Fchat.wrmgpt.com%2Flogin';

    const res = await fetch('https://chat.wrmgpt.com/api/chat', {
        method: 'POST',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36',
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'Origin': 'https://chat.wrmgpt.com',
            'Referer': 'https://chat.wrmgpt.com/',
            'Cookie': cookie,
            'sec-ch-ua-platform': '"Android"',
            'sec-ch-ua-mobile': '?1'
        },
        body: JSON.stringify({
            id: messageId,
            message: {
                role: 'user',
                parts: [{ type: 'text', text: query }],
                id: userId
            },
            selectedChatModel: 'wormgpt-v5.5',
            selectedVisibilityType: 'private',
            searchEnabled: false,
            memoryLength: 8
        })
    });

    if (!res.ok) {
        throw new Error(`Backup API Error: ${res.status}`);
    }

    const raw = await res.text();
    let result = '';
    for (const line of raw.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;
        try {
            const json = JSON.parse(data);
            if (json.type === 'text-delta' && json.delta) {
                result += json.delta;
            }
        } catch { }
    }
    if (!result) throw new Error('No output from backup API');
    return result;
}

async function wormgptCommand(sock, chatId, message, args) {
    try {
        const userPrompt = args.join(' ').trim();
        if (!userPrompt) {
            await sock.sendMessage(chatId, {
                text: '🐛 *WormGPT Uncensored AI*\n\nUsage: .wormgpt <message>\nExample: .wormgpt Tell me a joke'
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: "⏳", key: message.key } });

        let replyText = null;

        // Try primary API (venice-uncensored)
        try {
            const primaryUrl = `https://omegatech-api.dixonomega.tech/api/ai/venice-uncensored?message=${encodeURIComponent(userPrompt)}`;
            const response = await axios.get(primaryUrl, { timeout: 35000 });
            const data = response.data;

            if (data.success && data.result) {
                replyText = `🐛 *WormGPT:* ${data.result}`;
                if (data.model) replyText += `\n\n└─ *Model:* ${data.model}`;
            } else {
                throw new Error('Primary API returned invalid data');
            }
        } catch (primaryErr) {
            console.error('[WormGPT] Primary API failed, using backup:', primaryErr.message);
            try {
                const backupResult = await wormgptBackup(userPrompt);
                replyText = `🐛 *WormGPT (Backup):*\n${backupResult}`;
            } catch (backupErr) {
                console.error('[WormGPT] Backup also failed:', backupErr.message);
                throw new Error('Both primary and backup APIs failed');
            }
        }

        if (replyText) {
            await sock.sendMessage(chatId, { text: replyText }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
        } else {
            throw new Error('No response generated');
        }

    } catch (error) {
        console.error('[WormGPT] Error:', error.message);
        await sock.sendMessage(chatId, {
            text: '❌ *WormGPT is unresponsive*\nPlease try again later.'
        }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
    }
}

module.exports = wormgptCommand;