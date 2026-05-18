const settings = require('../settings');
const fs = require('fs');
const path = require('path');
const os = require('os');
const moment = require('moment-timezone');

// Load commandsMeta
let commandsMeta = [];
try {
    const metaPath = path.join(__dirname, '../lib/commandsMeta.js');
    const meta = require(metaPath);
    commandsMeta = meta.commands || [];
    console.log(`✅ Loaded ${commandsMeta.length} commands from commandsMeta`);
} catch (err) {
    console.error('❌ Failed to load commandsMeta:', err.message);
}

const botStartTime = Date.now();
const MENU_AUDIO_URL = 'https://eliteprotech-url.zone.id/17732975697380ue3xn.mp3';
const THUMB_IMAGE = 'https://aqrmhkzrrmpljrtknrpi.supabase.co/storage/v1/object/public/uploads/4YDNVP.jpg';

// Fake contact for quoting
const fakeMeta = {
    key: {
        participant: '0@s.whatsapp.net',
        remoteJid: 'status@broadcast',
        fromMe: false,
        id: 'BATMAN_META_' + Date.now()
    },
    message: {
        contactMessage: {
            displayName: 'BATMAN MD',
            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:BATMAN MD;;;;\nFN:BATMAN MD\nTEL;waid=2349049636843:+234 904 963 6843\nEND:VCARD`,
            sendEphemeral: true
        }
    },
    messageTimestamp: Math.floor(Date.now() / 1000),
    pushName: 'BATMAN MD'
};

function getUptime() {
    const seconds = Math.floor((Date.now() - botStartTime) / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
}

function getRamUsage() {
    try {
        const total = os.totalmem();
        const free = os.freemem();
        const used = total - free;
        const percentage = ((used / total) * 100).toFixed(1);
        const usedMB = Math.round(used / 1024 / 1024);
        const totalMB = Math.round(total / 1024 / 1024);
        return `${usedMB}MB / ${totalMB}MB (${percentage}%)`;
    } catch {
        return 'N/A';
    }
}

function getTimeBasedGreeting(userName) {
    const hour = moment().tz('Africa/Lagos').hour();
    if (hour >= 5 && hour < 12) return `Good Morning ☀️ @${userName}`;
    if (hour >= 12 && hour < 17) return `Good Afternoon 🌤️ @${userName}`;
    if (hour >= 17 && hour < 21) return `Good Evening 🌙 @${userName}`;
    return `Good Night 🌃 @${userName}`;
}

function extractPhoneNumber(jid) {
    let num = jid.split('@')[0];
    num = num.replace(/[^0-9]/g, '');
    if (num.length > 12) num = num.slice(-12);
    return num;
}

// Build command groups from commandsMeta AND scan commands folder for missing ones
function buildCommandGroups(prefix) {
    const groups = {};
    
    // First, add all commands from commandsMeta
    const metaCommandNames = new Set();
    for (const cmd of commandsMeta) {
        const category = cmd.category || 'Other';
        if (!groups[category]) groups[category] = [];
        groups[category].push(cmd.name);
        metaCommandNames.add(cmd.name);
    }
    
    // Second, scan commands folder for extra .js files not in meta
    const commandsDir = __dirname;
    const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js') && !['help.js', 'settings.js', 'list.js'].includes(f));
    const extraCommands = [];
    for (const file of files) {
        const cmdName = file.replace('.js', '');
        if (!metaCommandNames.has(cmdName)) {
            extraCommands.push(cmdName);
        }
    }
    
    // Add extra commands to "Other" category
    if (extraCommands.length > 0) {
        if (!groups['Other']) groups['Other'] = [];
        groups['Other'].push(...extraCommands);
    }
    
    // Sort each category alphabetically
    for (const cat in groups) groups[cat].sort();
    return groups;
}

async function helpCommand(sock, chatId, message) {
    try {
        const prefix = settings.prefix || '.';
        const senderId = message.key.participant || message.key.remoteJid;
        const senderName = message.pushName || extractPhoneNumber(senderId);

        const greeting = getTimeBasedGreeting(senderName);
        const uptime = getUptime();
        const ramInfo = getRamUsage();

        const groups = buildCommandGroups(prefix);
        const totalCmds = Object.values(groups).reduce((n, arr) => n + arr.length, 0);

        const botName = settings.botName || 'BATMAN MD';
        const version = settings.version || '1.0';
        const platform = os.platform().toUpperCase();
        const nodeVersion = process.version;
        const currentDate = moment().tz('Africa/Lagos').format('DD/MM/YYYY');
        const currentTime = moment().tz('Africa/Lagos').format('HH:mm');
        const dayName = moment().tz('Africa/Lagos').format('dddd');

        let menu = `${greeting}\n\n`;
        menu += `┌❏ *${botName} v${version}* ❏\n`;
        menu += `│\n├❏ Owner: NABEES TECH\n`;
        menu += `├❏ Prefix: ${prefix}\n`;
        menu += `├❏ User: ${senderName}\n`;
        menu += `├❏ Version: ${version}\n`;
        menu += `├❏ Time: ${currentTime} (Africa/Lagos)\n`;
        menu += `├❏ Uptime: ${uptime}\n`;
        menu += `├❏ Commands: ${totalCmds}\n`;
        menu += `├❏ Day: ${dayName}\n`;
        menu += `├❏ Date: ${currentDate}\n`;
        menu += `├❏ Platform: ${platform}\n`;
        menu += `├❏ Runtime: Node.js ${nodeVersion}\n`;
        menu += `├❏ RAM: ${ramInfo}\n`;
        menu += `├❏ Mode: Public\n`;
        menu += `│\n└❏\n\n`;

        // Preferred order (Other now included at the end)
        const preferredOrder = ['AI', 'Download', 'Fun', 'Games', 'Group', 'Sticker', 'Text FX', 'Misc', 'General', 'Owner', 'Utility', 'NSFW', 'Other'];
        const seen = new Set();
        for (const cat of [...preferredOrder, ...Object.keys(groups)]) {
            if (seen.has(cat) || !groups[cat] || groups[cat].length === 0) continue;
            seen.add(cat);
            menu += `◈═══〔 ${cat} 〕═══◈\n`;
            for (const cmd of groups[cat]) {
                menu += `*⚡︎* ${prefix}${cmd}\n`;
            }
            menu += `\n`;
        }
        menu += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n> © ${botName} v${version}\n`;

        // React
        await sock.sendMessage(chatId, { react: { text: "🪀", key: message.key } });

        // Send document with enlarged thumbnail
        await sock.sendMessage(chatId, {
            document: Buffer.from(' ', 'utf-8'),
            mimetype: 'application/pdf',
            fileName: `${botName}_Menu.pdf`,
            fileLength: 9999999999999999999,
            caption: menu,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363367299421766@newsletter',
                    newsletterName: 'BATMAN MD',
                    serverMessageId: 13
                },
                externalAdReply: {
                    title: 'NABEES TECH',
                    body: 'Click to visit website',
                    thumbnailUrl: THUMB_IMAGE,
                    mediaType: 1,
                    renderLargerThumbnail: true,   // Larger thumbnail
                    sourceUrl: 'https://nabees.online',
                    thumbnailHeight: 800,           // Increased from 300
                    thumbnailWidth: 800             // Increased from 300
                }
            }
        }, { quoted: fakeMeta });

        // Send audio
        try {
            await sock.sendMessage(chatId, {
                audio: { url: MENU_AUDIO_URL },
                mimetype: 'audio/mpeg',
                ptt: false,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363367299421766@newsletter',
                        newsletterName: 'BATMAN MD',
                        serverMessageId: 13
                    }
                }
            }, { quoted: message });
        } catch (audioErr) {
            console.log('Audio failed:', audioErr.message);
        }

        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
    } catch (error) {
        console.error('Help error:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        await sock.sendMessage(chatId, { text: "❌ Error loading menu." }, { quoted: message });
    }
}

module.exports = helpCommand;