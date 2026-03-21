// commands/status.js
const { 
    downloadMediaMessage, 
    prepareWAMessageMedia, 
    generateWAMessageFromContent 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const settings = require('../settings');

// ============================================
// Newsletter channel info
// ============================================
const channelInfo = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: settings.newsletterJid,
            newsletterName: settings.newsletterName,
            serverMessageId: 13
        }
    }
};

// ============================================
// Helper function for stylish messages
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
        text: '📝',
        owner: '👑'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

async function statusCommand(sock, chatId, message, args) {
    const from = chatId;
    const m = message;
    const text = args || '';
    
    // ============================================
    // CHECK OWNER PERMISSION
    // ============================================
    const senderId = m.key.participant || m.key.remoteJid;
    const isOwner = senderId.includes(settings.ownerNumber);
    
    if (!isOwner && !m.key.fromMe) {
        const errorMsg = formatStatusMessage(
            'UNAUTHORIZED',
            `│ 👑 Only the bot owner can post status updates!\n│\n│ 🔒 This feature is restricted to the bot owner.`,
            'error'
        );
        return await sock.sendMessage(from, { text: errorMsg, ...channelInfo }, { quoted: m });
    }

    // ============================================
    // GET QUOTED MEDIA
    // ============================================
    let quotedMessage = null;
    let mediaType = null;
    let mediaBuffer = null;
    
    if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        quotedMessage = m.message.extendedTextMessage.contextInfo.quotedMessage;
        
        if (quotedMessage.imageMessage) {
            mediaType = 'image';
        } else if (quotedMessage.videoMessage) {
            mediaType = 'video';
        }
    }
    
    // ============================================
    // VALIDATE INPUT
    // ============================================
    if (!mediaType && !text.trim()) {
        const usageMsg = formatStatusMessage(
            'STATUS POSTER',
            `│ 📱 Post WhatsApp status updates!\n│\n│ *Usage:*\n│ • Text: .status <message>\n│ • Reply to image: .status\n│ • Reply to video: .status\n│\n│ *Examples:*\n│ ♧ .status Hello everyone!\n│ ♧ Reply to an image/video\n│\n│ *Note:* Only bot owner can use this`,
            'status'
        );
        return await sock.sendMessage(from, { text: usageMsg, ...channelInfo }, { quoted: m });
    }

    // Send processing reaction
    await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

    try {
        // ============================================
        // POST MEDIA STATUS (Image/Video)
        // ============================================
        if (mediaType) {
            try {
                const stanzaId = m.message.extendedTextMessage.contextInfo.stanzaId;
                const participant = m.message.extendedTextMessage.contextInfo.participant;
                
                if (!stanzaId) {
                    throw new Error('Could not get quoted message ID');
                }
                
                // Download media
                mediaBuffer = await downloadMediaMessage(
                    {
                        key: {
                            remoteJid: from,
                            id: stanzaId,
                            participant: participant || senderId
                        },
                        message: quotedMessage
                    },
                    'buffer',
                    {},
                    { logger: pino({ level: 'silent' }) }
                );
                
                if (!mediaBuffer || mediaBuffer.length === 0) {
                    throw new Error('Failed to download media');
                }
            } catch (downloadError) {
                console.error('Download error:', downloadError);
                const errorMsg = formatStatusMessage(
                    'DOWNLOAD FAILED',
                    `│ ❌ Failed to download media.\n│ 🔧 ${downloadError.message}\n│\n│ 🔄 Please try again.`,
                    'error'
                );
                await sock.sendMessage(from, { text: errorMsg, ...channelInfo }, { quoted: m });
                await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
                return;
            }
            
            // Prepare caption
            const caption = text.trim() || `📢 *${settings.botName || 'BATMAN MD'} Status*\n\n🕒 ${new Date().toLocaleString()}`;
            
            // Post to WhatsApp status (stories)
            await sock.sendMessage('status@broadcast', {
                [mediaType]: mediaBuffer,
                caption: caption,
                ...channelInfo
            });
            
            // Send success message
            const successMsg = formatStatusMessage(
                'STATUS POSTED',
                `│ ✅ Status posted successfully!\n│ 📁 *Type:* ${mediaType.toUpperCase()}\n│ 📝 *Caption:* ${text.trim() || 'No caption'}\n│ 🕒 *Time:* ${new Date().toLocaleString()}`,
                'success'
            );
            
            await sock.sendMessage(from, { text: successMsg, ...channelInfo }, { quoted: m });
            await sock.sendMessage(from, { react: { text: '✅', key: m.key } });
        } 
        // ============================================
        // POST TEXT STATUS
        // ============================================
        else if (text.trim()) {
            // Create status text with styling
            const statusText = `📢 *${settings.botName || 'BATMAN MD'} Status*\n\n${text.trim()}\n\n🕒 ${new Date().toLocaleString()}\n\n> *Powered by ${settings.botName || 'BATMAN MD'}*`;
            
            // Post to WhatsApp status
            await sock.sendMessage('status@broadcast', {
                text: statusText,
                ...channelInfo
            });
            
            const successMsg = formatStatusMessage(
                'STATUS POSTED',
                `│ ✅ Status posted successfully!\n│ 📝 *Text:* ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}\n│ 🕒 *Time:* ${new Date().toLocaleString()}`,
                'success'
            );
            
            await sock.sendMessage(from, { text: successMsg, ...channelInfo }, { quoted: m });
            await sock.sendMessage(from, { react: { text: '✅', key: m.key } });
        }

    } catch (e) {
        console.error("[STATUS ERROR]", e);
        
        const errorMsg = formatStatusMessage(
            'ERROR',
            `│ ❌ Failed to post status.\n│ 🔧 ${e.message}\n│\n│ 🔄 Please try again later.`,
            'error'
        );
        
        await sock.sendMessage(from, { text: errorMsg, ...channelInfo }, { quoted: m });
        await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
}

module.exports = statusCommand;
