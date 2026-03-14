const { bots } = require('../lib/antilink');
const { setAntilink, getAntilink, removeAntilink } = require('../lib/index');
const isAdmin = require('../lib/isAdmin');

// ============================================
// ENHANCEMENT: Stylish console header
// ============================================
console.log(`
╔═══════════════════════════════════╗
║    『 🔗 ANTILINK MODULE 』       ║
║    ▶ Status: Initializing...      ║
║    ▶ Protection: Active           ║
║    ▶ By: Batman MD                ║
╚═══════════════════════════════════╝
`);

// ============================================
// ENHANCEMENT: Stats tracking
// ============================================
const stats = {
    linksDeleted: 0,
    warningsIssued: 0,
    kicksPerformed: 0,
    lastDetection: null
};

// ============================================
// ENHANCEMENT: Helper function for stylish messages
// ============================================
function formatMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        config: '⚙️'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> © ʙᴀᴛᴍᴀɴ ᴍᴅ`;
}

async function handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        if (!isSenderAdmin) {
            // ENHANCEMENT: Stylish admin-only message
            const adminMsg = formatMessage(
                'ADMIN ONLY',
                `│ ❌ This command is restricted\n│ 👑 to group administrators only!`,
                'warning'
            );
            await sock.sendMessage(chatId, { text: adminMsg }, { quoted: message });
            return;
        }

        const prefix = '.';
        const args = userMessage.slice(9).toLowerCase().trim().split(' ');
        const action = args[0];

        if (!action) {
            // ENHANCEMENT: Enhanced usage display
            const usageMsg = formatMessage(
                'ANTILINK SETUP',
                `│ 📝 *Usage:*\n│ ${prefix}antilink on\n│ ${prefix}antilink off\n│ ${prefix}antilink set delete|kick|warn\n│ ${prefix}antilink get\n│\n│ 🔰 *Actions:*\n│ • delete - Remove link\n│ • kick - Remove member\n│ • warn - Give warning\n│\n│ 📊 *Stats:*\n│ 🗑️ Deleted: ${stats.linksDeleted}\n│ ⚠️ Warnings: ${stats.warningsIssued}\n│ 👢 Kicks: ${stats.kicksPerformed}`,
                'config'
            );
            await sock.sendMessage(chatId, { text: usageMsg }, { quoted: message });
            return;
        }

        switch (action) {
            case 'on':
                const existingConfig = await getAntilink(chatId, 'on');
                if (existingConfig?.enabled) {
                    const alreadyOnMsg = formatMessage(
                        'ALREADY ACTIVE',
                        `│ 🔗 Antilink is already ENABLED\n│ ⚙️ Current action: ${existingConfig.action || 'delete'}`,
                        'info'
                    );
                    await sock.sendMessage(chatId, { text: alreadyOnMsg }, { quoted: message });
                    return;
                }
                const result = await setAntilink(chatId, 'on', 'delete');
                
                if (result) {
                    const successMsg = formatMessage(
                        'ANTILINK ENABLED',
                        `│ ✅ Antilink has been turned ON\n│ ⚙️ Default action: delete\n│ 🛡️ All links will be removed`,
                        'success'
                    );
                    await sock.sendMessage(chatId, { text: successMsg }, { quoted: message });
                } else {
                    const failMsg = formatMessage(
                        'ACTIVATION FAILED',
                        `│ ❌ Failed to turn on Antilink\n│ 🔧 Please try again or check logs`,
                        'error'
                    );
                    await sock.sendMessage(chatId, { text: failMsg }, { quoted: message });
                }
                break;

            case 'off':
                await removeAntilink(chatId, 'on');
                const offMsg = formatMessage(
                    'ANTILINK DISABLED',
                    `│ 🔴 Antilink has been turned OFF\n│ 📝 No link protection active`,
                    'warning'
                );
                await sock.sendMessage(chatId, { text: offMsg }, { quoted: message });
                break;

            case 'set':
                if (args.length < 2) {
                    const setHelpMsg = formatMessage(
                        'SET ACTION',
                        `│ 📝 Please specify an action:\n│ ${prefix}antilink set delete\n│ ${prefix}antilink set kick\n│ ${prefix}antilink set warn`,
                        'info'
                    );
                    await sock.sendMessage(chatId, { text: setHelpMsg }, { quoted: message });
                    return;
                }
                
                const setAction = args[1];
                if (!['delete', 'kick', 'warn'].includes(setAction)) {
                    const invalidMsg = formatMessage(
                        'INVALID ACTION',
                        `│ ❌ Invalid action: "${setAction}"\n│ ✅ Choose: delete, kick, or warn`,
                        'error'
                    );
                    await sock.sendMessage(chatId, { text: invalidMsg }, { quoted: message });
                    return;
                }
                
                const setResult = await setAntilink(chatId, 'on', setAction);
                
                if (setResult) {
                    const actionEmoji = setAction === 'delete' ? '🗑️' : (setAction === 'kick' ? '👢' : '⚠️');
                    const setSuccessMsg = formatMessage(
                        'ACTION UPDATED',
                        `│ ${actionEmoji} Antilink action set to: *${setAction}*\n│ 🔰 New setting is now active`,
                        'success'
                    );
                    await sock.sendMessage(chatId, { text: setSuccessMsg }, { quoted: message });
                } else {
                    const setFailMsg = formatMessage(
                        'UPDATE FAILED',
                        `│ ❌ Failed to set Antilink action\n│ 🔧 Please try again`,
                        'error'
                    );
                    await sock.sendMessage(chatId, { text: setFailMsg }, { quoted: message });
                }
                break;

            case 'get':
                const status = await getAntilink(chatId, 'on');
                const actionConfig = await getAntilink(chatId, 'on');
                
                const statusEmoji = status ? '✅' : '❌';
                const actionEmoji = actionConfig?.action === 'delete' ? '🗑️' : 
                                   (actionConfig?.action === 'kick' ? '👢' : '⚠️');
                
                const statusMsg = formatMessage(
                    'CURRENT CONFIGURATION',
                    `│ ${statusEmoji} *Status:* ${status ? 'ON' : 'OFF'}\n│ ${actionEmoji} *Action:* ${actionConfig?.action || 'Not set'}\n│\n│ 📊 *Stats Summary:*\n│ 🗑️ Deleted: ${stats.linksDeleted}\n│ ⚠️ Warnings: ${stats.warningsIssued}\n│ 👢 Kicks: ${stats.kicksPerformed}`,
                    'info'
                );
                await sock.sendMessage(chatId, { text: statusMsg }, { quoted: message });
                break;

            default:
                const defaultMsg = formatMessage(
                    'UNKNOWN COMMAND',
                    `│ ❌ Unknown action: "${action}"\n│ 📝 Use ${prefix}antilink for help`,
                    'error'
                );
                await sock.sendMessage(chatId, { text: defaultMsg });
        }
    } catch (error) {
        console.error('Error in antilink command:', error);
        
        const errorMsg = formatMessage(
            'SYSTEM ERROR',
            `│ ❌ *Error:* ${error.message || 'Unknown error'}\n│ 🔧 *Command:* antilink\n│ 📝 Check logs for details`,
            'error'
        );
        await sock.sendMessage(chatId, { text: errorMsg });
    }
}

async function handleLinkDetection(sock, chatId, message, userMessage, senderId) {
    const antilinkSetting = getAntilinkSetting(chatId);
    if (antilinkSetting === 'off') return;

    console.log(`Antilink Setting for ${chatId}: ${antilinkSetting}`);
    console.log(`Checking message for links: ${userMessage}`);
    
    // Log the full message object to diagnose message structure
    console.log("Full message object: ", JSON.stringify(message, null, 2));

    let shouldDelete = false;
    let detectedLinkType = '';

    const linkPatterns = {
        whatsappGroup: /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/i,
        whatsappChannel: /wa\.me\/channel\/[A-Za-z0-9]{20,}/i,
        telegram: /t\.me\/[A-Za-z0-9_]+/i,
        // Matches:
        // - Full URLs with protocol (http/https)
        // - URLs starting with www.
        // - Bare domains anywhere in the string, even when attached to text
        //   e.g., "helloinstagram.comworld" or "testhttps://x.com"
        allLinks: /https?:\/\/\S+|www\.\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/i,
    };

    // Detect WhatsApp Group links
    if (antilinkSetting === 'whatsappGroup') {
        console.log('WhatsApp group link protection is enabled.');
        if (linkPatterns.whatsappGroup.test(userMessage)) {
            console.log('Detected a WhatsApp group link!');
            shouldDelete = true;
            detectedLinkType = 'WhatsApp Group';
        }
    } else if (antilinkSetting === 'whatsappChannel' && linkPatterns.whatsappChannel.test(userMessage)) {
        shouldDelete = true;
        detectedLinkType = 'WhatsApp Channel';
    } else if (antilinkSetting === 'telegram' && linkPatterns.telegram.test(userMessage)) {
        shouldDelete = true;
        detectedLinkType = 'Telegram';
    } else if (antilinkSetting === 'allLinks' && linkPatterns.allLinks.test(userMessage)) {
        shouldDelete = true;
        detectedLinkType = 'External Link';
    }

    if (shouldDelete) {
        const quotedMessageId = message.key.id; // Get the message ID to delete
        const quotedParticipant = message.key.participant || senderId; // Get the participant ID

        console.log(`Attempting to delete message with id: ${quotedMessageId} from participant: ${quotedParticipant}`);

        try {
            await sock.sendMessage(chatId, {
                delete: { remoteJid: chatId, fromMe: false, id: quotedMessageId, participant: quotedParticipant },
            });
            console.log(`Message with ID ${quotedMessageId} deleted successfully.`);
            stats.linksDeleted++;
            
            // ENHANCEMENT: Get current action for appropriate response
            const actionConfig = await getAntilink(chatId, 'on');
            const currentAction = actionConfig?.action || 'delete';
            
            // ENHANCEMENT: Stylish warning message
            const actionEmoji = currentAction === 'delete' ? '🗑️' : (currentAction === 'kick' ? '👢' : '⚠️');
            
            let warningText = `│ ⚠️ @${senderId.split('@')[0]} posting links is not allowed!\n│ 🔗 *Type:* ${detectedLinkType}\n│ ${actionEmoji} *Action:* ${currentAction}`;
            
            if (currentAction === 'warn') {
                stats.warningsIssued++;
                warningText += `\n│ 📊 *Warning #${stats.warningsIssued}*`;
            } else if (currentAction === 'kick') {
                stats.kicksPerformed++;
                warningText += `\n│ 👢 *User will be removed*`;
            }
            
            const warningMsg = formatMessage(
                'LINK DETECTED',
                warningText,
                'warning'
            );
            
            const mentionedJidList = [senderId];
            await sock.sendMessage(chatId, { 
                text: warningMsg, 
                mentions: mentionedJidList 
            });
            
            // ENHANCEMENT: Log detection time
            stats.lastDetection = new Date().toISOString();
            
        } catch (error) {
            console.error('Failed to delete message:', error);
            
            const deleteErrorMsg = formatMessage(
                'ACTION FAILED',
                `│ ❌ Failed to delete link message\n│ 🔧 Error: ${error.message}`,
                'error'
            );
            await sock.sendMessage(chatId, { text: deleteErrorMsg });
        }
    } else {
        console.log('No link detected or protection not enabled for this type of link.');
    }
}

// ============================================
// ENHANCEMENT: Stats getter function
// ============================================
function getAntilinkStats() {
    return { ...stats };
}

// ============================================
// ENHANCEMENT: Reset stats function (owner only)
// ============================================
function resetAntilinkStats() {
    stats.linksDeleted = 0;
    stats.warningsIssued = 0;
    stats.kicksPerformed = 0;
    stats.lastDetection = null;
    return true;
}

// Log when module loads
console.log(`
╔═══════════════════════════════════╗
║    『 🔗 ANTILINK READY 』        ║
╠═══════════════════════════════════╣
║ 🔰 Protection: Active             ║
║ 📊 Monitoring all groups           ║
║ 🛡️ Status: Online                 ║
╚═══════════════════════════════════╝
`);

module.exports = {
    handleAntilinkCommand,
    handleLinkDetection,
    getAntilinkStats,    // ENHANCEMENT: Export stats
    resetAntilinkStats   // ENHANCEMENT: Export reset function
};