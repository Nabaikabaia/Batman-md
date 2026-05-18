// commands/imagine.js
const { generateImage } = require('../lib/imagehandler');

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

async function imagineCommand(sock, chatId, message, args) {
    try {
        const prompt = args.join(' ').trim();
        
        if (!prompt) {
            await sock.sendMessage(chatId, { 
                text: "🎨 *AI Image Generator*\n\nUsage: .imagine <prompt>\n\nExample: .imagine a beautiful sunset over mountains"
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: "🎨", key: message.key } });

        // Generate image using local handler
        const imageUrl = await generateImage(prompt, 'anime');
        
        await sock.sendMessage(chatId, { react: { text: "📥", key: message.key } });
        
        await sock.sendMessage(chatId, {
            image: { url: imageUrl },
            caption: `🎨 *${prompt.slice(0, 50)}*\n\n> *© BATMAN MD*`,
            ...newsletterContext
        }, { quoted: message });
        
        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('Imagine error:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
    }
}

module.exports = imagineCommand;