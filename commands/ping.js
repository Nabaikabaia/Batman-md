const settings = require('../settings.js');

// Static contact (same as help.js)
const fakeMeta = {
    key: {
        participant: '0@s.whatsapp.net',
        remoteJid: 'status@broadcast',
        fromMe: false,
        id: 'BATMAN_META_' + Date.now()
    },
    message: {
        contactMessage: {
            displayName: 'BATMAN MD',
            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:BATMAN MD;;;;\nFN:BATMAN MD\nTEL;waid=2349049636843:+234 904 963 6843\nEND:VCARD`,
            sendEphemeral: true
        }
    },
    messageTimestamp: Math.floor(Date.now() / 1000),
    pushName: 'BATMAN MD'
};

const THUMB_IMAGE = 'https://aqrmhkzrrmpljrtknrpi.supabase.co/storage/v1/object/public/uploads/4YDNVP.jpg';

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    return parts.join(' ');
}

async function pingCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🏓", key: message.key } });

        const start = Date.now();
        await sock.sendMessage(chatId, { text: "🏓" }, { quoted: message });
        const end = Date.now();
        const ping = end - start;

        const uptimeStr = formatUptime(process.uptime());
        const memory = Math.round(process.memoryUsage().rss / 1024 / 1024);

        const response = `🏓 *PONG!*

⏱️ Ping: *${ping}ms*
⏰ Uptime: *${uptimeStr}*
🧠 RAM: *${memory}MB*
🔄 Version: *${settings.version || '1.0'}*

> *© BATMAN MD*`;

        await sock.sendMessage(chatId, {
            document: Buffer.from(' ', 'utf-8'),
            mimetype: 'application/msword',
            fileName: `ping.doc`,
            fileLength: 99999999999999999999999999,
            caption: response,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363367299421766@newsletter',
                    newsletterName: 'BATMAN MD',
                    serverMessageId: 13
                },
                externalAdReply: {
                    title: 'BATMAN MD',
                    body: 'System Status • Online',
                    thumbnailUrl: THUMB_IMAGE,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    sourceUrl: 'https://nabees.online',
                    thumbnailHeight: 300,
                    thumbnailWidth: 300
                }
            }
        }, { quoted: fakeMeta });

        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('Ping error:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        await sock.sendMessage(chatId, { text: "❌ Failed to get ping status." }, { quoted: message });
    }
}

module.exports = pingCommand;