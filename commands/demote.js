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

// ============================================
// ENHANCEMENT: Helper function for stylish messages
// ============================================
function formatDemoteMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        demote: '⬇️',
        admin: '👑',
        bot: '🤖',
        group: '👥'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

async function demoteCommand(sock, chatId, mentionedJids, message) {
    try {
        // First check if it's a group
        if (!chatId.endsWith('@g.us')) {
            // ENHANCEMENT: Stylish group-only message
            const groupOnlyMsg = formatDemoteMessage(
                'GROUP ONLY',
                `│ 👥 This command can only be\n│    used in groups!`,
                'group'
            );
            await sock.sendMessage(chatId, { 
                text: groupOnlyMsg,
                ...channelInfo
            });
            return;
        }

        // Check admin status first, before any other operations
        try {
            const adminStatus = await isAdmin(sock, chatId, message.key.participant || message.key.remoteJid);
            
            if (!adminStatus.isBotAdmin) {
                // ENHANCEMENT: Stylish bot admin required message
                const botAdminMsg = formatDemoteMessage(
                    'BOT NOT ADMIN',
                    `│ 🤖 Please make the bot an admin\n│ ⬇️ first to use the demote command.`,
                    'bot'
                );
                await sock.sendMessage(chatId, { 
                    text: botAdminMsg,
                    ...channelInfo
                });
                return;
            }

            if (!adminStatus.isSenderAdmin) {
                // ENHANCEMENT: Stylish admin only message
                const adminOnlyMsg = formatDemoteMessage(
                    'ADMIN ONLY',
                    `│ 👑 Only group admins can use\n│ ⬇️ the demote command.`,
                    'admin'
                );
                await sock.sendMessage(chatId, { 
                    text: adminOnlyMsg,
                    ...channelInfo
                });
                return;
            }
        } catch (adminError) {
            console.error('Error checking admin status:', adminError);
            
            // ENHANCEMENT: Stylish error message
            const errorMsg = formatDemoteMessage(
                'ADMIN CHECK FAILED',
                `│ ❌ Please make sure the bot is\n│ 🤖 an admin of this group.`,
                'error'
            );
            await sock.sendMessage(chatId, { 
                text: errorMsg,
                ...channelInfo
            });
            return;
        }

        let userToDemote = [];
        
        // Check for mentioned users
        if (mentionedJids && mentionedJids.length > 0) {
            userToDemote = mentionedJids;
        }
        // Check for replied message
        else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToDemote = [message.message.extendedTextMessage.contextInfo.participant];
        }
        
        // If no user found through either method
        if (userToDemote.length === 0) {
            // ENHANCEMENT: Stylish missing user message
            const missingMsg = formatDemoteMessage(
                'USER REQUIRED',
                `│ ❌ Please mention the user or\n│ ⬇️ reply to their message to demote!\n│\n│ *Usage:*\n│ ♧ .demote @user\n│ ♧ Reply + .demote`,
                'warning'
            );
            await sock.sendMessage(chatId, { 
                text: missingMsg,
                ...channelInfo
            });
            return;
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        await sock.groupParticipantsUpdate(chatId, userToDemote, "demote");
        
        // Get usernames for each demoted user
        const usernames = await Promise.all(userToDemote.map(async jid => {
            return `@${jid.split('@')[0]}`;
        }));

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        // ENHANCEMENT: Stylish demotion success message
        const demotionSuccessMsg = formatDemoteMessage(
            'DEMOTION SUCCESSFUL',
            `│ 👤 *User${userToDemote.length > 1 ? 's' : ''}:*\n│ ${usernames.map(name => `♧ ${name}`).join('\n│ ')}\n│\n│ 👑 *Demoted By:* @${message.key.participant ? message.key.participant.split('@')[0] : message.key.remoteJid.split('@')[0]}\n│ 📅 *Date:* ${new Date().toLocaleString()}`,
            'demote'
        );
        
        await sock.sendMessage(chatId, { 
            text: demotionSuccessMsg,
            mentions: [...userToDemote, message.key.participant || message.key.remoteJid],
            ...channelInfo
        });
        
    } catch (error) {
        console.error('Error in demote command:', error);
        
        if (error.data === 429) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // ENHANCEMENT: Stylish rate limit message
            const rateLimitMsg = formatDemoteMessage(
                'RATE LIMIT',
                `│ ⏳ Rate limit reached.\n│ 🔄 Please try again in a few seconds.`,
                'warning'
            );
            
            try {
                await sock.sendMessage(chatId, { 
                    text: rateLimitMsg,
                    ...channelInfo
                });
            } catch (retryError) {
                console.error('Error sending retry message:', retryError);
            }
        } else {
            // ENHANCEMENT: Stylish error message
            const errorMsg = formatDemoteMessage(
                'DEMOTE FAILED',
                `│ ❌ Failed to demote user(s).\n│ 🤖 Make sure the bot is admin\n│    and has sufficient permissions.`,
                'error'
            );
            
            try {
                await sock.sendMessage(chatId, { 
                    text: errorMsg,
                    ...channelInfo
                });
            } catch (sendError) {
                console.error('Error sending error message:', sendError);
            }
        }
    }
}

// Function to handle automatic demotion detection
async function handleDemotionEvent(sock, groupId, participants, author) {
    try {
        // Safety check for participants
        if (!Array.isArray(participants) || participants.length === 0) {
            return;
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get usernames for demoted participants
        const demotedUsernames = await Promise.all(participants.map(async jid => {
            // Handle case where jid might be an object or not a string
            const jidString = typeof jid === 'string' ? jid : (jid.id || jid.toString());
            return `@${jidString.split('@')[0]}`;
        }));

        let demotedBy;
        let mentionList = participants.map(jid => {
            // Ensure all mentions are proper JID strings
            return typeof jid === 'string' ? jid : (jid.id || jid.toString());
        });

        if (author && author.length > 0) {
            // Ensure author has the correct format
            const authorJid = typeof author === 'string' ? author : (author.id || author.toString());
            demotedBy = `@${authorJid.split('@')[0]}`;
            mentionList.push(authorJid);
        } else {
            demotedBy = 'System';
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        // ENHANCEMENT: Stylish automatic demotion detection message
        const demotionEventMsg = formatDemoteMessage(
            'DEMOTION DETECTED',
            `│ 👤 *Demoted User${participants.length > 1 ? 's' : ''}:*\n│ ${demotedUsernames.map(name => `♧ ${name}`).join('\n│ ')}\n│\n│ 👑 *Demoted By:* ${demotedBy}\n│ 📅 *Date:* ${new Date().toLocaleString()}`,
            'demote'
        );
        
        await sock.sendMessage(groupId, {
            text: demotionEventMsg,
            mentions: mentionList,
            ...channelInfo
        });
        
    } catch (error) {
        console.error('Error handling demotion event:', error);
        if (error.data === 429) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

module.exports = { demoteCommand, handleDemotionEvent };