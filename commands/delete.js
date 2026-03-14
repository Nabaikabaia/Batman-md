const isAdmin = require('../lib/isAdmin');
const store = require('../lib/lightweight_store');

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
function formatDeleteMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        delete: '🗑️',
        admin: '👑',
        bot: '🤖'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

async function deleteCommand(sock, chatId, message, senderId) {
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isBotAdmin) {
            // ENHANCEMENT: Stylish bot admin required message
            const botAdminMsg = formatDeleteMessage(
                'BOT NOT ADMIN',
                `│ 🤖 I need to be an admin\n│ 🗑️ to delete messages.`,
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
            const adminOnlyMsg = formatDeleteMessage(
                'ADMIN ONLY',
                `│ 👑 Only group administrators\n│ 🗑️ can use the .delete command.`,
                'admin'
            );
            await sock.sendMessage(chatId, { 
                text: adminOnlyMsg, 
                ...channelInfo 
            }, { quoted: message });
            return;
        }

        // Determine target user and count
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const parts = text.trim().split(/\s+/);
        let countArg = null;
        
        // Check if a number is provided
        if (parts.length > 1) {
            const maybeNum = parseInt(parts[1], 10);
            if (!isNaN(maybeNum) && maybeNum > 0) {
                countArg = Math.min(maybeNum, 50);
            }
        }
        
        // Check if user is replying to a message
        const ctxInfo = message.message?.extendedTextMessage?.contextInfo || {};
        const repliedParticipant = ctxInfo.participant || null;
        const mentioned = Array.isArray(ctxInfo.mentionedJid) && ctxInfo.mentionedJid.length > 0 ? ctxInfo.mentionedJid[0] : null;
        
        // If no number provided but replying to a message, default to 1
        if (countArg === null && repliedParticipant) {
            countArg = 1;
        }
        // If no number provided and not replying/mentioning, show usage message
        else if (countArg === null && !repliedParticipant && !mentioned) {
            // ENHANCEMENT: Stylish usage message
            const usageMsg = formatDeleteMessage(
                'DELETE COMMAND',
                `│ ❌ Please specify number of messages\n│\n│ *Usage:*\n│ ♧ .del 5 - Delete last 5 msgs\n│ ♧ .del 3 @user - Delete @user's msgs\n│ ♧ .del 2 (reply) - Delete replied user's msgs`,
                'info'
            );
            await sock.sendMessage(chatId, { 
                text: usageMsg,
                ...channelInfo 
            }, { quoted: message });
            return;
        }
        // If no number provided but mentioning a user, default to 1
        else if (countArg === null && mentioned) {
            countArg = 1;
        }


        // Determine target user: replied > mentioned; if neither, delete last N messages from group
        let targetUser = null;
        let repliedMsgId = null;
        let deleteGroupMessages = false;
        
        if (repliedParticipant && ctxInfo.stanzaId) {
            targetUser = repliedParticipant;
            repliedMsgId = ctxInfo.stanzaId;
        } else if (mentioned) {
            targetUser = mentioned;
        } else {
            // No user mentioned or replied to - delete last N messages from group
            deleteGroupMessages = true;
        }

        // Gather last N messages from targetUser in this chat
        const chatMessages = Array.isArray(store.messages[chatId]) ? store.messages[chatId] : [];
        // Newest last; we traverse from end backwards
        const toDelete = [];
        const seenIds = new Set();

        if (deleteGroupMessages) {
            // Delete last N messages from group (any user)
            for (let i = chatMessages.length - 1; i >= 0 && toDelete.length < countArg; i--) {
                const m = chatMessages[i];
                if (!seenIds.has(m.key.id)) {
                    // skip protocol/system messages, bot's own messages, and the current command message
                    if (!m.message?.protocolMessage && 
                        !m.key.fromMe && 
                        m.key.id !== message.key.id) {
                        toDelete.push(m);
                        seenIds.add(m.key.id);
                    }
                }
            }
        } else {
            // Original logic for specific user
            // If replying, prioritize deleting the exact replied message first (counts toward N)
            if (repliedMsgId) {
                const repliedInStore = chatMessages.find(m => m.key.id === repliedMsgId && (m.key.participant || m.key.remoteJid) === targetUser);
                if (repliedInStore) {
                    toDelete.push(repliedInStore);
                    seenIds.add(repliedInStore.key.id);
                } else {
                    // If not found in store, still attempt delete directly
                    try {
                        await sock.sendMessage(chatId, {
                            delete: {
                                remoteJid: chatId,
                                fromMe: false,
                                id: repliedMsgId,
                                participant: repliedParticipant
                            }
                        });
                        // Count this as one deleted and reduce required count
                        countArg = Math.max(0, countArg - 1);
                    } catch {}
                }
            }
            for (let i = chatMessages.length - 1; i >= 0 && toDelete.length < countArg; i--) {
                const m = chatMessages[i];
                const participant = m.key.participant || m.key.remoteJid;
                if (participant === targetUser && !seenIds.has(m.key.id)) {
                    // skip protocol/system messages
                    if (!m.message?.protocolMessage) {
                        toDelete.push(m);
                        seenIds.add(m.key.id);
                    }
                }
            }
        }

        if (toDelete.length === 0) {
            // ENHANCEMENT: Stylish no messages found message
            const errorMsg = deleteGroupMessages 
                ? formatDeleteMessage(
                    'NO MESSAGES',
                    `│ 🗑️ No recent messages found\n│    in the group to delete.`,
                    'warning'
                  )
                : formatDeleteMessage(
                    'NO MESSAGES',
                    `│ 🗑️ No recent messages found\n│    for the target user.`,
                    'warning'
                  );
            
            await sock.sendMessage(chatId, { 
                text: errorMsg,
                ...channelInfo 
            }, { quoted: message });
            return;
        }

        // Delete sequentially with small delay
        for (const m of toDelete) {
            try {
                const msgParticipant = deleteGroupMessages 
                    ? (m.key.participant || m.key.remoteJid) 
                    : (m.key.participant || targetUser);
                await sock.sendMessage(chatId, {
                    delete: {
                        remoteJid: chatId,
                        fromMe: false,
                        id: m.key.id,
                        participant: msgParticipant
                    }
                });
                await new Promise(r => setTimeout(r, 300));
            } catch (e) {
                // continue
            }
        }
        
        // ENHANCEMENT: Stylish success message after deletion
        const successMsg = formatDeleteMessage(
            'DELETE COMPLETE',
            `│ 🗑️ Successfully deleted\n│ 📊 *Count:* ${toDelete.length} message(s)\n│ 👤 *Target:* ${deleteGroupMessages ? 'Group' : '@' + (targetUser?.split('@')[0] || 'user')}`,
            'success'
        );
        
        const mentions = deleteGroupMessages ? [] : [targetUser].filter(Boolean);
        await sock.sendMessage(chatId, { 
            text: successMsg,
            mentions: mentions,
            ...channelInfo 
        }, { quoted: message });

    } catch (err) {
        // ENHANCEMENT: Stylish error message
        const errorMsg = formatDeleteMessage(
            'DELETE FAILED',
            `│ ❌ Failed to delete messages.\n│ 🔧 Error: ${err.message || 'Unknown'}`,
            'error'
        );
        await sock.sendMessage(chatId, { 
            text: errorMsg,
            ...channelInfo 
        }, { quoted: message });
    }
}

module.exports = deleteCommand;