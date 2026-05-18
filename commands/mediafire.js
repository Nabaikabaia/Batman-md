// commands/mediafire.js
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

// Helper: format bytes to human readable
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Main mediafire extraction function
async function extractMediafire(url) {
    // Validate URL format
    const mediaRegex = /https?:\/\/(www\.)?mediafire\.com\/(file|folder)\/([a-zA-Z0-9]+)/;
    const match = mediaRegex.exec(url);
    if (!match) throw new Error('Invalid MediaFire link format');

    const quickKey = match[3]; // file ID

    // 1. Fetch page to get download button URL
    const pageRes = await axios.get(url, {
        timeout: 30000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    const $ = cheerio.load(pageRes.data);
    const downloadUrl = $('#downloadButton').attr('href');
    if (!downloadUrl) throw new Error('Could not extract download link');

    // 2. Fetch file info from MediaFire API
    const apiUrl = `https://www.mediafire.com/api/1.5/file/get_info.php?response_format=json&quick_key=${quickKey}`;
    const apiRes = await axios.get(apiUrl, { timeout: 15000 });
    const json = apiRes.data;

    if (json.response?.result !== 'Success') throw new Error('API failed: ' + (json.response?.message || 'Unknown error'));

    const info = json.response.file_info;
    const sizeBytes = parseInt(info.size) || 0;

    return {
        filename: info.filename,
        size: sizeBytes,
        sizeReadable: formatBytes(sizeBytes),
        filetype: info.filetype,
        mimetype: info.mimetype || 'application/octet-stream',
        privacy: info.privacy,
        owner_name: info.owner_name,
        download: downloadUrl
    };
}

async function mediafireCommand(sock, chatId, message, args) {
    const url = args.join(' ').trim();

    if (!url) {
        await sock.sendMessage(chatId, {
            text: "📦 *MediaFire Downloader*\n\nUsage: .mediafire <link>\nExample: .mediafire https://www.mediafire.com/file/xxxxx",
            ...newsletterContext
        }, { quoted: message });
        return;
    }

    // Quick validation
    if (!url.includes('mediafire.com')) {
        await sock.sendMessage(chatId, { text: "❌ Invalid MediaFire link." }, { quoted: message });
        return;
    }

    await sock.sendMessage(chatId, { react: { text: "📦", key: message.key } });

    try {
        const fileData = await extractMediafire(url);

        // Send file info as caption
        const infoText = `📄 *${fileData.filename}*\n💾 *Size:* ${fileData.sizeReadable}\n📁 *Type:* ${fileData.filetype}\n👤 *Owner:* ${fileData.owner_name || 'Unknown'}\n🔒 *Privacy:* ${fileData.privacy || 'Public'}\n\n> *© BATMAN MD*`;

        // Send document (file) with info as caption
        await sock.sendMessage(chatId, {
            document: { url: fileData.download },
            fileName: fileData.filename,
            mimetype: fileData.mimetype,
            caption: infoText,
            ...newsletterContext
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('[MediaFire] Error:', error.message);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        await sock.sendMessage(chatId, {
            text: `❌ Failed to fetch file.\nReason: ${error.message}`,
            ...newsletterContext
        }, { quoted: message });
    }
}

module.exports = mediafireCommand;