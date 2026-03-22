// commands/fakenumber.js - Temporary Phone Number Generator
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
function formatFakeNumberMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        phone: '📱',
        inbox: '📥',
        generate: '🆕',
        refresh: '🔄',
        delete: '🗑️',
        country: '🌍'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

// Store active numbers per user
const userNumbers = new Map();

async function fakenumberCommand(sock, chatId, message, args) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const subCommand = args[0]?.toLowerCase();
        const param = args[1];
        
        // ============================================
        // SHOW AVAILABLE COUNTRIES
        // ============================================
        if (!subCommand || subCommand === 'countries' || subCommand === 'list') {
            await sock.sendMessage(chatId, { react: { text: '🌍', key: message.key } });
            
            try {
                const response = await axios.get('https://api.vreden.my.id/api/v1/tools/fakenumber/country', {
                    timeout: 10000
                });
                
                if (response.data && response.data.status) {
                    const countries = response.data.result;
                    
                    let countryList = `│ 🌍 *Available Countries:*\n│\n`;
                    let count = 0;
                    
                    for (const country of countries) {
                        countryList += `│ ♧ *${country.title}* - \`${country.id}\`\n`;
                        count++;
                        if (count >= 30) break; // Limit to 30 to avoid message too long
                    }
                    
                    countryList += `\n│ 📊 *Total:* ${countries.length} countries\n│\n│ 💡 *Usage:* .fakenumber <country-id>\n│ *Example:* .fakenumber us\n│ *Example:* .fakenumber gb`;
                    
                    const countryMsg = formatFakeNumberMessage(
                        'COUNTRY LIST',
                        countryList,
                        'country'
                    );
                    
                    await sock.sendMessage(chatId, { text: countryMsg, ...channelInfo }, { quoted: message });
                    await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
                } else {
                    throw new Error('Failed to fetch countries');
                }
            } catch (error) {
                console.error('Country list error:', error);
                const errorMsg = formatFakeNumberMessage(
                    'FETCH FAILED',
                    `│ ❌ Failed to fetch country list.\n│ 🔧 ${error.message}\n│\n│ 🔄 Please try again later.`,
                    'error'
                );
                await sock.sendMessage(chatId, { text: errorMsg, ...channelInfo }, { quoted: message });
                await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            }
            return;
        }
        
        // ============================================
        // GENERATE NUMBER FOR A COUNTRY
        // ============================================
        if (subCommand === 'generate' || subCommand === 'get' || subCommand === 'new') {
            const countryId = param;
            
            if (!countryId) {
                const usageMsg = formatFakeNumberMessage(
                    'USAGE',
                    `│ 📱 Generate a temporary phone number!\n│\n│ *Usage:* .fakenumber generate <country-id>\n│\n│ *Examples:*\n│ ♧ .fakenumber generate us\n│ ♧ .fakenumber generate gb\n│ ♧ .fakenumber generate id\n│\n│ 💡 First use .fakenumber countries to see available IDs`,
                    'phone'
                );
                await sock.sendMessage(chatId, { text: usageMsg, ...channelInfo }, { quoted: message });
                return;
            }
            
            await sock.sendMessage(chatId, { react: { text: '📱', key: message.key } });
            
            const generatingMsg = formatFakeNumberMessage(
                'GENERATING',
                `│ 🔄 Generating temporary number for ${countryId.toUpperCase()}...\n│ ⏳ Please wait.`,
                'generate'
            );
            await sock.sendMessage(chatId, { text: generatingMsg, ...channelInfo }, { quoted: message });
            
            try {
                const response = await axios.get(`https://api.vreden.my.id/api/v1/tools/fakenumber/number?id=${countryId}`, {
                    timeout: 10000
                });
                
                if (response.data && response.data.status && response.data.result && response.data.result.length > 0) {
                    const numbers = response.data.result;
                    const firstNumber = numbers[0];
                    const countryName = firstNumber.country || countryId.toUpperCase();
                    
                    // Store the number for this user
                    userNumbers.set(senderId, {
                        number: firstNumber.number,
                        country: countryName,
                        countryId: countryId,
                        numbers: numbers,
                        createdAt: Date.now()
                    });
                    
                    // Show all available numbers (first 5)
                    let numberList = `│ 📞 *Country:* ${countryName}\n│\n│ *Available Numbers:*\n`;
                    for (let i = 0; i < Math.min(numbers.length, 10); i++) {
                        numberList += `│ ${i+1}. ${numbers[i].number}\n`;
                    }
                    numberList += `\n│ 💡 *Commands:*\n│ ♧ .fakenumber check - Check messages for your number\n│ ♧ .fakenumber messages <number> - Check specific number\n│ ♧ .fakenumber refresh - Refresh messages\n│ ♧ .fakenumber delete - Delete this session\n│\n│ ⚠️ *Note:* Your current number is: ${firstNumber.number}`;
                    
                    const successMsg = formatFakeNumberMessage(
                        'NUMBER GENERATED',
                        numberList,
                        'success'
                    );
                    
                    await sock.sendMessage(chatId, { text: successMsg, ...channelInfo }, { quoted: message });
                    await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
                } else {
                    throw new Error('No numbers available for this country');
                }
            } catch (error) {
                console.error('Generate error:', error);
                const errorMsg = formatFakeNumberMessage(
                    'GENERATION FAILED',
                    `│ ❌ Failed to generate number.\n│ 🔧 ${error.message}\n│\n│ 🔄 Try another country or try again later.`,
                    'error'
                );
                await sock.sendMessage(chatId, { text: errorMsg, ...channelInfo }, { quoted: message });
                await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            }
            return;
        }
        
        // ============================================
        // CHECK MESSAGES FOR A NUMBER
        // ============================================
        if (subCommand === 'messages' || subCommand === 'inbox' || subCommand === 'check') {
            let phoneNumber = param;
            
            // If no number provided, use stored number
            if (!phoneNumber) {
                const userSession = userNumbers.get(senderId);
                if (!userSession) {
                    const noSessionMsg = formatFakeNumberMessage(
                        'NO NUMBER',
                        `│ ❌ No active number.\n│\n│ *Usage:*\n│ ♧ .fakenumber generate <country-id> - First get a number\n│ ♧ .fakenumber messages <number> - Check specific number`,
                        'error'
                    );
                    await sock.sendMessage(chatId, { text: noSessionMsg, ...channelInfo }, { quoted: message });
                    return;
                }
                phoneNumber = userSession.number;
            }
            
            await sock.sendMessage(chatId, { react: { text: '📥', key: message.key } });
            
            const checkingMsg = formatFakeNumberMessage(
                'CHECKING',
                `│ 🔄 Fetching messages for ${phoneNumber}...\n│ ⏳ Please wait.`,
                'inbox'
            );
            await sock.sendMessage(chatId, { text: checkingMsg, ...channelInfo }, { quoted: message });
            
            try {
                const response = await axios.get(`https://api.vreden.my.id/api/v1/tools/fakenumber/message?number=${encodeURIComponent(phoneNumber)}`, {
                    timeout: 10000
                });
                
                if (response.data && response.data.status) {
                    const messages = response.data.result || [];
                    
                    if (messages.length === 0) {
                        const emptyMsg = formatFakeNumberMessage(
                            'INBOX EMPTY',
                            `│ 📞 *Number:* ${phoneNumber}\n│ 📥 *Messages:* 0\n│\n│ 🔄 No messages yet.\n│\n│ 💡 Try again later or use .fakenumber refresh`,
                            'info'
                        );
                        await sock.sendMessage(chatId, { text: emptyMsg, ...channelInfo }, { quoted: message });
                    } else {
                        // Send inbox summary
                        const summaryMsg = formatFakeNumberMessage(
                            'INBOX SUMMARY',
                            `│ 📞 *Number:* ${phoneNumber}\n│ 📥 *Messages:* ${messages.length}\n│\n│ 📬 *New Messages:*\n${messages.slice(0, 5).map((msg, i) => `│ ${i+1}. 📨 *${msg.from || 'Unknown'}*\n│    🕒 ${msg.time_wib || msg.timestamp}`).join('\n│\n')}\n\n${messages.length > 5 ? `│\n│ 📄 *+${messages.length - 5} more messages*` : ''}`,
                            'inbox'
                        );
                        await sock.sendMessage(chatId, { text: summaryMsg, ...channelInfo }, { quoted: message });
                        
                        // Send each message individually
                        for (let i = 0; i < Math.min(messages.length, 5); i++) {
                            const msg = messages[i];
                            const detailMsg = formatFakeNumberMessage(
                                `MESSAGE ${i+1}`,
                                `│ 📨 *From:* ${msg.from || 'Unknown'}\n│ 🕒 *Time:* ${msg.time_wib || msg.timestamp}\n│\n│ 📄 *Content:*\n│ ${(msg.content || 'No content').substring(0, 400)}${(msg.content || '').length > 400 ? '...' : ''}`,
                                'info'
                            );
                            await sock.sendMessage(chatId, { text: detailMsg, ...channelInfo }, { quoted: message });
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    }
                    await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
                } else {
                    throw new Error('Failed to fetch messages');
                }
            } catch (error) {
                console.error('Messages error:', error);
                const errorMsg = formatFakeNumberMessage(
                    'FETCH FAILED',
                    `│ ❌ Failed to fetch messages.\n│ 🔧 ${error.message}\n│\n│ 🔄 Please check the number or try again.`,
                    'error'
                );
                await sock.sendMessage(chatId, { text: errorMsg, ...channelInfo }, { quoted: message });
                await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            }
            return;
        }
        
        // ============================================
        // REFRESH MESSAGES
        // ============================================
        if (subCommand === 'refresh' || subCommand === 'reload') {
            const userSession = userNumbers.get(senderId);
            if (!userSession) {
                const noSessionMsg = formatFakeNumberMessage(
                    'NO NUMBER',
                    `│ ❌ No active number.\n│\n│ *Usage:* .fakenumber generate first`,
                    'error'
                );
                await sock.sendMessage(chatId, { text: noSessionMsg, ...channelInfo }, { quoted: message });
                return;
            }
            
            // Call messages with stored number
            await fakenumberCommand(sock, chatId, message, ['messages', userSession.number]);
            return;
        }
        
        // ============================================
        // DELETE/EXPIRE NUMBER
        // ============================================
        if (subCommand === 'delete' || subCommand === 'expire' || subCommand === 'remove') {
            const userSession = userNumbers.get(senderId);
            if (!userSession) {
                const noSessionMsg = formatFakeNumberMessage(
                    'NO NUMBER',
                    `│ ❌ No active number to delete.`,
                    'error'
                );
                await sock.sendMessage(chatId, { text: noSessionMsg, ...channelInfo }, { quoted: message });
                return;
            }
            
            const number = userSession.number;
            userNumbers.delete(senderId);
            
            const deleteMsg = formatFakeNumberMessage(
                'NUMBER DELETED',
                `│ 🗑️ Temporary number deleted.\n│ 📞 *Number:* ${number}\n│\n│ 💡 Use .fakenumber generate to create a new one.`,
                'delete'
            );
            await sock.sendMessage(chatId, { text: deleteMsg, ...channelInfo }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '🗑️', key: message.key } });
            return;
        }
        
        // ============================================
        // SHOW USAGE
        // ============================================
        const usageMsg = `*『 📱 TEMPORARY NUMBER 』*
╭─────────⟢
│ 📞 Get temporary phone numbers for SMS verification!
│
│ *Commands:*
│ ♧ .fakenumber countries - Show available countries
│ ♧ .fakenumber generate <id> - Get number for country
│ ♧ .fakenumber messages [number] - Check messages
│ ♧ .fakenumber refresh - Refresh current inbox
│ ♧ .fakenumber delete - Delete current number
│
│ *Examples:*
│ ♧ .fakenumber countries
│ ♧ .fakenumber generate us
│ ♧ .fakenumber messages +1234567890
│ ♧ .fakenumber refresh
│
│ *Note:* Numbers expire after ~1 hour
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
        
        await sock.sendMessage(chatId, { text: usageMsg, ...channelInfo }, { quoted: message });
        
    } catch (error) {
        console.error('FakeNumber Command Error:', error);
        
        const errorMsg = formatFakeNumberMessage(
            'ERROR',
            `│ ❌ Failed to process request.\n│ 🔧 ${error.message}\n│\n│ 🔄 Please try again later.`,
            'error'
        );
        await sock.sendMessage(chatId, { text: errorMsg, ...channelInfo }, { quoted: message });
    }
}

// Clean up expired sessions every hour
setInterval(() => {
    const now = Date.now();
    for (const [userId, session] of userNumbers.entries()) {
        if (now - session.createdAt > 3600000) { // 1 hour
            userNumbers.delete(userId);
            console.log(`🗑️ Expired fake number session for ${userId}`);
        }
    }
}, 3600000);

module.exports = fakenumberCommand;