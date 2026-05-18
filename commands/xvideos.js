// commands/xvideos.js
const axios = require('axios');
const cheerio = require('cheerio');

const newsletterContext = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363367299421766@newsletter',
            newsletterName: 'BATMAN MD',
            serverMessageId: 13
        }
    }
};

async function xvideosCommand(sock, chatId, message, args) {
    try {
        const query = args.join(' ').trim();
        
        if (!query) {
            await sock.sendMessage(chatId, { 
                text: "🎬 *XVideo Search*\n\nUsage: .xvideos <search term>\n\nExample: .xvideos stepmom"
            }, { quoted: message });
            return;
        }

        // React: 🔍
        await sock.sendMessage(chatId, { react: { text: "🔍", key: message.key } });

        const searchUrl = `https://www.xvideos.com/?k=${encodeURIComponent(query)}`;
        const { data: searchHtml } = await axios.get(searchUrl, {
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        const $ = cheerio.load(searchHtml);
        const firstResult = $(".thumb-block").first();
        const videoHref = firstResult.find("p.title a").attr("href");
        const videoTitle = firstResult.find("p.title a").text().trim();

        if (!videoHref) {
            await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
            await sock.sendMessage(chatId, { 
                text: `❌ No results found for: "${query}"`
            }, { quoted: message });
            return;
        }

        const videoPageUrl = `https://www.xvideos.com${videoHref}`;
        const { data: videoPageHtml } = await axios.get(videoPageUrl, {
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        const $$ = cheerio.load(videoPageHtml);
        const scriptContent = $$("script")
            .filter((i, el) => $$(el).html()?.includes("setVideoUrlHigh"))
            .first()
            .html();

        const match = scriptContent?.match(/setVideoUrlHigh\('(.*?)'\)/);
        const directVideoUrl = match ? match[1] : null;

        if (!directVideoUrl) {
            await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
            return;
        }

        // Check file size
        const head = await axios.head(directVideoUrl, {
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const size = parseInt(head.headers["content-length"] || "0");
        const maxSize = 100 * 1024 * 1024; // 15MB limit

        if (size > maxSize) {
            await sock.sendMessage(chatId, { react: { text: "⚠️", key: message.key } });
            await sock.sendMessage(chatId, { 
                text: `⚠️ Video too large (${(size / 1024 / 1024).toFixed(2)}MB). Max 50MB allowed.`
            }, { quoted: message });
            return;
        }

        // React: 📥
        await sock.sendMessage(chatId, { react: { text: "📥", key: message.key } });

        await sock.sendMessage(chatId, {
            video: { url: directVideoUrl },
            mimetype: 'video/mp4',
            caption: `💦 *${videoTitle}*\n\n> *© BATMAN MD*`,
            ...newsletterContext
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('xvideos error:', error.message);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        await sock.sendMessage(chatId, { 
            text: "❌ Failed to fetch video. Try another search term."
        }, { quoted: message });
    }
}

module.exports = xvideosCommand;