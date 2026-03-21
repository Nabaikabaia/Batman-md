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
function formatRemoveBgMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        processing: '🖼️',
        done: '✨',
        url: '🔗'
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
    name: 'removebg',
    alias: ['rmbg', 'nobg'],
    category: 'general',
    desc: 'Remove background from images',
    
    async exec(sock, message, args) {
        try {
            const chatId = message.key.remoteJid;
            let imageUrl = null;
            
            // Send processing reaction
            await sock.sendMessage(chatId, { react: { text: '🖼️', key: message.key } });
            
            // ============================================
            // GET IMAGE URL FROM ARGS OR MESSAGE
            // ============================================
            if (args.length > 0) {
                const url = args.join(' ');
                if (isValidUrl(url)) {
                    imageUrl = url;
                } else {
                    const errorMsg = formatRemoveBgMessage(
                        'INVALID URL',
                        `│ ❌ The provided URL is invalid.\n│\n│ *Usage:*\n│ ♧ .removebg <image_url>\n│ ♧ Reply to an image\n│ ♧ Send image with caption\n│\n│ *Example:* .removebg https://example.com/image.jpg`,
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
                    const usageMsg = formatRemoveBgMessage(
                        'REMOVE BACKGROUND',
                        `│ 🖼️ Remove background from images!\n│\n│ *Usage:*\n│ ♧ .removebg <image_url>\n│ ♧ Reply to an image with .removebg\n│ ♧ Send image with .removebg\n│\n│ *Examples:*\n│ ♧ .removebg https://example.com/image.jpg\n│ ♧ Reply to an image\n│\n│ *Note:* Supports JPG, PNG, WEBP`,
                        'info'
                    );
                    await sock.sendMessage(chatId, { text: usageMsg, ...channelInfo }, { quoted: message });
                    await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                    return;
                }
            }

            // Send processing message
            const processingMsg = formatRemoveBgMessage(
                'PROCESSING',
                `│ 🔄 Removing background...\n│ 🔗 *Image URL:* ${imageUrl.substring(0, 50)}${imageUrl.length > 50 ? '...' : ''}\n│\n│ ⏳ Please wait, this may take a few seconds.`,
                'processing'
            );
            await sock.sendMessage(chatId, { text: processingMsg, ...channelInfo }, { quoted: message });
            
            // ============================================
            // CALL REMOVE BACKGROUND API
            // ============================================
            const apiUrl = `https://api.siputzx.my.id/api/iloveimg/removebg?image=${encodeURIComponent(imageUrl)}`;
            
            const response = await axios.get(apiUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'image/webp,image/*,*/*'
                }
            });

            if (response.status === 200 && response.data && response.data.length > 0) {
                // Send success reaction
                await sock.sendMessage(chatId, { react: { text: '✨', key: message.key } });
                
                // Send the processed image
                const successCaption = `✨ *Background removed successfully!*

🖼️ *Image processed*
🕒 *Time:* ${new Date().toLocaleString()}

𝗣𝗥𝗢𝗖𝗘𝗦𝗦𝗘𝗗 𝗕𝗬 BATMAN MD

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
                
                await sock.sendMessage(chatId, {
                    image: response.data,
                    caption: successCaption,
                    ...channelInfo
                }, { quoted: message });
                
                // Remove processing reaction
                await sock.sendMessage(chatId, { react: { text: null, key: message.key } });
                
            } else {
                throw new Error('Failed to process image - Empty response');
            }

        } catch (error) {
            console.error('RemoveBG Error:', error.message);
            
            // Remove reaction
            try {
                await sock.sendMessage(message.key.remoteJid, { react: { text: null, key: message.key } });
            } catch (_) {}
            
            // Determine error message
            let errorMessage = '❌ Failed to remove background.';
            let errorTitle = 'PROCESSING FAILED';
            
            if (error.response?.status === 429) {
                errorMessage = '⏰ *Rate limit exceeded.*\n\nPlease wait a few minutes before trying again.';
                errorTitle = 'RATE LIMITED';
            } else if (error.response?.status === 400) {
                errorMessage = '❌ *Invalid image.*\n\nPlease make sure the image is valid and contains a clear subject.';
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
            } else if (error.message.includes('Invalid URL')) {
                errorMessage = '🔗 *Invalid URL.*\n\nPlease provide a valid image URL.';
                errorTitle = 'INVALID URL';
            } else {
                errorMessage = `❌ *Failed to process image.*\n\n🔧 Error: ${error.message.substring(0, 100)}`;
            }
            
            const errorMsg = formatRemoveBgMessage(
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