// commands/remini.js - Image Enhancer/Remini
const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploadImage } = require('../lib/uploadImage');
const settings = require('../settings');

// ============================================
// NEWSLETTER CHANNEL INFO
// ============================================
const channelInfo = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: settings.newsletterJid,
            newsletterName: settings.botName || 'BATMAN MD',
            serverMessageId: 13
        }
    }
};

// ============================================
// HELPER FUNCTION FOR STYLISH MESSAGES
// ============================================
function formatReminiMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        processing: '🖼️',
        done: '✨',
        enhance: '🔮'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

// ============================================
// GET QUOTED OR OWN IMAGE URL
// ============================================
async function getQuotedOrOwnImageUrl(sock, message) {
    // 1) Quoted image (highest priority)
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quoted?.imageMessage) {
        const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        return await uploadImage(buffer);
    }

    // 2) Image in the current message
    if (message.message?.imageMessage) {
        const stream = await downloadContentFromMessage(message.message.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        return await uploadImage(buffer);
    }

    return null;
}

// ============================================
// VALIDATE URL
// ============================================
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// ============================================
// MAIN COMMAND EXECUTION
// ============================================
module.exports = {
    name: 'remini',
    alias: ['enhance', 'upscale'],
    category: 'general',
    desc: 'Enhance and upscale images using AI',
    
    async exec(sock, message, args) {
        try {
            const chatId = message.key.remoteJid;
            let imageUrl = null;
            
            // Send processing reaction
            await sock.sendMessage(chatId, { react: { text: '🔮', key: message.key } });
            
            // ============================================
            // GET IMAGE URL FROM ARGS OR MESSAGE
            // ============================================
            if (args.length > 0) {
                const url = args.join(' ');
                if (isValidUrl(url)) {
                    imageUrl = url;
                } else {
                    const errorMsg = formatReminiMessage(
                        'INVALID URL',
                        `│ ❌ The provided URL is invalid.\n│\n│ *Usage:*\n│ ♧ .remini <image_url>\n│ ♧ Reply to an image\n│ ♧ Send image with caption\n│\n│ *Example:* .remini https://example.com/image.jpg`,
                        'error'
                    );
                    await sock.sendMessage(chatId, { text: errorMsg, ...channelInfo }, { quoted: message });
                    await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                    return;
                }
            } else {
                // Try to get image from message or quoted message
                imageUrl = await getQuotedOrOwnImageUrl(sock, message);
                
                if (!imageUrl) {
                    const usageMsg = formatReminiMessage(
                        'IMAGE ENHANCER',
                        `│ 🔮 Enhance and upscale your images!\n│\n│ *Usage:*\n│ ♧ .remini <image_url>\n│ ♧ Reply to an image with .remini\n│ ♧ Send image with .remini\n│\n│ *Examples:*\n│ ♧ .remini https://example.com/image.jpg\n│ ♧ Reply to a blurry image\n│\n│ *Note:* Uses AI to enhance quality`,
                        'enhance'
                    );
                    await sock.sendMessage(chatId, { text: usageMsg, ...channelInfo }, { quoted: message });
                    await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                    return;
                }
            }

            // Send processing message
            const processingMsg = formatReminiMessage(
                'PROCESSING',
                `│ 🔮 Enhancing image...\n│ 🔗 *Image URL:* ${imageUrl.substring(0, 50)}${imageUrl.length > 50 ? '...' : ''}\n│\n│ ⏳ Using AI to enhance quality, please wait.`,
                'processing'
            );
            await sock.sendMessage(chatId, { text: processingMsg, ...channelInfo }, { quoted: message });
            
            // ============================================
            // CALL REMINI API (GiftedTech)
            // ============================================
            const apiUrl = `https://api.giftedtech.co.ke/api/tools/remini?apikey=gifted&url=${encodeURIComponent(imageUrl)}`;
            
            const response = await axios.get(apiUrl, {
                timeout: 45000, // Longer timeout for enhancement
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            });

            // Check if API returned success
            if (response.data && response.data.success && response.data.result?.image_url) {
                const resultUrl = response.data.result.image_url;
                
                // Send success reaction
                await sock.sendMessage(chatId, { react: { text: '✨', key: message.key } });
                
                // Fetch the enhanced image
                const imageResponse = await axios.get(resultUrl, {
                    responseType: 'arraybuffer',
                    timeout: 20000
                });
                
                // Send the enhanced image
                const successCaption = `✨ *Image enhanced successfully!*

🔮 *AI Enhancement completed*
🕒 *Time:* ${new Date().toLocaleString()}

𝗘𝗡𝗛𝗔𝗡𝗖𝗘𝗗 𝗕𝗬 BATMAN MD

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
                
                await sock.sendMessage(chatId, {
                    image: imageResponse.data,
                    caption: successCaption,
                    ...channelInfo
                }, { quoted: message });
                
                // Remove processing reaction
                await sock.sendMessage(chatId, { react: { text: null, key: message.key } });
                
            } else {
                throw new Error(response.data?.message || 'Failed to enhance image');
            }

        } catch (error) {
            console.error('Remini Error:', error.message);
            
            // Remove reaction
            try {
                await sock.sendMessage(message.key.remoteJid, { react: { text: null, key: message.key } });
            } catch (_) {}
            
            // Determine error message
            let errorMessage = '❌ Failed to enhance image.';
            let errorTitle = 'ENHANCEMENT FAILED';
            
            if (error.response?.status === 429) {
                errorMessage = '⏰ *Rate limit exceeded.*\n\nPlease wait a few minutes before trying again.';
                errorTitle = 'RATE LIMITED';
            } else if (error.response?.status === 400) {
                errorMessage = '❌ *Invalid image.*\n\nPlease make sure the image is valid.';
                errorTitle = 'INVALID IMAGE';
            } else if (error.response?.status === 500) {
                errorMessage = '🔧 *Server error.*\n\nPlease try again later.';
                errorTitle = 'SERVER ERROR';
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = '⏰ *Request timeout.*\n\nPlease try again with a smaller image.';
                errorTitle = 'TIMEOUT';
            } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
                errorMessage = '🌐 *Network error.*\n\nPlease check your connection and try again.';
                errorTitle = 'NETWORK ERROR';
            } else {
                errorMessage = `❌ *Failed to enhance image.*\n\n🔧 Error: ${error.message.substring(0, 100)}`;
            }
            
            const errorMsg = formatReminiMessage(
                errorTitle,
                `│ ${errorMessage}\n│\n│ 🔄 Please try again later.`,
                'error'
            );
            
            await sock.sendMessage(message.key.remoteJid, { 
                text: errorMsg,
                ...channelInfo
            }, { quoted: message });
        }
    }
};