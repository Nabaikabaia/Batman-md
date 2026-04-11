const isAdmin = require('../lib/isAdmin');

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

async function muteCommand(sock, chatId, senderId, message, durationInMinutes) {
    
    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
    if (!isBotAdmin) {
        await sock.sendMessage(chatId, { 
            text: 'Please make the bot an admin first.', 
            ...channelInfo 
        }, { quoted: message });
        return;
    }

    if (!isSenderAdmin) {
        await sock.sendMessage(chatId, { 
            text: 'Only group admins can use the mute command.', 
            ...channelInfo 
        }, { quoted: message });
        return;
    }

    try {
        // Mute the group
        await sock.groupSettingUpdate(chatId, 'announcement');
        
        if (durationInMinutes !== undefined && durationInMinutes > 0) {
            const durationInMilliseconds = durationInMinutes * 60 * 1000;
            await sock.sendMessage(chatId, { 
                text: `The group has been muted for ${durationInMinutes} minutes.`, 
                ...channelInfo 
            }, { quoted: message });
            
            // Set timeout to unmute after duration
            setTimeout(async () => {
                try {
                    await sock.groupSettingUpdate(chatId, 'not_announcement');
                    await sock.sendMessage(chatId, { 
                        text: 'The group has been unmuted.',
                        ...channelInfo 
                    });
                } catch (unmuteError) {
                    console.error('Error unmuting group:', unmuteError);
                }
            }, durationInMilliseconds);
        } else {
            await sock.sendMessage(chatId, { 
                text: 'The group has been muted.', 
                ...channelInfo 
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error muting/unmuting the group:', error);
        await sock.sendMessage(chatId, { 
            text: 'An error occurred while muting/unmuting the group. Please try again.', 
            ...channelInfo 
        }, { quoted: message });
    }
}

module.exports = muteCommand;