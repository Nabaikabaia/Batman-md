// commands/report.js
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
    // LIDs are longer than 12 digits
    if (num.length > 12) {
        return null;
    }
    return num;
}

async function reportCommand(sock, chatId, message, args) {
    try {
        const type = args[0]?.toLowerCase();
        const content = args.slice(1).join(' ').trim();
        const senderId = message.key.participant || message.key.remoteJid;
        
        // Extract actual phone number (not LID)
        let senderNumber = extractPhoneNumber(senderId);
        const senderName = message.pushName || senderNumber || 'Unknown';
        
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

        // React based on type
        const emoji = type === 'bug' ? "🐛" : "💡";
        await sock.sendMessage(chatId, { react: { text: emoji, key: message.key } });

        const timestamp = new Date().toLocaleString();
        
        // Format sender number display
        const displayNumber = senderNumber || 'Unknown (LID detected)';
        
        const reportMsg = type === 'bug' 
            ? `┌❏ *BUG REPORT* ❏
│
├❏ 👤 *From:* ${senderName}
├❏ 📱 *Number:* ${displayNumber}
├❏ 🕐 *Time:* ${timestamp}
├❏ 🐛 *Bug:* ${content}
│
└❏ ❏`
            : `┌❏ *FEATURE REQUEST* ❏
│
├❏ 👤 *From:* ${senderName}
├❏ 📱 *Number:* ${displayNumber}
├❏ 🕐 *Time:* ${timestamp}
├❏ 💡 *Feature:* ${content}
│
└❏ ❏`;

        // Send to all dev numbers
        for (const devNumber of DEV_NUMBERS) {
            const devJid = devNumber + '@s.whatsapp.net';
            try {
                await sock.sendMessage(devJid, { text: reportMsg, ...newsletterContext });
            } catch (err) {
                console.error(`Failed to send to ${devNumber}:`, err.message);
            }
        }
        
        // Send confirmation to user
        const confirmMsg = type === 'bug'
            ? "✅ *Bug Reported!*\n\nThank you for helping improve BATMAN MD. The developers will review your report.\n\n> *© BATMAN MD*"
            : "✅ *Feature Request Submitted!*\n\nThank you for your suggestion. The developers will consider adding this feature.\n\n> *© BATMAN MD*";
        
        await sock.sendMessage(chatId, { 
            text: confirmMsg,
            ...newsletterContext
        }, { quoted: message });
        
        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('Report error:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
    }
}

module.exports = reportCommand;
