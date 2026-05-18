const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function darknaijaCommand(sock, chatId, message, args) {
    try {
        // Optional: restrict to private chat (NSFW content)
        const isGroup = chatId.endsWith('@g.us');
        if (isGroup) {
            await sock.sendMessage(chatId, { 
                text: "🔞 *This command contains adult content. Use in private chat only.*"
            }, { quoted: message });
            return;
        }

        // React: 🔍
        await sock.sendMessage(chatId, { react: { text: "🔍", key: message.key } });

        const apiUrl = 'https://apis.davidcyril.name.ng/darknaija';
        const response = await axios.get(apiUrl, { timeout: 15000 });
        const data = response.data;

        if (!data || !data.downloadUrl) {
            throw new Error('Invalid API response');
        }

        const { title, thumbnail, downloadUrl } = data;

        // React: 📥
        await sock.sendMessage(chatId, { react: { text: "📥", key: message.key } });

        // Download video to temp
        const videoPath = path.join(process.cwd(), 'temp', `darknaija_${Date.now()}.mp4`);
        const writer = fs.createWriteStream(videoPath);
        const videoRes = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream' });
        videoRes.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // Send as video
        await sock.sendMessage(chatId, {
            video: { url: videoPath },
            caption: `🎬 *${title}*\n\n> *© BATMAN MD*`,
            thumbnail: thumbnail ? await axios.get(thumbnail, { responseType: 'arraybuffer' }).then(r => r.data) : null,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363367299421766@newsletter',
                    newsletterName: 'BATMAN MD',
                    serverMessageId: 13
                }
            }
        }, { quoted: message });

        // Cleanup
        fs.unlinkSync(videoPath);

        // React: ✅
        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('Darknaija error:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        await sock.sendMessage(chatId, { text: 'Failed to fetch content. Try again later.' }, { quoted: message });
    }
}

module.exports = darknaijaCommand;