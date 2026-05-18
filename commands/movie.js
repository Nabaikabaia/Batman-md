// commands/movie.js
const axios = require('axios');

const SEARCH_API = 'https://movieapi.nabees.online/search';
const DETAILS_API = 'https://movieapi.nabees.online/details';
const STREAM_API = 'https://raspy-shape-8d99.nabaikabaiaguo.workers.dev/v2';

const userSession = new Map();

// Simple headers that work (matching curl command)
const headers = {
    'Host': 'movieapi.nabees.online',
    'Accept': '*/*',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
    'Referer': 'https://movieapi.nabees.online/docs?section=radio'
};

// Headers for video download (matching working curl)
const downloadHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://movieapi.giftedtech.co.ke/',
    'Accept': '*/*'
};

// Language mapping for subtitles
const languages = {
    'en': 'English', 'fr': 'Français', 'es': 'Español', 'ar': 'Arabic',
    'bn': 'Bengali', 'ru': 'Russian', 'zh': 'Chinese', 'hi': 'Hindi',
    'ta': 'Tamil', 'te': 'Telugu', 'pt': 'Portuguese', 'id': 'Indonesian',
    'ms': 'Malay', 'fil': 'Filipino', 'ur': 'Urdu', 'ku': 'Kurdish'
};

function sanitizeFilename(name) {
    return name.replace(/[\\/*?:"<>|]/g, '').replace(/\s+/g, '_').substring(0, 200);
}

async function movieCommand(sock, chatId, message, args) {
    try {
        const userInput = args.join(' ').trim();
        const userId = message.key.participant || message.key.remoteJid;

        // HELP MENU
        if (!userInput) {
            const helpText = `🎬 *MOVIE COMMAND* 🎬

╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃ 📽️ *Usage:*
┃ • .movie <title> - Search movies
┃ • .movie <id>/<quality> - Download movie
┃ • .movie <id>/<lang> - Download subtitle
┃ • .movie <id>/<season>/<ep>/<quality> - Series
┃ • .movie <id>/<season>/<ep>/<lang> - Series sub
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

📍 *Examples:*
• .movie Avatar
• .movie 74738785354956752/1080
• .movie 74738785354956752/en
• .movie 3156319133801794232/1/1/720

> *© BATMAN MD*`;
            await sock.sendMessage(chatId, { text: helpText }, { quoted: message });
            return;
        }

        // ========== DIRECT DOWNLOAD FORMAT ==========
        if (userInput.includes('/')) {
            const parts = userInput.split('/');
            
            // Series format: id/season/episode/action
            if (parts.length === 4) {
                const [id, season, episode, action] = parts;
                const seasonNum = parseInt(season);
                const episodeNum = parseInt(episode);
                
                if (!isNaN(seasonNum) && !isNaN(episodeNum)) {
                    if (['360', '480', '720', '1080'].includes(action)) {
                        await sendSeriesVideo(sock, chatId, message, id, seasonNum, episodeNum, action);
                    } else if (languages[action]) {
                        await sendSeriesSubtitle(sock, chatId, message, id, seasonNum, episodeNum, action);
                    } else {
                        await sock.sendMessage(chatId, { text: "❌ Invalid action. Use: 360/480/720/1080 or language code (en/fr/es/etc)" });
                    }
                }
                return;
            }
            
            // Movie format: id/action
            if (parts.length === 2) {
                const [id, action] = parts;
                
                if (['360', '480', '720', '1080'].includes(action)) {
                    await sendMovieVideo(sock, chatId, message, id, action);
                } else if (languages[action]) {
                    await sendMovieSubtitle(sock, chatId, message, id, action);
                } else {
                    await sock.sendMessage(chatId, { text: "❌ Invalid action. Use: 360/480/720/1080 or language code (en/fr/es/etc)" });
                }
                return;
            }
        }

        // ========== NUMBER SELECTION ==========
        if (/^\d+$/.test(userInput)) {
            const session = userSession.get(userId);
            if (!session || !session.results) {
                await sock.sendMessage(chatId, { text: "❌ No active search. Use .movie <query> first." }, { quoted: message });
                return;
            }
            const index = parseInt(userInput) - 1;
            if (index < 0 || index >= session.results.length) {
                await sock.sendMessage(chatId, { text: "❌ Invalid selection." }, { quoted: message });
                return;
            }
            const selected = session.results[index];
            await showMovieDetails(sock, chatId, message, selected, userId);
            return;
        }

        // ========== SEARCH ==========
        await sock.sendMessage(chatId, { react: { text: "🔍", key: message.key } });

        const searchUrl = `${SEARCH_API}?q=${encodeURIComponent(userInput)}&page=1&perPage=3&subjectType=0`;
        console.log('[Movie] Searching:', searchUrl);
        
        const response = await axios.get(searchUrl, { headers, timeout: 15000 });
        
        const items = response.data?.data?.items || [];
        
        if (items.length === 0) {
            await sock.sendMessage(chatId, { text: "❌ No results found." }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
            return;
        }

        userSession.set(userId, { results: items });

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const year = item.releaseDate ? item.releaseDate.split('-')[0] : 'N/A';
            const typeEmoji = item.subjectType === 1 ? '🎬' : item.subjectType === 2 ? '📺' : '🎵';
            const rating = item.imdbRatingValue || 'N/A';
            
            const caption = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ${typeEmoji} *${item.title}* (${year})
┃ ⭐ IMDb: ${rating}
┃ 🎭 ${item.genre?.split(',')[0] || 'N/A'}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

*Reply with number:* ${i + 1}

> *© BATMAN MD*`;

            await sock.sendMessage(chatId, {
                image: { url: item.cover?.url || 'https://aqrmhkzrrmpljrtknrpi.supabase.co/storage/v1/object/public/uploads/4YDNVP.jpg' },
                caption: caption,
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
            
            await new Promise(r => setTimeout(r, 300));
        }

        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('[Movie] Error:', error.message);
        if (error.response) {
            console.error('[Movie] Status:', error.response.status);
        }
        await sock.sendMessage(chatId, { text: `❌ Error: ${error.message}` }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
    }
}

async function showMovieDetails(sock, chatId, message, movie, userId) {
    try {
        await sock.sendMessage(chatId, { react: { text: "📖", key: message.key } });

        const detailUrl = `${DETAILS_API}?detailPath=${movie.detailPath}`;
        console.log('[Movie] Details URL:', detailUrl);
        
        const response = await axios.get(detailUrl, { headers, timeout: 15000 });
        
        const subject = response.data?.data?.subject;
        if (!subject) throw new Error('Could not fetch details');
        
        const isSeries = subject.subjectType === 2;
        const year = subject.releaseDate ? subject.releaseDate.split('-')[0] : 'N/A';
        const duration = subject.duration ? `${Math.floor(subject.duration / 60)} min` : 'N/A';
        
        // Fetch stream info for resolutions and subtitles
        let resolutions = ['360', '480', '720', '1080'];
        let subtitles = [];
        
        try {
            const streamUrl = `${STREAM_API}/${isSeries ? 'series' : 'movie'}?id=${subject.subjectId}${isSeries ? '&season=1&episode=1' : ''}`;
            const streamRes = await axios.get(streamUrl, { 
                headers: { 'User-Agent': headers['User-Agent'], 'Accept': 'application/json' }, 
                timeout: 10000 
            });
            if (streamRes.data?.data?.streams) {
                resolutions = streamRes.data.data.streams.map(s => s.quality.replace('p', ''));
            }
            if (streamRes.data?.data?.subtitles) {
                subtitles = streamRes.data.data.subtitles.map(s => s.language);
            }
        } catch (err) {
            console.log('[Movie] Could not fetch stream info:', err.message);
        }
        
        const subList = subtitles.length ? subtitles.slice(0, 8).map(l => languages[l] || l).join(', ') : 'English, French, Spanish, Arabic';
        
        // Build frame
        let detailsFrame = `┌❏ *${subject.title}* (${year}) ❏
│
├❏ *Type:* ${isSeries ? '📺 SERIES' : '🎬 MOVIE'}
├❏ *IMDb:* ${subject.imdbRatingValue || 'N/A'}/10
├❏ *Genre:* ${subject.genre || 'N/A'}
├❏ *Duration:* ${duration}
├❏ *Country:* ${subject.countryName || 'N/A'}
│
├❏ *Plot:*
│  ${subject.description?.substring(0, 200) || 'No description'}${subject.description?.length > 200 ? '...' : ''}
│
├❏ *Cast:*
${response.data?.data?.stars?.slice(0, 3).map(s => `│  ▸ ${s.name}`).join('\n') || '│  ▸ Information not available'}`;

        if (isSeries && response.data?.data?.resource?.seasons) {
            const seasonCount = response.data.data.resource.seasons.length;
            const episodeCount = response.data.data.resource.seasons.reduce((sum, s) => sum + (s.maxEp || 0), 0);
            detailsFrame += `
│
├❏ *Seasons:* ${seasonCount}
├❏ *Episodes:* ${episodeCount}`;
        }

        detailsFrame += `
│
├❏ *Resolutions:* ${resolutions.join(', ')}
├❏ *Subtitles:* ${subList}
│
├❏ *Download:*
│  ▸ Movie: .movie ${subject.subjectId}/<quality>
│  ▸ Sub: .movie ${subject.subjectId}/<lang>`;

        if (isSeries) {
            detailsFrame += `
│  ▸ Series: .movie ${subject.subjectId}/<season>/<ep>/<quality>
│  ▸ Series Sub: .movie ${subject.subjectId}/<season>/<ep>/<lang>`;
        }

        detailsFrame += `
│
└❏

> *© BATMAN MD*`;

        userSession.set(userId, {
            subjectId: subject.subjectId,
            title: subject.title,
            isSeries: isSeries
        });

        // Send trailer if available
        if (subject.trailer?.videoAddress?.url) {
            await sock.sendMessage(chatId, {
                video: { url: subject.trailer.videoAddress.url },
                caption: detailsFrame,
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
        } else {
            await sock.sendMessage(chatId, {
                image: { url: subject.cover?.url || 'https://aqrmhkzrrmpljrtknrpi.supabase.co/storage/v1/object/public/uploads/4YDNVP.jpg' },
                caption: detailsFrame,
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
        }

        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('[Movie] Details error:', error.message);
        await sock.sendMessage(chatId, { text: `❌ Failed to load details: ${error.message}` }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
    }
}

async function sendMovieVideo(sock, chatId, message, subjectId, quality) {
    try {
        await sock.sendMessage(chatId, { react: { text: "⏳", key: message.key } });
        
        let title = 'Movie';
        const streamUrl = `${STREAM_API}/movie?id=${subjectId}`;
        const response = await axios.get(streamUrl, { 
            timeout: 20000,
            headers: { 'User-Agent': headers['User-Agent'], 'Accept': 'application/json' }
        });
        
        const session = userSession.get(message.key.participant || message.key.remoteJid);
        if (session?.title) title = session.title;
        else if (response.data?.data?.title) title = response.data.data.title;
        
        const targetQuality = quality.replace('p', '');
        const stream = response.data?.data?.streams?.find(s => s.quality === `${targetQuality}p`);
        if (!stream) throw new Error(`Quality ${quality} not available`);
        
        // Use download_url with proper headers
        const videoUrl = stream.download_url;
        if (!videoUrl) throw new Error('Download URL not available');
        
        const fileName = `${sanitizeFilename(title)}_${quality}.mp4`;
        
        await sock.sendMessage(chatId, { react: { text: "📤", key: message.key } });
        
        // Download the video with CORRECT headers
        const videoResponse = await axios.get(videoUrl, { 
            responseType: 'arraybuffer',
            headers: downloadHeaders,
            timeout: 180000
        });
        
        const videoBuffer = Buffer.from(videoResponse.data);
        
        await sock.sendMessage(chatId, {
            video: videoBuffer,
            fileName: fileName,
            mimetype: 'video/mp4',
            caption: `🎬 *${title}* - ${quality}p\n\n> *© BATMAN MD*`,
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
        
        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
        
    } catch (error) {
        console.error('[Movie] Send video error:', error.message);
        await sock.sendMessage(chatId, { text: `❌ Failed: ${error.message}` }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
    }
}

async function sendMovieSubtitle(sock, chatId, message, subjectId, langCode) {
    try {
        await sock.sendMessage(chatId, { react: { text: "⏳", key: message.key } });
        
        let title = 'Movie';
        const streamUrl = `${STREAM_API}/movie?id=${subjectId}`;
        const response = await axios.get(streamUrl, { 
            timeout: 20000,
            headers: { 'User-Agent': headers['User-Agent'], 'Accept': 'application/json' }
        });
        
        const session = userSession.get(message.key.participant || message.key.remoteJid);
        if (session?.title) title = session.title;
        else if (response.data?.data?.title) title = response.data.data.title;
        
        const subtitle = response.data?.data?.subtitles?.find(s => s.language === langCode);
        if (!subtitle) {
            // Try to get first available subtitle as fallback
            const firstSub = response.data?.data?.subtitles?.[0];
            if (firstSub) {
                await sock.sendMessage(chatId, { text: `⚠️ Subtitle ${languages[langCode]} not available. Available: ${response.data.data.subtitles.map(s => languages[s.language] || s.language).join(', ')}` }, { quoted: message });
            }
            throw new Error(`Subtitle ${langCode} not available`);
        }
        
        const subtitleUrl = subtitle.url;
        if (!subtitleUrl) throw new Error('Subtitle URL not available');
        
        const fileName = `${sanitizeFilename(title)}_${languages[langCode]}.srt`;
        
        await sock.sendMessage(chatId, { react: { text: "📤", key: message.key } });
        
        // Download subtitle
        const subResponse = await axios.get(subtitleUrl, { 
            responseType: 'arraybuffer',
            headers: downloadHeaders,
            timeout: 30000
        });
        
        const subBuffer = Buffer.from(subResponse.data);
        
        await sock.sendMessage(chatId, {
            document: subBuffer,
            mimetype: 'text/plain',
            fileName: fileName,
            caption: `📝 *${title}* - ${languages[langCode]} Subtitle\n\n> *© BATMAN MD*`,
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
        
        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
        
    } catch (error) {
        console.error('[Movie] Subtitle error:', error.message);
        await sock.sendMessage(chatId, { text: `❌ Failed: ${error.message}` }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
    }
}

async function sendSeriesVideo(sock, chatId, message, subjectId, season, episode, quality) {
    try {
        await sock.sendMessage(chatId, { react: { text: "⏳", key: message.key } });
        
        let title = 'Series';
        const streamUrl = `${STREAM_API}/series?id=${subjectId}&season=${season}&episode=${episode}`;
        const response = await axios.get(streamUrl, { 
            timeout: 20000,
            headers: { 'User-Agent': headers['User-Agent'], 'Accept': 'application/json' }
        });
        
        const session = userSession.get(message.key.participant || message.key.remoteJid);
        if (session?.title) title = session.title;
        else if (response.data?.data?.title) title = response.data.data.title;
        
        const targetQuality = quality.replace('p', '');
        const stream = response.data?.data?.streams?.find(s => s.quality === `${targetQuality}p`);
        if (!stream) throw new Error(`Quality ${quality} not available`);
        
        // Use download_url with proper headers
        const videoUrl = stream.download_url;
        if (!videoUrl) throw new Error('Download URL not available');
        
        const seasonPad = season.toString().padStart(2, '0');
        const episodePad = episode.toString().padStart(2, '0');
        const fileName = `${sanitizeFilename(title)}_S${seasonPad}E${episodePad}_${quality}.mp4`;
        
        await sock.sendMessage(chatId, { react: { text: "📤", key: message.key } });
        
        // Download the video with CORRECT headers
        const videoResponse = await axios.get(videoUrl, { 
            responseType: 'arraybuffer',
            headers: downloadHeaders,
            timeout: 180000
        });
        
        const videoBuffer = Buffer.from(videoResponse.data);
        
        await sock.sendMessage(chatId, {
            video: videoBuffer,
            fileName: fileName,
            mimetype: 'video/mp4',
            caption: `📺 *${title}* - S${seasonPad}E${episodePad} (${quality}p)\n\n> *© BATMAN MD*`,
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
        
        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
        
    } catch (error) {
        console.error('[Movie] Series video error:', error.message);
        await sock.sendMessage(chatId, { text: `❌ Failed: ${error.message}` }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
    }
}

async function sendSeriesSubtitle(sock, chatId, message, subjectId, season, episode, langCode) {
    try {
        await sock.sendMessage(chatId, { react: { text: "⏳", key: message.key } });
        
        let title = 'Series';
        const streamUrl = `${STREAM_API}/series?id=${subjectId}&season=${season}&episode=${episode}`;
        const response = await axios.get(streamUrl, { 
            timeout: 20000,
            headers: { 'User-Agent': headers['User-Agent'], 'Accept': 'application/json' }
        });
        
        const session = userSession.get(message.key.participant || message.key.remoteJid);
        if (session?.title) title = session.title;
        else if (response.data?.data?.title) title = response.data.data.title;
        
        const subtitle = response.data?.data?.subtitles?.find(s => s.language === langCode);
        if (!subtitle) {
            const firstSub = response.data?.data?.subtitles?.[0];
            if (firstSub) {
                await sock.sendMessage(chatId, { text: `⚠️ Subtitle ${languages[langCode]} not available. Available: ${response.data.data.subtitles.map(s => languages[s.language] || s.language).join(', ')}` }, { quoted: message });
            }
            throw new Error(`Subtitle ${langCode} not available`);
        }
        
        const subtitleUrl = subtitle.url;
        if (!subtitleUrl) throw new Error('Subtitle URL not available');
        
        const seasonPad = season.toString().padStart(2, '0');
        const episodePad = episode.toString().padStart(2, '0');
        const fileName = `${sanitizeFilename(title)}_S${seasonPad}E${episodePad}_${languages[langCode]}.srt`;
        
        await sock.sendMessage(chatId, { react: { text: "📤", key: message.key } });
        
        // Download subtitle
        const subResponse = await axios.get(subtitleUrl, { 
            responseType: 'arraybuffer',
            headers: downloadHeaders,
            timeout: 30000
        });
        
        const subBuffer = Buffer.from(subResponse.data);
        
        await sock.sendMessage(chatId, {
            document: subBuffer,
            mimetype: 'text/plain',
            fileName: fileName,
            caption: `📝 *${title}* - S${seasonPad}E${episodePad} (${languages[langCode]} Subtitle)\n\n> *© BATMAN MD*`,
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
        
        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
        
    } catch (error) {
        console.error('[Movie] Series subtitle error:', error.message);
        await sock.sendMessage(chatId, { text: `❌ Failed: ${error.message}` }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
    }
}

async function handleMovieAction(sock, chatId, message, action, userId) {
    console.log('[Movie] Action received:', action);
}

module.exports = { movieCommand, handleMovieAction };