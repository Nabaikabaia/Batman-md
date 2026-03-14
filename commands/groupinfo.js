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

async function groupInfoCommand(sock, chatId, msg) {
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
        const listAdmin = groupAdmins.map((v, i) => `│ ♧ @${v.id.split('@')[0]}`).join('\n');
        
        // Get group owner
        const owner = groupMetadata.owner || groupAdmins.find(p => p.admin === 'superadmin')?.id || chatId.split('-')[0] + '@s.whatsapp.net';

        // ENHANCEMENT: Stylish group info text
        const text = `*『 👥 GROUP INFORMATION 』*
╭─────────⟢
│ *🆔 ID:*
│ ♧ ${groupMetadata.id}
│
│ *🔖 NAME:* 
│ ♧ ${groupMetadata.subject}
│
│ *👥 MEMBERS:*
│ ♧ ${participants.length}
│
│ *👑 OWNER:*
│ ♧ @${owner.split('@')[0]}
│
│ *🛡️ ADMINS:*
${listAdmin || '│ ♧ No admins found'}
│
│ *📝 DESCRIPTION:*
│ ♧ ${groupMetadata.desc?.toString() || 'No description'}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;

        // Send the message with image and mentions
        await sock.sendMessage(chatId, {
            image: { url: pp },
            caption: text,
            mentions: [...groupAdmins.map(v => v.id), owner],
            ...channelInfo
        });

    } catch (error) {
        console.error('Error in groupinfo command:', error);
        
        // ENHANCEMENT: Stylish error message
        const errorMsg = `*『 ❌ ERROR 』*
╭─────────⟢
│ Failed to get group info!
│ 🔧 Error: ${error.message}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
        
        await sock.sendMessage(chatId, { 
            text: errorMsg,
            ...channelInfo
        });
    }
}

module.exports = groupInfoCommand;