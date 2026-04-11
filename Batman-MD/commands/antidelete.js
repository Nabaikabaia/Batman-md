const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { writeFile } = require('fs/promises');

// ============================================
// ENHANCEMENT: Stylish console header
// ============================================
console.log(`
╔═══════════════════════════════════╗
║    『 🔰 ANTIDELETE MODULE 』     ║
║    ▶ Status: Initializing...      ║
║    ▶ Version: 2.0.0               ║
║    ▶ By: Batman MD                ║
╚═══════════════════════════════════╝
`);

const messageStore = new Map();
const CONFIG_PATH = path.join(__dirname, '../data/antidelete.json');
const TEMP_MEDIA_DIR = path.join(__dirname, '../tmp');

// Ensure tmp dir exists
if (!fs.existsSync(TEMP_MEDIA_DIR)) {
    fs.mkdirSync(TEMP_MEDIA_DIR, { recursive: true });
    console.log('📁 Created temp directory:', TEMP_MEDIA_DIR);
}

// ============================================
// ENHANCEMENT: Stats tracking
// ============================================
const stats = {
    messagesStored: 0,
    viewOnceCaptured: 0,
    deletionsCaught: 0,
    mediaSaved: 0,
    startTime: Date.now()
};

// Function to get folder size in MB
const getFolderSizeInMB = (folderPath) => {
    try {
        const files = fs.readdirSync(folderPath);
        let totalSize = 0;

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            if (fs.statSync(filePath).isFile()) {
                totalSize += fs.statSync(filePath).size;
            }
        }

        return totalSize / (1024 * 1024); // Convert bytes to MB
    } catch (err) {
        console.error('Error getting folder size:', err);
        return 0;
    }
};

// Function to clean temp folder if size exceeds 10MB
const cleanTempFolderIfLarge = () => {
    try {
        const sizeMB = getFolderSizeInMB(TEMP_MEDIA_DIR);
        
        if (sizeMB > 200) {
            const files = fs.readdirSync(TEMP_MEDIA_DIR);
            let deletedCount = 0;
            for (const file of files) {
                const filePath = path.join(TEMP_MEDIA_DIR, file);
                fs.unlinkSync(filePath);
                deletedCount++;
            }
            console.log(`🧹 Cleaned ${deletedCount} temp files (${sizeMB.toFixed(2)}MB → 0MB)`);
        }
    } catch (err) {
        console.error('Temp cleanup error:', err);
    }
};

// Start periodic cleanup check every 1 minute
setInterval(cleanTempFolderIfLarge, 60 * 1000);

// Load config
function loadAntideleteConfig() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) return { enabled: false };
        return JSON.parse(fs.readFileSync(CONFIG_PATH));
    } catch {
        return { enabled: false };
    }
}

// Save config
function saveAntideleteConfig(config) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch (err) {
        console.error('Config save error:', err);
    }
}

const isOwnerOrSudo = require('../lib/isOwner');

// ============================================
// ENHANCEMENT: Get uptime
// ============================================
function getUptime() {
    const uptimeSeconds = Math.floor((Date.now() - stats.startTime) / 1000);
    
    const days = Math.floor(uptimeSeconds / (3600 * 24));
    const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

// Command Handler
async function handleAntideleteCommand(sock, chatId, message, match) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
    
    if (!message.key.fromMe && !isOwner) {
        // ENHANCEMENT: Stylish owner-only message
        return sock.sendMessage(chatId, { 
            text: `*『 🔒 OWNER ONLY 』*
╭─────────⟢
│ ❌ This command is restricted
│ 👑 to bot owners only!
╰─────────⟢

> © ʙᴀᴛᴍᴀɴ ᴍᴅ`
        }, { quoted: message });
    }

    const config = loadAntideleteConfig();

    if (!match) {
        // ENHANCEMENT: Enhanced status display with stats
        const folderSize = getFolderSizeInMB(TEMP_MEDIA_DIR).toFixed(2);
        const statusMessage = `*『 🛡️ ANTIDELETE 』*
╭─────────⟢
│ 📊 *Status:* ${config.enabled ? '✅ ENABLED' : '❌ DISABLED'}
│ 📁 *Temp Size:* ${folderSize}MB
│ 📦 *Stored:* ${stats.messagesStored} msgs
│ 🎯 *ViewOnce:* ${stats.viewOnceCaptured}
│ 🗑️ *Deletions:* ${stats.deletionsCaught}
│ ⏱️ *Uptime:* ${getUptime()}
╰─────────⟢

*Usage:*
• *.antidelete on*  - Enable
• *.antidelete off* - Disable
• *.antidelete*     - Show this menu

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ`;
        
        return sock.sendMessage(chatId, {
            text: statusMessage
        }, {quoted: message});
    }

    if (match === 'on') {
        config.enabled = true;
        saveAntideleteConfig(config);
        
        // ENHANCEMENT: Stylish enable message
        return sock.sendMessage(chatId, { 
            text: `*『 ✅ ANTIDELETE ENABLED 』*
╭─────────⟢
│ 🔰 Anti-delete is now ACTIVE
│ 🛡️ All deleted messages will
│    be forwarded to owner
╰─────────⟢

> © ʙᴀᴛᴍᴀɴ ᴍᴅ`
        }, {quoted:message});
        
    } else if (match === 'off') {
        config.enabled = false;
        saveAntideleteConfig(config);
        
        // ENHANCEMENT: Stylish disable message
        return sock.sendMessage(chatId, { 
            text: `*『 ❌ ANTIDELETE DISABLED 』*
╭─────────⟢
│ 🔰 Anti-delete is now INACTIVE
│ 🛡️ No messages will be tracked
╰─────────⟢

> © ʙᴀᴛᴍᴀɴ ᴍᴅ`
        }, {quoted:message});
        
    } else {
        // ENHANCEMENT: Stylish invalid command message
        return sock.sendMessage(chatId, { 
            text: `*『 ⚠️ INVALID COMMAND 』*
╭─────────⟢
│ ❌ Unknown option: "${match}"
│ 📝 Use *.antidelete* for help
╰─────────⟢

> © ʙᴀᴛᴍᴀɴ ᴍᴅ`
        }, {quoted:message});
    }
}

