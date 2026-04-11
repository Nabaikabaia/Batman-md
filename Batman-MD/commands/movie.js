// commands/movie.js
const axios = require('axios');
const settings = require('../settings');
const { sendInteractiveMessage } = require('gifted-btns');
const { 
    handleMovieSelection, 
    handleQualityDownload, 
    handleSubtitleDownload, 
    handleEpisodeDownload,
    handleEpisodeSubtitle  // THIS WAS MISSING!
} = require('../lib/movieHandler');

const BASE_URL = 'https://mumubmrvkqcgzidqubcc.supabase.co/functions/v1/movies/api';

function formatRating(rating, count) {
    if (!rating || rating === '0') return '⭐ Not Rated';
    const stars = '⭐'.repeat(Math.min(Math.floor(rating), 5));
    const num = parseFloat(rating).toFixed(1);
    return `${stars} ${num}/10 ${count ? `(${count.toLocaleString()} votes)` : ''}`;
}

function truncate(text, maxLength = 150) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

async function movieCommand(sock, chatId, message, args) {
    try {
        const input = args.trim();
        const currentPrefix = settings.prefix || '.';
        
        if (!input) {
            const usageMsg = `*🎬 MOVIE SEARCH*\n\n` +
                `Search for movies and series!\n\n` +
                `*Usage:*\n` +
                `♧ ${currentPrefix}movie <title>\n` +
                `♧ ${currentPrefix}movie <subjectId>\n` +
                `♧ ${currentPrefix}movie <subjectId>/<quality>\n` +
                `♧ ${currentPrefix}movie <subjectId>/<language>\n` +
                `♧ ${currentPrefix}movie <subjectId>/<season>/<episode>/<quality>\n` +
                `♧ ${currentPrefix}movie <subjectId>/<season>/<episode>/<language>\n\n` +
                `*Examples:*\n` +
                `♧ ${currentPrefix}movie Wura\n` +
                `♧ ${currentPrefix}movie 4616805651656916944\n` +
                `♧ ${currentPrefix}movie 4616805651656916944/hd\n` +
                `♧ ${currentPrefix}movie 4616805651656916944/en\n` +
                `♧ ${currentPrefix}movie 1216407338207298384/1/1/hd\n` +
                `♧ ${currentPrefix}movie 1216407338207298384/1/1/en`;
            return await sock.sendMessage(chatId, { text: usageMsg }, { quoted: message });
        }
        
        // ============================================
        // CHECK FOR SERIES EPISODE FORMAT: subjectId/season/episode/quality OR subjectId/season/episode/language
        // ============================================
        const parts = input.split('/');
        
        // Format: subjectId/season/episode/option (4 parts)
        if (parts.length === 4 && /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1]) && /^\d+$/.test(parts[2])) {
            const subjectId = parts[0];
            const season = parts[1];
            const episode = parts[2];
            const option = parts[3];
            
            if (['fhd', 'hd', 'sd'].includes(option.toLowerCase())) {
                return await handleEpisodeDownload(sock, chatId, message, subjectId, season, episode, option.toLowerCase());
            } else {
                return await handleEpisodeSubtitle(sock, chatId, message, subjectId, season, episode, option);
            }
        }
        
        // Format: subjectId/option (2 parts)
        if (parts.length === 2 && /^\d+$/.test(parts[0])) {
            const subjectId = parts[0];
            const option = parts[1];
            
            if (['fhd', 'hd', 'sd'].includes(option.toLowerCase())) {
                return await handleQualityDownload(sock, chatId, message, subjectId, option.toLowerCase());
            } else {
                return await handleSubtitleDownload(sock, chatId, message, subjectId, option);
            }
        }
        
        // Format: subjectId only
        if (/^\d+$/.test(input)) {
            return await handleMovieSelection(sock, chatId, message, input);
        }
        
        // ============================================
        // SEARCH FOR MOVIES BY TITLE
        // ============================================
        await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });
        
        const apiUrl = `${BASE_URL}/search?q=${encodeURIComponent(input)}&page=1`;
        const { data } = await axios.get(apiUrl, { timeout: 30000 });
        
        if (!data.success || !data.results?.items || data.results.items.length === 0) {
            await sock.sendMessage(chatId, { text: `❌ No movies found for "${input}". Try a different search term.`, quoted: message });
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return;
        }
        
        const movies = data.results.items.slice(0, 5);
        
        for (const movie of movies) {
            const isSeries = movie.subjectType === 2;
            const year = movie.releaseDate ? movie.releaseDate.split('-')[0] : 'N/A';
            const rating = formatRating(movie.imdbRatingValue, movie.imdbRatingCount);
            const description = truncate(movie.description || 'No description available', 120);
            
            let caption = `*${isSeries ? '📺 SERIES' : '🎬 MOVIE'}*\n\n`;
            caption += `*${movie.title}* ${year !== 'N/A' ? `(${year})` : ''}\n\n`;
            caption += `🎭 *Genre:* ${movie.genre || 'N/A'}\n`;
            caption += `${rating}\n`;
            caption += `🌍 *Country:* ${movie.countryName || 'N/A'}\n\n`;
            caption += `📝 *Description:* ${description}\n\n`;
            caption += `🔑 *Subject ID:* \`${movie.subjectId}\``;
            
            // Only the Copy ID button - rest via commands
            const interactiveButtons = [
                {
                    name: 'cta_copy',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📋 Copy ID',
                        copy_code: movie.subjectId
                    })
                }
            ];
            
            try {
                if (movie.cover?.url) {
                    await sendInteractiveMessage(
                        sock, chatId,
                        { text: caption, footer: `💡 Use: ${currentPrefix}movie ${movie.subjectId} for details`, image: { url: movie.cover.url }, interactiveButtons },
                        { quoted: message }
                    );
                } else {
                    await sendInteractiveMessage(
                        sock, chatId,
                        { text: caption, footer: `💡 Use: ${currentPrefix}movie ${movie.subjectId} for details`, interactiveButtons },
                        { quoted: message }
                    );
                }
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
                await sock.sendMessage(chatId, { text: caption, quoted: message });
            }
        }
        
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        
    } catch (error) {
        console.error('Movie Command Error:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to process request. Please try again.', quoted: message });
    }
}

module.exports = movieCommand;