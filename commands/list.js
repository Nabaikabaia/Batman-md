/**
 * List Command — Batman MD
 * Shows all commands grouped by category with interactive URL buttons
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

/**
 * Build grouped command list from commandsMeta.
 * Only counts each file once per category (deduplicates aliases).
 * Returns: { CategoryName: Set<fileName>, ... }
 */
function buildCategoryGroups() {
    const commandsDir = path.join(__dirname);
    const groups = {};

    for (const entry of commandsMeta) {
        // Skip entries whose backing file doesn't exist (optional safety)
        if (entry.file !== null) {
            const filePath = path.join(commandsDir, entry.file + '.js');
            if (!fs.existsSync(filePath)) continue;
        }
        const cat = entry.category || 'Other';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(entry.name);
    }

    // Auto-detect command files not covered by metadata → "Other"
    const metaFiles = new Set(commandsMeta.filter(e => e.file).map(e => e.file));
    const hidden = new Set(['help', 'list', 'settings']);
    try {
        const allFiles = fs.readdirSync(commandsDir)
            .filter(f => f.endsWith('.js'))
            .map(f => f.replace('.js', ''));
        for (const file of allFiles) {
            if (hidden.has(file) || metaFiles.has(file)) continue;
            if (!groups['Other']) groups['Other'] = [];
            groups['Other'].push(file);
        }
    } catch (_) {}

    return groups;
}

async function listCommand(sock, chatId, message) {
    let reactionSent = false;
    try {
        const prefix = settings.prefix || '.';
        const botName = settings.botName || 'BATMAN MD';

        await sock.sendMessage(chatId, { react: { text: '📋', key: message.key } });
        reactionSent = true;

        const groups = buildCategoryGroups();
        const totalCmds = Object.values(groups).reduce((n, arr) => n + arr.length, 0);

        // Ordered categories
        const preferredOrder = [
            'AI', 'Download', 'Fun', 'Games', 'Group',
            'Sticker', 'Text FX', 'Misc', 'General', 'Owner', 'Other'
        ];
        const seen = new Set();
        const orderedCats = [...preferredOrder, ...Object.keys(groups)].filter(c => {
            if (seen.has(c) || !groups[c] || groups[c].length === 0) return false;
            seen.add(c);
            return true;
        });

        // Build text body
        let menu = `*${botName} — Commands List*\n`;
        menu += `Prefix: *${prefix}*  |  Total: *${totalCmds}+* commands\n\n`;

        for (const cat of orderedCats) {
            const cfg = categoryConfig[cat] || { emoji: '📦', title: cat };
            menu += `*${cfg.emoji} ${cfg.title.replace(' Menu', '')}*\n`;
            for (const name of groups[cat]) {
                menu += `  • \`${prefix}${name}\`\n`;
            }
            menu += '\n';
        }

        menu = menu.trimEnd();

        // Send with gifted-btns interactive buttons
        await sendButtons(
            sock,
            chatId,
            {
                title: '',
                text: menu,
                footer: `> *Powered by ${botName}*`,
                buttons: [
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
                ]
            },
            { quoted: message }
        );

        // Remove reaction
        await sock.sendMessage(chatId, { react: { text: null, key: message.key } });
        reactionSent = false;

    } catch (err) {
        console.error('list.js error:', err);
        if (reactionSent) {
            try { await sock.sendMessage(chatId, { react: { text: null, key: message.key } }); } catch (_) {}
        }
        // Fallback — plain text if gifted-btns fails (e.g. not yet installed)
        try {
            await sock.sendMessage(chatId, {
                text: '❌ Failed to load commands list. Try `.help` instead.',
                ...channelInfo
            }, { quoted: message });
        } catch (_) {}
    }
}

module.exports = listCommand;
