const fs = require('fs');
const isAdmin = require('../lib/isAdmin');
const { isSudo } = require('../lib/index');

// ============================================
// ENHANCEMENT: Newsletter channel info with correct JID
// ============================================
const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363367299421766@newsletter',
            newsletterName: 'BATMAN MD',
            serverMessageId: -1
        }
    }
};

// ============================================
// ENHANCEMENT: Helper function for stylish messages
// ============================================
function formatBanMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        ban: '🔨',
        admin: '👑',
        bot: '🤖'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

async function banCommand(sock, chatId, message) {
    // Restrict in groups to admins; in private to owner/sudo
    const isGroup = chatId.endsWith('@g.us');
    if (isGroup) {
        const senderId = message.key.participant || message.key.remoteJid;
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
        
        if (!isBotAdmin) {
            // Bot admin required message
            const botAdminMsg = formatBanMessage(
                'BOT NOT ADMIN',
                `│ 🤖 Please make the bot an admin\n│ 🔨 to use the ban command`,
                'bot'
            );
            await sock.sendMessage(chatId, { 
                text: botAdminMsg, 
                ...channelInfo 
            }, { quoted: message });
            return;
        }
        
        if (!isSenderAdmin && !message.key.fromMe) {
            // Admin only message
            const adminOnlyMsg = formatBanMessage(
                'ADMIN ONLY',
                `│ 👑 Only group administrators\n│ 🔨 can use the ban command`,
                'admin'
            );
            await sock.sendMessage(chatId, { 
                text: adminOnlyMsg, 
                ...channelInfo 
            }, { quoted: message });
            return;
        }
    } else {
        const senderId = message.key.participant || message.key.remoteJid;
        const senderIsSudo = await isSudo(senderId);
        
        if (!message.key.fromMe && !senderIsSudo) {
            // Owner/sudo only message
            const ownerOnlyMsg = formatBanMessage(
                'OWNER ONLY',
                `│ 👑 Only owner or sudo users\n│ 🔨 can use ban in private chat`,
                'admin'
            );
            await sock.sendMessage(chatId, { 
                text: ownerOnlyMsg, 
                ...channelInfo 
            }, { quoted: message });
            return;
        }
    }
    
    let userToBan;
    
    // Check for mentioned users
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToBan = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    // Check for replied message
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToBan = message.message.extendedTextMessage.contextInfo.participant;
    }
    
    if (!userToBan) {
        // Missing user message
        const missingMsg = formatBanMessage(
            'USER REQUIRED',
            `│ ❌ Please mention the user or\n│ 🔨 reply to their message to ban!\n│\n│ *Usage:*\n│ ♧ .ban @user\n│ ♧ Reply to message + .ban`,
            'warning'
        );
        await sock.sendMessage(chatId, { 
            text: missingMsg, 
            ...channelInfo 
        });
        return;
    }

    // Prevent banning the bot itself
    try {
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        if (userToBan === botId || userToBan === botId.replace('@s.whatsapp.net', '@lid')) {
            // Cannot ban bot message
            const cantBanMsg = formatBanMessage(
                'CANNOT BAN BOT',
                `│ 🤖 You cannot ban the bot account!\n│ 🔨 Please select a different user`,
                'error'
            );
            await sock.sendMessage(chatId, { 
                text: cantBanMsg, 
                ...channelInfo 
            }, { quoted: message });
            return;
        }
    } catch {}

    try {
        // Add user to banned list
        const bannedUsers = JSON.parse(fs.readFileSync('./data/banned.json'));
        
        if (!bannedUsers.includes(userToBan)) {
            bannedUsers.push(userToBan);
            fs.writeFileSync('./data/banned.json', JSON.stringify(bannedUsers, null, 2));
            
            // Ban success message
            const successMsg = formatBanMessage(
                'BAN SUCCESSFUL',
                `│ 🔨 User: @${userToBan.split('@')[0]}\n│ ✅ Has been banned successfully!\n│ 📝 Added to banned list`,
                'ban'
            );
            
            await sock.sendMessage(chatId, { 
                text: successMsg,
                mentions: [userToBan],
                ...channelInfo 
            }, { quoted: message });
            
        } else {
            // Already banned message
            const alreadyMsg = formatBanMessage(
                'ALREADY BANNED',
                `│ ⚠️ @${userToBan.split('@')[0]}\n│ 🔨 Is already in the banned list!`,
                'warning'
            );
            
            await sock.sendMessage(chatId, { 
                text: alreadyMsg,
                mentions: [userToBan],
                ...channelInfo 
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in ban command:', error);
        
        // Error message
        const errorMsg = formatBanMessage(
            'SYSTEM ERROR',
            `│ ❌ Failed to ban user!\n│ 🔧 Error: ${error.message || 'Unknown'}`,
            'error'
        );
        
        await sock.sendMessage(chatId, { 
            text: errorMsg, 
            ...channelInfo 
        }, { quoted: message });
    }
}

module.exports = banCommand;