/**
 * List Command — Batman MD
 * Shows all commands with descriptions, grouped by category.
 * Sends the bot image as a header + interactive URL buttons via gifted-btns.
 */

const fs = require('fs');
const path = require('path');
const settings = require('../settings');
const { commands: commandsMeta, categoryConfig } = require('../lib/commandsMeta');
const { sendButtons } = require('gifted-btns');

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

/** Load bot image as Buffer (returns null if not found). */
function loadBotImage() {
    const candidates = [
        path.join(__dirname, '../assets/bot_image.jpg'),
        path.join(__dirname, '../assets/owner.jpg'),
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) {
            try { return fs.readFileSync(p); } catch (_) {}
        }
    }
    return null;
}

/**
 * Build grouped entry list from commandsMeta.
 * Returns: { CategoryName: [{ name, desc }, ...], ... }
 * - Checks that the backing command file exists before including the entry.
 * - Auto-detects .js files in commands/ not covered by metadata → "Other".
 */
function buildCategoryGroups() {
    const commandsDir = path.join(__dirname);
    const groups = {};
    const metaFiles = new Set();

    for (const entry of commandsMeta) {
        if (entry.file !== null) {
            const filePath = path.join(commandsDir, entry.file + '.js');
            if (!fs.existsSync(filePath)) continue;
            metaFiles.add(entry.file);
        }
        const cat = entry.category || 'Other';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push({ name: entry.name, desc: entry.desc || '' });
    }

    // Auto-detect extras
    const hidden = new Set(['help', 'list', 'settings']);
    try {
        const allFiles = fs.readdirSync(commandsDir)
            .filter(f => f.endsWith('.js'))
            .map(f => f.replace('.js', ''));
        for (const file of allFiles) {
            if (hidden.has(file) || metaFiles.has(file)) continue;
            if (!groups['Other']) groups['Other'] = [];
            groups['Other'].push({ name: file, desc: '' });
        }
    } catch (_) {}

    return groups;
}

const PREFERRED_ORDER = [
    'AI', 'Download', 'Fun', 'Games', 'Group',
    'Sticker', 'Text FX', 'Misc', 'General', 'Owner', 'Other'
];

// ── Main command ──────────────────────────────────────────────────────────────

async function listCommand(sock, chatId, message) {
    let reactionSent = false;
    try {
        const prefix = settings.prefix || '.';
        const botName = settings.botName || 'BATMAN MD';

        await sock.sendMessage(chatId, { react: { text: '📋', key: message.key } });
        reactionSent = true;

        const groups = buildCategoryGroups();
        const totalCmds = Object.values(groups).reduce((n, arr) => n + arr.length, 0);

        // Ordered category list
        const seen = new Set();
        const orderedCats = [...PREFERRED_ORDER, ...Object.keys(groups)].filter(c => {
            if (seen.has(c) || !groups[c] || groups[c].length === 0) return false;
            seen.add(c);
            return true;
        });

        // ── Build menu text ──────────────────────────────────────────────────
        let menu = `*╔══ ${botName} — Commands List ══╗*\n`;
        menu += `*║* Prefix: *${prefix}*  •  Total: *${totalCmds}+* commands\n`;
        menu += `*╚══════════════════════════════╝*\n\n`;

        for (const cat of orderedCats) {
            const cfg = categoryConfig[cat] || { emoji: '📦', title: cat };
            const label = cfg.title.replace(' Menu', '');
            menu += `*${cfg.emoji} ${label}*\n`;

            for (const { name, desc } of groups[cat]) {
                const cmdStr = `\`${prefix}${name}\``;
                menu += desc
                    ? `  • ${cmdStr} — ${desc}\n`
                    : `  • ${cmdStr}\n`;
            }
            menu += '\n';
        }

        menu = menu.trimEnd();

        // ── Buttons definition ───────────────────────────────────────────────
        const buttons = [
            {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '🌐 Website',
                    url: 'https://nabees.online'
                })
            },
            {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📦 Bot Repo',
                    url: 'https://github.com/Nabaikabaia/Batman-md'
                })
            },
            {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📣 Join Channel',
                    url: 'https://whatsapp.com/channel/0029VawtjOXJpe8X3j3NCZ3j'
                })
            }
        ];

        const footer = `> *Powered by ${botName}*`;
        const botImage = loadBotImage();

        // ── Send with image header if available ──────────────────────────────
        if (botImage) {
            // Try gifted-btns image header first; fall back to two-step send.
            let sent = false;
            try {
                await sendButtons(
                    sock,
                    chatId,
                    { image: botImage, title: '', text: menu, footer, buttons },
                    { quoted: message }
                );
                sent = true;
            } catch (_) {}

            if (!sent) {
                // Two-step: image first, then buttons message
                await sock.sendMessage(chatId, {
                    image: botImage,
                    caption: `*${botName}*\n_Type ${prefix}list to see full command list_`,
                    ...channelInfo
                }, { quoted: message });

                await sendButtons(
                    sock,
                    chatId,
                    { title: '', text: menu, footer, buttons },
                    { quoted: message }
                );
            }
        } else {
            // No image — plain buttons message
            await sendButtons(
                sock,
                chatId,
                { title: '', text: menu, footer, buttons },
                { quoted: message }
            );
        }

        // ── Remove reaction ──────────────────────────────────────────────────
        await sock.sendMessage(chatId, { react: { text: null, key: message.key } });
        reactionSent = false;

    } catch (err) {
        console.error('list.js error:', err);
        if (reactionSent) {
            try { await sock.sendMessage(chatId, { react: { text: null, key: message.key } }); } catch (_) {}
        }
        try {
            await sock.sendMessage(chatId, {
                text: '❌ Failed to load commands list. Try `.help` instead.',
                ...channelInfo
            }, { quoted: message });
        } catch (_) {}
    }
}

module.exports = listCommand;
