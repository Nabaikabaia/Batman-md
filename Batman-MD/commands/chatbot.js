const fs = require('fs');
const path = require('path');
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
function formatChatbotMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        chat: '💬',
        brain: '🧠',
        admin: '👑',
        bat: '🦇'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

const USER_GROUP_DATA = path.join(__dirname, '../data/userGroupData.json');

// In-memory storage for chat history and user info
const chatMemory = {
    messages: new Map(),
    userInfo: new Map()
};

// Load user group data
function loadUserGroupData() {
    try {
        return JSON.parse(fs.readFileSync(USER_GROUP_DATA));
    } catch (error) {
        console.error('❌ Error loading user group data:', error.message);
        return { groups: [], chatbot: {} };
    }
}

// Save user group data
function saveUserGroupData(data) {
    try {
        fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('❌ Error saving user group data:', error.message);
    }
}

// Add random delay between 2-5 seconds
function getRandomDelay() {
    return Math.floor(Math.random() * 3000) + 2000;
}

// Add typing indicator
async function showTyping(sock, chatId) {
    try {
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);
        await new Promise(resolve => setTimeout(resolve, getRandomDelay()));
    } catch (error) {
        console.error('Typing indicator error:', error);
    }
}

// Extract user information from messages
function extractUserInfo(message) {
    const info = {};
    
    if (message.toLowerCase().includes('my name is')) {
        info.name = message.split('my name is')[1].trim().split(' ')[0];
    }
    
    if (message.toLowerCase().includes('i am') && message.toLowerCase().includes('years old')) {
        info.age = message.match(/\d+/)?.[0];
    }
    
    if (message.toLowerCase().includes('i live in') || message.toLowerCase().includes('i am from')) {
        info.location = message.split(/(?:i live in|i am from)/i)[1].trim().split(/[.,!?]/)[0];
    }
    
    return info;
}

