// ============================================
//  Obfuscated by Nabees Tech
//  Domain: git.nabees.online
//  WhatsApp: https://whatsapp.com/channel/0029VawtjOXJpe8X3j3NCZ3j
//  Protected - Do not redistribute
// ============================================
// commands/remini.js
const axios = require('axios');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
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

async function getImageUrl(sock, chatId, message) {
    // Check if replying to an image
    const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (quotedMsg?.imageMessage) {
        const stanzaId = message.message.extendedTextMessage.contextInfo.stanzaId;
        const participant = message.message.extendedTextMessage.contextInfo.participant;
        const senderId = message.key.participant || message.key.remoteJid;

        if (!stanzaId) {
            console.log('No stanzaId found');
            return null;
        }

        try {
            // Use downloadMediaMessage correctly
            const mediaBuffer = await downloadMediaMessage(
                {
                    key: {
                        remoteJid: chatId,
                        id: stanzaId,
                        participant: participant || senderId
                    },
                    message: quotedMsg
                },
                'buffer',
                {},
                { logger: console }
            );
            
            if (mediaBuffer && mediaBuffer.length > 0) {
                // Upload to get a public URL
                const uploadedUrl = await uploadImage(mediaBuffer);
                return uploadedUrl;
            }
        } catch (err) {
            console.error('Download error:', err);
            return null;
        }
    }
    
    // Check if a URL was provided directly in args
    return null;
}

async function reminiCommand(sock, chatId, message, args) {
    try {
        let imageUrl = null;
        
        // Try to get image from args (URL)
        if (args && args.length > 0) {
            const url = args[0];
            if (url.startsWith('http://') || url.startsWith('https://')) {
                imageUrl = url;
            }
        }
        
        // If no URL in args, try to get from replied image
        if (!imageUrl) {
            imageUrl = await getImageUrl(sock, chatId, message);
        }
        
        if (!imageUrl) {
            await sock.sendMessage(chatId, { 
                text: "🖼️ *Enhance Image*\n\nUsage:\n• .remini <image_url>\n• Reply to an image with .remini"
            }, { quoted: message });
            return;
        }

        // React: 🔍
        await sock.sendMessage(chatId, { react: { text: "🔍", key: message.key } });

        // Call the Omegatech Remini API
        const apiUrl = `https://omegatech-api.dixonomega.tech/api/tools/remini?url=${encodeURIComponent(imageUrl)}`;
        
        console.log(`[Remini] Requesting: ${apiUrl}`);
        
        const response = await axios.get(apiUrl, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://omegatech-api.dixonomega.tech/'
            }
        });

        if (response.data && response.data.length > 1000) {
            await sock.sendMessage(chatId, { react: { text: "📥", key: message.key } });

            await sock.sendMessage(chatId, {
                image: Buffer.from(response.data),
                caption: `✨ *Enhanced Image*\n\n> *© BATMAN MD*`,
                ...newsletterContext
            }, { quoted: message });

            await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
        } else {
            await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        }

    } catch (error) {
        console.error('Remini error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
        }
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        await sock.sendMessage(chatId, { 
            text: "❌ Failed to enhance image. Please try again later."
        }, { quoted: message });
    }
}

module.exports = { reminiCommand };