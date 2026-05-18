const axios = require('axios');

async function nsfwCommand(sock, chatId, message, args) {
    try {
        // Group check removed – command now works in any chat
        const type = args.toLowerCase();
        
        const categories = {
            'waifu': 'https://api.waifu.pics/nsfw/waifu',
            'neko': 'https://api.waifu.pics/nsfw/neko',
            'trap': 'https://api.waifu.pics/nsfw/trap',
            'blowjob': 'https://api.waifu.pics/nsfw/blowjob',
            'hentai': 'https://nekos.life/api/v2/img/hentai',
            'hneko': 'https://nekos.life/api/v2/img/nsfw_neko_gif',
            'lewd': 'https://nekobot.xyz/api/image?type=lewd',
            'pussy': 'https://nekobot.xyz/api/image?type=pussy',
            'boobs': 'https://nekobot.xyz/api/image?type=boobs',
            'ass': 'https://nekobot.xyz/api/image?type=ass'
        };
        
        if (!type || !categories[type]) {
            const list = Object.keys(categories).map(c => `• ${c}`).join('\n');
            await sock.sendMessage(chatId, { 
                text: `🔞 *NSFW Commands*\n\nAvailable:\n${list}\n\nUsage: .nsfw <category>\nExample: .nsfw waifu`
            }, { quoted: message });
            return;
        }
        
        // React: 🔞
        await sock.sendMessage(chatId, { react: { text: "🔞", key: message.key } });
        
        const apiUrl = categories[type];
        const response = await axios.get(apiUrl, { timeout: 15000 });
        
        let imageUrl;
        if (apiUrl.includes('waifu.pics') || apiUrl.includes('nekos.life')) {
            imageUrl = response.data.url;
        } else if (apiUrl.includes('nekobot.xyz')) {
            imageUrl = response.data.message;
        }
        
        if (!imageUrl) throw new Error('No image');
        
        await sock.sendMessage(chatId, {
            image: { url: imageUrl },
            caption: `> *© BATMAN MD*`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363367299421766@newsletter',
                    newsletterName: 'BATMAN MD',
                    serverMessageId: 13
                }
            }
        }, { quoted: message });
        
        // React: ✅
        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('NSFW error:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
    }
}

module.exports = nsfwCommand;