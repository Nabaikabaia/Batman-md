const settings = require("../settings");
const os = require('os');

const botStartTime = Date.now();

// Static Batman contact
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

function getUptime() {
    const seconds = Math.floor((Date.now() - botStartTime) / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
}

function getBatmanQuote() {
    const quotes = [
        "I am vengeance. I am the night. I am BATMAN MD.",
        "Gotham needs me. And so do you, citizen.",
        "The darkness is my ally. Justice is my weapon.",
        "Even in the shadows, I am watching over this chat.",
        "Fear is a tool. I use it well.",
        "I don't wear a mask to hide who I am. I wear it to protect those who need me.",
        "Justice isn't a choice. It's a responsibility.",
        "The night is darkest just before dawn. But I never sleep.",
        "I'm not a hero. I'm a silent guardian."
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
}

async function aliveCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🦇", key: message.key } });

        const uptime = getUptime();
        const totalMem = (os.totalmem() / 1024 ** 3).toFixed(1);
        const freeMem = (os.freemem() / 1024 ** 3).toFixed(1);
        const usedMem = (totalMem - freeMem).toFixed(1);
        const batmanQuote = getBatmanQuote();

        const response = `🦇 *THE DARK KNIGHT AWAKENS* 🦇

${batmanQuote}

⚡ *Status:* ONLINE
⏱️ *Uptime:* ${uptime}
💾 *System RAM:* ${usedMem}GB / ${totalMem}GB
🔄 *Version:* ${settings.version || '1.0'}

> *© BATMAN MD*`;

        await sock.sendMessage(chatId, {
            document: Buffer.from(' ', 'utf-8'),
            mimetype: 'application/msword',
            fileName: `batman_md.doc`,
            fileLength: 999999999,
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
                    body: 'The Dark Knight stands vigil',
                    thumbnailUrl: THUMB_IMAGE,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    sourceUrl: 'https://nabees.online',
                    thumbnailHeight: 400,
                    thumbnailWidth: 400
                }
            }
        }, { quoted: fakeMeta });

        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('Alive error:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        await sock.sendMessage(chatId, { text: "🦇 *BATMAN MD stands vigil. Always.*" }, { quoted: message });
    }
}

module.exports = aliveCommand;