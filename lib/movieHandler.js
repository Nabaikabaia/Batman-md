// lib/movieHandler.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
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

// Helper function to stream video directly to WhatsApp without loading entire file into memory
async function streamVideoToWhatsApp(sock, chatId, downloadUrl, caption, quotedMessage) {
    return new Promise(async (resolve, reject) => {
        try {
            // Create a temp file path
            const tempDir = path.join(process.cwd(), 'temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            
            const tempFile = path.join(tempDir, `download_${Date.now()}.mp4`);
            
            // Download video in chunks using stream
            const writer = fs.createWriteStream(tempFile);
            
            const response = await axios({
                method: 'get',
                url: downloadUrl,
                responseType: 'stream',
                timeout: 120000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'video/mp4,video/*,*/*',
                    'Connection': 'keep-alive',
                    'Referer': 'https://www.aoneroom.com/'
                }
            });
            
            let downloadedSize = 0;
            let lastProgress = 0;
            
            response.data.on('data', (chunk) => {
                downloadedSize += chunk.length;
                // Log progress every 5MB
                const progressMB = Math.floor(downloadedSize / 1024 / 1024);
                if (progressMB > lastProgress) {
                    lastProgress = progressMB;
                    console.log(`📥 Downloading: ${progressMB}MB downloaded`);
                }
            });
            
            response.data.pipe(writer);
            
            writer.on('finish', async () => {
                try {
                    // Check file size
                    const stats = fs.statSync(tempFile);
                    const fileSizeMB = stats.size / 1024 / 1024;
                    
                    if (stats.size === 0) {
                        throw new Error('Downloaded file is empty');
                    }
                    
                    console.log(`✅ Download complete: ${fileSizeMB.toFixed(2)}MB`);
                    
                    // Send the file from disk with newsletter context
                    await sock.sendMessage(chatId, {
                        video: { url: tempFile },
                        mimetype: 'video/mp4',
                        caption: caption,
                        ...channelInfo
                    }, { quoted: quotedMessage });
                    
                    // Clean up temp file after sending
                    setTimeout(() => {
                        fs.unlink(tempFile, (err) => {
                            if (err) console.error('Error deleting temp file:', err);
                            else console.log('🗑️ Temp file deleted');
                        });
                    }, 5000);
                    
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
            
            writer.on('error', reject);
            response.data.on('error', reject);
            
        } catch (error) {
            reject(error);
        }
    });
}

// Helper function to fetch subtitle with proper headers
async function fetchSubtitle(url) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/plain,application/octet-stream,*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Referer': 'https://www.aoneroom.com/'
            }
        });
        return Buffer.from(response.data);
    } catch (error) {
        console.error('Fetch subtitle error:', error.message);
        throw error;
    }
}

const BASE_URL = 'https://mumubmrvkqcgzidqubcc.supabase.co/functions/v1/movies/api';

// Format rating with stars
function formatRating(rating, count) {
    if (!rating || rating === '0') return '⭐ Not Rated';
    const stars = '⭐'.repeat(Math.min(Math.floor(rating), 5));
    const num = parseFloat(rating).toFixed(1);
    return `${stars} ${num}/10 ${count ? `(${count.toLocaleString()} votes)` : ''}`;
}

