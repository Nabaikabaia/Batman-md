const os = require('os');
const settings = require('../settings.js');

// ============================================
// ENHANCEMENT: Quoted contact template (from your vv command)
// ============================================
const quotedContact = {
  key: {
    fromMe: false,
    participant: `0@s.whatsapp.net`,
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "NABEES TECH",
      vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:BATMAN MD\nORG:BATMAN MD;\nTEL;type=CELL;type=VOICE;waid=+2347072182960:+2347072182960\nEND:VCARD"
    }
  }
};

// ============================================
// ENHANCEMENT: Newsletter channel info with correct JID
// ============================================
const channelInfo = {
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

function formatTime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds = seconds % (24 * 60 * 60);
    const hours = Math.floor(seconds / (60 * 60));
    seconds = seconds % (60 * 60);
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    let time = '';
    if (days > 0) time += `${days}d `;
    if (hours > 0) time += `${hours}h `;
    if (minutes > 0) time += `${minutes}m `;
    if (seconds > 0 || time === '') time += `${seconds}s`;

    return time.trim();
}

async function pingCommand(sock, chatId, message) {
    try {
        const start = Date.now();
        
        // Send initial pong with newsletter and quoted contact
        await sock.sendMessage(chatId, { 
            text: 'Pong!', 
            ...channelInfo 
        }, { 
            quoted: message 
        });
        
        const end = Date.now();
        const ping = Math.round((end - start) / 2);

        const uptimeInSeconds = process.uptime();
        const uptimeFormatted = formatTime(uptimeInSeconds);

        // ENHANCEMENT: Stylish bot info with newsletter and quoted contact
        const botInfo = `*『 🤖 BATMAN MD 』*
╭─────────⟢
│ 🚀 *Ping:* ${ping} ms
│ ⏱️ *Uptime:* ${uptimeFormatted}
│ 🔖 *Version:* v${settings.version}
│ 👑 *Owner:* Nabees Tech
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;

        // Send bot info with newsletter and quoted contact
        await sock.sendMessage(chatId, { 
            text: botInfo,
            ...channelInfo 
        }, { 
            quoted: quotedContact // Using the contact template for the second message
        });

    } catch (error) {
        console.error('Error in ping command:', error);
        
        // ENHANCEMENT: Stylish error message with newsletter and quoted contact
        const errorMsg = `*『 ❌ ERROR 』*
╭─────────⟢
│ Failed to get bot status.
│ 🔧 ${error.message}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
        
        await sock.sendMessage(chatId, { 
            text: errorMsg,
            ...channelInfo 
        }, { 
            quoted: quotedContact 
        });
    }
}

module.exports = pingCommand;