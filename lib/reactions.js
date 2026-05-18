// lib/reactions.js
const fs = require('fs');
const path = require('path');

// List of emojis for reactions (you can customize)
const reactionEmojis = ['🤖', '🔥', '💯', '❤️', '👍', '💫', '✨', '👏', '😎', '🚀', '⚡', '💥', '🌟', '💪'];

// Path for storing auto-reaction state
const USER_GROUP_DATA = path.join(__dirname, '../data/userGroupData.json');

// Global auto-reaction flag (for both commands and messages)
let isAutoReactionEnabled = false;

// Load state from file
function loadAutoReactionState() {
    try {
        if (fs.existsSync(USER_GROUP_DATA)) {
            const data = JSON.parse(fs.readFileSync(USER_GROUP_DATA));
            return data.autoReaction === true;
        }
    } catch (error) {
        console.error('Error loading auto-reaction state:', error);
    }
    return false;
}

// Save state to file
function saveAutoReactionState(state) {
    try {
        let data = {};
        if (fs.existsSync(USER_GROUP_DATA)) {
            data = JSON.parse(fs.readFileSync(USER_GROUP_DATA));
        }
        data.autoReaction = state;
        fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving auto-reaction state:', error);
    }
}

// Initialize state on module load
isAutoReactionEnabled = loadAutoReactionState();

// Get a random emoji from the list
function getRandomReactionEmoji() {
    return reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
}

// ========== REACTION FUNCTIONS ==========

// 1️⃣ For command messages (existing behavior)
async function addCommandReaction(sock, message) {
    if (!isAutoReactionEnabled || !message?.key?.id) return;
    try {
        const emoji = getRandomReactionEmoji();
        await sock.sendMessage(message.key.remoteJid, {
            react: { text: emoji, key: message.key }
        });
    } catch (error) {
        console.error('Error adding command reaction:', error);
    }
}

// 2️⃣ For group messages & channel posts
async function autoReactToMessage(sock, chatId, messageKey, skipIfFromMe = true) {
    if (!isAutoReactionEnabled) return;
    if (skipIfFromMe && messageKey.fromMe) return;
    if (!chatId || !messageKey?.id) return;

    try {
        const emoji = getRandomReactionEmoji();
        await sock.sendMessage(chatId, {
            react: { text: emoji, key: messageKey }
        });
        // Optional: log to console for debugging
        console.log(`[AutoReact] reacted with ${emoji} in ${chatId}`);
    } catch (error) {
        // Silently fail – don't spam logs
    }
}

// 3️⃣ Toggle auto-reaction (owner command)
async function handleAreactCommand(sock, chatId, message, isOwner) {
    if (!isOwner) {
        await sock.sendMessage(chatId, { 
            text: '❌ This command is only available for the owner!',
            quoted: message
        });
        return;
    }

    const args = message.message?.conversation?.split(' ') || [];
    const action = args[1]?.toLowerCase();

    if (action === 'on') {
        isAutoReactionEnabled = true;
        saveAutoReactionState(true);
        await sock.sendMessage(chatId, { 
            text: '✅ Auto‑reactions have been enabled for ALL messages (commands, groups, channels)',
            quoted: message
        });
    } else if (action === 'off') {
        isAutoReactionEnabled = false;
        saveAutoReactionState(false);
        await sock.sendMessage(chatId, { 
            text: '❌ Auto‑reactions have been disabled globally',
            quoted: message
        });
    } else {
        const currentState = isAutoReactionEnabled ? 'enabled' : 'disabled';
        await sock.sendMessage(chatId, { 
            text: `✨ *Auto‑Reaction System*\n\nStatus: ${currentState}\n\nUse:\n.areact on   → Enable reactions for all messages\n.areact off  → Disable all reactions\n\n*Note:* Reactions will appear in groups & channels as well.`,
            quoted: message
        });
    }
}

// Export all functions
module.exports = {
    addCommandReaction,
    autoReactToMessage,      // new: use this for groups & channels
    handleAreactCommand,
    getRandomReactionEmoji   // optional, in case you need it elsewhere
};