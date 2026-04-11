const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
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
function formatViewOnceMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        viewonce: '👁️',
        image: '🖼️',
        video: '🎬',
        forward: '📨'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

// Store owner JID
const ownerJid = settings.ownerNumber + '@s.whatsapp.net';

// ============================================
// AUTO-DETECT AND FORWARD VIEW-ONCE MESSAGES TO OWNER
// ============================================
async function handleViewOnceAutoForward(sock, message) {
    try {
        const msg = message.message;
        if (!msg) return false;
        
        // Check for view-once image
        const imageMsg = msg.imageMessage;
        if (imageMsg && imageMsg.viewOnce) {
            console.log('👁️ View-once image detected - auto-forwarding to owner');
            await forwardToOwner(sock, message, imageMsg, 'image');
            return true;
        }
        
        // Check for view-once video
        const videoMsg = msg.videoMessage;
        if (videoMsg && videoMsg.viewOnce) {
            console.log('👁️ View-once video detected - auto-forwarding to owner');
            await forwardToOwner(sock, message, videoMsg, 'video');
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Error in handleViewOnceAutoForward:', error);
        return false;
    }
}

// ============================================
// FORWARD VIEW-ONCE MEDIA TO OWNER
// ============================================
async function forwardToOwner(sock, originalMessage, mediaMsg, type) {
    try {
        const sender = originalMessage.key.participant || originalMessage.key.remoteJid;
        const senderName = originalMessage.pushName || sender.split('@')[0];
        const chatId = originalMessage.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        
        // Download the media
        console.log(`📥 Downloading view-once ${type} from ${sender}...`);
        const stream = await downloadContentFromMessage(mediaMsg, type);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        
        // Get file size
        const fileSizeMB = (buffer.length / 1024 / 1024).toFixed(2);
        
        // Prepare caption with sender info
        const caption = `╭━━⪨ 👁️ *VIEW-ONCE MEDIA CAPTURED* ⪩━━┈⊷
┃
┃ 📤 *From:* ${senderName}
┃ 📱 *JID:* ${sender}
┃ ${isGroup ? `👥 *Group:* ${chatId.split('@')[0]}\n┃ ` : ''}🕒 *Time:* ${new Date().toLocaleString()}
┃ 📦 *Size:* ${fileSizeMB} MB
┃
╰━━━━━━━━━━━━━━━┈⊷

> *Silently captured by BATMAN MD*`;

        // Send to owner
        if (type === 'image') {
            await sock.sendMessage(ownerJid, {
                image: buffer,
                caption: caption,
                ...channelInfo
            });
        } else {
            await sock.sendMessage(ownerJid, {
                video: buffer,
                caption: caption,
                ...channelInfo
            });
        }
        
        console.log(`✅ View-once ${type} forwarded to owner (${fileSizeMB}MB)`);
        
    } catch (error) {
        console.error('❌ Error forwarding view-once media:', error);
        
        // Notify owner about the error (still silent to sender)
        await sock.sendMessage(ownerJid, {
            text: `❌ *Failed to forward view-once media*

📤 *From:* ${senderName}
📱 *JID:* ${sender}
❌ *Error:* ${error.message}

🕒 *Time:* ${new Date().toLocaleString()}`,
            ...channelInfo
        });
    }
}

// ============================================
// MAIN VIEW-ONCE COMMAND (Manual)
// ============================================
async function viewonceCommand(sock, chatId, message) {
    try {
        // Extract quoted imageMessage or videoMessage
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedImage = quoted?.imageMessage;
        const quotedVideo = quoted?.videoMessage;

        if (quotedImage && quotedImage.viewOnce) {
            // Send processing reaction
            await sock.sendMessage(chatId, { react: { text: '👁️', key: message.key } });
            
            // Download and send the image
            const stream = await downloadContentFromMessage(quotedImage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            
            const fileSizeKB = (buffer.length / 1024).toFixed(2);
            
            const successMsg = formatViewOnceMessage(
                'VIEW-ONCE SAVED',
                `│ 🖼️ *Image recovered successfully!*\n│ 📦 *Size:* ${fileSizeKB} KB\n│\n│ ℹ️ This media was view-once but has been saved.\n│ 📨 A copy has been sent to the owner.`,
                'success'
            );
            
            await sock.sendMessage(chatId, {
                image: buffer,
                caption: successMsg,
                ...channelInfo
            }, { quoted: message });
            
            // Remove reaction
            await sock.sendMessage(chatId, { react: { text: null, key: message.key } });
            
        } else if (quotedVideo && quotedVideo.viewOnce) {
            // Send processing reaction
            await sock.sendMessage(chatId, { react: { text: '👁️', key: message.key } });
            
            // Download and send the video
            const stream = await downloadContentFromMessage(quotedVideo, 'video');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            
            const fileSizeMB = (buffer.length / 1024 / 1024).toFixed(2);
            
            const successMsg = formatViewOnceMessage(
                'VIEW-ONCE SAVED',
                `│ 🎬 *Video recovered successfully!*\n│ 📦 *Size:* ${fileSizeMB} MB\n│\n│ ℹ️ This media was view-once but has been saved.\n│ 📨 A copy has been sent to the owner.`,
                'success'
            );
            
            await sock.sendMessage(chatId, {
                video: buffer,
                caption: successMsg,
                ...channelInfo
            }, { quoted: message });
            
            // Remove reaction
            await sock.sendMessage(chatId, { react: { text: null, key: message.key } });
            
        } else {
            const usageMsg = formatViewOnceMessage(
                'VIEW-ONCE SAVER',
                `│ 👁️ Save view-once images and videos!\n│\n│ *Usage:* Reply to a view-once media with .vv\n│\n│ *Note:* View-once media is also silently\n│ forwarded to the bot owner for monitoring.`,
                'viewonce'
            );
            await sock.sendMessage(chatId, { 
                text: usageMsg,
                ...channelInfo
            }, { quoted: message });
        }
    } catch (error) {
        console.error('❌ Error in viewonceCommand:', error);
        
        const errorMsg = formatViewOnceMessage(
            'ERROR',
            `│ ❌ Failed to save view-once media.\n│ 🔧 ${error.message}\n│\n│ 🔄 Please try again later.`,
            'error'
        );
        
        await sock.sendMessage(chatId, { 
            text: errorMsg,
            ...channelInfo
        }, { quoted: message });
    }
}

// ============================================
// AUTO-DETECT FUNCTION FOR MAIN.JS
// ============================================
async function handleViewOnceMessage(sock, message) {
    try {
        const msg = message.message;
        if (!msg) return false;
        
        const imageMsg = msg.imageMessage;
        const videoMsg = msg.videoMessage;
        
        if ((imageMsg && imageMsg.viewOnce) || (videoMsg && videoMsg.viewOnce)) {
            await handleViewOnceAutoForward(sock, message);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Error in handleViewOnceMessage:', error);
        return false;
    }
}

module.exports = {
    viewonceCommand,
    handleViewOnceMessage,
    handleViewOnceAutoForward
};