const fs = require('fs');
const path = require('path');
const isAdmin = require('../lib/isAdmin');

// ============================================
// ENHANCEMENT: Quoted contact template (from your vv command)
// ============================================
const quotedContact = {
  key: {
    fromMe: false,
    participant: `0@s.whatsapp.net`,
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "NABEES TECH",
      vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:BATMAN MD\nORG:BATMAN MD;\nTEL;type=CELL;type=VOICE;waid=+2347072182960:+2347072182960\nEND:VCARD"
    }
  }
};

// ============================================
// ENHANCEMENT: Newsletter channel info with correct JID
// ============================================
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

// ============================================
// ENHANCEMENT: Helper function for stylish messages
// ============================================
function formatWarnMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        warn: '⚠️',
        admin: '👑',
        bot: '🤖',
        group: '👥',
        kick: '👢'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

// Define paths
const databaseDir = path.join(process.cwd(), 'data');
const warningsPath = path.join(databaseDir, 'warnings.json');

// Initialize warnings file if it doesn't exist
function initializeWarningsFile() {
    // Create database directory if it doesn't exist
    if (!fs.existsSync(databaseDir)) {
        fs.mkdirSync(databaseDir, { recursive: true });
    }
    
    // Create warnings.json if it doesn't exist
    if (!fs.existsSync(warningsPath)) {
        fs.writeFileSync(warningsPath, JSON.stringify({}), 'utf8');
    }
}

