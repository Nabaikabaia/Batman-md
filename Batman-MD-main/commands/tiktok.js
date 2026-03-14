const { ttdl } = require("ruhend-scraper");
const axios = require('axios');

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
function formatTikTokMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        video: '🎬',
        music: '🎵',
        download: '📥',
        link: '🔗'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

async function tiktokCommand(sock, chatId, message) {
    try {
        // Check if message has already been processed
        if (processedMessages.has(message.key.id)) {
            return;
        }
        
        // Add message ID to processed set
        processedMessages.add(message.key.id);
        
        // Clean up old message IDs after 5 minutes
        setTimeout(() => {
            processedMessages.delete(message.key.id);
        }, 5 * 60 * 1000);

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        
        if (!text) {
            // ENHANCEMENT: Stylish usage message
            const usageMsg = formatTikTokMessage(
                'TIKTOK DOWNLOADER',
                `│ 🎬 Download TikTok videos without watermark!\n│\n│ *Usage:* .tiktok <link>\n│\n│ *Example:* .tiktok https://tiktok.com/@user/video/123`,
                'video'
            );
            return await sock.sendMessage(chatId, { 
                text: usageMsg,
                ...channelInfo
            });
        }

        // Extract URL from command
        const url = text.split(' ').slice(1).join(' ').trim();
        
        if (!url) {
            // ENHANCEMENT: Stylish missing URL message
            const missingUrlMsg = formatTikTokMessage(
                'URL REQUIRED',
                `│ 🔗 Please provide a TikTok link.\n│\n│ *Example:* .tiktok https://tiktok.com/@user/video/123`,
                'link'
            );
            return await sock.sendMessage(chatId, { 
                text: missingUrlMsg,
                ...channelInfo
            });
        }

        // Check for various TikTok URL formats
        const tiktokPatterns = [
            /https?:\/\/(?:www\.)?tiktok\.com\//,
            /https?:\/\/(?:vm\.)?tiktok\.com\//,
            /https?:\/\/(?:vt\.)?tiktok\.com\//,
            /https?:\/\/(?:www\.)?tiktok\.com\/@/,
            /https?:\/\/(?:www\.)?tiktok\.com\/t\//
        ];

        const isValidUrl = tiktokPatterns.some(pattern => pattern.test(url));
        
        if (!isValidUrl) {
            // ENHANCEMENT: Stylish invalid URL message
            const invalidUrlMsg = formatTikTokMessage(
                'INVALID LINK',
                `│ ❌ That is not a valid TikTok link.\n│ 🔗 Please provide a valid TikTok video link.`,
                'error'
            );
            return await sock.sendMessage(chatId, { 
                text: invalidUrlMsg,
                ...channelInfo
            });
        }

        await sock.sendMessage(chatId, {
            react: { text: '🔄', key: message.key }
        });

        // Processing message
        const processingMsg = formatTikTokMessage(
            'DOWNLOADING',
            `│ 📥 Downloading TikTok video...\n│ 🔗 ${url.substring(0, 50)}${url.length > 50 ? '...' : ''}\n│\n│ ⏳ Please wait...`,
            'download'
        );
        await sock.sendMessage(chatId, { 
            text: processingMsg,
            ...channelInfo
        }, { quoted: message });

        try {
            // Use only Siputzx API
            const apiUrl = `https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`;

            let videoUrl = null;
            let audioUrl = null;
            let title = null;

            // Call Siputzx API
            try {
                const response = await axios.get(apiUrl, { 
                    timeout: 15000,
                    headers: {
                        'accept': '*/*',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                if (response.data && response.data.status) {
                    // Check if the API returned video data
                    if (response.data.data) {
                        // Check for urls array first (this is the main response format)
                        if (response.data.data.urls && Array.isArray(response.data.data.urls) && response.data.data.urls.length > 0) {
                            // Use the first URL from the urls array (usually HD quality)
                            videoUrl = response.data.data.urls[0];
                            title = response.data.data.metadata?.title || "TikTok Video";
                        } else if (response.data.data.video_url) {
                            videoUrl = response.data.data.video_url;
                            title = response.data.data.metadata?.title || "TikTok Video";
                        } else if (response.data.data.url) {
                            videoUrl = response.data.data.url;
                            title = response.data.data.metadata?.title || "TikTok Video";
                        } else if (response.data.data.download_url) {
                            videoUrl = response.data.data.download_url;
                            title = response.data.data.metadata?.title || "TikTok Video";
                        } else {
                            throw new Error("No video URL found in Siputzx API response");
                        }
                    } else {
                        throw new Error("No data field in Siputzx API response");
                    }
                } else {
                    throw new Error("Invalid Siputzx API response");
                }
            } catch (apiError) {
                console.error(`Siputzx API failed: ${apiError.message}`);
            }

            // If Siputzx API didn't work, try the original ttdl method
            if (!videoUrl) {
                try {
                    let downloadData = await ttdl(url);
                    if (downloadData && downloadData.data && downloadData.data.length > 0) {
                        const mediaData = downloadData.data;
                        for (let i = 0; i < Math.min(20, mediaData.length); i++) {
                            const media = mediaData[i];
                            const mediaUrl = media.url;

                            // Check if URL ends with common video extensions
                            const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) || 
                                          media.type === 'video';

                            const caption = `𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 BATMAN MD\n\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
                            
                            if (isVideo) {
                                await sock.sendMessage(chatId, {
                                    video: { url: mediaUrl },
                                    mimetype: "video/mp4",
                                    caption: caption,
                                    ...channelInfo
                                }, { quoted: message });
                            } else {
                                await sock.sendMessage(chatId, {
                                    image: { url: mediaUrl },
                                    caption: caption,
                                    ...channelInfo
                                }, { quoted: message });
                            }
                        }
                        return;
                    }
                } catch (ttdlError) {
                    console.error("ttdl fallback also failed:", ttdlError.message);
                }
            }

            // Send the video if we got a URL from the APIs
            if (videoUrl) {
                try {
                    // Download video as buffer
                    const videoResponse = await axios.get(videoUrl, {
                        responseType: 'arraybuffer',
                        timeout: 60000,
                        maxContentLength: 100 * 1024 * 1024, // 100MB limit
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'video/mp4,video/*,*/*;q=0.9',
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Accept-Encoding': 'gzip, deflate, br',
                            'Connection': 'keep-alive',
                            'Referer': 'https://www.tiktok.com/'
                        }
                    });
                    
                    const videoBuffer = Buffer.from(videoResponse.data);
                    
                    // Validate video buffer
                    if (videoBuffer.length === 0) {
                        throw new Error("Video buffer is empty");
                    }
                    
                    // Check if it's a valid video file (starts with video file signatures)
                    const isValidVideo = videoBuffer.length > 1000 && (
                        videoBuffer.toString('hex', 0, 4) === '000001ba' || // MP4
                        videoBuffer.toString('hex', 0, 4) === '000001b3' || // MP4
                        videoBuffer.toString('hex', 0, 8) === '0000001866747970' || // MP4
                        videoBuffer.toString('hex', 0, 4) === '1a45dfa3' // WebM
                    );
                    
                    if (!isValidVideo && videoBuffer.length < 10000) {
                        const bufferText = videoBuffer.toString('utf8', 0, 200);
                        if (bufferText.includes('error') || bufferText.includes('blocked') || bufferText.includes('403')) {
                            throw new Error("Received error page instead of video");
                        }
                    }
                    
                    // ENHANCEMENT: Stylish success caption
                    const successCaption = `✨ *TikTok Downloaded!*

📝 *Title:* ${title || 'TikTok Video'}
📥 *Format:* Video MP4

𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 BATMAN MD

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
                    
                    await sock.sendMessage(chatId, {
                        video: videoBuffer,
                        mimetype: "video/mp4",
                        caption: successCaption,
                        ...channelInfo
                    }, { quoted: message });

                    // If we have audio URL, download and send it as well
                    if (audioUrl) {
                        try {
                            const audioResponse = await axios.get(audioUrl, {
                                responseType: 'arraybuffer',
                                timeout: 30000,
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                                }
                            });
                            
                            const audioBuffer = Buffer.from(audioResponse.data);
                            
                            const audioCaption = `🎵 *TikTok Audio*\n\n📝 *Title:* ${title || 'TikTok Audio'}\n\n𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 BATMAN MD\n\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
                            
                            await sock.sendMessage(chatId, {
                                audio: audioBuffer,
                                mimetype: "audio/mp3",
                                caption: audioCaption,
                                ...channelInfo
                            }, { quoted: message });
                        } catch (audioError) {
                            console.error(`Failed to download audio: ${audioError.message}`);
                        }
                    }
                    return;
                } catch (downloadError) {
                    console.error(`Failed to download video: ${downloadError.message}`);
                    // Fallback to URL method
                    try {
                        const successCaption = `✨ *TikTok Downloaded!*\n\n📝 *Title:* ${title || 'TikTok Video'}\n\n𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 BATMAN MD\n\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
                        
                        await sock.sendMessage(chatId, {
                            video: { url: videoUrl },
                            mimetype: "video/mp4",
                            caption: successCaption,
                            ...channelInfo
                        }, { quoted: message });
                        return;
                    } catch (urlError) {
                        console.error(`URL method also failed: ${urlError.message}`);
                    }
                }
            }

            // If we reach here, no method worked
            const failedMsg = formatTikTokMessage(
                'DOWNLOAD FAILED',
                `│ ❌ Failed to download TikTok video.\n│\n│ *Possible reasons:*\n│ • Video is private\n│ • Video unavailable\n│ • All download sources failed\n│\n│ 🔄 Try a different link.`,
                'error'
            );
            return await sock.sendMessage(chatId, { 
                text: failedMsg,
                ...channelInfo
            }, { quoted: message });
        } catch (error) {
            console.error('Error in TikTok download:', error);
            
            const errorMsg = formatTikTokMessage(
                'DOWNLOAD ERROR',
                `│ ❌ Failed to download the TikTok video.\n│ 🔧 ${error.message}\n│\n│ 🔄 Please try again with a different link.`,
                'error'
            );
            
            await sock.sendMessage(chatId, { 
                text: errorMsg,
                ...channelInfo
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in TikTok command:', error);
        
        const errorMsg = formatTikTokMessage(
            'SYSTEM ERROR',
            `│ ❌ An error occurred while processing\n│    your request.\n│ 🔧 ${error.message}\n│\n│ 🔄 Please try again later.`,
            'error'
        );
        
        await sock.sendMessage(chatId, { 
            text: errorMsg,
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = tiktokCommand;