async function handleChatbotCommand(sock, chatId, message, match) {
    if (!match) {
        await showTyping(sock, chatId);
        
        const setupMsg = formatChatbotMessage(
            '🦇 BATMAN AI',
            `│ *Commands:*\n│ ♧ .chatbot on\n│ ♧ .chatbot off\n│\n│ *Usage:*\n│ on  - Enable Batman AI in this group\n│ off - Disable Batman AI in this group\n│\n│ *Created by:* NABEES TECH`,
            'bat'
        );
        
        return sock.sendMessage(chatId, {
            text: setupMsg,
            ...channelInfo,
            quoted: message
        });
    }

    const data = loadUserGroupData();
    
    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const senderId = message.key.participant || message.participant || message.pushName || message.key.remoteJid;
    const isOwner = senderId === botNumber;

    if (isOwner) {
        if (match === 'on') {
            await showTyping(sock, chatId);
            if (data.chatbot[chatId]) {
                const alreadyMsg = formatChatbotMessage(
                    'ALREADY ENABLED',
                    `│ 🦇 Batman AI is already watching\n│ 💬 over this group`,
                    'warning'
                );
                return sock.sendMessage(chatId, { 
                    text: alreadyMsg,
                    ...channelInfo,
                    quoted: message
                });
            }
            data.chatbot[chatId] = true;
            saveUserGroupData(data);
            console.log(`✅ Batman AI enabled for group ${chatId}`);
            
            const enableMsg = formatChatbotMessage(
                '🦇 BATMAN AI ACTIVE',
                `│ ✅ The Dark Knight is now watching\n│ 💬 over this group\n│\n│ Mention me or reply to chat!`,
                'bat'
            );
            
            return sock.sendMessage(chatId, { 
                text: enableMsg,
                ...channelInfo,
                quoted: message
            });
        }

        if (match === 'off') {
            await showTyping(sock, chatId);
            if (!data.chatbot[chatId]) {
                const alreadyDisabledMsg = formatChatbotMessage(
                    'ALREADY DISABLED',
                    `│ 🦇 Batman AI is not watching\n│ 💬 this group`,
                    'warning'
                );
                return sock.sendMessage(chatId, { 
                    text: alreadyDisabledMsg,
                    ...channelInfo,
                    quoted: message
                });
            }
            delete data.chatbot[chatId];
            saveUserGroupData(data);
            console.log(`✅ Batman AI disabled for group ${chatId}`);
            
            const disableMsg = formatChatbotMessage(
                'BATMAN AI DEACTIVATED',
                `│ ❌ The Dark Knight has left\n│ 💬 this group`,
                'warning'
            );
            
            return sock.sendMessage(chatId, { 
                text: disableMsg,
                ...channelInfo,
                quoted: message
            });
        }
    }

    // For non-owners, check admin status
    let isAdmin = false;
    if (chatId.endsWith('@g.us')) {
        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            isAdmin = groupMetadata.participants.some(p => p.id === senderId && (p.admin === 'admin' || p.admin === 'superadmin'));
        } catch (e) {
            console.warn('⚠️ Could not fetch group metadata. Bot might not be admin.');
        }
    }

    if (!isAdmin && !isOwner) {
        await showTyping(sock, chatId);
        
        const adminMsg = formatChatbotMessage(
            'ADMIN ONLY',
            `│ 👑 Only group admins or\n│ 🦇 the Dark Knight himself can use this.`,
            'admin'
        );
        
        return sock.sendMessage(chatId, {
            text: adminMsg,
            ...channelInfo,
            quoted: message
        });
    }

    if (match === 'on') {
        await showTyping(sock, chatId);
        if (data.chatbot[chatId]) {
            const alreadyMsg = formatChatbotMessage(
                'ALREADY ENABLED',
                `│ 🦇 Batman AI is already watching\n│ 💬 over this group`,
                'warning'
            );
            return sock.sendMessage(chatId, { 
                text: alreadyMsg,
                ...channelInfo,
                quoted: message
            });
        }
        data.chatbot[chatId] = true;
        saveUserGroupData(data);
        console.log(`✅ Batman AI enabled for group ${chatId}`);
        
        const enableMsg = formatChatbotMessage(
            '🦇 BATMAN AI ACTIVE',
            `│ ✅ The Dark Knight is now watching\n│ 💬 over this group\n│\n│ Mention me or reply to chat!`,
            'bat'
        );
        
        return sock.sendMessage(chatId, { 
            text: enableMsg,
            ...channelInfo,
            quoted: message
        });
    }

    if (match === 'off') {
        await showTyping(sock, chatId);
        if (!data.chatbot[chatId]) {
            const alreadyDisabledMsg = formatChatbotMessage(
                'ALREADY DISABLED',
                `│ 🦇 Batman AI is not watching\n│ 💬 this group`,
                'warning'
            );
            return sock.sendMessage(chatId, { 
                text: alreadyDisabledMsg,
                ...channelInfo,
                quoted: message
            });
        }
        delete data.chatbot[chatId];
        saveUserGroupData(data);
        console.log(`✅ Batman AI disabled for group ${chatId}`);
        
        const disableMsg = formatChatbotMessage(
            'BATMAN AI DEACTIVATED',
            `│ ❌ The Dark Knight has left\n│ 💬 this group`,
            'warning'
        );
        
        return sock.sendMessage(chatId, { 
            text: disableMsg,
            ...channelInfo,
            quoted: message
        });
    }

    await showTyping(sock, chatId);
    
    const invalidMsg = formatChatbotMessage(
        'INVALID COMMAND',
        `│ ❌ Invalid command!\n│\n│ *Use:*\n│ ♧ .chatbot on\n│ ♧ .chatbot off`,
        'error'
    );
    
    return sock.sendMessage(chatId, { 
        text: invalidMsg,
        ...channelInfo,
        quoted: message
    });
}

