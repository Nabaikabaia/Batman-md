// lib/downloadMedia.js
const axios = require('axios');

/**
 * Download media from a WhatsApp message (image, video, document, sticker)
 * @param {Object} sock - Baileys socket instance
 * @param {Object} message - The full message object (containing the quoted media or direct media)
 * @returns {Promise<Buffer>} - Media buffer
 */
async function downloadMedia(sock, message) {
    // Check if the message itself contains media (for replied messages)
    let mediaMsg = null;
    
    // Case 1: The message has a quoted message with media
    if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        mediaMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
    }
    // Case 2: The message itself is a media message (e.g., image without caption)
    else if (message.message?.imageMessage || message.message?.videoMessage || message.message?.documentMessage) {
        mediaMsg = message.message;
    }
    
    if (!mediaMsg) {
        throw new Error('No quoted media found');
    }
    
    // Extract the specific media object
    let mediaKey = mediaMsg.imageMessage || mediaMsg.videoMessage || mediaMsg.documentMessage || mediaMsg.stickerMessage || mediaMsg.audioMessage;
    if (!mediaKey) {
        throw new Error('No media key found in quoted message');
    }
    
    // Method 1: Use Baileys' downloadMediaMessage (most common)
    if (typeof sock.downloadMediaMessage === 'function') {
        try {
            // Attempt with the full quoted message object
            const buffer = await sock.downloadMediaMessage(mediaMsg);
            if (buffer) return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
        } catch (err) {
            console.warn('downloadMediaMessage with full message failed, trying with media key:', err.message);
        }
        try {
            // Some versions need the media key object
            const buffer = await sock.downloadMediaMessage(mediaKey);
            if (buffer) return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
        } catch (err2) {
            console.warn('downloadMediaMessage with media key also failed:', err2.message);
        }
    }
    
    // Method 2: If the media has a direct URL (rare, but possible for some forwarded media)
    if (mediaKey.url) {
        try {
            const response = await axios.get(mediaKey.url, { responseType: 'arraybuffer', timeout: 30000 });
            return Buffer.from(response.data);
        } catch (err) {
            console.warn('Direct URL download failed:', err.message);
        }
    }
    
    // Method 3: Try using decryptMedia function if available (deprecated)
    if (sock.decryptMedia && mediaKey) {
        try {
            const buffer = await sock.decryptMedia(mediaKey);
            if (buffer) return buffer;
        } catch (err) {
            console.warn('decryptMedia failed:', err.message);
        }
    }
    
    throw new Error('Unable to download media – no working method');
}

module.exports = { downloadMedia };