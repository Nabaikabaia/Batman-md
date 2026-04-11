/**
 * World Time Command — Batman MD
 * Shows current time in popular world timezones.
 * Usage: .time  |  .time Lagos  |  .time London
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

const ZONES = [
    { label: '🇳🇬 Lagos (WAT)',        tz: 'Africa/Lagos' },
    { label: '🇬🇧 London (GMT/BST)',    tz: 'Europe/London' },
    { label: '🇺🇸 New York (EST/EDT)',  tz: 'America/New_York' },
    { label: '🇺🇸 Los Angeles (PST)',   tz: 'America/Los_Angeles' },
    { label: '🇦🇪 Dubai (GST)',         tz: 'Asia/Dubai' },
    { label: '🇮🇳 Mumbai (IST)',        tz: 'Asia/Kolkata' },
    { label: '🇸🇬 Singapore (SGT)',     tz: 'Asia/Singapore' },
    { label: '🇯🇵 Tokyo (JST)',         tz: 'Asia/Tokyo' },
    { label: '🇦🇺 Sydney (AEDT)',       tz: 'Australia/Sydney' },
    { label: '🇧🇷 São Paulo (BRT)',     tz: 'America/Sao_Paulo' },
    { label: '🇿🇦 Johannesburg (SAST)',  tz: 'Africa/Johannesburg' },
    { label: '🇩🇪 Berlin (CET/CEST)',   tz: 'Europe/Berlin' },
];

// Search map: keyword → timezone string
const ZONE_SEARCH = ZONES.reduce((acc, z) => {
    const keywords = z.label.toLowerCase().replace(/[🇦-🇿]/gu, '').trim().split(/[\s(/)]+/);
    keywords.forEach(k => { if (k.length > 2) acc[k] = z; });
    acc[z.tz.toLowerCase()] = z;
    return acc;
}, {});

function formatTime(tz) {
    const now = new Date();
    return now.toLocaleString('en-GB', {
        timeZone: tz,
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    });
}

async function timeCommand(sock, chatId, message, query) {
    if (query && query.trim()) {
        const key = query.trim().toLowerCase();
        const match = ZONE_SEARCH[key] || ZONES.find(z => z.label.toLowerCase().includes(key) || z.tz.toLowerCase().includes(key));
        if (match) {
            const timeStr = formatTime(match.tz);
            return sock.sendMessage(chatId, {
                text: `*🕐 World Time*\n\n${match.label}\n🕐 *${timeStr}*`,
                ...channelInfo,
            }, { quoted: message });
        }
        // Try raw Intl timezone
        try {
            new Intl.DateTimeFormat('en', { timeZone: query.trim() });
            const timeStr = formatTime(query.trim());
            return sock.sendMessage(chatId, {
                text: `*🕐 World Time*\n\n🌍 ${query.trim()}\n🕐 *${timeStr}*`,
                ...channelInfo,
            }, { quoted: message });
        } catch (_) {}
        return sock.sendMessage(chatId, {
            text: `❌ Unknown timezone: *${query.trim()}*\n\nTry: \`${settings.prefix || '.'}time\` for all zones, or use standard names like \`America/New_York\`, \`Europe/London\`.`,
            ...channelInfo,
        }, { quoted: message });
    }

    // No query → show all popular zones
    const lines = ZONES.map(z => `${z.label}\n   🕐 ${formatTime(z.tz)}`);
    await sock.sendMessage(chatId, {
        text: `*🕐 World Time*\n\n${lines.join('\n\n')}`,
        ...channelInfo,
    }, { quoted: message });
}

module.exports = timeCommand;
