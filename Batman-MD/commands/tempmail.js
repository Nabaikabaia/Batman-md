// commands/tempmail.js - Fixed with working API
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
// BROWSER HEADERS
// ============================================
const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive'
};

// ============================================
// HELPER FUNCTION
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
        delete: '🗑️'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

// Store sessions per user
const userSessions = new Map();

// ============================================
// GENERATE TEMP EMAIL - USING 1SECMAIL (RELIABLE)
// ============================================
async function generateTempEmail() {
    try {
        // Use 1secmail API - very reliable
        const response = await axios.get('https://www.1secmail.com/api/v1/?action=genRandomMailbox', {
            headers: browserHeaders,
            timeout: 10000
        });
        
        if (response.data && Array.isArray(response.data) && response.data[0]) {
            const email = response.data[0];
            const login = email.split('@')[0];
            const domain = email.split('@')[1];
            
            return {
                success: true,
                email: email,
                login: login,
                domain: domain,
                sessionId: login,
                expiresAt: Date.now() + 3600000
            };
        }
        
        return { success: false, error: 'Failed to generate email' };
    } catch (err) {
        console.error('Generate error:', err.message);
        return { success: false, error: err.message };
    }
}

// ============================================
// CHECK INBOX - USING 1SECMAIL
// ============================================
async function checkInbox(email) {
    try {
        const [login, domain] = email.split('@');
        const response = await axios.get(
            `https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`,
            { headers: browserHeaders, timeout: 10000 }
        );
        
        return { success: true, messages: response.data || [] };
    } catch (err) {
        console.error('Inbox error:', err.message);
        return { success: false, error: err.message };
    }
}

// ============================================
// READ MESSAGE - USING 1SECMAIL
// ============================================
async function readMessage(email, messageId) {
    try {
        const [login, domain] = email.split('@');
        const response = await axios.get(
            `https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${messageId}`,
            { headers: browserHeaders, timeout: 10000 }
        );
        
        return response.data;
    } catch (err) {
        console.error('Read message error:', err.message);
        return null;
    }
}

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
            
            const result = await generateTempEmail();
            
            if (result.success && result.email) {
                userSessions.set(senderId, {
                    email: result.email,
                    login: result.login,
                    domain: result.domain,
                    sessionId: result.sessionId,
                    createdAt: Date.now()
                });
                
                const successMsg = formatTempMailMessage(
                    'EMAIL GENERATED',
                    `│ 📧 *Email:* ${result.email}\n│ 🆔 *ID:* \`${result.login}\`\n│ ⏰ *Expires:* 1 hour\n│\n│ *Commands:*\n│ ♧ .tempmail inbox - Check messages\n│ ♧ .tempmail refresh - Refresh inbox\n│ ♧ .tempmail delete - Delete this email\n│\n│ 💡 *Send a test email to:* ${result.email}`,
                    'success'
                );
                
                await sock.sendMessage(chatId, { text: successMsg, ...channelInfo }, { quoted: message });
                await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
            } else {
                throw new Error(result.error || 'Failed to generate email');
            }
            return;
        }
        
        // ============================================
        // CHECK INBOX
        // ============================================
        if (subCommand === 'inbox' || subCommand === 'check' || subCommand === 'messages') {
            let email;
            
            if (param && param.includes('@')) {
                email = param;
            } else {
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
                email = userSession.email;
            }
            
            await sock.sendMessage(chatId, { react: { text: '📥', key: message.key } });
            
            const checkingMsg = formatTempMailMessage(
                'CHECKING INBOX',
                `│ 🔄 Fetching messages for ${email}...`,
                'inbox'
            );
            await sock.sendMessage(chatId, { text: checkingMsg, ...channelInfo }, { quoted: message });
            
            const result = await checkInbox(email);
            
            if (result.success) {
                const messages = result.messages || [];
                
                if (messages.length === 0) {
                    const emptyMsg = formatTempMailMessage(
                        'INBOX EMPTY',
                        `│ 📧 *Email:* ${email}\n│ 📥 *Messages:* 0\n│\n│ 🔄 No messages yet.\n│\n│ 💡 Send a test email to this address!`,
                        'info'
                    );
                    await sock.sendMessage(chatId, { text: emptyMsg, ...channelInfo }, { quoted: message });
                } else {
                    const summaryMsg = formatTempMailMessage(
                        'INBOX SUMMARY',
                        `│ 📧 *Email:* ${email}\n│ 📥 *Messages:* ${messages.length}\n│\n${messages.slice(0, 5).map((msg, i) => `│ ${i+1}. 📧 *${msg.from || 'Unknown'}*\n│    📝 ${msg.subject || 'No subject'}`).join('\n│\n')}`,
                        'inbox'
                    );
                    await sock.sendMessage(chatId, { text: summaryMsg, ...channelInfo }, { quoted: message });
                    
                    // Send each message
                    for (let i = 0; i < Math.min(messages.length, 5); i++) {
                        const msg = messages[i];
                        const fullMsg = await readMessage(email, msg.id);
                        
                        const body = fullMsg?.textBody || fullMsg?.htmlBody || msg.body || 'No content';
                        const cleanBody = body.replace(/<[^>]*>/g, '').substring(0, 500);
                        
                        const detailMsg = formatTempMailMessage(
                            `MESSAGE ${i+1}`,
                            `│ 📧 *From:* ${msg.from || 'Unknown'}\n│ 📝 *Subject:* ${msg.subject || 'No subject'}\n│ 🕒 *Date:* ${msg.date || 'Unknown'}\n│\n│ 📄 *Content:*\n│ ${cleanBody}${cleanBody.length >= 500 ? '...' : ''}`,
                            'info'
                        );
                        await sock.sendMessage(chatId, { text: detailMsg, ...channelInfo }, { quoted: message });
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
                await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
            } else {
                throw new Error(result.error || 'Failed to fetch inbox');
            }
            return;
        }
        
        // ============================================
        // REFRESH INBOX
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
            
            const newArgs = ['inbox', userSession.email];
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
│ ♧ .tempmail inbox - Check messages
│ ♧ .tempmail refresh - Refresh inbox
│ ♧ .tempmail delete - Delete current email
│
│ *Examples:*
│ ♧ .tempmail generate
│ ♧ .tempmail inbox
│
│ *Note:* Emails expire after 1 hour
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
        
        await sock.sendMessage(chatId, { text: usageMsg, ...channelInfo }, { quoted: message });
        
    } catch (error) {
        console.error('TempMail Error:', error);
        
        const errorMsg = formatTempMailMessage(
            'ERROR',
            `│ ❌ Failed to process request.\n│ 🔧 ${error.message}\n│\n│ 🔄 Please try again later.`,
            'error'
        );
        await sock.sendMessage(chatId, { text: errorMsg, ...channelInfo }, { quoted: message });
    }
}

// Clean up expired sessions
setInterval(() => {
    const now = Date.now();
    for (const [userId, session] of userSessions.entries()) {
        if (now - session.createdAt > 3600000) {
            userSessions.delete(userId);
            console.log(`🗑️ Expired temp email for ${userId}`);
        }
    }
}, 3600000);

module.exports = tempmailCommand;