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
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quoted?.imageMessage) {
        const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        return await uploadImage(buffer);
    }

    if (message.message?.imageMessage) {
        const stream = await downloadContentFromMessage(message.message.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        return await uploadImage(buffer);
    }

    return null;
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// ============================================
// MAIN COMMAND FUNCTION
// ============================================
async function reminiCommand(sock, chatId, message, args) {
    try {
        let imageUrl = null;
        
        await sock.sendMessage(chatId, { react: { text: '🔮', key: message.key } });
        
        if (args && args.length > 0) {
            const url = args.join(' ');
            if (isValidUrl(url)) {
                imageUrl = url;
            } else {
                const errorMsg = formatReminiMessage(
                    'INVALID URL',
                    `│ ❌ The provided URL is invalid.\n│\n│ *Usage:* .remini <image_url>\n│ or reply to an image`,
                    'error'
                );
                await sock.sendMessage(chatId, { text: errorMsg, ...channelInfo }, { quoted: message });
                await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                return;
            }
        } else {
            imageUrl = await getQuotedOrOwnImageUrl(sock, message);
            if (!imageUrl) {
                const usageMsg = formatReminiMessage(
                    'IMAGE ENHANCER',
                    `│ 🔮 Enhance and upscale your images!\n│\n│ *Usage:*\n│ ♧ .remini <image_url>\n│ ♧ Reply to an image\n│\n│ *Example:* .remini https://example.com/image.jpg`,
                    'enhance'
                );
                await sock.sendMessage(chatId, { text: usageMsg, ...channelInfo }, { quoted: message });
                await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                return;
            }
        }

        const processingMsg = formatReminiMessage(
            'PROCESSING',
            `│ 🔮 Enhancing image...\n│\n│ ⏳ Using AI to enhance quality, please wait.`,
            'processing'
        );
        await sock.sendMessage(chatId, { text: processingMsg, ...channelInfo }, { quoted: message });
        
        const apiUrl = `https://api.giftedtech.co.ke/api/tools/remini?apikey=gifted&url=${encodeURIComponent(imageUrl)}`;
        const response = await axios.get(apiUrl, { timeout: 45000 });

        if (response.data && response.data.success && response.data.result?.image_url) {
            const resultUrl = response.data.result.image_url;
            
            await sock.sendMessage(chatId, { react: { text: '✨', key: message.key } });
            
            const imageResponse = await axios.get(resultUrl, { responseType: 'arraybuffer', timeout: 20000 });
            
            const successCaption = `✨ *Image enhanced successfully!*

🕒 *Time:* ${new Date().toLocaleString()}

𝗘𝗡𝗛𝗔𝗡𝗖𝗘𝗗 𝗕𝗬 BATMAN MD`;
            
            await sock.sendMessage(chatId, {
                image: imageResponse.data,
                caption: successCaption,
                ...channelInfo
            }, { quoted: message });
            
            await sock.sendMessage(chatId, { react: { text: null, key: message.key } });
            
        } else {
            throw new Error(response.data?.message || 'Failed to enhance image');
        }

    } catch (error) {
        console.error('Remini Error:', error.message);
        
        try {
            await sock.sendMessage(chatId, { react: { text: null, key: message.key } });
        } catch (_) {}
        
        const errorMsg = formatReminiMessage(
            'ENHANCEMENT FAILED',
            `│ ❌ Failed to enhance image.\n│ 🔧 ${error.message}\n│\n│ 🔄 Please try again later.`,
            'error'
        );
        
        await sock.sendMessage(chatId, { 
            text: errorMsg,
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = reminiCommand;