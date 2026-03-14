const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363367299421766@newsletter',
            newsletterName: 'Batman MD',
            serverMessageId: -1
        }
    }
};

// ============================================
// ENHANCEMENT: Helper function for stylish messages (ONLY for WhatsApp output)
// ============================================
function formatAutoStatusMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        status: '📱',
        react: '💫',
        settings: '⚙️'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

// Path to store auto status configuration
const configPath = path.join(__dirname, '../data/autoStatus.json');

// Initialize config file if it doesn't exist
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ 
        enabled: false, 
        reactOn: false 
    }));
}

async function autoStatusCommand(sock, chatId, msg, args) {
    try {
        const senderId = msg.key.participant || msg.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        
        if (!msg.key.fromMe && !isOwner) {
            // ENHANCEMENT: Stylish owner-only message
            const ownerMsg = formatAutoStatusMessage(
                'OWNER ONLY',
                `│ ❌ This command can only be used\n│ 👑 by the bot owner!`,
                'error'
            );
            await sock.sendMessage(chatId, { 
                text: ownerMsg,
                ...channelInfo
            });
            return;
        }

        // Read current config
        let config = JSON.parse(fs.readFileSync(configPath));

        // If no arguments, show current status
        if (!args || args.length === 0) {
            const status = config.enabled ? '✅ ENABLED' : '❌ DISABLED';
            const reactStatus = config.reactOn ? '✅ ENABLED' : '❌ DISABLED';
            
            // ENHANCEMENT: Stylish status display
            const statusMsg = formatAutoStatusMessage(
                'AUTO STATUS SETTINGS',
                `│ 📱 *Auto View:* ${status}\n│ 💫 *Reactions:* ${reactStatus}\n│\n│ *Commands:*\n│ ♧ .autostatus on\n│ ♧ .autostatus off\n│ ♧ .autostatus react on\n│ ♧ .autostatus react off`,
                'settings'
            );
            
            await sock.sendMessage(chatId, { 
                text: statusMsg,
                ...channelInfo
            });
            return;
        }

        // Handle on/off commands
        const command = args[0].toLowerCase();
        
        if (command === 'on') {
            config.enabled = true;
            fs.writeFileSync(configPath, JSON.stringify(config));
            
            // ENHANCEMENT: Stylish enable message
            const enableMsg = formatAutoStatusMessage(
                'AUTO STATUS ENABLED',
                `│ ✅ Auto status view is now ON\n│ 📱 Bot will automatically view\n│    all contact statuses`,
                'success'
            );
            
            await sock.sendMessage(chatId, { 
                text: enableMsg,
                ...channelInfo
            });
            
        } else if (command === 'off') {
            config.enabled = false;
            fs.writeFileSync(configPath, JSON.stringify(config));
            
            // ENHANCEMENT: Stylish disable message
            const disableMsg = formatAutoStatusMessage(
                'AUTO STATUS DISABLED',
                `│ ❌ Auto status view is now OFF\n│ 📱 Bot will no longer view\n│    statuses automatically`,
                'warning'
            );
            
            await sock.sendMessage(chatId, { 
                text: disableMsg,
                ...channelInfo
            });
            
        } else if (command === 'react') {
            // Handle react subcommand
            if (!args[1]) {
                // ENHANCEMENT: Stylish missing argument message
                const missingMsg = formatAutoStatusMessage(
                    'ACTION REQUIRED',
                    `│ ❌ Please specify on/off for reactions!\n│\n│ *Usage:*\n│ ♧ .autostatus react on\n│ ♧ .autostatus react off`,
                    'warning'
                );
                
                await sock.sendMessage(chatId, { 
                    text: missingMsg,
                    ...channelInfo
                });
                return;
            }
            
            const reactCommand = args[1].toLowerCase();
            if (reactCommand === 'on') {
                config.reactOn = true;
                fs.writeFileSync(configPath, JSON.stringify(config));
                
                // ENHANCEMENT: Stylish react enable message
                const reactOnMsg = formatAutoStatusMessage(
                    'REACTIONS ENABLED',
                    `│ 💫 Status reactions are now ON\n│ ✅ Bot will react to statuses\n│    with 💚`,
                    'react'
                );
                
                await sock.sendMessage(chatId, { 
                    text: reactOnMsg,
                    ...channelInfo
                });
                
            } else if (reactCommand === 'off') {
                config.reactOn = false;
                fs.writeFileSync(configPath, JSON.stringify(config));
                
                // ENHANCEMENT: Stylish react disable message
                const reactOffMsg = formatAutoStatusMessage(
                    'REACTIONS DISABLED',
                    `│ ❌ Status reactions are now OFF\n│ 💫 Bot will no longer react\n│    to statuses`,
                    'warning'
                );
                
                await sock.sendMessage(chatId, { 
                    text: reactOffMsg,
                    ...channelInfo
                });
                
            } else {
                // ENHANCEMENT: Stylish invalid command message
                const invalidMsg = formatAutoStatusMessage(
                    'INVALID COMMAND',
                    `│ ❌ Invalid reaction command: "${reactCommand}"\n│\n│ *Use:*\n│ ♧ .autostatus react on\n│ ♧ .autostatus react off`,
                    'error'
                );
                
                await sock.sendMessage(chatId, { 
                    text: invalidMsg,
                    ...channelInfo
                });
            }
        } else {
            // ENHANCEMENT: Stylish invalid command message
            const invalidMsg = formatAutoStatusMessage(
                'INVALID COMMAND',
                `│ ❌ Unknown command: "${command}"\n│\n│ *Available commands:*\n│ ♧ .autostatus on\n│ ♧ .autostatus off\n│ ♧ .autostatus react on\n│ ♧ .autostatus react off`,
                'error'
            );
            
            await sock.sendMessage(chatId, { 
                text: invalidMsg,
                ...channelInfo
            });
        }

    } catch (error) {
        console.error('Error in autostatus command:', error);
        
        // ENHANCEMENT: Stylish error message
        const errorMsg = formatAutoStatusMessage(
            'SYSTEM ERROR',
            `│ ❌ *Error:* ${error.message}\n│ 🔧 Check logs for details`,
            'error'
        );
        
        await sock.sendMessage(chatId, { 
            text: errorMsg,
            ...channelInfo
        });
    }
}

