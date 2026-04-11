const axios = require('axios');

// ============================================
// ENHANCEMENT: Newsletter channel info
// ============================================
const channelInfo = {
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

// ============================================
// ENHANCEMENT: Helper function for stylish messages
// ============================================
function formatApkMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        search: '🔍',
        download: '📥',
        apk: '📦'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

async function apkCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const query = text.split(' ').slice(1).join(' ').trim();

        if (!query) {
            const usageMsg = formatApkMessage(
                'APK DOWNLOADER',
                `│ 📦 Download Android apps directly!\n│\n│ *Usage:* .apk <app name>\n│\n│ *Example:* .apk whatsapp\n│ .apk spotify\n│ .apk instagram`,
                'apk'
            );
            return await sock.sendMessage(chatId, { 
                text: usageMsg,
                ...channelInfo
            }, { quoted: message });
        }

        // Send reaction
        await sock.sendMessage(chatId, {
            react: { text: '🔍', key: message.key }
        });

        // Loading message
        const searchingMsg = formatApkMessage(
            'SEARCHING',
            `│ 🔍 Searching for *${query}*...\n│ ⏳ Please wait.`,
            'search'
        );
        await sock.sendMessage(chatId, { 
            text: searchingMsg,
            ...channelInfo
        }, { quoted: message });

        // Aptoide API endpoint
        const apiUrl = `http://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(query)}/limit=1`;
        const response = await axios.get(apiUrl, { timeout: 10000 });
        const data = response.data;

        if (!data || !data.datalist || !data.datalist.list || data.datalist.list.length === 0) {
            const notFoundMsg = formatApkMessage(
                'NOT FOUND',
                `│ ❌ No results found for *${query}*.\n│\n│ 🔍 Try a different search term.`,
                'error'
            );
            return await sock.sendMessage(chatId, { 
                text: notFoundMsg,
                ...channelInfo
            }, { quoted: message });
        }

        const app = data.datalist.list[0];
        
        // Format file size
        const appSize = app.files?.[0]?.filesize 
            ? (app.files[0].filesize / 1048576).toFixed(2) 
            : (app.size / 1048576).toFixed(2);
        
        // Format date
        const updated = app.updated ? new Date(app.updated * 1000).toLocaleDateString() : 'Unknown';
        
        // Get download URL
        const downloadUrl = app.file?.path_alt || app.file?.path || app.files?.[0]?.path;

        if (!downloadUrl) {
            throw new Error('No download URL found');
        }

        // Update reaction
        await sock.sendMessage(chatId, {
            react: { text: '📥', key: message.key }
        });

        // Prepare caption
        const caption = `╭━━⪨ *APK Downloader* ⪩━━┈⊷
┃ 📦 *NAME:* ${app.name || 'Unknown'}
┃ 🏋 *SIZE:* ${appSize} MB
┃ 📦 *PACKAGE:* ${app.package || 'Unknown'}
┃ 📅 *UPDATED:* ${updated}
┃ 👨‍💻 *DEVELOPER:* ${app.developer?.name || 'Unknown'}
┃ ⭐ *RATING:* ${app.stats?.rating?.avg ? app.stats.rating.avg.toFixed(1) : 'N/A'} (${app.stats?.rating?.total || 0} votes)
╰━━━━━━━━━━━━━━━┈⊷

𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 BATMAN MD`;

        // Send the APK file
        await sock.sendMessage(chatId, {
            document: { url: downloadUrl },
            mimetype: 'application/vnd.android.package-archive',
            fileName: `${app.name || 'app'}.apk`,
            caption: caption,
            ...channelInfo
        }, { quoted: message });

        // Remove reaction
        await sock.sendMessage(chatId, {
            react: { text: null, key: message.key }
        });

    } catch (error) {
        console.error("APK command error:", error);
        
        // Remove reaction if it exists
        try {
            await sock.sendMessage(chatId, {
                react: { text: null, key: message.key }
            });
        } catch (_) {}

        const errorMsg = formatApkMessage(
            'ERROR',
            `│ ❌ Failed to download APK.\n│ 🔧 ${error.message || 'Unknown error'}\n│\n│ 🔄 Please try again later.`,
            'error'
        );
        await sock.sendMessage(chatId, { 
            text: errorMsg,
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = apkCommand;