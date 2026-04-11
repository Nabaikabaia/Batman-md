/**
 * Password Generator — Batman MD
 * Generates a cryptographically random strong password.
 * Usage: .password  |  .password 20  |  .password 16 simple
 */
const crypto = require('crypto');
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

const CHARS = {
    upper:   'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower:   'abcdefghijklmnopqrstuvwxyz',
    digits:  '0123456789',
    special: '!@#$%^&*()-_=+[]{}|;:,.<>?',
};

function generate(length, includeSpecial = true) {
    const pool = CHARS.upper + CHARS.lower + CHARS.digits + (includeSpecial ? CHARS.special : '');
    let pass = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        pass += pool[bytes[i] % pool.length];
    }
    return pass;
}

function strength(pass) {
    let score = 0;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    if (pass.length >= 16) score++;
    const labels = ['', '🔴 Very Weak', '🟠 Weak', '🟡 Moderate', '🟢 Strong', '💎 Very Strong'];
    return labels[score] || '🔴 Very Weak';
}

async function passwordCommand(sock, chatId, message, args) {
    const parts = (args || '').trim().split(/\s+/);
    let length = parseInt(parts[0]) || 16;
    const simple = (parts[1] || '').toLowerCase() === 'simple';

    length = Math.min(Math.max(length, 8), 64); // clamp 8-64

    const pass = generate(length, !simple);
    const str = strength(pass);

    await sock.sendMessage(chatId, {
        text: `*🔐 Password Generator*\n\n` +
              `🔑 Password: \`${pass}\`\n` +
              `📏 Length:   ${length} chars\n` +
              `💪 Strength: ${str}\n\n` +
              `_Store it safely! BATMAN MD doesn't keep a record of this._`,
        ...channelInfo,
    }, { quoted: message });
}

module.exports = passwordCommand;
