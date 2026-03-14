const { handleAntiBadwordCommand } = require('../lib/antibadword');
const isAdminHelper = require('../lib/isAdmin');

async function antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin) {
    try {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { 
                text: '```❌ For Group Admins Only!```\n> *This command is restricted to group administrators*' 
            }, { quoted: message });
            return;
        }

        // Extract match from message
        const text = message.message?.conversation || 
                    message.message?.extendedTextMessage?.text || '';
        const match = text.split(' ').slice(1).join(' ');

        // Show processing message
        const processingMsg = await sock.sendMessage(chatId, { 
            text: '```⚙️ Processing antibadword settings...```' 
        }, { quoted: message });

        await handleAntiBadwordCommand(sock, chatId, message, match);

        // Optional: Delete processing message (uncomment if you want)
        // if (processingMsg) {
        //     await sock.sendMessage(chatId, { delete: processingMsg.key });
        // }

    } catch (error) {
        console.error('Error in antibadword command:', error);
        
        // Enhanced error message with styling
        const errorMessage = `*『 ❌ ERROR 』*
╭─────────⟢
│ • *Command:* antibadword
│ • *Issue:* ${error.message || 'Unknown error occurred'}
│ • *Fix:* Check logs or contact owner
╰─────────⟢

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ`;
        
        await sock.sendMessage(chatId, { 
            text: errorMessage
        }, { quoted: message });
    }
}

module.exports = antibadwordCommand;