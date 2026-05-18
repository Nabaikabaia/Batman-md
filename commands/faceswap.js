// commands/faceswap.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { downloadMedia } = require('../lib/downloadMedia');

const faceSwapCache = new Map();

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

const TMP_DIR = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

async function faceswapCommand(sock, chatId, message, args) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const userPhone = senderId.split('@')[0];

        // Check if there is a quoted image
        const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const hasQuotedImage = quotedMsg && (quotedMsg.imageMessage || quotedMsg.videoMessage);

        // STAGE 0: No image and no pending session → show text instructions
        if (!hasQuotedImage && !faceSwapCache.has(senderId)) {
            const instructions = `🎭 *FACE-SWAP ENGINE*\n\n` +
                `*Step 1:* Reply to the SOURCE image (the face to take) with:\n\`.faceswap\`\n\n` +
                `*Step 2:* Reply to the TARGET image (the face to replace) with:\n\`.faceswap\`\n\n` +
                `> *© BATMAN MD*`;
            await sock.sendMessage(chatId, { text: instructions, ...channelInfo }, { quoted: message });
            return;
        }

        // If we have a quoted image, download it
        let imageBuffer;
        if (hasQuotedImage) {
            try {
                imageBuffer = await downloadMedia(sock, message);
            } catch (err) {
                console.error('[FaceSwap] Download error:', err);
                await sock.sendMessage(chatId, { text: '❌ Failed to download the image. Try sending the image again.' }, { quoted: message });
                return;
            }
        } else {
            // No quoted image and no session? Already handled above.
            // If session exists but no image, this case shouldn't happen
            await sock.sendMessage(chatId, { text: '❌ Please reply to an image.' }, { quoted: message });
            return;
        }

        // STAGE 1: First image (source)
        if (!faceSwapCache.has(senderId)) {
            const sourcePath = path.join(TMP_DIR, `source_${userPhone}.jpg`);
            fs.writeFileSync(sourcePath, imageBuffer);
            faceSwapCache.set(senderId, { source: sourcePath });
            await sock.sendMessage(chatId, {
                text: '✅ *Source image saved.* Now reply to the **target image** (the face you want to replace) with `.faceswap`.',
                ...channelInfo
            }, { quoted: message });
            return;
        }

        // STAGE 2: Second image (target) → process face swap
        const cached = faceSwapCache.get(senderId);
        if (cached && cached.source) {
            const sourcePath = cached.source;
            const targetPath = path.join(TMP_DIR, `target_${userPhone}.jpg`);
            fs.writeFileSync(targetPath, imageBuffer);

            await sock.sendMessage(chatId, {
                text: '✨ *Neural Lab:* Both samples acquired. Initiating face-swap... this may take 30 seconds.',
                ...channelInfo
            }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: "🧬", key: message.key } });

            try {
                // 1. Create job on lovefaceswap.com
                const form = new FormData();
                form.append('source_image', fs.createReadStream(sourcePath), { filename: 'source.jpg', contentType: 'image/jpeg' });
                form.append('target_image', fs.createReadStream(targetPath), { filename: 'target.jpg', contentType: 'image/jpeg' });

                const createRes = await axios.post('https://api.lovefaceswap.com/api/face-swap/create-poll', form, {
                    headers: {
                        ...form.getHeaders(),
                        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
                        'Origin': 'https://lovefaceswap.com',
                        'Referer': 'https://lovefaceswap.com/'
                    },
                    timeout: 30000
                });

                const taskId = createRes.data?.data?.task_id;
                if (!taskId) throw new Error('No task ID received');

                // 2. Poll for result (max 20 attempts, 3 seconds each = 60 seconds)
                let resultUrl = null;
                for (let i = 0; i < 20; i++) {
                    await new Promise(r => setTimeout(r, 3000));
                    const check = await axios.get(`https://api.lovefaceswap.com/api/common/get?job_id=${taskId}`, {
                        headers: { 'User-Agent': 'Mozilla/5.0', 'Origin': 'https://lovefaceswap.com' },
                        timeout: 10000
                    });
                    const data = check.data?.data;
                    if (data?.image_url && data.image_url.length > 0) {
                        resultUrl = data.image_url[0];
                        break;
                    }
                    if (data?.status === 'failed') throw new Error('Processing failed on server');
                }

                if (!resultUrl) throw new Error('Processing timeout');

                // 3. Send result image
                await sock.sendMessage(chatId, {
                    image: { url: resultUrl },
                    caption: `🎭 *FACE-SWAP SUCCESSFUL*\n\n> *© BATMAN MD*`,
                    ...channelInfo
                }, { quoted: message });
                await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

            } catch (apiErr) {
                console.error('[FaceSwap] API error:', apiErr.message);
                await sock.sendMessage(chatId, {
                    text: `❌ *Face-swap failed:* ${apiErr.message}`,
                    ...channelInfo
                }, { quoted: message });
                await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
            } finally {
                // Cleanup temp files
                try {
                    if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath);
                    if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
                } catch (e) { }
                faceSwapCache.delete(senderId);
            }
        }
    } catch (error) {
        console.error('[FaceSwap] General error:', error.message);
        await sock.sendMessage(chatId, { text: `❌ *Error:* ${error.message}`, ...channelInfo }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        // Clean up cache on error
        const senderId2 = message.key.participant || message.key.remoteJid;
        if (faceSwapCache.has(senderId2)) {
            const old = faceSwapCache.get(senderId2);
            if (old?.source && fs.existsSync(old.source)) fs.unlinkSync(old.source);
            faceSwapCache.delete(senderId2);
        }
    }
}

module.exports = faceswapCommand;