// Store incoming messages (also handles anti-view-once by forwarding immediately)
async function storeMessage(sock, message) {
    try {
        const config = loadAntideleteConfig();
        if (!config.enabled) return; // Don't store if antidelete is disabled

        if (!message.key?.id) return;

        const messageId = message.key.id;
        let content = '';
        let mediaType = '';
        let mediaPath = '';
        let isViewOnce = false;

        const sender = message.key.participant || message.key.remoteJid;

        // Detect content (including view-once wrappers)
        const viewOnceContainer = message.message?.viewOnceMessageV2?.message || message.message?.viewOnceMessage?.message;
        if (viewOnceContainer) {
            // unwrap view-once content
            if (viewOnceContainer.imageMessage) {
                mediaType = 'image';
                content = viewOnceContainer.imageMessage.caption || '';
                const buffer = await downloadContentFromMessage(viewOnceContainer.imageMessage, 'image');
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.jpg`);
                await writeFile(mediaPath, buffer);
                isViewOnce = true;
                stats.mediaSaved++;
            } else if (viewOnceContainer.videoMessage) {
                mediaType = 'video';
                content = viewOnceContainer.videoMessage.caption || '';
                const buffer = await downloadContentFromMessage(viewOnceContainer.videoMessage, 'video');
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.mp4`);
                await writeFile(mediaPath, buffer);
                isViewOnce = true;
                stats.mediaSaved++;
            }
        } else if (message.message?.conversation) {
            content = message.message.conversation;
        } else if (message.message?.extendedTextMessage?.text) {
            content = message.message.extendedTextMessage.text;
        } else if (message.message?.imageMessage) {
            mediaType = 'image';
            content = message.message.imageMessage.caption || '';
            const buffer = await downloadContentFromMessage(message.message.imageMessage, 'image');
            mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.jpg`);
            await writeFile(mediaPath, buffer);
            stats.mediaSaved++;
        } else if (message.message?.stickerMessage) {
            mediaType = 'sticker';
            const buffer = await downloadContentFromMessage(message.message.stickerMessage, 'sticker');
            mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.webp`);
            await writeFile(mediaPath, buffer);
            stats.mediaSaved++;
        } else if (message.message?.videoMessage) {
            mediaType = 'video';
            content = message.message.videoMessage.caption || '';
            const buffer = await downloadContentFromMessage(message.message.videoMessage, 'video');
            mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.mp4`);
            await writeFile(mediaPath, buffer);
            stats.mediaSaved++;
        } else if (message.message?.audioMessage) {
            mediaType = 'audio';
            const mime = message.message.audioMessage.mimetype || '';
            const ext = mime.includes('mpeg') ? 'mp3' : (mime.includes('ogg') ? 'ogg' : 'mp3');
            const buffer = await downloadContentFromMessage(message.message.audioMessage, 'audio');
            mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.${ext}`);
            await writeFile(mediaPath, buffer);
            stats.mediaSaved++;
        }

        messageStore.set(messageId, {
            content,
            mediaType,
            mediaPath,
            sender,
            group: message.key.remoteJid.endsWith('@g.us') ? message.key.remoteJid : null,
            timestamp: new Date().toISOString()
        });
        
        stats.messagesStored++;

        // Anti-ViewOnce: forward immediately to owner if captured
        if (isViewOnce && mediaType && fs.existsSync(mediaPath)) {
            try {
                const ownerNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                const senderName = sender.split('@')[0];
                
                // ENHANCEMENT: Stylish view-once capture notification
                const captureMsg = `*『 👁️ VIEW-ONCE CAPTURED 』*
╭─────────⟢
│ 📸 *Type:* ${mediaType}
│ 👤 *From:* @${senderName}
│ ⏱️ *Time:* ${new Date().toLocaleTimeString()}
╰─────────⟢

> 🔰 Forwarded by Batman MD`;
                
                await sock.sendMessage(ownerNumber, {
                    text: captureMsg,
                    mentions: [sender]
                });
                
                const mediaOptions = {
                    caption: `*Captured ${mediaType}*`,
                    mentions: [sender]
                };
                
                if (mediaType === 'image') {
                    await sock.sendMessage(ownerNumber, { image: { url: mediaPath }, ...mediaOptions });
                } else if (mediaType === 'video') {
                    await sock.sendMessage(ownerNumber, { video: { url: mediaPath }, ...mediaOptions });
                }
                
                stats.viewOnceCaptured++;
                
                // Cleanup immediately for view-once forward
                try { fs.unlinkSync(mediaPath); } catch {}
            } catch (e) {
                // ignore
            }
        }

    } catch (err) {
        console.error('storeMessage error:', err);
    }
}

