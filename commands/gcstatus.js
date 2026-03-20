const { 
    downloadMediaMessage, 
    prepareWAMessageMedia, 
    generateWAMessageFromContent,
    jidDecode
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const settings = require('../settings');
const isAdmin = require('../lib/isAdmin');

// ============================================
// ENHANCEMENT: Newsletter channel info
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
        admin: '👑'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

async function gcstatus(sock, chatId, message, args) {
    const from = chatId;
    const m = message;
    
    // Check if in group
    if (!from.endsWith('@g.us')) {
        const errorMsg = formatStatusMessage(
            'GROUP ONLY',
            `│ ❌ This command can only be used in groups.`,
            'error'
        );
        return await sock.sendMessage(from, { text: errorMsg, ...channelInfo }, { quoted: m });
    }

    // Get sender info
    const senderId = m.key.participant || m.key.remoteJid;
    
    // Check if sender is admin
    const adminStatus = await isAdmin(sock, from, senderId);
    const isSenderAdmin = adminStatus.isSenderAdmin;
    const isBotAdmin = adminStatus.isBotAdmin;
    
    // Only admins can post group status
    if (!isSenderAdmin && !m.key.fromMe) {
        const errorMsg = formatStatusMessage(
            'ADMIN ONLY',
            `│ 👑 Only group admins can post status updates.\n│\n│ 🔒 This feature is restricted to admins.`,
            'error'
        );
        return await sock.sendMessage(from, { text: errorMsg, ...channelInfo }, { quoted: m });
    }

    // Check if bot is admin (needed to post)
    if (!isBotAdmin) {
        const errorMsg = formatStatusMessage(
            'BOT NOT ADMIN',
            `│ 🤖 Bot needs to be admin to post status.\n│\n│ Please make the bot an admin first.`,
            'error'
        );
        return await sock.sendMessage(from, { text: errorMsg, ...channelInfo }, { quoted: m });
    }

    // Get quoted message
    let quotedMessage = null;
    let mediaType = null;
    let mediaBuffer = null;
    
    // Check if replying to a message
    if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        quotedMessage = m.message.extendedTextMessage.contextInfo.quotedMessage;
        
        // Determine media type
        if (quotedMessage.imageMessage) {
            mediaType = 'image';
        } else if (quotedMessage.videoMessage) {
            mediaType = 'video';
        } else if (quotedMessage.audioMessage) {
            mediaType = 'audio';
        }
    }
    
    // Get text from args
    const text = args.join(" ").trim();
    
    // Validate input
    if (!mediaType && !text) {
        const usageMsg = formatStatusMessage(
            'GROUP STATUS',
            `│ 📱 Post status updates in the group!\n│\n│ *Usage:*\n│ • Reply to media: .gcstatus\n│ • With text: .gcstatus <message>\n│\n│ *Examples:*\n│ ♧ Reply to an image/video\n│ ♧ .gcstatus Hello everyone!\n│ ♧ .gcstatus Check this out!`,
            'status'
        );
        return await sock.sendMessage(from, { text: usageMsg, ...channelInfo }, { quoted: m });
    }

    // Send processing reaction
    await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

    try {
        let messagePayload = {};
        let caption = text;

        // 2. Prepare MEDIA (Image/Video/Audio)
        if (mediaType) {
            try {
                // Download media
                mediaBuffer = await downloadMediaMessage(
                    {
                        key: {
                            remoteJid: from,
                            id: m.message.extendedTextMessage.contextInfo.stanzaId,
                            participant: m.message.extendedTextMessage.contextInfo.participant || senderId
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
            
            // Prepare media options
            let mediaOptions = {};
            if (mediaType === 'image') {
                mediaOptions = { image: mediaBuffer, caption: text || ' ' };
            } else if (mediaType === 'video') {
                mediaOptions = { video: mediaBuffer, caption: text || ' ' };
            } else if (mediaType === 'audio') {
                mediaOptions = { audio: mediaBuffer, mimetype: 'audio/mp4', ptt: false, caption: text || ' ' };
            }
            
            // Upload & prepare
            const preparedMedia = await prepareWAMessageMedia(
                mediaOptions,
                { upload: sock.waUploadToServer }
            );
            
            // Construct final message
            let finalMediaMsg = {};
            if (mediaType === 'image') {
                finalMediaMsg = { imageMessage: preparedMedia.imageMessage };
            } else if (mediaType === 'video') {
                finalMediaMsg = { videoMessage: preparedMedia.videoMessage };
            } else if (mediaType === 'audio') {
                finalMediaMsg = { audioMessage: preparedMedia.audioMessage };
            }
            
            messagePayload = {
                groupStatusMessageV2: {
                    message: finalMediaMsg
                }
            };
        } 
        // 3. Prepare TEXT
        else if (text) {
            // Random background color for text status
            const randomHex = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
            messagePayload = {
                groupStatusMessageV2: {
                    message: {
                        extendedTextMessage: {
                            text: text,
                            backgroundArgb: 0xFF000000 + parseInt(randomHex, 16),
                            font: 2,
                            textArgb: 0xFFFFFFFF // White text
                        }
                    }
                }
            };
        }

        // 4. Generate & Send
        const msg = generateWAMessageFromContent(
            from,
            messagePayload,
            { userJid: sock.user.id }
        );
        
        await sock.relayMessage(from, msg.message, { messageId: msg.key.id });
        
        // Send success reaction
        await sock.sendMessage(from, { react: { text: '✅', key: m.key } });
        
        // Optional: Send notification that status was posted
        const senderName = m.pushName || senderId.split('@')[0];
        const notification = formatStatusMessage(
            'STATUS POSTED',
            `│ 👑 *${senderName}* posted a group status!\n│ ${mediaType ? `📁 *Type:* ${mediaType.toUpperCase()}` : '📝 *Text:* ' + text.substring(0, 50)}`,
            'success'
        );
        await sock.sendMessage(from, { text: notification, ...channelInfo });

    } catch (e) {
        console.error("[GC STATUS ERROR]", e);
        
        const errorMsg = formatStatusMessage(
            'ERROR',
            `│ ❌ Failed to post status.\n│ 🔧 ${e.message}\n│\n│ 🔄 Please try again later.`,
            'error'
        );
        
        await sock.sendMessage(from, { text: errorMsg, ...channelInfo }, { quoted: m });
        await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
}

module.exports = gcstatus;
