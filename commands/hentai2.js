
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

async function hentai2Command(sock, chatId, message, args) {
    try {
        const query = args.join(' ') || 'school';

        // React: 
        await sock.sendMessage(chatId, { react: { text: "🔞", key: message.key } });

        // Step 1: Search
        const searchUrl = `https://hentaihaven.xxx/search/${encodeURIComponent(query)}/`;
        const { data: searchHtml } = await axios.get(searchUrl, {
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $ = cheerio.load(searchHtml);
        const results = [];

        $('.item').slice(0, 5).each((i, el) => {
            const title = $(el).find('.data h3').text().trim();
            const url = $(el).find('a').attr('href');
            const thumb = $(el).find('img').attr('src');
            if (title && url && thumb) {
                results.push({ title, url, thumb });
            }
        });

        if (!results.length) {
            await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
            return;
        }

        // Step 2: Pick first result
        const { title, url, thumb } = results[0];

        const { data: pageHtml } = await axios.get(url, {
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $$ = cheerio.load(pageHtml);
        const scriptTag = $$('script').filter((i, el) =>
            $$(el).html().includes('sources')
        ).first().html();

        const match = scriptTag?.match(/sources:\s*\[{file:\s*"(.*?)"/);
        const videoUrl = match ? match[1] : null;

        if (!videoUrl) {
            await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
            return;
        }

        // React: 📥
        await sock.sendMessage(chatId, { react: { text: "📥", key: message.key } });

        // Send video with thumbnail preview
        await sock.sendMessage(chatId, {
            video: { url: videoUrl },
            mimetype: 'video/mp4',
            caption: `🔞*${title}*\n\n> *© BATMAN MD*`,
            contextInfo: {
                ...newsletterContext.contextInfo,
                externalAdReply: {
                    title: title,
                    body: '🔞 Hentai Video',
                    thumbnailUrl: thumb,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    sourceUrl: url,
                    thumbnailHeight: 400,
                    thumbnailWidth: 400
                }
            }
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('Hentai2 error:', error.message);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        await sock.sendMessage(chatId, { 
            text: "❌ Failed to fetch anime. Try again later."
        }, { quoted: message });
    }
}

module.exports = hentai2Command;