// Handle message deletion
async function handleMessageRevocation(sock, revocationMessage) {
    try {
        const config = loadAntideleteConfig();
        if (!config.enabled) return;

        const messageId = revocationMessage.message.protocolMessage.key.id;
        const deletedBy = revocationMessage.participant || revocationMessage.key.participant || revocationMessage.key.remoteJid;
        const ownerNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        if (deletedBy.includes(sock.user.id) || deletedBy === ownerNumber) return;

        const original = messageStore.get(messageId);
        if (!original) return;

        const sender = original.sender;
        const senderName = sender.split('@')[0];
        const groupName = original.group ? (await sock.groupMetadata(original.group)).subject : '';

        const time = new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Kolkata',
            hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric'
        });

        // ENHANCEMENT: Stylish deletion report
        let text = `*『 🗑️ DELETED MESSAGE REPORT 』*
╭─────────⟢
│ 🔰 *ID:* ${messageId.substring(0, 8)}...
│ 👤 *Sender:* @${senderName}
│ 🚫 *Deleted by:* @${deletedBy.split('@')[0]}
│ 📱 *Number:* ${sender}
│ 🕒 *Time:* ${time}
`;

        if (groupName) text += `│ 👥 *Group:* ${groupName}\n`;
        text += `╰─────────⟢\n`;

        if (original.content) {
            text += `\n*💬 Deleted Message:*\n\`\`\`${original.content}\`\`\``;
        }

        await sock.sendMessage(ownerNumber, {
            text,
            mentions: [deletedBy, sender]
        });

        stats.deletionsCaught++;

        // Media sending
        if (original.mediaType && fs.existsSync(original.mediaPath)) {
            const mediaOptions = {
                caption: `*Deleted ${original.mediaType}*\nFrom: @${senderName}`,
                mentions: [sender]
            };

            try {
                switch (original.mediaType) {
                    case 'image':
                        await sock.sendMessage(ownerNumber, {
                            image: { url: original.mediaPath },
                            ...mediaOptions
                        });
                        break;
                    case 'sticker':
                        await sock.sendMessage(ownerNumber, {
                            sticker: { url: original.mediaPath },
                            ...mediaOptions
                        });
                        break;
                    case 'video':
                        await sock.sendMessage(ownerNumber, {
                            video: { url: original.mediaPath },
                            ...mediaOptions
                        });
                        break;
                    case 'audio':
                        await sock.sendMessage(ownerNumber, {
                            audio: { url: original.mediaPath },
                            mimetype: 'audio/mpeg',
                            ptt: false,
                            ...mediaOptions
                        });
                        break;
                }
            } catch (err) {
                await sock.sendMessage(ownerNumber, {
                    text: `⚠️ Error sending media: ${err.message}`
                });
            }

            // Cleanup
            try {
                fs.unlinkSync(original.mediaPath);
            } catch (err) {
                console.error('Media cleanup error:', err);
            }
        }

        messageStore.delete(messageId);

    } catch (err) {
        console.error('handleMessageRevocation error:', err);
    }
}

// ============================================
// ENHANCEMENT: Stats display function
// ============================================
function getStats() {
    return {
        ...stats,
        folderSize: getFolderSizeInMB(TEMP_MEDIA_DIR).toFixed(2),
        storedCount: messageStore.size,
        uptime: getUptime()
    };
}

// Log when module loads
console.log(`
╔═══════════════════════════════════╗
║    『 🔰 ANTIDELETE READY 』      ║
╠═══════════════════════════════════╣
║ 📁 Temp Folder: ${TEMP_MEDIA_DIR}
║ 📊 Max Size: 200MB auto-clean
║ 🛡️ Status: Active
╚═══════════════════════════════════╝
`);

module.exports = {
    handleAntideleteCommand,
    handleMessageRevocation,
    storeMessage,
    getStats // ENHANCEMENT: Export stats function
};