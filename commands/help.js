const settings = require('../settings');
const fs = require('fs');
const path = require('path');
const { commands: commandsMeta, categoryConfig } = require('../lib/commandsMeta');

const botStartTime = Date.now();

// ============================================
// ENHANCEMENT: Multiple image URLs for random selection
// ============================================
const imageUrls = [
    'https://eliteprotech-url.zone.id/17738209879847o227e.jpg',
    'https://eliteprotech-url.zone.id/1773820972620l5kfaj.jpg',
    'https://eliteprotech-url.zone.id/1773820961364sqlh4z.jpg',
    'https://eliteprotech-url.zone.id/1773820922047xds28h.jpg',
    'https://eliteprotech-url.zone.id/1773820936402tvozdz.jpg'
];

// ============================================
// FUNCTION TO GET RANDOM URL FROM ARRAY
// ============================================
function getRandomImageUrl() {
    const randomIndex = Math.floor(Math.random() * imageUrls.length);
    return imageUrls[randomIndex];
}

// ── Assets ──────────────────────────────────────────────────────────────────
let contactThumb = null;
try {
    const thumbPath = path.join(__dirname, '../assets/owner.jpg');
    if (fs.existsSync(thumbPath)) contactThumb = fs.readFileSync(thumbPath);
} catch (_) {}

