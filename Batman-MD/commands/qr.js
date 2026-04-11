/**
 * QR Code Generator — Batman MD
 * Generates a QR code image from any text or URL.
 * Usage: .qr <text or URL>
 */
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const settings = require('../settings');

const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: settings.newsletterJid,
            newsletterName: settings.newsletterName,
            serverMessageId: -1,
        },
    },
};

async function qrCommand(sock, chatId, message, text) {
    if (!text || !text.trim()) {
        return sock.sendMessage(chatId, {
            text: `*📷 QR Code Generator*\n\nUsage: \`${settings.prefix || '.'}qr <text or URL>\`\n\nExamples:\n• \`${settings.prefix || '.'}qr https://nabees.online\`\n• \`${settings.prefix || '.'}qr Hello Batman MD!`,
            ...channelInfo,
        }, { quoted: message });
    }

    try {
        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const outPath = path.join(tempDir, `qr_${Date.now()}.png`);
        await QRCode.toFile(outPath, text.trim(), {
            type: 'png',
            width: 512,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' },
        });

        const imgBuffer = fs.readFileSync(outPath);

        await sock.sendMessage(chatId, {
            image: imgBuffer,
            caption: `*📷 QR Code Generated*\n\n📝 Content: \`${text.trim().slice(0, 100)}${text.length > 100 ? '...' : ''}\`\n\n_Scan with any QR reader_`,
            ...channelInfo,
        }, { quoted: message });

        fs.unlinkSync(outPath);
        await sock.sendMessage(chatId, { react: { text: null, key: message.key } });
    } catch (err) {
        console.error('[QR] Error:', err);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to generate QR code. Please try again.',
            ...channelInfo,
        }, { quoted: message });
    }
}

module.exports = qrCommand;
