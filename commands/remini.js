// commands/remini.js
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { upscaleImage } = require('../lib/imagehandler');

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

async function reminiCommand(sock, chatId, message, args) {
    try {
        let imageBuffer = null;
        
        const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (quotedMsg?.imageMessage) {
            const stanzaId = message.message.extendedTextMessage.contextInfo.stanzaId;
            const participant = message.message.extendedTextMessage.contextInfo.participant;
            const senderId = message.key.participant || message.key.remoteJid;
            
            const stream = await downloadMediaMessage({
                key: { remoteJid: chatId, id: stanzaId, participant: participant || senderId },
                message: quotedMsg
            }, 'buffer', {}, { logger: console });
            imageBuffer = Buffer.from(stream);
        }
        else {
            await sock.sendMessage(chatId, { 
                text: "🖼️ *Enhance Image*\n\nReply to an image with .remini"
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: "🔍", key: message.key } });

        // Use local upscaler
        const result = await upscaleImage(imageBuffer);
        
        await sock.sendMessage(chatId, { react: { text: "📥", key: message.key } });
        
        await sock.sendMessage(chatId, {
            image: result.buffer,
            caption: `✨ *Image Enhanced*\n\n> *© BATMAN MD*`,
            ...newsletterContext
        }, { quoted: message });
        
        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('Remini error:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
    }
}

module.exports = { reminiCommand };