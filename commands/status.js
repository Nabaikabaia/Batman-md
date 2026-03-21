// commands/status.js
const settings = require('../settings');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// ============================================
// HELPER FUNCTIONS
// ============================================
function formatStatusMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        status: '📱',
        image: '🖼️',
        video: '🎬',
        text: '📝'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

// ============================================
// FUNCTION TO CONVERT STREAM TO BUFFER
// ============================================
async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

// ============================================
// FUNCTION TO DOWNLOAD MEDIA FROM QUOTED MESSAGE
// ============================================
async function downloadQuotedMedia(sock, message) {
    try {
        const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMsg) return null;
        
        let mediaMessage = null;
        let mediaType = null;
        
        if (quotedMsg.imageMessage) {
            mediaMessage = quotedMsg.imageMessage;
            mediaType = 'image';
        } else if (quotedMsg.videoMessage) {
            mediaMessage = quotedMsg.videoMessage;
            mediaType = 'video';
        } else {
            return null;
        }
        
        // Get the message ID of the quoted message
        const stanzaId = message.message.extendedTextMessage.contextInfo.stanzaId;
        const participant = message.message.extendedTextMessage.contextInfo.participant;
        
        // Create the key for the quoted message
        const quotedKey = {
            remoteJid: message.key.remoteJid,
            id: stanzaId,
            fromMe: false
        };
        
        if (participant) {
            quotedKey.participant = participant;
        }
        
        // Download the media
        const stream = await sock.downloadMediaMessage({
            key: quotedKey,
            message: mediaMessage
        });
        
        const buffer = await streamToBuffer(stream);
        return { buffer, type: mediaType, mimetype: mediaMessage.mimetype };
        
    } catch (error) {
        console.error('Download error:', error);
        return null;
    }
}

// ============================================
// MAIN STATUS POST COMMAND
// ============================================
async function statusCommand(sock, chatId, message, args) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = senderId.includes(settings.ownerNumber);
        
        // Check if user is owner
        if (!isOwner && !message.key.fromMe) {
            const errorMsg = formatStatusMessage(
                'UNAUTHORIZED',
                `│ ❌ Only the bot owner can post status updates!\n│\n│ 👑 This command is restricted to the bot owner.`,
                'error'
            );
            return await sock.sendMessage(chatId, { text: errorMsg }, { quoted: message });
        }

        const text = args.trim();
        
        // Newsletter context
        const newsletterContext = {
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
        // CHECK FOR QUOTED MEDIA (IMAGE/VIDEO)
        // ============================================
        const quotedMedia = await downloadQuotedMedia(sock, message);
        
        if (quotedMedia) {
            await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
            
            try {
                // Post to status using the correct method
                const statusMessage = {
                    [quotedMedia.type]: quotedMedia.buffer,
                    caption: text || `📢 *${settings.botName || 'BATMAN MD'} Status Update*\n\n🕒 ${new Date().toLocaleString()}`
                };
                
                // Send to status broadcast
                await sock.sendMessage('status@broadcast', statusMessage);
                
                const successMsg = formatStatusMessage(
                    'STATUS POSTED',
                    `│ ✅ Status posted successfully!\n│ 📁 *Type:* ${quotedMedia.type.toUpperCase()}\n│ 📝 *Caption:* ${text || 'No caption'}\n│ 🕒 *Time:* ${new Date().toLocaleString()}`,
                    'success'
                );
                
                await sock.sendMessage(chatId, { text: successMsg, ...newsletterContext }, { quoted: message });
                await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
                
            } catch (error) {
                console.error('Status post error:', error);
                const errorMsg = formatStatusMessage(
                    'POST FAILED',
                    `│ ❌ Failed to post status.\n│ 🔧 ${error.message}\n│\n│ 🔄 Please try again.`,
                    'error'
                );
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: message });
                await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            }
            
            return;
        }
        
        // ============================================
        // POST TEXT STATUS
        // ============================================
        if (text) {
            await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
            
            try {
                // Create status text
                const statusText = `📢 *${settings.botName || 'BATMAN MD'} Status Update*\n\n${text}\n\n🕒 ${new Date().toLocaleString()}\n\n> *Powered by ${settings.botName || 'BATMAN MD'}*`;
                
                // Send to status broadcast
                await sock.sendMessage('status@broadcast', {
                    text: statusText,
                    ...newsletterContext
                });
                
                const successMsg = formatStatusMessage(
                    'STATUS POSTED',
                    `│ ✅ Status posted successfully!\n│ 📝 *Text:* ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}\n│ 🕒 *Time:* ${new Date().toLocaleString()}`,
                    'success'
                );
                
                await sock.sendMessage(chatId, { text: successMsg, ...newsletterContext }, { quoted: message });
                await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
                
            } catch (error) {
                console.error('Status post error:', error);
                const errorMsg = formatStatusMessage(
                    'POST FAILED',
                    `│ ❌ Failed to post status.\n│ 🔧 ${error.message}\n│\n│ 🔄 Please try again.`,
                    'error'
                );
                await sock.sendMessage(chatId, { text: errorMsg }, { quoted: message });
                await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            }
            
            return;
        }
        
        // ============================================
        // SHOW USAGE
        // ============================================
        const usageMsg = `*『 📱 STATUS POSTER 』*
╭─────────⟢
│ 📢 Post WhatsApp status updates!
│
│ *Usage:*
│ ♧ .status <text>
│ ♧ Reply to image/video with .status
│
│ *Examples:*
│ ♧ .status Hello everyone!
│ ♧ Reply to an image/video
│
│ *Note:* Only bot owner can use this
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
        
        await sock.sendMessage(chatId, { text: usageMsg, ...newsletterContext }, { quoted: message });
        
    } catch (error) {
        console.error('Status Command Error:', error);
        
        const errorMsg = formatStatusMessage(
            'ERROR',
            `│ ❌ Failed to process request.\n│ 🔧 ${error.message}\n│\n│ 🔄 Please try again later.`,
            'error'
        );
        await sock.sendMessage(chatId, { text: errorMsg }, { quoted: message });
    }
}

module.exports = statusCommand;