async function warnCommand(sock, chatId, senderId, mentionedJids, message) {
    try {
        // Initialize files first
        initializeWarningsFile();

        // First check if it's a group
        if (!chatId.endsWith('@g.us')) {
            // ENHANCEMENT: Stylish group-only message
            const groupOnlyMsg = formatWarnMessage(
                'GROUP ONLY',
                `│ 👥 This command can only be\n│    used in groups!`,
                'group'
            );
            await sock.sendMessage(chatId, { 
                text: groupOnlyMsg,
                ...channelInfo
            }, { quoted: quotedContact });
            return;
        }

        // Check admin status first
        try {
            const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
            
            if (!isBotAdmin) {
                // ENHANCEMENT: Stylish bot admin required message
                const botAdminMsg = formatWarnMessage(
                    'BOT NOT ADMIN',
                    `│ 🤖 Please make the bot an admin\n│ ⚠️ to use the warn command.`,
                    'bot'
                );
                await sock.sendMessage(chatId, { 
                    text: botAdminMsg,
                    ...channelInfo
                }, { quoted: quotedContact });
                return;
            }

            if (!isSenderAdmin) {
                // ENHANCEMENT: Stylish admin only message
                const adminOnlyMsg = formatWarnMessage(
                    'ADMIN ONLY',
                    `│ 👑 Only group administrators\n│ ⚠️ can use the warn command.`,
                    'admin'
                );
                await sock.sendMessage(chatId, { 
                    text: adminOnlyMsg,
                    ...channelInfo
                }, { quoted: quotedContact });
                return;
            }
        } catch (adminError) {
            console.error('Error checking admin status:', adminError);
            
            // ENHANCEMENT: Stylish admin check error message
            const adminCheckMsg = formatWarnMessage(
                'ADMIN CHECK FAILED',
                `│ ❌ Please make sure the bot is\n│ 🤖 an admin of this group.`,
                'error'
            );
            await sock.sendMessage(chatId, { 
                text: adminCheckMsg,
                ...channelInfo
            }, { quoted: quotedContact });
            return;
        }

        let userToWarn;
        
        // Check for mentioned users
        if (mentionedJids && mentionedJids.length > 0) {
            userToWarn = mentionedJids[0];
        }
        // Check for replied message
        else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToWarn = message.message.extendedTextMessage.contextInfo.participant;
        }
        
        if (!userToWarn) {
            // ENHANCEMENT: Stylish missing user message
            const missingMsg = formatWarnMessage(
                'USER REQUIRED',
                `│ ❌ Please mention the user or\n│ ⚠️ reply to their message to warn!\n│\n│ *Usage:*\n│ ♧ .warn @user\n│ ♧ Reply + .warn`,
                'warn'
            );
            await sock.sendMessage(chatId, { 
                text: missingMsg,
                ...channelInfo
            }, { quoted: quotedContact });
            return;
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            // Read warnings, create empty object if file is empty
            let warnings = {};
            try {
                warnings = JSON.parse(fs.readFileSync(warningsPath, 'utf8'));
            } catch (error) {
                warnings = {};
            }

            // Initialize nested objects if they don't exist
            if (!warnings[chatId]) warnings[chatId] = {};
            if (!warnings[chatId][userToWarn]) warnings[chatId][userToWarn] = 0;
            
            warnings[chatId][userToWarn]++;
            fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));

            // ENHANCEMENT: Stylish warning message
            const warningMessage = formatWarnMessage(
                'WARNING ISSUED',
                `│ 👤 *User:* @${userToWarn.split('@')[0]}\n` +
                `│ ⚠️ *Count:* ${warnings[chatId][userToWarn]}/3\n` +
                `│ 👑 *By:* @${senderId.split('@')[0]}\n` +
                `│ 📅 *Date:* ${new Date().toLocaleString()}`,
                'warn'
            );

            await sock.sendMessage(chatId, { 
                text: warningMessage,
                mentions: [userToWarn, senderId],
                ...channelInfo
            }, { quoted: quotedContact });

            // Auto-kick after 3 warnings
            if (warnings[chatId][userToWarn] >= 3) {
                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));

                await sock.groupParticipantsUpdate(chatId, [userToWarn], "remove");
                delete warnings[chatId][userToWarn];
                fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));
                
                // ENHANCEMENT: Stylish auto-kick message
                const kickMessage = formatWarnMessage(
                    'AUTO-KICK',
                    `│ 👢 @${userToWarn.split('@')[0]}\n` +
                    `│ ⚠️ Has been removed after\n` +
                    `│    receiving 3 warnings!`,
                    'kick'
                );

                await sock.sendMessage(chatId, { 
                    text: kickMessage,
                    mentions: [userToWarn],
                    ...channelInfo
                }, { quoted: quotedContact });
            }
        } catch (error) {
            console.error('Error in warn command:', error);
            
            // ENHANCEMENT: Stylish error message
            const failMsg = formatWarnMessage(
                'WARN FAILED',
                `│ ❌ Failed to warn user!\n│ 🔧 ${error.message}`,
                'error'
            );
            await sock.sendMessage(chatId, { 
                text: failMsg,
                ...channelInfo
            }, { quoted: quotedContact });
        }
    } catch (error) {
        console.error('Error in warn command:', error);
        
        if (error.data === 429) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
                // ENHANCEMENT: Stylish rate limit message
                const rateLimitMsg = formatWarnMessage(
                    'RATE LIMIT',
                    `│ ⏳ Rate limit reached.\n│ 🔄 Please try again in a few seconds.`,
                    'warning'
                );
                await sock.sendMessage(chatId, { 
                    text: rateLimitMsg,
                    ...channelInfo
                }, { quoted: quotedContact });
            } catch (retryError) {
                console.error('Error sending retry message:', retryError);
            }
        } else {
            try {
                // ENHANCEMENT: Stylish error message
                const errorMsg = formatWarnMessage(
                    'WARN FAILED',
                    `│ ❌ Failed to warn user.\n│ 🤖 Make sure the bot is admin\n│    and has sufficient permissions.`,
                    'error'
                );
                await sock.sendMessage(chatId, { 
                    text: errorMsg,
                    ...channelInfo
                }, { quoted: quotedContact });
            } catch (sendError) {
                console.error('Error sending error message:', sendError);
            }
        }
    }
}

module.exports = warnCommand;