// commands/convert.js
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

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

async function convertCommand(sock, chatId, message, args) {
    try {
        const mode = args[0]?.toLowerCase();
        
        const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quotedMsg) {
            await sock.sendMessage(chatId, { 
                text: "🎨 *Universal Media Converter*\n\n*Modes:*\n.to sticker - Image/Video → Sticker\n.to image - Sticker → Image\n.to video - Sticker/Audio → Video\n.to audio - Video → Audio (MP3)\n.to voicenote - Audio/Video → Voice Note\n.to videonote - Video → Circle Video\n.to resize - Image → Resized Image\n\n*Usage:* Reply to media with .to <mode>"
            }, { quoted: message });
            return;
        }

        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        
        let inputBuffer = null;
        let inputType = null;
        let stanzaId = message.message?.extendedTextMessage?.contextInfo?.stanzaId;
        let participant = message.message?.extendedTextMessage?.contextInfo?.participant;
        let senderId = message.key.participant || message.key.remoteJid;

        // Detect input type
        if (quotedMsg.imageMessage) {
            inputType = 'image';
            const stream = await downloadMediaMessage({
                key: { remoteJid: chatId, id: stanzaId, participant: participant || senderId },
                message: quotedMsg
            }, 'buffer', {}, { logger: console });
            inputBuffer = stream;
        } 
        else if (quotedMsg.videoMessage) {
            inputType = 'video';
            const stream = await downloadMediaMessage({
                key: { remoteJid: chatId, id: stanzaId, participant: participant || senderId },
                message: quotedMsg
            }, 'buffer', {}, { logger: console });
            inputBuffer = stream;
        }
        else if (quotedMsg.audioMessage) {
            inputType = 'audio';
            const stream = await downloadMediaMessage({
                key: { remoteJid: chatId, id: stanzaId, participant: participant || senderId },
                message: quotedMsg
            }, 'buffer', {}, { logger: console });
            inputBuffer = stream;
        }
        else if (quotedMsg.stickerMessage) {
            inputType = 'sticker';
            const stream = await downloadMediaMessage({
                key: { remoteJid: chatId, id: stanzaId, participant: participant || senderId },
                message: quotedMsg
            }, 'buffer', {}, { logger: console });
            inputBuffer = stream;
        }
        else {
            await sock.sendMessage(chatId, { text: "❌ Please reply to an image, video, audio, or sticker." }, { quoted: message });
            return;
        }

        if (!inputBuffer) {
            await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: "🎨", key: message.key } });

        const tempInput = path.join(tmpDir, `input_${Date.now()}`);
        const tempOutput = path.join(tmpDir, `output_${Date.now()}`);

        // ============ STICKER CONVERSION ============
        if (mode === 'sticker') {
            if (inputType === 'image') {
                fs.writeFileSync(tempInput + '.jpg', inputBuffer);
                await execPromise(`ffmpeg -i "${tempInput}.jpg" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2" -c:v libwebp -loop 0 -qscale 80 "${tempOutput}.webp"`);
                const outputBuffer = fs.readFileSync(tempOutput + '.webp');
                await sock.sendMessage(chatId, { sticker: outputBuffer, ...newsletterContext }, { quoted: message });
            } 
            else if (inputType === 'video') {
                fs.writeFileSync(tempInput + '.mp4', inputBuffer);
                await execPromise(`ffmpeg -i "${tempInput}.mp4" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2,fps=15" -c:v libwebp -loop 0 -qscale 80 "${tempOutput}.webp"`);
                const outputBuffer = fs.readFileSync(tempOutput + '.webp');
                await sock.sendMessage(chatId, { sticker: outputBuffer, ...newsletterContext }, { quoted: message });
            }
            else {
                throw new Error('Invalid input for sticker. Reply to image or video.');
            }
        }
        
        // ============ IMAGE CONVERSION ============
        else if (mode === 'image') {
            if (inputType === 'sticker') {
                fs.writeFileSync(tempInput + '.webp', inputBuffer);
                await execPromise(`ffmpeg -i "${tempInput}.webp" "${tempOutput}.jpg"`);
                const outputBuffer = fs.readFileSync(tempOutput + '.jpg');
                await sock.sendMessage(chatId, { image: outputBuffer, caption: '> *© BATMAN MD*', ...newsletterContext }, { quoted: message });
            }
            else {
                throw new Error('Invalid input for image. Reply to a sticker.');
            }
        }
        
        // ============ RESIZE IMAGE ============
        else if (mode === 'resize') {
            if (inputType === 'image') {
                fs.writeFileSync(tempInput + '.jpg', inputBuffer);
                await execPromise(`ffmpeg -i "${tempInput}.jpg" -vf "scale=720:720:force_original_aspect_ratio=decrease" "${tempOutput}.jpg"`);
                const outputBuffer = fs.readFileSync(tempOutput + '.jpg');
                await sock.sendMessage(chatId, { image: outputBuffer, caption: '> *© BATMAN MD*', ...newsletterContext }, { quoted: message });
            }
            else {
                throw new Error('Invalid input for resize. Reply to an image.');
            }
        }
        
        // ============ VIDEO CONVERSION (Sticker → Video | Audio → Video) ============
        else if (mode === 'video') {
            if (inputType === 'sticker') {
                fs.writeFileSync(tempInput + '.webp', inputBuffer);
                
                await sock.sendMessage(chatId, { react: { text: "🔄", key: message.key } });
                
                try {
                    // Try animated WEBP to MP4
                    await execPromise(`ffmpeg -i "${tempInput}.webp" -vf "fps=10,scale=480:-1:flags=lanczos" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 25 "${tempOutput}.mp4"`);
                    const outputBuffer = fs.readFileSync(tempOutput + '.mp4');
                    await sock.sendMessage(chatId, { video: outputBuffer, caption: '🎬 *Sticker to Video*\n\n> *© BATMAN MD*', ...newsletterContext }, { quoted: message });
                } catch (err) {
                    // Fallback: static frame
                    await execPromise(`ffmpeg -i "${tempInput}.webp" -frames:v 1 -c:v libx264 -pix_fmt yuv420p "${tempOutput}.mp4"`);
                    const outputBuffer = fs.readFileSync(tempOutput + '.mp4');
                    await sock.sendMessage(chatId, { video: outputBuffer, caption: '🎬 *Sticker to Video (Static)*\n\n> *© BATMAN MD*', ...newsletterContext }, { quoted: message });
                }
            }
            else if (inputType === 'audio') {
                fs.writeFileSync(tempInput + '.mp3', inputBuffer);
                await execPromise(`ffmpeg -i "${tempInput}.mp3" -filter_complex "[0:a]avectorscope=s=640x360,format=yuv420p[v]" -map "[v]" -map 0:a -c:v libx264 -c:a copy -shortest "${tempOutput}.mp4"`);
                const outputBuffer = fs.readFileSync(tempOutput + '.mp4');
                await sock.sendMessage(chatId, { video: outputBuffer, caption: '🎵 *Audio Visualizer*\n\n> *© BATMAN MD*', ...newsletterContext }, { quoted: message });
            }
            else {
                throw new Error('Invalid input for video. Reply to a sticker or audio.');
            }
        }
        
        // ============ AUDIO CONVERSION (Video → Audio/MP3) ============
        else if (mode === 'audio') {
            if (inputType === 'video') {
                fs.writeFileSync(tempInput + '.mp4', inputBuffer);
                await execPromise(`ffmpeg -i "${tempInput}.mp4" -q:a 0 -map a "${tempOutput}.mp3"`);
                const outputBuffer = fs.readFileSync(tempOutput + '.mp3');
                await sock.sendMessage(chatId, { 
                    audio: outputBuffer, 
                    mimetype: 'audio/mpeg',
                    fileName: 'audio.mp3',
                    ...newsletterContext
                }, { quoted: message });
            }
            else {
                throw new Error('Invalid input for audio. Reply to a video.');
            }
        }
        
        // ============ VOICE NOTE CONVERSION ============
        else if (mode === 'voicenote') {
            if (inputType === 'audio') {
                fs.writeFileSync(tempInput + '.mp3', inputBuffer);
                await execPromise(`ffmpeg -i "${tempInput}.mp3" -c:a libopus -b:a 24k -vbr on -compression_level 10 -application voip -ar 24000 -ac 1 "${tempOutput}.opus"`);
                const outputBuffer = fs.readFileSync(tempOutput + '.opus');
                await sock.sendMessage(chatId, { 
                    audio: outputBuffer, 
                    mimetype: 'audio/ogg',
                    ptt: true,
                    ...newsletterContext
                }, { quoted: message });
            }
            else if (inputType === 'video') {
                fs.writeFileSync(tempInput + '.mp4', inputBuffer);
                await execPromise(`ffmpeg -i "${tempInput}.mp4" -vn -c:a libopus -b:a 24k -vbr on -compression_level 10 -application voip -ar 24000 -ac 1 "${tempOutput}.opus"`);
                const outputBuffer = fs.readFileSync(tempOutput + '.opus');
                await sock.sendMessage(chatId, { 
                    audio: outputBuffer, 
                    mimetype: 'audio/ogg',
                    ptt: true,
                    ...newsletterContext
                }, { quoted: message });
            }
            else {
                throw new Error('Invalid input for voice note. Reply to audio or video.');
            }
        }
        
        // ============ VIDEO NOTE (Circle Video) ============
        else if (mode === 'videonote') {
            if (inputType === 'video') {
                fs.writeFileSync(tempInput + '.mp4', inputBuffer);
                await execPromise(`ffmpeg -i "${tempInput}.mp4" -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=480:480,format=yuv420p" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 64k -movflags +faststart -pix_fmt yuv420p "${tempOutput}.mp4"`);
                const outputBuffer = fs.readFileSync(tempOutput + '.mp4');
                await sock.sendMessage(chatId, { 
                    video: outputBuffer, 
                    mimetype: 'video/mp4',
                    gifPlayback: false,
                    ...newsletterContext
                }, { quoted: message });
            }
            else {
                throw new Error('Invalid input for video note. Reply to a video.');
            }
        }
        
        else {
            await sock.sendMessage(chatId, { 
                text: "❌ Invalid mode.\n\nAvailable modes:\n• sticker - Image/Video → Sticker\n• image - Sticker → Image\n• video - Sticker/Audio → Video\n• audio - Video → Audio (MP3)\n• voicenote - Audio/Video → Voice Note\n• videonote - Video → Circle Video\n• resize - Image → Resized Image"
            }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
            return;
        }

        // Cleanup temp files
        try {
            const files = fs.readdirSync(tmpDir);
            for (const file of files) {
                if (file.includes('input_') || file.includes('output_')) {
                    fs.unlinkSync(path.join(tmpDir, file));
                }
            }
        } catch (e) {}

        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('Convert error:', error.message);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        await sock.sendMessage(chatId, { 
            text: `❌ Conversion failed: ${error.message}`
        }, { quoted: message });
    }
}

module.exports = convertCommand;