const { 
    downloadMediaMessage, 
    prepareWAMessageMedia, 
    generateWAMessageFromContent 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const settings = require('../settings');
const isAdmin = require('../lib/isAdmin');

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
        admin: '👑'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

async function gcstatus(sock, chatId, message, args) {
    const m = message;
    let targetGroup = chatId;
    let text = args || '';
    
    // ============================================
    // FEATURE 1: Post from DM to a specific group
    // ============================================
    // Check if we're in DM and user provided a group JID
    if (!chatId.endsWith('@g.us')) {
        // Check if first argument is a group JID
        const parts = text.split(' ');
        const possibleJid = parts[0];
        
        // Check if it looks like a group JID (ends with @g.us)
        if (possibleJid && possibleJid.endsWith('@g.us')) {
            targetGroup = possibleJid;
            // Remove the JID from text
            text = parts.slice(1).join(' ').trim();
        } else {
            // Not a DM command, show error
            const errorMsg = formatStatusMessage(
                'GROUP REQUIRED',
                `│ 📱 Post group status from anywhere!\n│\n│ *Usage:*\n│ ♧ .gcstatus <group-jid> <message>\n│ ♧ .gcstatus <group-jid> (reply to media)\n│\n│ *Examples:*\n│ ♧ .gcstatus 123456789@g.us Hello group!\n│ ♧ Reply to image/video with:\n│   .gcstatus 123456789@g.us\n│\n│ *Note:* You must be an admin in that group`,
                'status'
            );
            return await sock.sendMessage(chatId, { text: errorMsg, ...channelInfo }, { quoted: m });
        }
    }

    // Get sender info
    const senderId = m.key.participant || m.key.remoteJid;
    const isOwner = senderId.includes(settings.ownerNumber) || m.key.fromMe;
    
    // ============================================
    // CHECK ADMIN PERMISSIONS IN TARGET GROUP
    // ============================================
    let isSenderAdmin = false;
    let isBotAdmin = false;
    
    try {
        const groupMetadata = await sock.groupMetadata(targetGroup);
        isSenderAdmin = groupMetadata.participants.some(p => 
            p.id === senderId && (p.admin === 'admin' || p.admin === 'superadmin')
        );
        isBotAdmin = groupMetadata.participants.some(p => 
            p.id === sock.user.id && (p.admin === 'admin' || p.admin === 'superadmin')
        );
    } catch (err) {
        console.error('Error fetching group metadata:', err);
        const errorMsg = formatStatusMessage(
            'GROUP ERROR',
            `│ ❌ Could not access group.\n│ 🔧 Make sure the bot is in the group and the JID is correct.\n│\n│ 💡 *Tip:* Use .jid in the group to get its JID`,
            'error'
        );
        return await sock.sendMessage(chatId, { text: errorMsg, ...channelInfo }, { quoted: m });
    }
    
    // Only admins or owner can post
    if (!isSenderAdmin && !isOwner) {
        const errorMsg = formatStatusMessage(
            'ADMIN ONLY',
            `│ 👑 Only group admins or the bot owner can post status updates.\n│\n│ 🔒 This feature is restricted.`,
            'error'
        );
        return await sock.sendMessage(chatId, { text: errorMsg, ...channelInfo }, { quoted: m });
    }

    // Check if bot is admin
    if (!isBotAdmin) {
        const errorMsg = formatStatusMessage(
            'BOT NOT ADMIN',
            `│ 🤖 Bot needs to be admin to post status in that group.\n│\n│ Please make the bot an admin first.`,
            'error'
        );
        return await sock.sendMessage(chatId, { text: errorMsg, ...channelInfo }, { quoted: m });
    }

    // ============================================
    // GET QUOTED MEDIA (with caption support)
    // ============================================
    let quotedMessage = null;
    let mediaType = null;
    let mediaBuffer = null;
    let quotedCaption = '';
    
    // Check if replying to a message
    if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        quotedMessage = m.message.extendedTextMessage.contextInfo.quotedMessage;
        
        // Determine media type and extract caption
        if (quotedMessage.imageMessage) {
            mediaType = 'image';
            quotedCaption = quotedMessage.imageMessage.caption || '';
        } else if (quotedMessage.videoMessage) {
            mediaType = 'video';
            quotedCaption = quotedMessage.videoMessage.caption || '';
        } else if (quotedMessage.audioMessage) {
            mediaType = 'audio';
            quotedCaption = '';
        }
    }
    
    // Combine caption from quoted message with text from command
    let finalCaption = text || quotedCaption || '';
    
    // Validate input
    if (!mediaType && !finalCaption.trim()) {
        const usageMsg = formatStatusMessage(
            'GROUP STATUS',
            `│ 📱 Post status updates in groups!\n│\n│ *Usage from groups:*\n│ ♧ .gcstatus <message>\n│ ♧ Reply to media with .gcstatus\n│\n│ *Usage from DM:*\n│ ♧ .gcstatus <group-jid> <message>\n│ ♧ Reply to media with:\n│   .gcstatus <group-jid>\n│\n│ *Example:*\n│ ♧ .gcstatus 123456789@g.us Hello everyone!`,
            'status'
        );
        return await sock.sendMessage(chatId, { text: usageMsg, ...channelInfo }, { quoted: m });
    }

    // Send processing reaction in the original chat
    await sock.sendMessage(chatId, { react: { text: '⏳', key: m.key } });

    try {
        let messagePayload = {};

        // ============================================
        // PREPARE MEDIA (Image/Video) with CAPTION
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
                            remoteJid: chatId,
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
                await sock.sendMessage(chatId, { text: errorMsg, ...channelInfo }, { quoted: m });
                await sock.sendMessage(chatId, { react: { text: '❌', key: m.key } });
                return;
            }
            
            // Prepare media options with caption
            let mediaOptions = {};
            if (mediaType === 'image') {
                mediaOptions = { image: mediaBuffer, caption: finalCaption || ' ' };
            } else if (mediaType === 'video') {
                mediaOptions = { video: mediaBuffer, caption: finalCaption || ' ' };
            } else if (mediaType === 'audio') {
                mediaOptions = { audio: mediaBuffer, mimetype: 'audio/mp4', ptt: false };
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
        // ============================================
        // PREPARE TEXT STATUS
        // ============================================
        else if (finalCaption.trim()) {
            // Random background color for text status
            const randomHex = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
            messagePayload = {
                groupStatusMessageV2: {
                    message: {
                        extendedTextMessage: {
                            text: finalCaption,
                            backgroundArgb: 0xFF000000 + parseInt(randomHex, 16),
                            font: 2,
                            textArgb: 0xFFFFFFFF // White text
                        }
                    }
                }
            };
        }

        // ============================================
        // SEND TO TARGET GROUP
        // ============================================
        const msg = generateWAMessageFromContent(
            targetGroup,
            messagePayload,
            { userJid: sock.user.id }
        );
        
        await sock.relayMessage(targetGroup, msg.message, { messageId: msg.key.id });
        
        // Send success reaction
        await sock.sendMessage(chatId, { react: { text: '✅', key: m.key } });
        
        // Send confirmation message
        const groupName = await getGroupName(sock, targetGroup);
        const senderName = m.pushName || senderId.split('@')[0];
        const notification = formatStatusMessage(
            'STATUS POSTED',
            `│ ✅ Status posted successfully!\n│ 👥 *Group:* ${groupName}\n│ 👑 *By:* ${senderName}\n│ ${mediaType ? `📁 *Type:* ${mediaType.toUpperCase()}` : '📝 *Text:* ' + finalCaption.substring(0, 50)}\n│ 🕒 *Time:* ${new Date().toLocaleString()}`,
            'success'
        );
        await sock.sendMessage(chatId, { text: notification, ...channelInfo });

    } catch (e) {
        console.error("[GC STATUS ERROR]", e);
        
        const errorMsg = formatStatusMessage(
            'ERROR',
            `│ ❌ Failed to post status.\n│ 🔧 ${e.message}\n│\n│ 🔄 Please try again later.`,
            'error'
        );
        
        await sock.sendMessage(chatId, { text: errorMsg, ...channelInfo }, { quoted: m });
        await sock.sendMessage(chatId, { react: { text: '❌', key: m.key } });
    }
}

// ============================================
// Helper: Get group name
// ============================================
async function getGroupName(sock, groupJid) {
    try {
        const metadata = await sock.groupMetadata(groupJid);
        return metadata.subject || groupJid.split('@')[0];
    } catch (error) {
        return groupJid.split('@')[0];
    }
}

module.exports = gcstatus;