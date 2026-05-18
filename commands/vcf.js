// commands/vcf.js
const fs = require('fs');
const path = require('path');
const isAdmin = require('../lib/isAdmin');

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

function formatVcfMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        export: '📇',
        admin: '👑',
        bot: '🤖',
        group: '👥'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

// Helper to get real phone number from LID using messageCount.json
function getPhoneNumberFromLid(lid) {
    try {
        const dataPath = path.join(process.cwd(), 'data/messageCount.json');
        if (!fs.existsSync(dataPath)) return null;
        
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        
        // Search through all groups and users for this LID
        for (const [groupId, groupData] of Object.entries(data)) {
            if (groupId.endsWith('@g.us') && typeof groupData === 'object') {
                for (const [userId, count] of Object.entries(groupData)) {
                    if (userId === lid) {
                        // Try to extract phone number from userId (if it's not a LID)
                        let num = userId.split('@')[0].replace(/[^0-9]/g, '');
                        if (num.length > 12) continue; // Still a LID?
                        if (num.length >= 9 && num.length <= 12) return num;
                    }
                }
            }
        }
        
        // Also check for direct mapping (if the user has messaged the bot in private)
        for (const [chatId, chatData] of Object.entries(data)) {
            if (chatId.endsWith('@s.whatsapp.net') && typeof chatData === 'object') {
                for (const [userId, count] of Object.entries(chatData)) {
                    if (userId === lid) {
                        let num = userId.split('@')[0].replace(/[^0-9]/g, '');
                        if (num.length >= 9 && num.length <= 12) return num;
                    }
                }
            }
        }
        
        return null;
    } catch (e) {
        console.error('getPhoneNumberFromLid error:', e);
        return null;
    }
}

async function vcfCommand(sock, chatId, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            const errorMsg = formatVcfMessage(
                'GROUP ONLY',
                `│ ❌ This command can only be used in groups.`,
                'error'
            );
            await sock.sendMessage(chatId, { text: errorMsg, ...channelInfo }, { quoted: message });
            return;
        }

        const senderId = message.key.participant || message.key.remoteJid;
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isBotAdmin) {
            const botAdminMsg = formatVcfMessage(
                'BOT NOT ADMIN',
                `│ 🤖 Please make the bot an admin\n│ 📇 to export group contacts.`,
                'bot'
            );
            await sock.sendMessage(chatId, { text: botAdminMsg, ...channelInfo }, { quoted: message });
            return;
        }

        if (!isSenderAdmin && !message.key.fromMe) {
            const adminOnlyMsg = formatVcfMessage(
                'ADMIN ONLY',
                `│ 👑 Only group administrators\n│ 📇 can export group contacts.`,
                'admin'
            );
            await sock.sendMessage(chatId, { text: adminOnlyMsg, ...channelInfo }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: "📇", key: message.key } });

        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants;
        const groupName = groupMetadata.subject || "Group";

        if (!participants || participants.length === 0) {
            const noParticipantsMsg = formatVcfMessage(
                'NO PARTICIPANTS',
                `│ ❌ No participants found.`,
                'error'
            );
            await sock.sendMessage(chatId, { text: noParticipantsMsg, ...channelInfo }, { quoted: message });
            return;
        }

        let vcardContent = '';
        let validContacts = 0;
        let lidCount = 0;

        for (const participant of participants) {
            const jid = participant.id;
            // First try to get real phone number from LID mapping
            let phoneNumber = getPhoneNumberFromLid(jid);
            
            if (!phoneNumber) {
                // Fallback: try to extract from JID if it looks like a phone number
                let extracted = jid.split('@')[0].replace(/[^0-9]/g, '');
                if (extracted.length >= 9 && extracted.length <= 12) {
                    phoneNumber = extracted;
                } else {
                    lidCount++;
                    continue;
                }
            }
            
            // Get contact name
            let contactName = phoneNumber;
            try {
                const name = await sock.getName(jid);
                if (name && name !== phoneNumber && !name.includes('@')) {
                    contactName = name;
                }
            } catch (e) {}
            
            vcardContent += `BEGIN:VCARD
VERSION:3.0
FN:${contactName}
TEL;type=CELL;type=VOICE;waid=${phoneNumber}:+${phoneNumber}
END:VCARD

`;
            validContacts++;
        }

        if (validContacts === 0) {
            const noValidMsg = formatVcfMessage(
                'NO VALID CONTACTS',
                `│ ❌ No valid phone numbers found.\n│ ℹ️ ${lidCount} LIDs skipped.`,
                'error'
            );
            await sock.sendMessage(chatId, { text: noValidMsg, ...channelInfo }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
            return;
        }

        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        
        const fileName = `group_contacts_${groupName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.vcf`;
        const filePath = path.join(tmpDir, fileName);
        
        fs.writeFileSync(filePath, vcardContent);

        const successMsg = formatVcfMessage(
            'CONTACTS EXPORTED',
            `│ 👥 *Group:* ${groupName}\n│ 📞 *Contacts:* ${validContacts}\n${lidCount > 0 ? `│ ⚠️ *Skipped:* ${lidCount} LIDs\n` : ''}│ 📎 *File:* ${fileName}`,
            'success'
        );
        
        await sock.sendMessage(chatId, {
            document: fs.readFileSync(filePath),
            mimetype: 'text/vcard',
            fileName: fileName,
            caption: successMsg,
            ...channelInfo
        }, { quoted: message });

        fs.unlinkSync(filePath);
        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('VCF error:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        const errorMsg = formatVcfMessage(
            'EXPORT FAILED',
            `│ ❌ Failed to export contacts.\n│ 🔧 ${error.message}`,
            'error'
        );
        await sock.sendMessage(chatId, { text: errorMsg, ...channelInfo }, { quoted: message });
    }
}

module.exports = vcfCommand;