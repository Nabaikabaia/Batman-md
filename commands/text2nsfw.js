// commands/text2nsfw.js
const axios = require('axios');

// Newsletter info (consistent with your bot's other commands)
const channelInfo = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363367299421766@newsletter',
            newsletterName: 'BATMAN MD',
            serverMessageId: 13
        }
    }
};

async function text2nsfwCommand(sock, chatId, message, args) {
    try {
        // ✅ Normalize args (array or string)
        let query = '';
        if (Array.isArray(args)) {
            query = args.join(' ').trim();
        } else if (typeof args === 'string') {
            query = args.trim();
        } else if (args && typeof args === 'object') {
            query = Object.values(args).join(' ').trim();
        } else {
            query = '';
        }

        // ❌ Group restriction removed – now works in any chat
        // (old group block deleted)

        if (!query) {
            await sock.sendMessage(chatId, {
                text: '🔞 *Text2NSFW Generator*\nUsage: .text2nsfw <prompt>\nExample: .text2nsfw sexy anime girl',
                ...channelInfo
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: "🎨", key: message.key } });

        const apiUrl = `https://omegatech-api.dixonomega.tech/api/ai/text2nsfw?q=${encodeURIComponent(query)}`;
        console.log(`[Text2NSFW] Request: ${apiUrl}`);

        const response = await axios.get(apiUrl, { timeout: 60000 });
        const data = response.data;

        if (!data.images || !data.images.length) {
            throw new Error('No images returned');
        }

        // Send up to 3 images (download buffer to avoid expired URLs)
        for (let i = 0; i < Math.min(data.images.length, 1); i++) {
            const imgUrl = data.images[i];
            const imgBuffer = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 15000 });
            await sock.sendMessage(chatId, {
                image: Buffer.from(imgBuffer.data),
                caption: i === 0 ? `🔞 *Prompt:* ${query}` : '',
                ...channelInfo
            }, { quoted: message });
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
    } catch (error) {
        console.error('[Text2NSFW]', error.message);
        await sock.sendMessage(chatId, {
            text: `❌ Failed: ${error.message}`,
            ...channelInfo
        }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
    }
}

module.exports = text2nsfwCommand;