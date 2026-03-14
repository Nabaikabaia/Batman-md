const isAdmin = require('../lib/isAdmin');

// ============================================
// ENHANCEMENT: Newsletter channel info with correct JID
// ============================================
const channelInfo = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363367299421766@newsletter',
            newsletterName: 'BATMAN MD',
            serverMessageId: 13
        }
    }
};

// ============================================
// ENHANCEMENT: Helper function for stylish messages
// ============================================
function formatTagallMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        tag: '🔊',
        admin: '👑',
        bot: '🤖',
        group: '👥'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

async function tagAllCommand(sock, chatId, senderId, message) {
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
        

        if (!isBotAdmin) {
            // ENHANCEMENT: Stylish bot admin required message
            const botAdminMsg = formatTagallMessage(
                'BOT NOT ADMIN',
                `│ 🤖 Please make the bot an admin\n│ 🔊 to use the tagall command.`,
                'bot'
            );
            await sock.sendMessage(chatId, { 
                text: botAdminMsg,
                ...channelInfo 
            }, { quoted: message });
            return;
        }

        if (!isSenderAdmin) {
            // ENHANCEMENT: Stylish admin only message
            const adminOnlyMsg = formatTagallMessage(
                'ADMIN ONLY',
                `│ 👑 Only group administrators\n│ 🔊 can use the tagall command.`,
                'admin'
            );
            await sock.sendMessage(chatId, { 
                text: adminOnlyMsg,
                ...channelInfo 
            }, { quoted: message });
            return;
        }

        // Get group metadata
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants;

        if (!participants || participants.length === 0) {
            // ENHANCEMENT: Stylish no participants message
            const noParticipantsMsg = formatTagallMessage(
                'NO PARTICIPANTS',
                `│ ❌ No participants found\n│    in the group.`,
                'error'
            );
            await sock.sendMessage(chatId, { 
                text: noParticipantsMsg,
                ...channelInfo 
            });
            return;
        }

        // ENHANCEMENT: Stylish tagall header
        let messageText = `*『 🔊 GROUP NOTIFICATION 』*
╭─────────⟢
│ 👥 *Total Members:* ${participants.length}
│ 👑 *Tagged by:* @${senderId.split('@')[0]}
│ 📅 *Date:* ${new Date().toLocaleString()}
│
│ *Tagged Members:*
`;

        // Add each member with bullet points
        participants.forEach(participant => {
            messageText += `│ ♧ @${participant.id.split('@')[0]}\n`;
        });

        messageText += `╰─────────⟢\n\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;

        // Send message with mentions and newsletter
        await sock.sendMessage(chatId, {
            text: messageText,
            mentions: participants.map(p => p.id),
            ...channelInfo
        });

    } catch (error) {
        console.error('Error in tagall command:', error);
        
        // ENHANCEMENT: Stylish error message
        const errorMsg = formatTagallMessage(
            'TAGALL FAILED',
            `│ ❌ Failed to tag all members.\n│ 🔧 ${error.message}`,
            'error'
        );
        
        await sock.sendMessage(chatId, { 
            text: errorMsg,
            ...channelInfo 
        });
    }
}

module.exports = tagAllCommand;