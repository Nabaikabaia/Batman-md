// commands/spam.js
async function spamCommand(sock, chatId, message, args) {
    try {
        // Owner check – restrict completely
        const isOwner = message.key.fromMe;
        if (!isOwner) {
            await sock.sendMessage(chatId, { 
                text: "❌ *Owner Only*\nThis command is restricted to the bot owner for security reasons."
            }, { quoted: message });
            return;
        }

        if (!args.length) {
            await sock.sendMessage(chatId, { 
                text: "💬 *Spam Command*\n\n*Usage:*\n1. Spam in current chat:\n`.spam <amount> <message>`\n\n2. Spam in another chat:\n`.spam <chatJID> <amount> <message>`\n\n*Examples:*\n`.spam 10 Hello`\n`.spam 1203631234567890@g.us 5 Hey!`\n\n*Limits:* 1-100 messages, 500ms delay\n\n⚠️ Owner only command."
            }, { quoted: message });
            return;
        }

        // Check if first arg looks like a JID (contains @ or is very long number)
        const firstArg = args[0];
        const isJidFormat = firstArg.includes('@') || (firstArg.length > 15 && !isNaN(parseInt(firstArg)));
        
        let targetChatId = chatId; // default to current chat
        let amount = 0;
        let msg = '';
        let isSpammingOtherChat = false;

        // Parse command based on format
        if (isJidFormat && args.length >= 3) {
            // Format: .spam <JID> <amount> <message>
            targetChatId = firstArg;
            amount = parseInt(args[1]);
            msg = args.slice(2).join(' ');
            isSpammingOtherChat = true;
        } else {
            // Format: .spam <amount> <message>
            amount = parseInt(args[0]);
            msg = args.slice(1).join(' ');
            targetChatId = chatId;
            isSpammingOtherChat = false;
        }

        // Validate amount
        if (isNaN(amount) || amount < 1 || amount > 100) {
            await sock.sendMessage(chatId, { 
                text: "❌ Invalid amount. Please use 1-100 messages."
            }, { quoted: message });
            return;
        }
        
        if (!msg) {
            await sock.sendMessage(chatId, { 
                text: "❌ Please provide a message to spam."
            }, { quoted: message });
            return;
        }

        // React: 💬
        await sock.sendMessage(chatId, { react: { text: "💬", key: message.key } });
        
        // Send confirmation
        const targetDisplay = targetChatId === chatId ? 'this chat' : targetChatId;
        await sock.sendMessage(chatId, { 
            text: `⏳ Spamming ${amount} message(s) to ${targetDisplay}...\n\n⚠️ This may take up to ${Math.ceil(amount * 0.5)} seconds.`
        }, { quoted: message });
        
        // Spam the messages
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < amount; i++) {
            try {
                await sock.sendMessage(targetChatId, { text: msg });
                successCount++;
            } catch (err) {
                failCount++;
                console.error(`[Spam] Failed to send message ${i+1}:`, err.message);
            }
            // Delay to avoid rate limiting (500ms between messages)
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Send summary
        let summary = `✅ *Spam Complete*\n\n📨 Sent: ${successCount}/${amount}\n`;
        if (failCount > 0) summary += `❌ Failed: ${failCount}\n`;
        if (isSpammingOtherChat) summary += `📍 Target: ${targetChatId}\n`;
        summary += `⏱️ Total time: ~${Math.ceil(successCount * 0.5)} seconds\n`;
        summary += `\n> *© BATMAN MD*`;
        
        await sock.sendMessage(chatId, { text: summary });
        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('Spam error:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        await sock.sendMessage(chatId, { 
            text: `❌ Spam failed: ${error.message}`
        }, { quoted: message });
    }
}

module.exports = spamCommand;