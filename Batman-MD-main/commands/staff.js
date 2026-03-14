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
function formatStaffMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        admin: '👑',
        group: '👥',
        staff: '🛡️'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

async function staffCommand(sock, chatId, msg) {
    try {
        // Get group metadata
        const groupMetadata = await sock.groupMetadata(chatId);
        
        // Get group profile picture
        let pp;
        try {
            pp = await sock.profilePictureUrl(chatId, 'image');
        } catch {
            pp = 'https://i.imgur.com/2wzGhpF.jpeg'; // Default image
        }

        // Get admins from participants
        const participants = groupMetadata.participants;
        const groupAdmins = participants.filter(p => p.admin);
        
        // ENHANCEMENT: Stylish admin list formatting
        const listAdmin = groupAdmins.map((v, i) => `│ ♧ @${v.id.split('@')[0]}`).join('\n');
        
        // Get group owner
        const owner = groupMetadata.owner || groupAdmins.find(p => p.admin === 'superadmin')?.id || chatId.split('-')[0] + '@s.whatsapp.net';

        // ENHANCEMENT: Stylish staff text
        const text = `*『 🛡️ GROUP ADMINS 』*
╭─────────⟢
│ 👥 *Group:* ${groupMetadata.subject}
│ 👑 *Owner:* @${owner.split('@')[0]}
│ 📊 *Total Admins:* ${groupAdmins.length}
│
│ *Admin List:*
${listAdmin || '│ ♧ No admins found'}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;

        // Send the message with image, newsletter, and mentions
        await sock.sendMessage(chatId, {
            image: { url: pp },
            caption: text,
            mentions: [...groupAdmins.map(v => v.id), owner],
            ...channelInfo
        });

    } catch (error) {
        console.error('Error in staff command:', error);
        
        // ENHANCEMENT: Stylish error message
        const errorMsg = formatStaffMessage(
            'ERROR',
            `│ ❌ Failed to get admin list!\n│ 🔧 ${error.message}`,
            'error'
        );
        
        await sock.sendMessage(chatId, { 
            text: errorMsg,
            ...channelInfo
        });
    }
}

module.exports = staffCommand;