// Function to check if auto status is enabled
function isAutoStatusEnabled() {
    try {
        const config = JSON.parse(fs.readFileSync(configPath));
        return config.enabled;
    } catch (error) {
        console.error('Error checking auto status config:', error);
        return false;
    }
}

// Function to check if status reactions are enabled
function isStatusReactionEnabled() {
    try {
        const config = JSON.parse(fs.readFileSync(configPath));
        return config.reactOn;
    } catch (error) {
        console.error('Error checking status reaction config:', error);
        return false;
    }
}

// Function to react to status using proper method
async function reactToStatus(sock, statusKey) {
    try {
        if (!isStatusReactionEnabled()) {
            return;
        }

        // Use the proper relayMessage method for status reactions
        await sock.relayMessage(
            'status@broadcast',
            {
                reactionMessage: {
                    key: {
                        remoteJid: 'status@broadcast',
                        id: statusKey.id,
                        participant: statusKey.participant || statusKey.remoteJid,
                        fromMe: false
                    },
                    text: '💚'
                }
            },
            {
                messageId: statusKey.id,
                statusJidList: [statusKey.remoteJid, statusKey.participant || statusKey.remoteJid]
            }
        );
        
        // Removed success log - only keep errors
    } catch (error) {
        console.error('❌ Error reacting to status:', error.message);
    }
}

// Function to handle status updates
async function handleStatusUpdate(sock, status) {
    try {
        if (!isAutoStatusEnabled()) {
            return;
        }

        // Add delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Handle status from messages.upsert
        if (status.messages && status.messages.length > 0) {
            const msg = status.messages[0];
            if (msg.key && msg.key.remoteJid === 'status@broadcast') {
                try {
                    await sock.readMessages([msg.key]);
                    const sender = msg.key.participant || msg.key.remoteJid;
                    
                    // React to status if enabled
                    await reactToStatus(sock, msg.key);
                    
                    // Removed success log - only keep errors
                } catch (err) {
                    if (err.message?.includes('rate-overlimit')) {
                        console.log('⚠️ Rate limit hit, waiting before retrying...');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        await sock.readMessages([msg.key]);
                    } else {
                        throw err;
                    }
                }
                return;
            }
        }

        // Handle direct status updates
        if (status.key && status.key.remoteJid === 'status@broadcast') {
            try {
                await sock.readMessages([status.key]);
                const sender = status.key.participant || status.key.remoteJid;
                
                // React to status if enabled
                await reactToStatus(sock, status.key);
                
                // Removed success log - only keep errors
            } catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    console.log('⚠️ Rate limit hit, waiting before retrying...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await sock.readMessages([status.key]);
                } else {
                    throw err;
                }
            }
            return;
        }

        // Handle status in reactions
        if (status.reaction && status.reaction.key.remoteJid === 'status@broadcast') {
            try {
                await sock.readMessages([status.reaction.key]);
                const sender = status.reaction.key.participant || status.reaction.key.remoteJid;
                
                // React to status if enabled
                await reactToStatus(sock, status.reaction.key);
                
                // Removed success log - only keep errors
            } catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    console.log('⚠️ Rate limit hit, waiting before retrying...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await sock.readMessages([status.reaction.key]);
                } else {
                    throw err;
                }
            }
            return;
        }

    } catch (error) {
        console.error('❌ Error in auto status view:', error.message);
    }
}

module.exports = {
    autoStatusCommand,
    handleStatusUpdate
};