const { isAdmin } = require('../lib/isAdmin');

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

// Function to handle manual promotions via command
async function promoteCommand(sock, chatId, mentionedJids, message) {
    let userToPromote = [];
    
    // Check for mentioned users
    if (mentionedJids && mentionedJids.length > 0) {
        userToPromote = mentionedJids;
    }
    // Check for replied message
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToPromote = [message.message.extendedTextMessage.contextInfo.participant];
    }
    
    // If no user found through either method
    if (userToPromote.length === 0) {
        // ENHANCEMENT: Stylish missing user message with newsletter and quoted contact
        const missingMsg = `*『 ⚠️ USER REQUIRED 』*
╭─────────⟢
│ Please mention the user or
│ reply to their message to promote!
│
│ *Usage:*
│ ♧ .promote @user
│ ♧ Reply + .promote
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
        
        await sock.sendMessage(chatId, { 
            text: missingMsg,
            ...channelInfo
        }, { quoted: quotedContact });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, userToPromote, "promote");
        
        // Get usernames for each promoted user
        const usernames = await Promise.all(userToPromote.map(async jid => {
            return `@${jid.split('@')[0]}`;
        }));

        // Get promoter's name (the bot user in this case)
        const promoterJid = sock.user.id;
        
        // ENHANCEMENT: Stylish promotion success message
        const promotionMessage = `*『 👑 PROMOTION SUCCESSFUL 』*
╭─────────⟢
│ 👥 *Promoted User${userToPromote.length > 1 ? 's' : ''}:*
│ ${usernames.map(name => `♧ ${name}`).join('\n│ ')}
│
│ 👤 *Promoted By:* @${promoterJid.split('@')[0]}
│ 📅 *Date:* ${new Date().toLocaleString()}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
        
        await sock.sendMessage(chatId, { 
            text: promotionMessage,
            mentions: [...userToPromote, promoterJid],
            ...channelInfo
        }, { quoted: quotedContact });
        
    } catch (error) {
        console.error('Error in promote command:', error);
        
        // ENHANCEMENT: Stylish error message
        const errorMsg = `*『 ❌ PROMOTION FAILED 』*
╭─────────⟢
│ Failed to promote user(s)!
│ 🔧 Error: ${error.message}
│
│ Make sure the bot is admin
│ and has sufficient permissions.
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
        
        await sock.sendMessage(chatId, { 
            text: errorMsg,
            ...channelInfo
        }, { quoted: quotedContact });
    }
}

// Function to handle automatic promotion detection
async function handlePromotionEvent(sock, groupId, participants, author) {
    try {
        // Safety check for participants
        if (!Array.isArray(participants) || participants.length === 0) {
            return;
        }

        // Get usernames for promoted participants
        const promotedUsernames = await Promise.all(participants.map(async jid => {
            // Handle case where jid might be an object or not a string
            const jidString = typeof jid === 'string' ? jid : (jid.id || jid.toString());
            return `@${jidString.split('@')[0]}`;
        }));

        let promotedBy;
        let mentionList = participants.map(jid => {
            // Ensure all mentions are proper JID strings
            return typeof jid === 'string' ? jid : (jid.id || jid.toString());
        });

        if (author && author.length > 0) {
            // Ensure author has the correct format
            const authorJid = typeof author === 'string' ? author : (author.id || author.toString());
            promotedBy = `@${authorJid.split('@')[0]}`;
            mentionList.push(authorJid);
        } else {
            promotedBy = 'System';
        }

        // ENHANCEMENT: Stylish automatic promotion detection message
        const promotionEventMsg = `*『 👑 PROMOTION DETECTED 』*
╭─────────⟢
│ 👥 *Promoted User${participants.length > 1 ? 's' : ''}:*
│ ${promotedUsernames.map(name => `♧ ${name}`).join('\n│ ')}
│
│ 👤 *Promoted By:* ${promotedBy}
│ 📅 *Date:* ${new Date().toLocaleString()}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
        
        await sock.sendMessage(groupId, {
            text: promotionEventMsg,
            mentions: mentionList,
            ...channelInfo
        }, { quoted: quotedContact });
        
    } catch (error) {
        console.error('Error handling promotion event:', error);
    }
}

module.exports = { promoteCommand, handlePromotionEvent };