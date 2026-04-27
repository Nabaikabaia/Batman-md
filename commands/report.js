// commands/report.js
const settings = require('../settings');

const newsletterContext = {
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

// Hardcoded developer numbers
const DEV_NUMBERS = ['2347072182960', '2349049636843'];

function extractPhoneNumber(jid) {
    if (!jid) return null;
    let num = jid.split('@')[0];
    num = num.replace(/[^0-9]/g, '');
    if (num.length > 12) return null;
    return num;
}

async function reportCommand(sock, chatId, message, args) {
    try {
        const type = args[0]?.toLowerCase();
        const content = args.slice(1).join(' ').trim();
        const senderId = message.key.participant || message.key.remoteJid;
        const senderName = message.pushName || 'Unknown';
        const senderNumber = extractPhoneNumber(senderId) || 'Unknown';
        
        // Show menu if no type provided
        if (!type || (type !== 'bug' && type !== 'feature')) {
            await sock.sendMessage(chatId, { 
                text: "📢 *Feedback & Support*\n\n*Report a Bug:*\n.report bug <description>\n\n*Request a Feature:*\n.report feature <description>\n\n*Examples:*\n.report bug The .play command is not working\n.report feature Add a .weather command",
                ...newsletterContext
            }, { quoted: message });
            return;
        }
        
        if (!content) {
            const msg = type === 'bug' 
                ? "🐛 *Report Bug*\n\nPlease describe the bug:\n.report bug <description>"
                : "💡 *Request Feature*\n\nPlease describe the feature:\n.report feature <description>";
            await sock.sendMessage(chatId, { text: msg }, { quoted: message });
            return;
        }

        const emoji = type === 'bug' ? "🐛" : "💡";
        await sock.sendMessage(chatId, { react: { text: emoji, key: message.key } });

        const timestamp = new Date().toLocaleString();
        
        // Report message that goes to devs (includes sender info)
        const reportMsg = type === 'bug' 
            ? `┌❏ *BUG REPORT* ❏
│
├❏ 👤 *From:* ${senderName}
├❏ 📱 *Number:* ${senderNumber}
├❏ 🕐 *Time:* ${timestamp}
├❏ 🐛 *Bug:* ${content}
│
└❏ ❏`
            : `┌❏ *FEATURE REQUEST* ❏
│
├❏ 👤 *From:* ${senderName}
├❏ 📱 *Number:* ${senderNumber}
├❏ 🕐 *Time:* ${timestamp}
├❏ 💡 *Feature:* ${content}
│
└❏ ❏`;

        // Send report to all dev numbers
        for (const devNumber of DEV_NUMBERS) {
            const devJid = devNumber + '@s.whatsapp.net';
            try {
                await sock.sendMessage(devJid, { text: reportMsg, ...newsletterContext });
            } catch (err) {
                console.error(`Failed to send to ${devNumber}:`, err.message);
            }
        }
        
        // DELETE THE USER'S REPORT MESSAGE FROM THEIR OWN CHAT (not the command)
        // The command is the ".report bug something" message itself
        try {
            await sock.sendMessage(chatId, {
                delete: {
                    remoteJid: chatId,
                    fromMe: false,
                    id: message.key.id,
                    participant: message.key.participant || senderId
                }
            });
        } catch (deleteErr) {
            console.log('Could not delete user message:', deleteErr.message);
        }
        
        // No confirmation message sent to user - complete silence
        // Just remove the reaction after a delay
        setTimeout(async () => {
            try {
                await sock.sendMessage(chatId, { react: { text: emoji, key: message.key, remove: true } });
            } catch (err) {}
        }, 1000);

    } catch (error) {
        console.error('Report error:', error);
    }
}

module.exports = reportCommand;
