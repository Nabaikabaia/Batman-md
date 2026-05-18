// commands/claude.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SESSIONS_FILE = path.join(__dirname, '../data/claude_sessions.json');

// Newsletter channel info (same as in your other commands)
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

// Ensure data directory exists
if (!fs.existsSync(path.dirname(SESSIONS_FILE))) {
    fs.mkdirSync(path.dirname(SESSIONS_FILE), { recursive: true });
}

function loadSessions() {
    try {
        if (fs.existsSync(SESSIONS_FILE)) {
            return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading Claude sessions:', error.message);
    }
    return {};
}

function saveSessions(sessions) {
    try {
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
    } catch (error) {
        console.error('Error saving Claude sessions:', error.message);
    }
}

async function claudeCommand(sock, chatId, message, args) {
    try {
        const userPrompt = args.join(' ').trim();
        if (!userPrompt) {
            await sock.sendMessage(chatId, {
                text: '🤖 *Claude AI*\n\nUsage: .claude <message>\nExample: .claude Hello, who are you?'
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: "⏳", key: message.key } });

        const isGroup = chatId.endsWith('@g.us');
        const senderId = message.key.participant || message.key.remoteJid;
        const sessionKey = isGroup ? `${chatId}_${senderId}` : senderId;

        const sessions = loadSessions();
        const existingSessionId = sessions[sessionKey] || null;

        let apiUrl = `https://my-api-rzmb.onrender.com/api/ai/claude-pro?prompt=${encodeURIComponent(userPrompt)}`;
        if (existingSessionId) {
            apiUrl += `&sessionId=${encodeURIComponent(existingSessionId)}`;
        }

        const response = await axios.get(apiUrl, { timeout: 35000 });
        const data = response.data;

        if (data.statusCode === 200 && data.success && data.response) {
            if (data.sessionId && !existingSessionId) {
                sessions[sessionKey] = data.sessionId;
                saveSessions(sessions);
            }

            // Send only the AI response + your footer (no session ID)
            const replyText = `🤖 *Claude:* ${data.response}\n\n> *© BATMAN MD*`;

            await sock.sendMessage(chatId, {
                text: replyText,
                ...channelInfo
            }, { quoted: message });

            await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
        } else {
            throw new Error('Invalid API response');
        }
    } catch (error) {
        console.error('[Claude] Error:', error.message);
        await sock.sendMessage(chatId, {
            text: '❌ *Claude is busy*\nPlease try again later.'
        }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
    }
}

module.exports = claudeCommand;