// commands/tempmail.js - Temporary Email Generator
const axios = require('axios');
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
function formatTempMailMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        email: '📧',
        inbox: '📥',
        generate: '🆕',
        refresh: '🔄',
        delete: '🗑️'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

// Store active sessions per user
const userSessions = new Map();

async function tempmailCommand(sock, chatId, message, args) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const subCommand = args[0]?.toLowerCase();
        const param = args[1];
        
        // ============================================
        // GENERATE NEW EMAIL
        // ============================================
        if (!subCommand || subCommand === 'generate' || subCommand === 'new' || subCommand === 'create') {
            await sock.sendMessage(chatId, { react: { text: '📧', key: message.key } });
            
            const generateMsg = formatTempMailMessage(
                'GENERATING',
                `│ 🔄 Creating temporary email...\n│ ⏳ Please wait.`,
                'generate'
            );
            await sock.sendMessage(chatId, { text: generateMsg, ...channelInfo }, { quoted: message });
            
            try {
                const response = await axios.get('https://apis.davidcyril.name.ng/endpoints/tools/temp-mail-generate', {
                    timeout: 10000
                });
                
                if (response.data && response.data.success) {
                    const email = response.data.email;
                    const sessionId = response.data.session_id;
                    const expiresAt = new Date(response.data.expires_at).toLocaleString();
                    
                    // Store session for this user
                    userSessions.set(senderId, {
                        email,
                        sessionId,
                        expiresAt: response.data.expires_at,
                        createdAt: Date.now()
                    });
                    
                    const successMsg = formatTempMailMessage(
                        'EMAIL GENERATED',
                        `│ 📧 *Email:* ${email}\n│ 🆔 *Session ID:* \`${sessionId}\`\n│ ⏰ *Expires:* ${expiresAt}\n│\n│ *Commands:*\n│ ♧ .tempmail inbox - Check messages\n│ ♧ .tempmail refresh - Refresh inbox\n│ ♧ .tempmail delete - Delete this email\n│\n│ ⚠️ *Note:* Save this session ID!`,
                        'success'
                    );
                    
                    await sock.sendMessage(chatId, { text: successMsg, ...channelInfo }, { quoted: message });
                    await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
                } else {
                    throw new Error('Failed to generate email');
                }
            } catch (error) {
                console.error('Generate error:', error);
                const errorMsg = formatTempMailMessage(
                    'GENERATION FAILED',
                    `│ ❌ Failed to create temporary email.\n│ 🔧 ${error.message}\n│\n│ 🔄 Please try again later.`,
                    'error'
                );
                await sock.sendMessage(chatId, { text: errorMsg, ...channelInfo }, { quoted: message });
                await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            }
            return;
        }
        
        // ============================================
        // CHECK INBOX
        // ============================================
        if (subCommand === 'inbox' || subCommand === 'check' || subCommand === 'messages') {
            // Get session from user storage or from param
            let sessionId;
            let email;
            
            if (param) {
                // User provided session ID
                sessionId = param;
                // Try to find email from stored sessions
                for (const [uid, session] of userSessions.entries()) {
                    if (session.sessionId === sessionId) {
                        email = session.email;
                        break;
                    }
                }
            } else {
                // Use current user's session
                const userSession = userSessions.get(senderId);
                if (!userSession) {
                    const noSessionMsg = formatTempMailMessage(
                        'NO SESSION',
                        `│ ❌ No active temporary email.\n│\n│ *Usage:*\n│ ♧ .tempmail generate - Create new email\n│ ♧ .tempmail inbox <session-id> - Check inbox`,
                        'error'
                    );
                    await sock.sendMessage(chatId, { text: noSessionMsg, ...channelInfo }, { quoted: message });
                    await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                    return;
                }
                sessionId = userSession.sessionId;
                email = userSession.email;
            }
            
            await sock.sendMessage(chatId, { react: { text: '📥', key: message.key } });
            
            const checkingMsg = formatTempMailMessage(
                'CHECKING INBOX',
                `│ 🔄 Fetching messages for ${email || sessionId}...\n│ ⏳ Please wait.`,
                'inbox'
            );
            await sock.sendMessage(chatId, { text: checkingMsg, ...channelInfo }, { quoted: message });
            
            try {
                const response = await axios.get(`https://apis.davidcyril.name.ng/temp-mail/inbox?id=${sessionId}`, {
                    timeout: 10000
                });
                
                if (response.data && response.data.success) {
                    const inboxCount = response.data.inbox_count || 0;
                    const messages = response.data.messages || [];
                    
                    if (inboxCount === 0 || messages.length === 0) {
                        const emptyMsg = formatTempMailMessage(
                            'INBOX EMPTY',
                            `│ 📧 *Email:* ${email || 'Unknown'}\n│ 📥 *Messages:* 0\n│\n│ 🔄 No messages yet.\n│\n│ 💡 Try again later or refresh.`,
                            'info'
                        );
                        await sock.sendMessage(chatId, { text: emptyMsg, ...channelInfo }, { quoted: message });
                    } else {
                        // Send inbox summary
                        const summaryMsg = formatTempMailMessage(
                            'INBOX SUMMARY',
                            `│ 📧 *Email:* ${email || 'Unknown'}\n│ 📥 *Messages:* ${inboxCount}\n│\n│ 📬 *New Messages:*\n${messages.slice(0, 5).map((msg, i) => `│ ${i+1}. 📧 *${msg.from || 'Unknown'}*\n│    📝 ${msg.subject || 'No subject'}`).join('\n│\n')}\n\n${inboxCount > 5 ? `│\n│ 📄 *+${inboxCount - 5} more messages*` : ''}`,
                            'inbox'
                        );
                        await sock.sendMessage(chatId, { text: summaryMsg, ...channelInfo }, { quoted: message });
                        
                        // Send each message individually for details
                        for (let i = 0; i < Math.min(messages.length, 5); i++) {
                            const msg = messages[i];
                            const detailMsg = formatTempMailMessage(
                                `MESSAGE ${i+1}`,
                                `│ 📧 *From:* ${msg.from || 'Unknown'}\n│ 📝 *Subject:* ${msg.subject || 'No subject'}\n│ 🕒 *Date:* ${msg.date || 'Unknown'}\n│\n│ 📄 *Content:*\n│ ${(msg.body || msg.text || 'No content').substring(0, 300)}${(msg.body || msg.text || '').length > 300 ? '...' : ''}`,
                                'info'
                            );
                            await sock.sendMessage(chatId, { text: detailMsg, ...channelInfo }, { quoted: message });
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    }
                    await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
                } else {
                    throw new Error('Failed to fetch inbox');
                }
            } catch (error) {
                console.error('Inbox error:', error);
                const errorMsg = formatTempMailMessage(
                    'INBOX FAILED',
                    `│ ❌ Failed to fetch messages.\n│ 🔧 ${error.message}\n│\n│ 🔄 Please check session ID or try again.`,
                    'error'
                );
                await sock.sendMessage(chatId, { text: errorMsg, ...channelInfo }, { quoted: message });
                await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            }
            return;
        }
        
        // ============================================
        // REFRESH INBOX (same as inbox but with refresh)
        // ============================================
        if (subCommand === 'refresh' || subCommand === 'reload') {
            const userSession = userSessions.get(senderId);
            if (!userSession) {
                const noSessionMsg = formatTempMailMessage(
                    'NO SESSION',
                    `│ ❌ No active temporary email.\n│\n│ *Usage:* .tempmail generate first`,
                    'error'
                );
                await sock.sendMessage(chatId, { text: noSessionMsg, ...channelInfo }, { quoted: message });
                return;
            }
            
            // Just call inbox with current session
            const newArgs = ['inbox', userSession.sessionId];
            await tempmailCommand(sock, chatId, message, newArgs);
            return;
        }
        
        // ============================================
        // DELETE/EXPIRE EMAIL
        // ============================================
        if (subCommand === 'delete' || subCommand === 'expire' || subCommand === 'remove') {
            const userSession = userSessions.get(senderId);
            if (!userSession) {
                const noSessionMsg = formatTempMailMessage(
                    'NO SESSION',
                    `│ ❌ No active temporary email to delete.`,
                    'error'
                );
                await sock.sendMessage(chatId, { text: noSessionMsg, ...channelInfo }, { quoted: message });
                return;
            }
            
            const email = userSession.email;
            userSessions.delete(senderId);
            
            const deleteMsg = formatTempMailMessage(
                'EMAIL DELETED',
                `│ 🗑️ Temporary email deleted.\n│ 📧 *Email:* ${email}\n│\n│ 💡 Use .tempmail generate to create a new one.`,
                'delete'
            );
            await sock.sendMessage(chatId, { text: deleteMsg, ...channelInfo }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '🗑️', key: message.key } });
            return;
        }
        
        // ============================================
        // SHOW USAGE
        // ============================================
        const usageMsg = `*『 📧 TEMPORARY EMAIL 』*
╭─────────⟢
│ 📧 Generate disposable emails instantly!
│
│ *Commands:*
│ ♧ .tempmail generate - Create new email
│ ♧ .tempmail inbox [session-id] - Check messages
│ ♧ .tempmail refresh - Refresh inbox
│ ♧ .tempmail delete - Delete current email
│
│ *Examples:*
│ ♧ .tempmail generate
│ ♧ .tempmail inbox
│ ♧ .tempmail inbox U2Vzc2lvbjr...
│
│ *Note:* Emails expire automatically after ~1 hour
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
        
        await sock.sendMessage(chatId, { text: usageMsg, ...channelInfo }, { quoted: message });
        
    } catch (error) {
        console.error('TempMail Command Error:', error);
        
        const errorMsg = formatTempMailMessage(
            'ERROR',
            `│ ❌ Failed to process request.\n│ 🔧 ${error.message}\n│\n│ 🔄 Please try again later.`,
            'error'
        );
        await sock.sendMessage(chatId, { text: errorMsg, ...channelInfo }, { quoted: message });
    }
}

// Clean up expired sessions every hour
setInterval(() => {
    const now = Date.now();
    for (const [userId, session] of userSessions.entries()) {
        if (now - session.createdAt > 3600000) { // 1 hour
            userSessions.delete(userId);
            console.log(`🗑️ Expired temp email session for ${userId}`);
        }
    }
}, 3600000);

module.exports = tempmailCommand;