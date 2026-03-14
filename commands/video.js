const axios = require('axios');
const yts = require('yt-search');

// ============================================
// ENHANCEMENT: Quoted contact template (from your vv command)
// ============================================
const quotedContact = {
  key: {
    fromMe: false,
    participant: `0@s.whatsapp.net`,
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "NABEES TECH",
      vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:BATMAN MD\nORG:BATMAN MD;\nTEL;type=CELL;type=VOICE;waid=+2347072182960:+2347072182960\nEND:VCARD"
    }
  }
};

// ============================================
// ENHANCEMENT: Newsletter channel info with correct JID
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
function formatVideoMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        video: '🎬',
        search: '🔍',
        download: '📥',
        youtube: '▶️'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

async function tryRequest(getter, attempts = 3) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await getter();
        } catch (err) {
            lastError = err;
            if (attempt < attempts) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }
    }
    throw lastError;
}

// EliteProTech API - Primary
async function getEliteProTechVideoByUrl(youtubeUrl) {
    const apiUrl = `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(youtubeUrl)}&format=mp4`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.success && res?.data?.downloadURL) {
        return {
            download: res.data.downloadURL,
            title: res.data.title
        };
    }
    throw new Error('EliteProTech ytdown returned no download');
}

async function getYupraVideoByUrl(youtubeUrl) {
    const apiUrl = `https://api.yupra.my.id/api/downloader/ytmp4?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.success && res?.data?.data?.download_url) {
        return {
            download: res.data.data.download_url,
            title: res.data.data.title,
            thumbnail: res.data.data.thumbnail
        };
    }
    throw new Error('Yupra returned no download');
}

async function getOkatsuVideoByUrl(youtubeUrl) {
    const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    // shape: { status, creator, url, result: { status, title, mp4 } }
    if (res?.data?.result?.mp4) {
        return { download: res.data.result.mp4, title: res.data.result.title };
    }
    throw new Error('Okatsu ytmp4 returned no mp4');
}

async function videoCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const searchQuery = text.split(' ').slice(1).join(' ').trim();
        
        
        if (!searchQuery) {
            // ENHANCEMENT: Stylish usage message
            const usageMsg = formatVideoMessage(
                'VIDEO DOWNLOADER',
                `│ 🎬 Download YouTube videos in MP4!\n│\n│ *Usage:* .video <name or link>\n│\n│ *Example:*\n│ ♧ .video shape of you\n│ ♧ .video https://youtu.be/...`,
                'video'
            );
            await sock.sendMessage(chatId, { 
                text: usageMsg,
                ...channelInfo 
            }, { quoted: quotedContact });
            return;
        }

        // Determine if input is a YouTube link
        let videoUrl = '';
        let videoTitle = '';
        let videoThumbnail = '';
        if (searchQuery.startsWith('http://') || searchQuery.startsWith('https://')) {
            videoUrl = searchQuery;
        } else {
            // Search YouTube for the video
            const { videos } = await yts(searchQuery);
            if (!videos || videos.length === 0) {
                // ENHANCEMENT: Stylish no results message
                const noResultsMsg = formatVideoMessage(
                    'NO RESULTS',
                    `│ 🔍 No videos found for:\n│ ♧ "${searchQuery}"\n│\n│ Try a different search term.`,
                    'search'
                );
                await sock.sendMessage(chatId, { 
                    text: noResultsMsg,
                    ...channelInfo 
                }, { quoted: quotedContact });
                return;
            }
            videoUrl = videos[0].url;
            videoTitle = videos[0].title;
            videoThumbnail = videos[0].thumbnail;
        }

        // Send thumbnail immediately
        try {
            const ytId = (videoUrl.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/) || [])[1];
            const thumb = videoThumbnail || (ytId ? `https://i.ytimg.com/vi/${ytId}/sddefault.jpg` : undefined);
            const captionTitle = videoTitle || searchQuery;
            if (thumb) {
                // ENHANCEMENT: Stylish downloading message
                const downloadingMsg = formatVideoMessage(
                    'PROCESSING',
                    `│ ▶️ *Title:* ${captionTitle}\n│ 📥 Downloading your video...\n│ ⏳ Please wait.`,
                    'youtube'
                );
                
                await sock.sendMessage(chatId, {
                    image: { url: thumb },
                    caption: downloadingMsg,
                    ...channelInfo
                }, { quoted: quotedContact });
            }
        } catch (e) { console.error('[VIDEO] thumb error:', e?.message || e); }
        

        // Validate YouTube URL
        let urls = videoUrl.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi);
        if (!urls) {
            // ENHANCEMENT: Stylish invalid link message
            const invalidMsg = formatVideoMessage(
                'INVALID LINK',
                `│ ❌ This is not a valid YouTube link!`,
                'error'
            );
            await sock.sendMessage(chatId, { 
                text: invalidMsg,
                ...channelInfo 
            }, { quoted: quotedContact });
            return;
        }

        // Try multiple APIs with fallback chain: EliteProTech -> Yupra -> Okatsu
        let videoData;
        let downloadSuccess = false;
        
        // List of API methods to try
        const apiMethods = [
            { name: 'EliteProTech', method: () => getEliteProTechVideoByUrl(videoUrl) },
            { name: 'Yupra', method: () => getYupraVideoByUrl(videoUrl) },
            { name: 'Okatsu', method: () => getOkatsuVideoByUrl(videoUrl) }
        ];
        
        // Try each API until we successfully get video data
        for (const apiMethod of apiMethods) {
            try {
                videoData = await apiMethod.method();
                const videoUrl_check = videoData.download || videoData.dl || videoData.url;
                
                if (!videoUrl_check) {
                    console.log(`${apiMethod.name} returned no download URL, trying next API...`);
                    continue; // Try next API
                }
                
                downloadSuccess = true;
                break; // Success! Exit the loop
            } catch (apiErr) {
                // API call failed, try next API
                console.log(`${apiMethod.name} API failed:`, apiErr.message);
                continue;
            }
        }
        
        // If all APIs failed, throw error
        if (!downloadSuccess || !videoData) {
            throw new Error('All download sources failed. The content may be unavailable or blocked in your region.');
        }

        // ENHANCEMENT: Stylish success caption
        const successCaption = `✨ *Video Downloaded!*

▶️ *Title:* ${videoData.title || videoTitle || 'Video'}
📥 *Format:* MP4

𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 BATMAN MD

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;

        // Send video directly using the download URL
        await sock.sendMessage(chatId, {
            video: { url: videoData.download || videoData.dl || videoData.url },
            mimetype: 'video/mp4',
            fileName: `${(videoData.title || videoTitle || 'video').replace(/[^\w\s-]/g, '')}.mp4`,
            caption: successCaption,
            ...channelInfo
        }, { quoted: quotedContact });


    } catch (error) {
        console.error('[VIDEO] Command Error:', error?.message || error);
        
        // Provide more specific error messages
        let errorTitle = 'DOWNLOAD FAILED';
        let errorContent = '❌ Failed to download video.';
        
        if (error.message && error.message.includes('blocked')) {
            errorTitle = 'BLOCKED';
            errorContent = '❌ Download blocked. The content may be unavailable in your region or due to legal restrictions.';
        } else if (error.response?.status === 451 || error.status === 451) {
            errorTitle = 'CONTENT UNAVAILABLE';
            errorContent = '❌ Content unavailable (451). This may be due to legal restrictions or regional blocking.';
        } else if (error.message && error.message.includes('All download sources failed')) {
            errorTitle = 'ALL SOURCES FAILED';
            errorContent = '❌ All download sources failed. The content may be unavailable or blocked.';
        }
        
        const errorMsg = formatVideoMessage(
            errorTitle,
            `│ ${errorContent}\n│ 🔧 ${error.message || 'Unknown error'}`,
            'error'
        );
        
        await sock.sendMessage(chatId, { 
            text: errorMsg,
            ...channelInfo 
        }, { quoted: quotedContact });
    }
}

module.exports = videoCommand;