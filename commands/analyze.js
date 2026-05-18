// commands/analyze.js
const axios = require('axios');
const { downloadMedia } = require('../lib/downloadMedia');

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

async function analyzeCommand(sock, chatId, message, args) {
    try {
        let imageBuffer = null;
        let directUrl = null;

        // Check for direct URL argument
        if (args && args.length > 0) {
            const possibleUrl = args.join(' ').trim();
            if (possibleUrl.match(/^https?:\/\/.+\/.*\.(jpg|jpeg|png|webp)/i)) {
                directUrl = possibleUrl;
            }
        }

        // If no direct URL, check for quoted image
        if (!directUrl) {
            try {
                imageBuffer = await downloadMedia(sock, message);
            } catch (err) {
                console.log('[OCR] No media or failed to download:', err.message);
            }
        }

        if (!directUrl && !imageBuffer) {
            await sock.sendMessage(chatId, {
                text: '🔍 *OCR - Extract Text from Image*\n\nUsage:\n1. Reply to an image with `.analyze`\n2. `.analyze <image_url>`\n\nExample: `.analyze https://example.com/image.jpg`',
                ...channelInfo
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: "⏳", key: message.key } });

        let extractedText = null;

        // Try primary URL-based OCR if directUrl provided
        if (directUrl) {
            try {
                const apiUrl = `https://eliteprotech-apis.zone.id/ocr?url=${encodeURIComponent(directUrl)}`;
                const response = await axios.get(apiUrl, { timeout: 60000 });
                if (response.data?.text) extractedText = response.data.text;
            } catch (err) {
                console.log('[OCR] Primary API failed, falling back to base64');
                // Download the image from the URL for base64 fallback
                const imgResp = await axios.get(directUrl, { responseType: 'arraybuffer', timeout: 30000 });
                imageBuffer = Buffer.from(imgResp.data);
            }
        }

        // If we have imageBuffer (either from quoted or downloaded URL), try base64 OCR fallback
        if (!extractedText && imageBuffer) {
            const base64 = imageBuffer.toString('base64');
            const mimeType = 'image/jpeg'; // best guess
            const fallbackUrl = 'https://staging-ai-image-ocr-266i.frontend.encr.app/api/ocr/process';
            try {
                const fallbackRes = await axios.post(fallbackUrl, {
                    imageBase64: base64,
                    mimeType: mimeType
                }, { timeout: 60000 });
                if (fallbackRes.data?.extractedText) {
                    extractedText = fallbackRes.data.extractedText;
                }
            } catch (err) {
                console.log('[OCR] Fallback also failed:', err.message);
            }
        }

        if (!extractedText) {
            throw new Error('No text detected');
        }

        // Clean and truncate
        let cleaned = extractedText.replace(/\r/g, '').split('\n').filter(l => l.trim()).join('\n');
        if (cleaned.length > 4000) cleaned = cleaned.slice(0, 4000) + '\n\n... (truncated)';

        await sock.sendMessage(chatId, {
            text: `📷 *Extracted Text*\n\n${cleaned}\n\n> *© BATMAN MD*`,
            ...channelInfo
        }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('[OCR] Error:', error.message);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        await sock.sendMessage(chatId, {
            text: `❌ *OCR Failed*\n${error.message}\n\nMake sure the image contains clear readable text.`,
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = analyzeCommand;