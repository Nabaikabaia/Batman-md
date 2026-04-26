// ============================================
//  Obfuscated by Nabees Tech
//  Domain: git.nabees.online
//  WhatsApp: https://whatsapp.com/channel/0029VawtjOXJpe8X3j3NCZ3j
//  Protected - Do not redistribute
// ============================================
const settings = require('../settings.js');

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

async function pingCommand(sock, chatId, message) {
    try {
        // React: 🏓
        await sock.sendMessage(chatId, { react: { text: "🏓", key: message.key } });

        const start = Date.now();
        
        await sock.sendMessage(chatId, { text: "🏓" }, { quoted: message });
        
        const end = Date.now();
        const ping = end - start;

        const uptimeInSeconds = process.uptime();
        const days = Math.floor(uptimeInSeconds / 86400);
        const hours = Math.floor((uptimeInSeconds % 86400) / 3600);
        const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
        const seconds = Math.floor(uptimeInSeconds % 60);
        
        let uptimeStr = '';
        if (days > 0) uptimeStr += `${days}d `;
        if (hours > 0) uptimeStr += `${hours}h `;
        if (minutes > 0) uptimeStr += `${minutes}m `;
        uptimeStr += `${seconds}s`;

        const memory = Math.round(process.memoryUsage().rss / 1024 / 1024);

        const response = `🏓 *PONG!*

⏱️ Ping: *${ping}ms*
⏰ Uptime: *${uptimeStr}*
🧠 RAM: *${memory}MB*
🔄 Version: *${settings.version || '1.0'}*

> *© BATMAN MD*`;

        await sock.sendMessage(chatId, { 
            text: response,
            ...newsletterContext
        }, { quoted: message });
        
        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('Ping error:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
    }
}

module.exports = pingCommand;