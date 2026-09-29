// commands/song.js
const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { toAudio } = require('../lib/converter');

const DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Newsletter context only (no externalAdReply)
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

function extractVideoId(url) {
    if (!url) return null;
    let m = null;
    if (url.includes('youtube.com/shorts/') || url.includes('youtu.be/')) {
        m = /\/([a-zA-Z0-9\-_]{11})/.exec(url);
    } else if (url.includes('youtube.com')) {
        m = /v=([a-zA-Z0-9\-_]{11})/.exec(url);
    } else {
        m = /[a-zA-Z0-9\-_]{11}/.exec(url);
    }
    return m ? m[1] : null;
}

async function scrapeYtmp3(youtubeUrl, format = 'mp3') {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) throw new Error('Invalid YouTube URL');

    const lowerFormat = format.toLowerCase();
    if (!['mp3', 'mp4'].includes(lowerFormat)) throw new Error('Invalid format');

    const headers = {
        'User-Agent': DEFAULT_UA,
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://id.ytmp3.mobi',
        'Referer': 'https://id.ytmp3.mobi/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site'
    };

    const initRes = await axios.get(
        `https://a.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=${Math.random()}`,
        { headers, timeout: 30000 }
    );
    const initJson = initRes.data;
    if (initJson.error > 0) throw new Error(`Init error: ${initJson.error}`);

    let convertUrl = `${initJson.convertURL}&v=${videoId}&f=${lowerFormat}&_=${Math.random()}`;
    let convertJson;
    while (true) {
        const r = await axios.get(convertUrl, { headers, timeout: 30000 });
        convertJson = r.data;
        if (convertJson.error > 0) throw new Error(`Convert error: ${convertJson.error}`);
        if (convertJson.redirect > 0 && convertJson.redirectURL) {
            convertUrl = `${convertJson.redirectURL}&v=${videoId}&f=${lowerFormat}&_=${Math.random()}`;
            continue;
        }
        break;
    }

    const progressUrl = convertJson.progressURL;
    const downloadUrl = convertJson.downloadURL;
    let title = convertJson.title || '';
    if (!progressUrl) throw new Error('No progress URL');

    let progress = 0, poll = 0;
    while (progress < 3 && poll < 60) {
        await new Promise(r => setTimeout(r, 1000));
        poll++;
        const p = await axios.get(progressUrl, { headers, timeout: 30000 });
        const pj = p.data;
        if (pj.error > 0) throw new Error(`Progress error: ${pj.error}`);
        progress = pj.progress;
        if (pj.title) title = pj.title;
    }
    if (progress < 3) throw new Error('Conversion timeout');

    return { status: 'success', videoId, title, format: lowerFormat, downloadUrl };
}

async function songCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';

        if (!text) {
            await sock.sendMessage(chatId, {
                text: "🎵 *What song do you want to download?*\n\n📝 *Usage:* .song <song name or link>\n\n*Example:* .song Alan Walker - Faded",
                ...newsletterContext
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });

        let video;
        let videoUrl = '';

        if (text.includes('youtube.com') || text.includes('youtu.be')) {
            videoUrl = text;
            video = { url: text };
        } else {
            const search = await yts(text);
            if (!search || !search.videos.length) {
                await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                await sock.sendMessage(chatId, {
                    text: `❌ No songs found for: "${text}"`,
                    ...newsletterContext
                }, { quoted: message });
                return;
            }
            video = search.videos[0];
            videoUrl = video.url;
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        // --- New download flow using ytmp3.mobi scraper ---
        let audioData;
        let audioBuffer;
        try {
            audioData = await scrapeYtmp3(video.url || videoUrl, 'mp3');

            const audioResponse = await axios.get(audioData.downloadUrl, {
                responseType: 'arraybuffer',
                timeout: 90000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                decompress: true,
                validateStatus: s => s >= 200 && s < 400,
                headers: {
                    'User-Agent': DEFAULT_UA,
                    'Accept': '*/*',
                    'Accept-Encoding': 'identity'
                }
            });
            audioBuffer = Buffer.from(audioResponse.data);
            if (!audioBuffer || audioBuffer.length === 0) {
                throw new Error('Empty audio buffer');
            }
        } catch (err) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            throw new Error(`Download failed: ${err.message}`);
        }

        await sock.sendMessage(chatId, { react: { text: '📥', key: message.key } });

        // Detect file format from magic bytes
        const firstBytes = audioBuffer.slice(0, 12);
        const hexSignature = firstBytes.toString('hex');
        const asciiSignature = firstBytes.toString('ascii', 4, 8);

        let fileExtension = 'mp3';

        if (asciiSignature === 'ftyp' || hexSignature.startsWith('000000')) {
            const ftypBox = audioBuffer.slice(4, 8).toString('ascii');
            if (ftypBox === 'ftyp') fileExtension = 'm4a';
        } else if (audioBuffer.toString('ascii', 0, 3) === 'ID3' ||
                   (audioBuffer[0] === 0xFF && (audioBuffer[1] & 0xE0) === 0xE0)) {
            fileExtension = 'mp3';
        } else if (audioBuffer.toString('ascii', 0, 4) === 'OggS') {
            fileExtension = 'ogg';
        } else if (audioBuffer.toString('ascii', 0, 4) === 'RIFF') {
            fileExtension = 'wav';
        } else {
            fileExtension = 'm4a';
        }

        let finalBuffer = audioBuffer;
        let finalExtension = 'mp3';

        if (fileExtension !== 'mp3') {
            try {
                finalBuffer = await toAudio(audioBuffer, fileExtension);
                if (!finalBuffer || finalBuffer.length === 0) {
                    throw new Error('Conversion returned empty buffer');
                }
                finalExtension = 'mp3';
            } catch (convErr) {
                await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                throw new Error(`Failed to convert: ${convErr.message}`);
            }
        }

        const songTitle = (audioData.title || video.title || 'song').replace(/[^\w\s-]/g, '');
        const ytLink = video.url || videoUrl;

        await sock.sendMessage(chatId, {
            audio: finalBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${songTitle}.${finalExtension}`,
            ptt: false,
            caption: `🎵 *${songTitle}*\n🔗 ${ytLink}\n\n> *© BATMAN MD*`,
            ...newsletterContext
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

        // Cleanup temp files
        try {
            const tempDir = path.join(__dirname, '../temp');
            if (fs.existsSync(tempDir)) {
                const files = fs.readdirSync(tempDir);
                const now = Date.now();
                files.forEach(file => {
                    const filePath = path.join(tempDir, file);
                    try {
                        const stats = fs.statSync(filePath);
                        if (now - stats.mtimeMs > 10000) {
                            if (file.endsWith('.mp3') || file.endsWith('.m4a') || /^\d+\.(mp3|m4a)$/.test(file)) {
                                fs.unlinkSync(filePath);
                            }
                        }
                    } catch (e) {}
                });
            }
        } catch (cleanupErr) {}

    } catch (err) {
        console.error('Song command error:', err);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `❌ Failed to download song.\n🔧 ${err.message}`,
            ...newsletterContext
        }, { quoted: message });
    }
}

module.exports = songCommand;
