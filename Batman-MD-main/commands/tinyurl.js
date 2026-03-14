const axios = require("axios");

// ============================================
// ENHANCEMENT: Quoted contact template
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
// ENHANCEMENT: Newsletter channel info
// ============================================
const channelInfo = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363367299421766@newsletter',
            newsletterName: 'BATMAN MD',
            serverMessageId: 144
        }
    }
};

// ============================================
// ENHANCEMENT: Helper function for stylish messages
// ============================================
function formatTinyUrlMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        link: '🔗',
        short: '✂️',
        url: '🌐'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

async function tinyurlCommand(sock, chatId, message, match) {
    try {
        // Extract the URL from the command
        const url = match?.trim();
        
        if (!url) {
            // ENHANCEMENT: Stylish usage message
            const usageMsg = formatTinyUrlMessage(
                'URL SHORTENER',
                `│ ✂️ Shorten long URLs instantly!\n│\n│ *Usage:* .tiny <url>\n│\n│ *Example:*\n│ ♧ .tiny https://github.com/Nabaikabaia/Batman-md`,
                'short'
            );
            await sock.sendMessage(chatId, { 
                text: usageMsg,
                ...channelInfo
            }, { quoted: quotedContact });
            return;
        }

        // Validate URL
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            const invalidMsg = formatTinyUrlMessage(
                'INVALID URL',
                `│ ⚠️ Please provide a valid URL starting with\n│ http:// or https://\n│\n│ *Example:*\n│ ♧ .tiny https://github.com/Nabaikabaia/Batman-md`,
                'warning'
            );
            await sock.sendMessage(chatId, { 
                text: invalidMsg,
                ...channelInfo
            }, { quoted: quotedContact });
            return;
        }

        // Show typing indicator
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);

        // Call TinyURL API
        const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
        const shortenedUrl = response.data;

        // ENHANCEMENT: Stylish success message
        const successMsg = formatTinyUrlMessage(
            'URL SHORTENED',
            `│ 🔗 *Original:*\n│ ♧ ${url}\n│\n│ ✂️ *Shortened:*\n│ ♧ ${shortenedUrl}\n│\n│ ✅ Your short URL is ready!`,
            'success'
        );
        
        await sock.sendMessage(chatId, { 
            text: successMsg,
            ...channelInfo
        }, { quoted: quotedContact });

    } catch (error) {
        console.error('❌ TinyURL Error:', error);
        
        // ENHANCEMENT: Stylish error message
        const errorMsg = formatTinyUrlMessage(
            'SHORTENING FAILED',
            `│ ❌ An error occurred while shortening the URL.\n│ 🔧 ${error.message}\n│\n│ 🔄 Please try again with a valid link.`,
            'error'
        );
        
        await sock.sendMessage(chatId, { 
            text: errorMsg,
            ...channelInfo
        }, { quoted: quotedContact });
    }
}

module.exports = tinyurlCommand;