const settings = require('../settings');
const fs = require('fs');
const path = require('path');

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
            serverMessageId: 152
        }
    }
};

// ============================================
// ENHANCEMENT: Helper function for stylish messages
// ============================================
function formatOwnerMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        owner: '👑',
        contact: '📇',
        phone: '📱'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

async function ownerCommand(sock, chatId) {
    try {
        // Show typing indicator
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);

        // Path to owner image
        const ownerImagePath = path.join(__dirname, '../assets/owner.jpg');
        
        // Format phone number for display
        const phoneNumber = settings.ownerNumber || '2347072182960';
        const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
        
        // Create stylish owner info text
        const ownerInfo = formatOwnerMessage(
            'BOT OWNER',
            `│ 👑 *Name:* ${settings.botOwner || 'Nabees Tech'}\n│ 📱 *Phone:* ${formattedNumber}\n│ 🤖 *Bot:* ${settings.botName || 'BATMAN MD'}\n│ 🔧 *Version:* ${settings.version || '1.0.0'}\n│\n│ 📞 *Click the contact card below to save!*`,
            'owner'
        );

        // First send the owner image with info
        if (fs.existsSync(ownerImagePath)) {
            const imageBuffer = fs.readFileSync(ownerImagePath);
            
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: ownerInfo,
                ...channelInfo
            }, { quoted: quotedContact });
        } else {
            // If no image, just send the text
            await sock.sendMessage(chatId, {
                text: ownerInfo,
                ...channelInfo
            }, { quoted: quotedContact });
        }

        // Create vcard with enhanced info
        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${settings.botOwner || 'Nabees Tech'}
ORG:${settings.botName || 'BATMAN MD'}
TITLE:Bot Owner
TEL;type=CELL;type=VOICE;waid=${phoneNumber}:${formattedNumber}
EMAIL:${settings.ownerEmail || 'nabees.dev@gmail.com'}
URL:${settings.website || 'https://nabees.online'}
NOTE:Bot Owner of ${settings.botName || 'BATMAN MD'} • Version ${settings.version || '1.0.0'}
ADR:;;;;
END:VCARD`;

        // Send contact card with newsletter forwarding
        await sock.sendMessage(chatId, {
            contacts: { 
                displayName: settings.botOwner || 'BATMAN MD Owner', 
                contacts: [{ vcard }] 
            },
            ...channelInfo
        }, { quoted: quotedContact });

        // Optional: Send a small footer message
        const footerMsg = formatOwnerMessage(
            'CONTACT SAVED',
            `│ ✅ Owner contact has been shared!\n│ 📞 You can now save the contact above.`,
            'success'
        );
        
        await sock.sendMessage(chatId, {
            text: footerMsg,
            ...channelInfo
        }, { quoted: quotedContact });

    } catch (error) {
        console.error('❌ Error in owner command:', error);
        
        // Fallback to original vcard if something fails
        const vcard = `
BEGIN:VCARD
VERSION:3.0
FN:${settings.botOwner}
TEL;waid=${settings.ownerNumber}:${settings.ownerNumber}
END:VCARD
`;

        await sock.sendMessage(chatId, {
            contacts: { displayName: settings.botOwner, contacts: [{ vcard }] },
            ...channelInfo
        }, { quoted: quotedContact });
    }
}

module.exports = ownerCommand;