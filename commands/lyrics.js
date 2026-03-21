const fetch = require('node-fetch');
const settings = require('../settings');

// ============================================
// Newsletter channel info
// ============================================
const channelInfo = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: settings.newsletterJid,
            newsletterName: settings.newsletterName,
            serverMessageId: 13
        }
    }
};

// ============================================
// Helper function for stylish messages
// ============================================
function formatLyricsMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        lyrics: '🎵',
        artist: '🎤',
        link: '🔗'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

async function lyricsCommand(sock, chatId, songTitle, message) {
    if (!songTitle) {
        const usageMsg = formatLyricsMessage(
            'LYRICS SEARCH',
            `│ 🔍 Find lyrics for your favorite songs!\n│\n│ *Usage:* .lyrics <song name>\n│\n│ *Examples:*\n│ ♧ .lyrics Dynasty Miaa\n│ ♧ .lyrics Blinding Lights\n│ ♧ .lyrics Someone Like You`,
            'lyrics'
        );
        await sock.sendMessage(chatId, { 
            text: usageMsg,
            ...channelInfo
        }, { quoted: message });
        return;
    }

    // Send processing reaction
    await sock.sendMessage(chatId, {
        react: { text: '🎵', key: message.key }
    });

    try {
        // Use GiftedTech Lyrics API
        const apiUrl = `https://api.giftedtech.co.ke/api/search/lyrics?apikey=gifted&query=${encodeURIComponent(songTitle)}`;
        const res = await fetch(apiUrl);
        
        if (!res.ok) {
            throw new Error(`API returned status ${res.status}`);
        }
        
        const data = await res.json();

        // Check if API returned success
        if (!data.success || !data.result) {
            const notFoundMsg = formatLyricsMessage(
                'NOT FOUND',
                `│ ❌ Sorry, I couldn't find any lyrics for\n│    "${songTitle}".\n│\n│ 🔍 Try a different search term.`,
                'error'
            );
            await sock.sendMessage(chatId, {
                text: notFoundMsg,
                ...channelInfo
            }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return;
        }

        const result = data.result;
        const artist = result.artist || 'Unknown Artist';
        const title = result.title || songTitle;
        const lyrics = result.lyrics || '';
        const link = result.link || '';
        
        if (!lyrics) {
            const noLyricsMsg = formatLyricsMessage(
                'NO LYRICS',
                `│ ❌ No lyrics found for "${title}" by ${artist}.\n│\n│ 🔗 *Genius Link:* ${link || 'Not available'}`,
                'warning'
            );
            await sock.sendMessage(chatId, {
                text: noLyricsMsg,
                ...channelInfo
            }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return;
        }

        // Format the lyrics for better readability
        let formattedLyrics = lyrics
            .replace(/\\n/g, '\n') // Fix escaped newlines
            .replace(/\[(.*?)\]/g, '\n*[$1]*\n') // Make section headers bold
            .replace(/\n{3,}/g, '\n\n'); // Remove excessive line breaks

        // Create header with song info
        const header = `🎵 *${title}* - *${artist}*\n\n`;
        
        const maxChars = 4096;
        let output = header + formattedLyrics;
        
        if (output.length > maxChars) {
            output = header + formattedLyrics.slice(0, maxChars - header.length - 3) + '...';
        }

        // Try to send the lyrics
        await sock.sendMessage(chatId, { 
            text: output,
            ...channelInfo
        }, { quoted: message });
        
        // Send success reaction
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

        // Optional: Send Genius link as a separate message
        if (link) {
            const linkMsg = formatLyricsMessage(
                'SOURCE',
                `│ 🔗 *Read more on Genius:*\n│ ${link}`,
                'link'
            );
            await sock.sendMessage(chatId, { 
                text: linkMsg,
                ...channelInfo
            }, { quoted: message });
        }

    } catch (error) {
        console.error('Error in lyrics command:', error);
        
        const errorMsg = formatLyricsMessage(
            'ERROR',
            `│ ❌ An error occurred while fetching lyrics.\n│ 🔧 ${error.message}\n│\n│ 🔄 Please try again later.`,
            'error'
        );
        
        await sock.sendMessage(chatId, { 
            text: errorMsg,
            ...channelInfo
        }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = { lyricsCommand };