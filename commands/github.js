const moment = require('moment-timezone');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

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

// ============================================
// ENHANCEMENT: Helper function for stylish messages
// ============================================
function formatGithubMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        github: '🐙',
        repo: '📦',
        code: '💻'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

async function githubCommand(sock, chatId, message) {
  try {
    // Show typing indicator
    await sock.presenceSubscribe(chatId);
    await sock.sendPresenceUpdate('composing', chatId);

    const res = await fetch('https://api.github.com/repos/Nabaikabaia/Batman-md');
    if (!res.ok) throw new Error('Error fetching repository data');
    const json = await res.json();

    // ENHANCEMENT: Stylish formatted text
    let txt = `*『 🐙 GITHUB REPOSITORY 』*
╭─────────⟢
│ 📦 *Name:* ${json.name}
│ 👀 *Watchers:* ${json.watchers_count}
│ 📊 *Size:* ${(json.size / 1024).toFixed(2)} MB
│ 🕒 *Last Updated:* ${moment(json.updated_at).format('DD/MM/YY - HH:mm:ss')}
│ 🔗 *URL:* ${json.html_url}
│ 🍴 *Forks:* ${json.forks_count}
│ ⭐ *Stars:* ${json.stargazers_count}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;

    // Use the local asset image
    const imgPath = path.join(__dirname, '../assets/bot_image.jpg');
    
    // Check if image exists
    if (fs.existsSync(imgPath)) {
        const imgBuffer = fs.readFileSync(imgPath);

        await sock.sendMessage(chatId, { 
            image: imgBuffer, 
            caption: txt,
            ...channelInfo 
        }, { quoted: quotedContact });
    } else {
        // If no image, just send text
        await sock.sendMessage(chatId, { 
            text: txt,
            ...channelInfo 
        }, { quoted: quotedContact });
    }
    
  } catch (error) {
    console.error('GitHub command error:', error);
    
    // ENHANCEMENT: Stylish error message
    const errorMsg = formatGithubMessage(
        'ERROR',
        `│ ❌ Error fetching repository information.\n│ 🔧 ${error.message}`,
        'error'
    );
    
    await sock.sendMessage(chatId, { 
        text: errorMsg,
        ...channelInfo 
    }, { quoted: quotedContact });
  }
}

module.exports = githubCommand;