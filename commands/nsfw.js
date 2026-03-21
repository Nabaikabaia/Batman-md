// commands/nsfw.js
const axios = require('axios');
const settings = require('../settings');

// ============================================
// NSFW COMMAND - 18+ Content
// ============================================
async function nsfwCommand(sock, chatId, message, args) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        
        // Check if user is adult (you can implement age verification if needed)
        // For now, we'll allow in private chat only
        if (isGroup) {
            return await sock.sendMessage(chatId, {
                text: `*『 🔞 NSFW 』*
╭─────────⟢
│ ❌ This command can only be used in private chat!
│
│ 🔒 NSFW content is restricted to private conversations.
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`
            }, { quoted: message });
        }

        const type = args.toLowerCase();
        
        // Available NSFW categories
        const categories = {
            'waifu': 'https://api.waifu.pics/nsfw/waifu',
            'neko': 'https://api.waifu.pics/nsfw/neko',
            'trap': 'https://api.waifu.pics/nsfw/trap',
            'blowjob': 'https://api.waifu.pics/nsfw/blowjob',
            'awoo': 'https://api.waifu.pics/nsfw/awoo',
            'hentai': 'https://nekos.life/api/v2/img/hentai',
            'hneko': 'https://nekos.life/api/v2/img/nsfw_neko_gif',
            'lewd': 'https://nekobot.xyz/api/image?type=lewd',
            'pussy': 'https://nekobot.xyz/api/image?type=pussy',
            'boobs': 'https://nekobot.xyz/api/image?type=boobs',
            'ass': 'https://nekobot.xyz/api/image?type=ass',
            'random': 'https://nekobot.xyz/api/image?type=pgif'
        };
        
        // Show categories if no argument provided
        if (!type) {
            const categoriesList = Object.keys(categories).map(c => `│ ♧ *${c}*`).join('\n');
            
            const usageMsg = `*『 🔞 NSFW COMMAND 』*
╭─────────⟢
│ ⚠️ *WARNING: 18+ Content Only!*
│
│ *Available categories:*
${categoriesList}
│
│ *Usage:* .nsfw <category>
│ *Example:* .nsfw waifu
│
│ *Note:* Private chat only
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
            
            return await sock.sendMessage(chatId, { text: usageMsg }, { quoted: message });
        }
        
        // Check if category exists
        if (!categories[type]) {
            return await sock.sendMessage(chatId, {
                text: `❌ Invalid category: *${type}*\n\nAvailable: ${Object.keys(categories).join(', ')}`
            }, { quoted: message });
        }
        
        // Send loading reaction
        await sock.sendMessage(chatId, { react: { text: '🔞', key: message.key } });
        
        // Fetch NSFW image
        const apiUrl = categories[type];
        const response = await axios.get(apiUrl, { timeout: 15000 });
        
        let imageUrl;
        
        // Handle different API response formats
        if (apiUrl.includes('waifu.pics')) {
            imageUrl = response.data.url;
        } else if (apiUrl.includes('nekos.life')) {
            imageUrl = response.data.url;
        } else if (apiUrl.includes('nekobot.xyz')) {
            imageUrl = response.data.message;
        } else {
            imageUrl = response.data.url || response.data.message;
        }
        
        if (!imageUrl) {
            throw new Error('No image URL received');
        }
        
        // Send the image
        await sock.sendMessage(chatId, {
            image: { url: imageUrl },
            caption: `*『 🔞 ${type.toUpperCase()} 』*\n\n⚠️ *18+ Content*\n\n> *Powered by BATMAN MD*`
        }, { quoted: message });
        
        // Remove reaction
        await sock.sendMessage(chatId, { react: { text: null, key: message.key } });
        
    } catch (error) {
        console.error('NSFW Command Error:', error);
        
        await sock.sendMessage(chatId, {
            text: `❌ *Failed to fetch content*\n\n🔧 Error: ${error.message}\n\n🔄 Please try again later.`
        }, { quoted: message });
        
        // Remove reaction on error
        await sock.sendMessage(chatId, { react: { text: null, key: message.key } });
    }
}

module.exports = nsfwCommand;