// Format duration
function formatDuration(seconds) {
    if (!seconds || seconds === 0) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

// Truncate text
function truncate(text, maxLength = 200) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Handle movie selection - shows movie details and available options
async function handleMovieSelection(sock, chatId, message, subjectId) {
    await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
    
    try {
        const detailUrl = `${BASE_URL}/info/${subjectId}`;
        const { data } = await axios.get(detailUrl, { timeout: 30000 });
        
        if (!data.success) throw new Error('Failed to fetch movie details');
        
        const subject = data.results.subject;
        const isSeries = subject.subjectType === 2;
        const rating = formatRating(subject.imdbRatingValue, subject.imdbRatingCount);
        const duration = formatDuration(subject.duration);
        const description = truncate(subject.description || 'No description available', 200);
        const currentPrefix = '.';
        
        let infoText = `*${isSeries ? '📺 SERIES DETAILS' : '🎬 MOVIE DETAILS'}*\n\n`;
        infoText += `*${subject.title}*\n\n`;
        infoText += `📅 *Release:* ${subject.releaseDate ? new Date(subject.releaseDate).toLocaleDateString() : 'N/A'}\n`;
        infoText += `🎭 *Genre:* ${subject.genre || 'N/A'}\n`;
        infoText += `${rating}\n`;
        infoText += `🌍 *Country:* ${subject.countryName || 'N/A'}\n`;
        infoText += `⏱️ *Duration:* ${duration}\n\n`;
        infoText += `📝 *Description:* ${description}\n\n`;
        
        if (isSeries && data.results.resource?.seasons?.length > 0) {
            const totalEpisodes = data.results.resource.seasons.reduce((sum, s) => sum + s.maxEp, 0);
            infoText += `━━━━━━━━━━━━━━━━━━━━━\n`;
            infoText += `📺 *SEASON & EPISODES*\n`;
            infoText += `🎬 *Seasons:* ${data.results.resource.seasons.length}\n`;
            infoText += `📀 *Total Episodes:* ${totalEpisodes}\n\n`;
            infoText += `💡 *Download episode:*\n`;
            infoText += `${currentPrefix}movie ${subjectId}/<season>/<episode>/<quality>\n\n`;
            infoText += `💡 *Download subtitles:*\n`;
            infoText += `${currentPrefix}movie ${subjectId}/<season>/<episode>/<language>\n\n`;
            infoText += `*Example:*\n`;
            infoText += `${currentPrefix}movie ${subjectId}/1/1/hd\n`;
            infoText += `${currentPrefix}movie ${subjectId}/1/1/en`;
        } else {
            // Show available qualities
            const qualities = ['FHD (1080p)', 'HD (720p)', 'SD (480p)'];
            infoText += `━━━━━━━━━━━━━━━━━━━━━\n`;
            infoText += `🎞️ *AVAILABLE QUALITIES*\n\n`;
            qualities.forEach(q => infoText += `┃ • ${q}\n`);
            infoText += `\n💡 *Download:*\n`;
            infoText += `${currentPrefix}movie ${subjectId}/<quality>\n\n`;
            infoText += `*Example:*\n`;
            infoText += `${currentPrefix}movie ${subjectId}/hd\n\n`;
            
            // Show available subtitles
            let subText = await getSubtitlesText(sock, subjectId);
            if (subText) {
                infoText += subText;
            }
        }
        
        // Send the message with poster and newsletter context
        if (subject.cover?.url) {
            await sock.sendMessage(chatId, {
                image: { url: subject.cover.url },
                caption: infoText,
                ...channelInfo
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: infoText,
                ...channelInfo
            }, { quoted: message });
        }
        
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        
    } catch (error) {
        console.error('Error:', error);
        await sock.sendMessage(chatId, { text: `❌ Failed to fetch movie details: ${error.message}`, ...channelInfo }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

// Get subtitles text without sending separate message
async function getSubtitlesText(sock, subjectId) {
    try {
        const sourceUrl = `${BASE_URL}/sources/${subjectId}`;
        const { data } = await axios.get(sourceUrl, { timeout: 30000 });
        
        if (data.success && data.subtitles && data.subtitles.length > 0) {
            let subText = `\n📝 *SUBTITLES AVAILABLE*\n\n`;
            const languageMap = {
                'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
                'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese',
                'ko': 'Korean', 'zh': 'Chinese', 'ar': 'Arabic', 'hi': 'Hindi',
                'id': 'Indonesian', 'ms': 'Malay', 'fil': 'Filipino', 'th': 'Thai'
            };
            
            const availableSubs = data.subtitles.slice(0, 10);
            for (const sub of availableSubs) {
                const langName = languageMap[sub.lan] || sub.lanName || sub.lan;
                subText += `┃ • ${langName} (\`${sub.lan}\`)\n`;
            }
            
            subText += `\n💡 *Download:*\n`;
            subText += `.movie ${subjectId}/<language>\n\n`;
            subText += `*Example:* .movie ${subjectId}/en\n\n`;
            return subText;
        }
        return null;
    } catch (error) {
        return null;
    }
}

// Handle quality download - uses streaming to avoid memory issues
async function handleQualityDownload(sock, chatId, message, subjectId, quality) {
    await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
    
    const qualityMap = { 'fhd': '1080p', 'hd': '720p', 'sd': '480p' };
    const resolution = qualityMap[quality] || '480p';
    
    try {
        const sourceUrl = `${BASE_URL}/sources/${subjectId}`;
        const { data } = await axios.get(sourceUrl, { timeout: 30000 });
        
        if (!data.success || !data.results || data.results.length === 0) {
            throw new Error('No download sources found');
        }
        
        const source = data.results.find(s => s.quality.toLowerCase().includes(resolution));
        const downloadUrl = source?.download_url || data.results[0]?.download_url;
        
        if (!downloadUrl) throw new Error('Download link not available');
        
        let movieTitle = subjectId;
        try {
            const detailRes = await axios.get(`${BASE_URL}/info/${subjectId}`);
            if (detailRes.data.success) movieTitle = detailRes.data.results.subject.title;
        } catch (e) {}
        
        await sock.sendMessage(chatId, {
            text: `⏳ *Downloading ${movieTitle} (${quality.toUpperCase()})...*\nThis may take a moment for large files.`,
            ...channelInfo
        }, { quoted: message });
        
        const caption = `🎬 *${movieTitle}*\n🎞️ *Quality:* ${quality.toUpperCase()} (${resolution})\n📦 *Size:* ${source?.size ? (source.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}\n\n📥 Downloaded by BATMAN MD`;
        
        // Use streaming to avoid memory issues
        await streamVideoToWhatsApp(sock, chatId, downloadUrl, caption, message);
        
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        
    } catch (error) {
        console.error('Download Error:', error);
        await sock.sendMessage(chatId, { text: `❌ Failed to download video: ${error.message}`, ...channelInfo }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

// Handle subtitle download
async function handleSubtitleDownload(sock, chatId, message, subjectId, languageCode) {
    await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
    
    try {
        const sourceUrl = `${BASE_URL}/sources/${subjectId}`;
        const { data } = await axios.get(sourceUrl, { timeout: 30000 });
        
        if (!data.success || !data.subtitles) throw new Error('No subtitles available');
        
        const subtitle = data.subtitles.find(s => s.lan === languageCode);
        if (!subtitle) {
            const available = data.subtitles.map(s => s.lan).join(', ');
            throw new Error(`Subtitle language "${languageCode}" not found. Available: ${available}`);
        }
        
        let movieTitle = subjectId;
        try {
            const detailRes = await axios.get(`${BASE_URL}/info/${subjectId}`);
            if (detailRes.data.success) movieTitle = detailRes.data.results.subject.title;
        } catch (e) {}
        
        const languageNames = {
            'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
            'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese',
            'ko': 'Korean', 'zh': 'Chinese', 'ar': 'Arabic', 'hi': 'Hindi',
            'id': 'Indonesian', 'ms': 'Malay', 'fil': 'Filipino', 'th': 'Thai'
        };
        const languageName = languageNames[languageCode] || subtitle.lanName || languageCode;
        
        const subtitleBuffer = await fetchSubtitle(subtitle.url);
        
        if (!subtitleBuffer || subtitleBuffer.length === 0) throw new Error('Subtitle file is empty');
        
        const sizeKB = (subtitleBuffer.length / 1024).toFixed(2);
        
        await sock.sendMessage(chatId, {
            document: subtitleBuffer,
            mimetype: 'text/plain',
            fileName: `${movieTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${languageName}.srt`,
            caption: `📝 *Subtitle Downloaded*\n🎬 *${movieTitle}*\n📝 *Language:* ${languageName}\n📦 *Size:* ${sizeKB} KB\n\n📥 Downloaded by BATMAN MD`,
            ...channelInfo
        }, { quoted: message });
        
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        
    } catch (error) {
        console.error('Subtitle Error:', error);
        await sock.sendMessage(chatId, { text: `❌ Failed to download subtitle: ${error.message}`, ...channelInfo }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

// Handle episode download - uses streaming
async function handleEpisodeDownload(sock, chatId, message, subjectId, season, episode, quality) {
    await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
    
    const qualityMap = { 'fhd': '1080p', 'hd': '720p', 'sd': '480p' };
    const resolution = qualityMap[quality] || '480p';
    
    try {
        const sourceUrl = `${BASE_URL}/sources/${subjectId}?season=${season}&episode=${episode}`;
        const { data } = await axios.get(sourceUrl, { timeout: 30000 });
        
        if (!data.success || !data.results || data.results.length === 0) {
            throw new Error('No episode sources found');
        }
        
        const source = data.results.find(s => s.quality.toLowerCase().includes(resolution)) || data.results[0];
        const downloadUrl = source?.download_url;
        
        if (!downloadUrl) throw new Error('Download link not available');
        
        let seriesTitle = subjectId;
        try {
            const detailRes = await axios.get(`${BASE_URL}/info/${subjectId}`);
            if (detailRes.data.success) seriesTitle = detailRes.data.results.subject.title;
        } catch (e) {}
        
        await sock.sendMessage(chatId, {
            text: `⏳ *Downloading ${seriesTitle} S${season}E${episode} (${quality.toUpperCase()})...*\nThis may take a moment.`,
            ...channelInfo
        }, { quoted: message });
        
        const caption = `📺 *${seriesTitle}*\n🎬 *Season ${season}, Episode ${episode}*\n🎞️ *Quality:* ${quality.toUpperCase()} (${resolution})\n📦 *Size:* ${source?.size ? (source.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}\n\n📥 Downloaded by BATMAN MD`;
        
        // Use streaming to avoid memory issues
        await streamVideoToWhatsApp(sock, chatId, downloadUrl, caption, message);
        
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        
    } catch (error) {
        console.error('Episode Error:', error);
        await sock.sendMessage(chatId, { text: `❌ Failed to download episode: ${error.message}`, ...channelInfo }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

// Handle episode subtitle download
async function handleEpisodeSubtitle(sock, chatId, message, subjectId, season, episode, languageCode) {
    await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
    
    try {
        const sourceUrl = `${BASE_URL}/sources/${subjectId}?season=${season}&episode=${episode}`;
        const { data } = await axios.get(sourceUrl, { timeout: 30000 });
        
        if (!data.success || !data.subtitles) {
            throw new Error('No subtitles available for this episode');
        }
        
        const subtitle = data.subtitles.find(s => s.lan === languageCode);
        if (!subtitle) {
            const available = data.subtitles.map(s => s.lan).join(', ');
            throw new Error(`Subtitle language "${languageCode}" not found. Available: ${available}`);
        }
        
        let seriesTitle = subjectId;
        try {
            const detailRes = await axios.get(`${BASE_URL}/info/${subjectId}`);
            if (detailRes.data.success) seriesTitle = detailRes.data.results.subject.title;
        } catch (e) {}
        
        const languageNames = {
            'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
            'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese',
            'ko': 'Korean', 'zh': 'Chinese', 'ar': 'Arabic', 'hi': 'Hindi',
            'id': 'Indonesian', 'ms': 'Malay', 'fil': 'Filipino', 'th': 'Thai'
        };
        const languageName = languageNames[languageCode] || subtitle.lanName || languageCode;
        
        const subtitleBuffer = await fetchSubtitle(subtitle.url);
        
        if (!subtitleBuffer || subtitleBuffer.length === 0) throw new Error('Subtitle file is empty');
        
        const sizeKB = (subtitleBuffer.length / 1024).toFixed(2);
        
        await sock.sendMessage(chatId, {
            document: subtitleBuffer,
            mimetype: 'text/plain',
            fileName: `${seriesTitle.replace(/[^a-zA-Z0-9]/g, '_')}_S${season}E${episode}_${languageName}.srt`,
            caption: `📝 *Subtitle Downloaded*\n📺 *${seriesTitle}*\n🎬 *Season ${season}, Episode ${episode}*\n📝 *Language:* ${languageName}\n📦 *Size:* ${sizeKB} KB\n\n📥 Downloaded by BATMAN MD`,
            ...channelInfo
        }, { quoted: message });
        
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        
    } catch (error) {
        console.error('Episode Subtitle Error:', error);
        await sock.sendMessage(chatId, { text: `❌ Failed to download subtitle: ${error.message}`, ...channelInfo }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = {
    handleMovieSelection,
    handleQualityDownload,
    handleSubtitleDownload,
    handleEpisodeDownload,
    handleEpisodeSubtitle
};