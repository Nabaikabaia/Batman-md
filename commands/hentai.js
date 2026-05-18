
const axios = require('axios');

const newsletterContext = {
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

async function hentaiCommand(sock, chatId, message) {
    try {
        // React: 🎬
        await sock.sendMessage(chatId, { react: { text: "🔞", key: message.key } });

        // Fetch random anime from API
        const apiUrl = 'https://eliteprotech-apis.zone.id/nsfw?random=true';
        const response = await axios.get(apiUrl, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json, text/plain, */*'
            }
        });

        if (response.data?.success && response.data?.results?.length > 0) {
            const nsfw = response.data.results[0];
            const title = nsfw.title || '💦 HENTAI VIDEO🍆';
            const videoUrl = nsfw.mp4;
            const pageUrl = nsfw.pageUrl;
            
            if (!videoUrl) {
                await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
                return;
            }

            // React: 📥
            await sock.sendMessage(chatId, { react: { text: "📥", key: message.key } });

            // Send video without external ad reply (just newsletter)
            await sock.sendMessage(chatId, {
                video: { url: videoUrl },
                mimetype: 'video/mp4',
                caption: `💦 *${title}*\n\n> *© BATMAN MD*`,
                ...newsletterContext
            }, { quoted: message });

            await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
        } else {
            await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        }

    } catch (error) {
        console.error('hentai error:', error.message);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        await sock.sendMessage(chatId, { 
            text: "❌ Failed to fetch hentai video. Try again later."
        }, { quoted: message });
    }
}

module.exports = hentaiCommand;