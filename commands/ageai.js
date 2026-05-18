// commands/ageai.js
const axios = require('axios');
const { downloadMedia } = require('../lib/downloadMedia');

const THUMB_IMAGE = 'https://aqrmhkzrrmpljrtknrpi.supabase.co/storage/v1/object/public/uploads/4YDNVP.jpg';

// Same Cloudflare cookie
const CF_CLEARANCE = 'cf_clearance=SYbNErk9BPCXRj5y9HeT4rw5btm5Hcr5X5R769dWJis-1777740071-1.2.1.1-i_yonWwR9qaRXOFe7GDLU1y3JVvWOWRit6T_2Q7kIrcEwy9klF0FWIU1PloSyXP1uV.wGp4bYtWLslTJCxlOqC2Jv.w6dHZxQuPnMte8XVWvAEOUL4ZWiRM20udgc5H80CJ50cpAV6Zm6lg9Pzgdz.A9c4sLKfbFxRIDDQPa.AW0SZh4bPF5MilPUNeL3Bby7vKm.s5OVm9zSL3RcR0Xt5yQo5U.9HKDAWRVmpyv2UqVXTvqpu0KAcsUwUSk8U6ZCAhT0uG.nSXxD1keX5uq4C0OXewu6QIIc2BP.4MrE26JH9TNwuJBgPOkGbeIl7itbAEguY0gUrpFYVg67e5WiQ';

const fakeMeta = {
    key: {
        participant: '0@s.whatsapp.net',
        remoteJid: 'status@broadcast',
        fromMe: false,
        id: 'AGEAI_META_' + Date.now()
    },
    message: {
        contactMessage: {
            displayName: 'BATMAN MD',
            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:BATMAN MD;;;;\nFN:BATMAN MD\nTEL;waid=2349049636843:+234 904 963 6843\nEND:VCARD`,
            sendEphemeral: true
        }
    },
    messageTimestamp: Math.floor(Date.now() / 1000),
    pushName: 'BATMAN MD'
};

async function ageAICommand(sock, chatId, message, args) {
    try {
        let imageUrl = null;
        let imageBuffer = null;

        if (args && args.length > 0) {
            const possibleUrl = args.join(' ').trim();
            if (possibleUrl.match(/^https?:\/\/.+\/.*\.(jpg|jpeg|png|webp)/i)) {
                imageUrl = possibleUrl;
            }
        }

        if (!imageUrl) {
            try {
                imageBuffer = await downloadMedia(sock, message);
            } catch (err) {
                console.log('[AgeAI] No media:', err.message);
            }
        }

        if (!imageUrl && !imageBuffer) {
            await sock.sendMessage(chatId, {
                text: '👴 *Age AI - Make anyone look older*\n\nUsage:\n1. Reply to an image with `.ageai`\n2. `.ageai <image_url>`\n\n⏱️ Processing takes up to 90 seconds.'
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: "⏳", key: message.key } });
        await sock.sendMessage(chatId, {
            text: "👴 *Aging AI activated...*\nConverting person to an older version. Please wait.",
            contextInfo: {
                externalAdReply: {
                    title: 'BATMAN MD - Age AI',
                    body: 'Processing image...',
                    thumbnailUrl: THUMB_IMAGE,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: message });

        if (!imageUrl && imageBuffer) {
            const FormData = require('form-data');
            const form = new FormData();
            form.append('file', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
            const uploadRes = await axios.post('https://catbox.moe/user/api.php', form, {
                headers: { ...form.getHeaders(), 'User-Agent': 'WhatsApp-Bot' },
                timeout: 30000
            });
            imageUrl = uploadRes.data;
        }

        const apiUrl = `https://api-faa.my.id/faa/totua?url=${encodeURIComponent(imageUrl)}`;
        console.log('[AgeAI] Requesting:', apiUrl);

        const response = await axios.get(apiUrl, {
            responseType: 'arraybuffer',
            timeout: 90000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36',
                'Cookie': CF_CLEARANCE,
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
                'Referer': 'https://api-faa.my.id/',
                'Origin': 'https://api-faa.my.id'
            }
        });

        if (!response.data || response.data.length < 100) {
            throw new Error('Invalid response from API');
        }

        const agedImageBuffer = Buffer.from(response.data);

        await sock.sendMessage(chatId, {
            image: agedImageBuffer,
            caption: `👴 *Aging Complete*\n\nSuccessfully converted to an older version.\n\n> *© BATMAN MD*`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363367299421766@newsletter',
                    newsletterName: 'BATMAN MD',
                    serverMessageId: 13
                }
            }
        }, { quoted: fakeMeta });

        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('[AgeAI] Error:', error.message);
        if (error.code === 'ECONNABORTED') {
            await sock.sendMessage(chatId, { text: "❌ *Timeout* - AI took too long. Try again." }, { quoted: message });
        } else if (error.response?.status === 403 || error.response?.status === 503) {
            await sock.sendMessage(chatId, { text: "❌ *Cloudflare block* - Cookie may have expired. Contact bot owner." }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: `❌ *Failed:* ${error.message}` }, { quoted: message });
        }
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
    }
}

module.exports = ageAICommand;