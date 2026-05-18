// commands/removebg.js
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { removeBackgroundPixa } = require('../lib/imagehandler');
const { uploadImage } = require('../lib/uploadImage');

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

async function removebgCommand(sock, chatId, message, args) {
    try {
        let imageBuffer = null;
        
        // Get image from reply or URL
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
        else if (args.length > 0 && args[0].startsWith('http')) {
            const response = await axios.get(args[0], { responseType: 'arraybuffer' });
            imageBuffer = Buffer.from(response.data);
        }
        else {
            await sock.sendMessage(chatId, { 
                text: "🖼️ *Remove Background*\n\nReply to an image with .removebg"
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: "🎨", key: message.key } });

        // Use local image handler instead of API
        const resultBuffer = await removeBackgroundPixa(imageBuffer);
        
        await sock.sendMessage(chatId, { react: { text: "📥", key: message.key } });
        
        await sock.sendMessage(chatId, {
            image: resultBuffer,
            caption: `✨ *Background Removed*\n\n> *© BATMAN MD*`,
            ...newsletterContext
        }, { quoted: message });
        
        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('RemoveBG error:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
    }
}

module.exports = removebgCommand;