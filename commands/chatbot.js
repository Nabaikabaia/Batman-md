// commands/chatbot.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const settings = require('../settings');
const getMetaFakeVcard = require('../lib/fakevcard2');

// Headers from working request
const browserHeaders = {
    'Host': 'api.nabees.online',
    'sec-ch-ua': '"Not;A=Brand";v="8", "Chromium";v="150", "Google Chrome";v="150"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'save-data': 'on',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'sec-fetch-site': 'none',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-dest': 'document',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
    'priority': 'u=0, i'
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
        admin: '👑'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© BATMAN MD*`;
}

const USER_GROUP_DATA = path.join(__dirname, '../data/userGroupData.json');

// In-memory storage for chat history and user info
const chatMemory = {
    messages: new Map(), // Stores last 5 messages per user
    userInfo: new Map()  // Stores user information
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
    
    // Extract name
    if (message.toLowerCase().includes('my name is')) {
        info.name = message.split('my name is')[1].trim().split(' ')[0];
    }
    
    // Extract age
    if (message.toLowerCase().includes('i am') && message.toLowerCase().includes('years old')) {
        info.age = message.match(/\d+/)?.[0];
    }
    
    // Extract location
    if (message.toLowerCase().includes('i live in') || message.toLowerCase().includes('i am from')) {
        info.location = message.split(/(?:i live in|i am from)/i)[1].trim().split(/[.,!?]/)[0];
    }
    
    return info;
}

async function handleChatbotCommand(sock, chatId, message, match) {
    if (!match) {
        await showTyping(sock, chatId);
        
        const setupMsg = formatChatbotMessage(
            'CHATBOT SETUP',
            `│ *Commands:*\n│ ♧ .chatbot on\n│ ♧ .chatbot off\n│\n│ *Usage:*\n│ on  - Enable chatbot in this group\n│ off - Disable chatbot in this group`,
            'info'
        );
        
        const metaVcard = getMetaFakeVcard();
        
        return sock.sendMessage(chatId, {
            text: setupMsg,
            quoted: metaVcard
        });
    }

    const data = loadUserGroupData();
    
    // Get bot's number
    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    
    // Check if sender is bot owner
    const senderId = message.key.participant || message.participant || message.pushName || message.key.remoteJid;
    const isOwner = senderId === botNumber;

    // If it's the bot owner, allow access immediately
    if (isOwner) {
        if (match === 'on') {
            await showTyping(sock, chatId);
            if (data.chatbot[chatId]) {
                const alreadyMsg = formatChatbotMessage(
                    'ALREADY ENABLED',
                    `│ 🤖 Chatbot is already enabled\n│ 💬 for this group`,
                    'warning'
                );
                return sock.sendMessage(chatId, { text: alreadyMsg });
            }
            data.chatbot[chatId] = true;
            saveUserGroupData(data);
            console.log(`✅ Chatbot enabled for group ${chatId}`);
            
            const enableMsg = formatChatbotMessage(
                'CHATBOT ENABLED',
                `│ ✅ Chatbot has been enabled\n│ 💬 for this group\n│\n│ Mention me or reply to chat!`,
                'success'
            );
            
            return sock.sendMessage(chatId, { text: enableMsg });
        }

        if (match === 'off') {
            await showTyping(sock, chatId);
            if (!data.chatbot[chatId]) {
                const alreadyDisabledMsg = formatChatbotMessage(
                    'ALREADY DISABLED',
                    `│ 🤖 Chatbot is already disabled\n│ 💬 for this group`,
                    'warning'
                );
                return sock.sendMessage(chatId, { text: alreadyDisabledMsg });
            }
            delete data.chatbot[chatId];
            saveUserGroupData(data);
            console.log(`✅ Chatbot disabled for group ${chatId}`);
            
            const disableMsg = formatChatbotMessage(
                'CHATBOT DISABLED',
                `│ ❌ Chatbot has been disabled\n│ 💬 for this group`,
                'warning'
            );
            
            return sock.sendMessage(chatId, { text: disableMsg });
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
            `│ 👑 Only group admins or\n│ 🤖 the bot owner can use this command.`,
            'admin'
        );
        
        return sock.sendMessage(chatId, { text: adminMsg });
    }

    if (match === 'on') {
        await showTyping(sock, chatId);
        if (data.chatbot[chatId]) {
            const alreadyMsg = formatChatbotMessage(
                'ALREADY ENABLED',
                `│ 🤖 Chatbot is already enabled\n│ 💬 for this group`,
                'warning'
            );
            return sock.sendMessage(chatId, { text: alreadyMsg });
        }
        data.chatbot[chatId] = true;
        saveUserGroupData(data);
        console.log(`✅ Chatbot enabled for group ${chatId}`);
        
        const enableMsg = formatChatbotMessage(
            'CHATBOT ENABLED',
            `│ ✅ Chatbot has been enabled\n│ 💬 for this group\n│\n│ Mention me or reply to chat!`,
            'success'
        );
        
        return sock.sendMessage(chatId, { text: enableMsg });
    }

    if (match === 'off') {
        await showTyping(sock, chatId);
        if (!data.chatbot[chatId]) {
            const alreadyDisabledMsg = formatChatbotMessage(
                'ALREADY DISABLED',
                `│ 🤖 Chatbot is already disabled\n│ 💬 for this group`,
                'warning'
            );
            return sock.sendMessage(chatId, { text: alreadyDisabledMsg });
        }
        delete data.chatbot[chatId];
        saveUserGroupData(data);
        console.log(`✅ Chatbot disabled for group ${chatId}`);
        
        const disableMsg = formatChatbotMessage(
            'CHATBOT DISABLED',
            `│ ❌ Chatbot has been disabled\n│ 💬 for this group`,
            'warning'
        );
        
        return sock.sendMessage(chatId, { text: disableMsg });
    }

    await showTyping(sock, chatId);
    
    const invalidMsg = formatChatbotMessage(
        'INVALID COMMAND',
        `│ ❌ Invalid command!\n│\n│ *Use:*\n│ ♧ .chatbot on\n│ ♧ .chatbot off`,
        'error'
    );
    
    return sock.sendMessage(chatId, { text: invalidMsg });
}

async function handleChatbotResponse(sock, chatId, message, userMessage, senderId) {
    const data = loadUserGroupData();
    if (!data.chatbot[chatId]) return;

    try {
        // Get bot's ID - try multiple formats
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

        // Check for mentions and replies
        let isBotMentioned = false;
        let isReplyToBot = false;

        if (message.message?.extendedTextMessage) {
            const mentionedJid = message.message.extendedTextMessage.contextInfo?.mentionedJid || [];
            const quotedParticipant = message.message.extendedTextMessage.contextInfo?.participant;
            
            isBotMentioned = mentionedJid.some(jid => {
                const jidNumber = jid.split('@')[0].split(':')[0];
                return botJids.some(botJid => {
                    const botJidNumber = botJid?.split('@')[0]?.split(':')[0];
                    return jidNumber === botJidNumber;
                });
            });
            
            if (quotedParticipant) {
                const cleanQuoted = quotedParticipant.replace(/[:@].*$/, '');
                isReplyToBot = botJids.some(botJid => {
                    const cleanBot = botJid?.replace(/[:@].*$/, '');
                    return cleanBot === cleanQuoted;
                });
            }
        }
        else if (message.message?.conversation) {
            isBotMentioned = userMessage.includes(`@${botNumber}`);
        }

        if (!isBotMentioned && !isReplyToBot) return;

        // Clean the message
        let cleanedMessage = userMessage;
        if (isBotMentioned) {
            cleanedMessage = cleanedMessage.replace(new RegExp(`@${botNumber}`, 'g'), '').trim();
        }

        // Initialize user's chat memory if not exists
        if (!chatMemory.messages.has(senderId)) {
            chatMemory.messages.set(senderId, []);
            chatMemory.userInfo.set(senderId, {});
        }

        // Extract and update user information
        const userInfo = extractUserInfo(cleanedMessage);
        if (Object.keys(userInfo).length > 0) {
            chatMemory.userInfo.set(senderId, {
                ...chatMemory.userInfo.get(senderId),
                ...userInfo
            });
        }

        // Add message to history (keep last 20 messages)
        const messages = chatMemory.messages.get(senderId);
        messages.push(cleanedMessage);
        if (messages.length > 20) {
            messages.shift();
        }
        chatMemory.messages.set(senderId, messages);

        // Show typing indicator
        await showTyping(sock, chatId);

        // Get AI response with context
        const response = await getAIResponse(cleanedMessage, {
            messages: chatMemory.messages.get(senderId),
            userInfo: chatMemory.userInfo.get(senderId)
        });

        if (!response) {
            // Don't send anything on error - just return silently
            return;
        }

        // Add human-like delay before sending response
        await new Promise(resolve => setTimeout(resolve, getRandomDelay()));

        const metaVcard = getMetaFakeVcard();

        // Send response as a reply
        await sock.sendMessage(chatId, {
            text: response
        }, { quoted: metaVcard });

    } catch (error) {
        console.error('❌ Error in chatbot response:', error.message);
        
        if (error.message && error.message.includes('No sessions')) {
            console.error('Session error in chatbot - skipping error response');
            return;
        }
        
        // Don't send anything on error - just return silently
        return;
    }
}

async function getAIResponse(userMessage, userContext) {
    try {
        // Build context from conversation history
        const conversationHistory = userContext.messages.slice(-10).join('\n');
        
        const prompt = `You are Batman MD, a cool, savage WhatsApp chatbot created by Nabees. You're not an AI - you're a real person chatting. Keep responses short (1-2 lines). Use Hinglish naturally. Be casual and match the user's tone.

Previous conversation:
${conversationHistory}

User: ${userMessage}
Batman MD:`;

        const response = await axios.post(
            'https://api.nabees.online/api/ai/chat',
            {
                prompt: prompt,
                model: 'chat'
            },
            {
                timeout: 30000,
                headers: browserHeaders
            }
        );

        if (response.data && response.data.status === 200 && response.data.data?.response) {
            let cleanedResponse = response.data.data.response.trim();
            
            // Clean up any prompt bleed
            cleanedResponse = cleanedResponse
                .replace(/^Batman MD:\s*/i, '')
                .replace(/^You are Batman MD.*$/i, '')
                .replace(/^Previous conversation:.*$/i, '')
                .replace(/^User:.*$/i, '')
                .replace(/^Batman MD:.*$/i, '')
                .trim();
            
            return cleanedResponse || null;
        }
        
        return null;

    } catch (error) {
        console.error("AI API error:", error.message);
        return null;
    }
}

module.exports = {
    handleChatbotCommand,
    handleChatbotResponse
};