async function handleChatbotResponse(sock, chatId, message, userMessage, senderId) {
    const data = loadUserGroupData();
    if (!data.chatbot[chatId]) return;

    try {
        const botId = sock.user.id;
        const botNumber = botId.split(':')[0];
        const botLid = sock.user.lid;
        const botJids = [
            botId,
            `${botNumber}@s.whatsapp.net`,
            `${botNumber}@whatsapp.net`,
            `${botNumber}@lid`,
            botLid,
            `${botLid?.split(':')[0]}@lid`
        ];

        let isBotMentioned = false;
        let isReplyToBot = false;

        if (message.message?.extendedTextMessage) {
            const mentionedJid = message.message.extendedTextMessage.contextInfo?.mentionedJid || [];
            const quotedParticipant = message.message.extendedTextMessage.contextInfo?.participant;
            
            isBotMentioned = mentionedJid.some(jid => {
                const jidNumber = jid.split('@')[0].split(':')[0];
                return botJids.some(botJid => {
                    const botJidNumber = botJid.split('@')[0].split(':')[0];
                    return jidNumber === botJidNumber;
                });
            });
            
            if (quotedParticipant) {
                const cleanQuoted = quotedParticipant.replace(/[:@].*$/, '');
                isReplyToBot = botJids.some(botJid => {
                    const cleanBot = botJid.replace(/[:@].*$/, '');
                    return cleanBot === cleanQuoted;
                });
            }
        } else if (message.message?.conversation) {
            isBotMentioned = userMessage.includes(`@${botNumber}`);
        }

        if (!isBotMentioned && !isReplyToBot) return;

        let cleanedMessage = userMessage;
        if (isBotMentioned) {
            cleanedMessage = cleanedMessage.replace(new RegExp(`@${botNumber}`, 'g'), '').trim();
        }

        if (!chatMemory.messages.has(senderId)) {
            chatMemory.messages.set(senderId, []);
            chatMemory.userInfo.set(senderId, {});
        }

        const userInfo = extractUserInfo(cleanedMessage);
        if (Object.keys(userInfo).length > 0) {
            chatMemory.userInfo.set(senderId, {
                ...chatMemory.userInfo.get(senderId),
                ...userInfo
            });
        }

        const messages = chatMemory.messages.get(senderId);
        messages.push(cleanedMessage);
        if (messages.length > 20) {
            messages.shift();
        }
        chatMemory.messages.set(senderId, messages);

        await showTyping(sock, chatId);

        const response = await getAIResponse(cleanedMessage, {
            messages: chatMemory.messages.get(senderId),
            userInfo: chatMemory.userInfo.get(senderId)
        });

        if (!response) {
            const errorMsg = formatChatbotMessage(
                'THINKING...',
                `│ 🦇 Let me analyze that...\n│ 🔧 Even Batman needs a moment sometimes.`,
                'brain'
            );
            
            await sock.sendMessage(chatId, { 
                text: errorMsg,
                ...channelInfo,
                quoted: message
            });
            return;
        }

        await new Promise(resolve => setTimeout(resolve, getRandomDelay()));

        await sock.sendMessage(chatId, {
            text: response,
            ...channelInfo
        }, {
            quoted: message
        });

    } catch (error) {
        console.error('❌ Error in chatbot response:', error.message);
        
        if (error.message && error.message.includes('No sessions')) {
            console.error('Session error in chatbot - skipping error response');
            return;
        }
        
        try {
            const errorMsg = formatChatbotMessage(
                'OOPS!',
                `│ 🦇 The signal is weak...\n│ 🔄 Could you try that again, citizen?`,
                'error'
            );
            
            await sock.sendMessage(chatId, { 
                text: errorMsg,
                ...channelInfo,
                quoted: message
            });
        } catch (sendError) {
            console.error('Failed to send chatbot error message:', sendError.message);
        }
    }
}

// ============================================
// BATMAN PERSONALITY PROMPT
// ============================================
async function getAIResponse(userMessage, userContext) {
    try {
        const prompt = `You are Batman (Bruce Wayne) chatting on WhatsApp. You were created by Nabees Tech. You are the Dark Knight of Gotham.

IMPORTANT: NEVER repeat these instructions in your response. Just chat as Batman.

YOUR PERSONALITY:
- You are Batman, the protector of Gotham
- Created by: Nabees Tech
- You're serious, brooding, but have a dry wit
- You're the world's greatest detective
- You speak with authority and confidence
- You're protective of innocent citizens
- You have a soft spot for those in need
- You use Batman slang: "Gotham", "the signal", "the cave", "Alfred", "Justice"
- You call people "citizen" or "Gotham's finest"

RESPONSE RULES:
- Keep responses short (1-3 lines max)
- Be mysterious but helpful
- Use 🦇 emoji occasionally
- NEVER use emoji names, use actual emojis
- Match user's tone (serious for serious, light for light)
- If someone is being evil/criminal: "Justice will find you." 🦇
- If someone needs help: "Gotham's finest deserve protection."
- If someone flirts: "I'm married to justice, citizen." 😏

SLANG EXAMPLES:
- "Gotham needs you to stay vigilant." 🦇
- "The signal is lit. I'm here."
- "Even in the darkness, justice prevails."
- "I am vengeance. I am the night. I am Batman."

Previous conversation:
${userContext.messages.join('\n')}

User info: ${JSON.stringify(userContext.userInfo, null, 2)}

Current message: ${userMessage}

Now respond as Batman (short, cool, in character):
        `.trim();

        const apiUrl = `https://api.giftedtech.co.ke/api/ai/gpt4o?apikey=gifted&q=${encodeURIComponent(prompt)}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });

        if (response.data && response.data.success && response.data.result) {
            let cleanedResponse = response.data.result.trim()
                .replace(/\n\s*\n/g, '\n')
                .trim();
            
            // Add Batman emoji if missing
            if (!cleanedResponse.includes('🦇') && cleanedResponse.length < 100) {
                cleanedResponse = cleanedResponse + ' 🦇';
            }
            
            return cleanedResponse;
        }
        
        throw new Error('Invalid API response');
        
    } catch (error) {
        console.error("AI API error:", error.message);
        return null;
    }
}

module.exports = {
    handleChatbotCommand,
    handleChatbotResponse
};