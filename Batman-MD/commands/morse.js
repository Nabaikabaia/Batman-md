/**
 * Morse Code Converter — Batman MD
 * Converts text ↔ Morse code and also text ↔ binary.
 * Usage: .morse hello world  |  .unmorse .... . .-.. .-.. ---
 *        .binary Hello       |  .unbinary 01001000...
 */
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

// ── Morse tables ─────────────────────────────────────────────────────────────
const TEXT_TO_MORSE = {
    A:'.-', B:'-...', C:'-.-.', D:'-..', E:'.', F:'..-.', G:'--.', H:'....',
    I:'..', J:'.---', K:'-.-', L:'.-..', M:'--', N:'-.', O:'---', P:'.--.',
    Q:'--.-', R:'.-.', S:'...', T:'-', U:'..-', V:'...-', W:'.--', X:'-..-',
    Y:'-.--', Z:'--..', '0':'-----', '1':'.----', '2':'..---', '3':'...--',
    '4':'....-', '5':'.....', '6':'-....', '7':'--...', '8':'---..', '9':'----.',
    '.':'.-.-.-', ',':'--..--', '?':'..--..', "'":'.----.', '!':'-.-.--',
    '/':'-..-.', '(':'-.--.', ')':'-.--.-', '&':'.-...', ':':'---...',
    ';':'-.-.-.', '=':'-...-', '+':'.-.-.', '-':'-....-', '_':'..--.-',
    '"':'.-..-.', '$':'...-..-', '@':'.--.-.', ' ':'/  ',
};

const MORSE_TO_TEXT = Object.fromEntries(Object.entries(TEXT_TO_MORSE).map(([k, v]) => [v, k]));

function toMorse(text) {
    return text.toUpperCase().split('').map(c => TEXT_TO_MORSE[c] || '?').join(' ');
}

function fromMorse(morse) {
    return morse.trim().split('   ').map(word =>
        word.split(' ').map(code => {
            if (code === '/') return ' ';
            return MORSE_TO_TEXT[code] || '?';
        }).join('')
    ).join(' ');
}

function toBinary(text) {
    return text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
}

function fromBinary(bin) {
    return bin.trim().replace(/\s+/g, ' ').split(' ').map(b => {
        const n = parseInt(b, 2);
        return isNaN(n) ? '?' : String.fromCharCode(n);
    }).join('');
}

async function morseCommand(sock, chatId, message, text) {
    if (!text?.trim()) {
        return sock.sendMessage(chatId, {
            text: `*📡 Morse Code Converter*\n\nUsage:\n• \`${settings.prefix || '.'}morse <text>\` — text to morse\n• \`${settings.prefix || '.'}unmorse <code>\` — morse to text\n• \`${settings.prefix || '.'}binary <text>\` — text to binary\n• \`${settings.prefix || '.'}unbinary <bits>\` — binary to text`,
            ...channelInfo,
        }, { quoted: message });
    }
    const result = toMorse(text);
    await sock.sendMessage(chatId, {
        text: `*📡 Text → Morse*\n\n📝 Input:  ${text}\n📤 Morse: \`${result}\``,
        ...channelInfo,
    }, { quoted: message });
}

async function unmorseCommand(sock, chatId, message, code) {
    if (!code?.trim()) {
        return sock.sendMessage(chatId, {
            text: `Usage: \`${settings.prefix || '.'}unmorse <morse code>\`\nExample: \`${settings.prefix || '.'}unmorse .... . .-.. .-.. ---\``,
            ...channelInfo,
        }, { quoted: message });
    }
    const result = fromMorse(code);
    await sock.sendMessage(chatId, {
        text: `*📡 Morse → Text*\n\n📥 Morse:  \`${code}\`\n📤 Text:  *${result}*`,
        ...channelInfo,
    }, { quoted: message });
}

async function binaryCommand(sock, chatId, message, text) {
    if (!text?.trim()) {
        return sock.sendMessage(chatId, {
            text: `Usage: \`${settings.prefix || '.'}binary <text>\``,
            ...channelInfo,
        }, { quoted: message });
    }
    const result = toBinary(text);
    await sock.sendMessage(chatId, {
        text: `*💻 Text → Binary*\n\n📝 Input:   ${text}\n📤 Binary: \`${result}\``,
        ...channelInfo,
    }, { quoted: message });
}

async function unbinaryCommand(sock, chatId, message, bits) {
    if (!bits?.trim()) {
        return sock.sendMessage(chatId, {
            text: `Usage: \`${settings.prefix || '.'}unbinary <binary bits>\``,
            ...channelInfo,
        }, { quoted: message });
    }
    const result = fromBinary(bits);
    await sock.sendMessage(chatId, {
        text: `*💻 Binary → Text*\n\n📥 Binary: \`${bits.slice(0, 80)}${bits.length > 80 ? '...' : ''}\`\n📤 Text:   *${result}*`,
        ...channelInfo,
    }, { quoted: message });
}

module.exports = { morseCommand, unmorseCommand, binaryCommand, unbinaryCommand };
