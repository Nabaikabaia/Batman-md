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
function formatResetMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        link: '🔗',
        admin: '👑',
        bot: '🤖'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

async function resetlinkCommand(sock, chatId, senderId) {
    try {
        // Check if sender is admin
        const groupMetadata = await sock.groupMetadata(chatId);
        const isAdmin = groupMetadata.participants
            .filter(p => p.admin)
            .map(p => p.id)
            .includes(senderId);

        // Check if bot is admin
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmin = groupMetadata.participants
            .filter(p => p.admin)
            .map(p => p.id)
            .includes(botId);

        if (!isAdmin) {
            // ENHANCEMENT: Stylish admin only message
            const adminMsg = formatResetMessage(
                'ADMIN ONLY',
                `│ 👑 Only group administrators\n│ 🔗 can reset the group link.`,
                'admin'
            );
            await sock.sendMessage(chatId, { 
                text: adminMsg,
                ...channelInfo 
            });
            return;
        }

        if (!isBotAdmin) {
            // ENHANCEMENT: Stylish bot admin required message
            const botAdminMsg = formatResetMessage(
                'BOT NOT ADMIN',
                `│ 🤖 Bot must be an admin\n│ 🔗 to reset the group link.`,
                'bot'
            );
            await sock.sendMessage(chatId, { 
                text: botAdminMsg,
                ...channelInfo 
            });
            return;
        }

        // Reset the group link
        const newCode = await sock.groupRevokeInvite(chatId);
        
        // ENHANCEMENT: Stylish success message with new link
        const successMsg = formatResetMessage(
            'LINK RESET',
            `│ ✅ Group link has been\n│    successfully reset!\n│\n│ 📌 *New Link:*\n│ ♧ https://chat.whatsapp.com/${newCode}`,
            'success'
        );
        
        await sock.sendMessage(chatId, { 
            text: successMsg,
            ...channelInfo
        });

    } catch (error) {
        console.error('Error in resetlink command:', error);
        
        // ENHANCEMENT: Stylish error message
        const errorMsg = formatResetMessage(
            'RESET FAILED',
            `│ ❌ Failed to reset group link!\n│ 🔧 ${error.message}`,
            'error'
        );
        
        await sock.sendMessage(chatId, { 
            text: errorMsg,
            ...channelInfo 
        });
    }
}

module.exports = resetlinkCommand;