const quotedContact = {
    key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
    message: {
        contactMessage: {
            displayName: settings.botOwner || 'BATMAN MD',
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${settings.botName || 'BATMAN MD'}\nORG:${settings.botName || 'BATMAN MD'};\nEND:VCARD`,
            jpegThumbnail: contactThumb
        }
    }
};

const channelInfo = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363367299421766@newsletter',
            newsletterName: settings.botName || 'BATMAN MD',
            serverMessageId: 13
        }
    }
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function getSpacing(lines = 1) { return '\u200E'.repeat(200 * lines); }

function getUptime() {
    const s = Math.floor((Date.now() - botStartTime) / 1000);
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600),
          m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (d > 0) return `${d}d ${h}h ${m}m ${sec}s`;
    if (h > 0) return `${h}h ${m}m ${sec}s`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
}

// ── Auto-detect command files in commands/ ───────────────────────────────────
function getCommandsDir() { return path.join(__dirname); }

function detectAllCommandFiles() {
    try {
        return fs.readdirSync(getCommandsDir())
            .filter(f => f.endsWith('.js'))
            .map(f => f.replace('.js', ''));
    } catch (_) { return []; }
}

/**
 * Build a grouped menu object from commandsMeta + auto-detected extras.
 * Returns: { CategoryName: ['cmd1', 'cmd2', ...], ... }
 */
function buildCommandGroups(prefix) {
    const groups = {};
    const metaFiles = new Set();

    // First pass: entries defined in commandsMeta
    for (const entry of commandsMeta) {
        // Skip entries whose command file doesn't exist (optional safety check)
        if (entry.file !== null) {
            const filePath = path.join(getCommandsDir(), entry.file + '.js');
            if (!fs.existsSync(filePath)) continue;
            metaFiles.add(entry.file);
        }
        const cat = entry.category || 'Other';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(prefix + entry.name);
    }

    // Second pass: auto-detect any command files not covered by metadata
    const allFiles = detectAllCommandFiles();
    const hiddenFiles = new Set(['help', 'settings']); // internal-only files

    for (const file of allFiles) {
        if (hiddenFiles.has(file)) continue;
        if (metaFiles.has(file)) continue;
        // Not in meta → add to "Other" using filename as command name
        if (!groups['Other']) groups['Other'] = [];
        groups['Other'].push(prefix + file);
    }

    return groups;
}

// ── Header styles ────────────────────────────────────────────────────────────
function getRandomHeader(senderName, prefix, uptime, totalCmds) {
    const bn = settings.botName || 'BATMAN MD';
    const bo = settings.botOwner || 'Nabees Tech';
    const mode = settings.commandMode || 'public';
    const ver = settings.version || '1.0.0';

    const headers = [
        `╭━◈〔 🔥 ${bn} v${ver} 〕╼
┃ ❀ Owner    : 𖤍 ${bo} 𖤍
┃ ❀ User     : ${senderName}
┃ ❀ Mode     : 🌍 ${mode}
┃ ❀ Prefix   : ${prefix}
┃ ❀ Commands : ${totalCmds}+ loaded
┃ ❀ Runtime  : ${uptime}
╰━◈━━━━━━━━❁━━━━━━━━━◈━╯`,

        `╭━𑁍〔🔥 ${bn} v${ver} 〕╼
┃ ❀ Owner    : 𖤍 ${bo} 𖤍
┃ ❀ User     : ${senderName}
┃ ❀ Mode     : 🌍 ${mode}
┃ ❀ Prefix   : ${prefix}
┃ ❀ Commands : ${totalCmds}+ loaded
┃ ❀ Runtime  : ${uptime}
╰━𑁍━══━═━❁━═━══━𑁍━╯`,

        `*『 👑 ${bn} 』*
*│ 👤 ᴏᴡɴᴇʀ     : ${bo}*
*│ 👤 ᴜsᴇʀ      : ${senderName}*
*│ 🌍 ᴍᴏᴅᴇ      : [ ${mode} ]*
*│ 🛠️ ᴘʀᴇғɪx    : [ ${prefix} ]*
*│ 📦 ᴄᴍᴅs      : ${totalCmds}+ ʟᴏᴀᴅᴇᴅ*
*│ 🔄 ᴜᴘᴛɪᴍᴇ    : ${uptime}*
*╰─────────⟢*`,

        `┏━━〔 ${bn} 〕━━┓
┃ Owner    : ${bo}
┃ User     : ${senderName}
┃ Mode     : ${mode}
┃ Prefix   : ${prefix}
┃ Commands : ${totalCmds}+ loaded
┃ Uptime   : ${uptime}
┗━━━━━━━━━━━━━━━━━━┛`,
    ];

    return headers[Math.floor(Math.random() * headers.length)];
}

// ── Main help command ─────────────────────────────────────────────────────────
async function helpCommand(sock, chatId, message) {
    let reactionSent = false;
    try {
        const prefix = settings.prefix || '.';
        const senderId = message.key.participant || message.key.remoteJid;
        let senderName = senderId.split('@')[0];
        try { if (message.pushName) senderName = message.pushName; } catch (_) {}

        const uptime = getUptime();
        // ============================================
        // ENHANCEMENT: Use random image URL instead of local file
        // ============================================
        const randomImageUrl = getRandomImageUrl();
        console.log(`🎲 Selected random image: ${randomImageUrl}`);
        
        const songPath  = path.join(__dirname, '../assets/menu.mp3');

        // Build command groups dynamically
        const groups = buildCommandGroups(prefix);
        const totalCmds = Object.values(groups).reduce((n, arr) => n + arr.length, 0);

        const randomHeader = getRandomHeader(senderName, prefix, uptime, totalCmds);

        // Build menu sections
        const menuSections = [];
        // Iterate in a preferred order, then any remaining categories
        const preferredOrder = ['AI', 'Download', 'Fun', 'Games', 'Group', 'Sticker', 'Text FX', 'Misc', 'General', 'Owner', 'Other'];
        const seen = new Set();

        for (const cat of [...preferredOrder, ...Object.keys(groups)]) {
            if (seen.has(cat) || !groups[cat] || groups[cat].length === 0) continue;
            seen.add(cat);

            const cfg = categoryConfig[cat] || { emoji: '📦', title: cat + ' Menu' };
            const lines = groups[cat].map(c => `*│ ♧ ${c}*`).join('\n');
            menuSections.push(
                `*『 ${cfg.emoji} ${cfg.title} 』*\n${lines}\n*╰─────────⟢*`
            );
        }

        const menuText = `
${randomHeader}
${getSpacing(2)}

${menuSections.join('\n' + getSpacing(2) + '\n\n')}

${getSpacing(2)}
◈━═━〔 *INFO & CREDITS* 〕━═━◈
◈ *_Powered By_* : ${settings.botOwner || 'Nabees Tech'} ᵗᵐ
◈ Developer : 𝓝𝓪𝓫𝓮𝓮𝓼 𝓣𝓮𝓬𝓱
◈ Bot       : ${settings.botName || 'BATMAN MD'} v${settings.version || '1.0.0'}
◈━══━══━══━❁━══━══━══━◈`;

        // Reaction
        await sock.sendMessage(chatId, { react: { text: '🪀', key: message.key } });
        reactionSent = true;

        // ============================================
        // ENHANCEMENT: Send menu with random image from URL
        // ============================================
        await sock.sendMessage(chatId, {
            image: { url: randomImageUrl },
            caption: menuText,
            ...channelInfo
        }, { quoted: quotedContact });

        // Send audio
        if (fs.existsSync(songPath)) {
            await new Promise(r => setTimeout(r, 1000));
            await sock.sendMessage(chatId, {
                audio: fs.readFileSync(songPath),
                mimetype: 'audio/mpeg',
                ptt: false,
                ...channelInfo
            }, { quoted: quotedContact });
        }

        // Remove reaction
        await sock.sendMessage(chatId, { react: { text: null, key: message.key } });
        reactionSent = false;

    } catch (error) {
        console.error('Error in help command:', error);
        if (reactionSent) {
            try { await sock.sendMessage(chatId, { react: { text: null, key: message.key } }); } catch (_) {}
        }
        await sock.sendMessage(chatId, { text: '❌ Error loading menu', ...channelInfo }, { quoted: quotedContact });
    }
}

module.exports = helpCommand;
