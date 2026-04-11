/**
 * Profile Command — Batman MD
 * Fetches and sends the WhatsApp profile picture of a tagged user or yourself.
 * Usage: .profile  |  .profile @user
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

async function profileCommand(sock, chatId, message) {
    try {
        // Determine target JID
        const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;
        const senderId = message.key.participant || message.key.remoteJid;

        let targetJid = senderId;
        let targetLabel = 'Your';

        if (mentioned && mentioned.length > 0) {
            targetJid = mentioned[0];
            targetLabel = `@${targetJid.split('@')[0]}'s`;
        } else if (quotedParticipant) {
            targetJid = quotedParticipant;
            targetLabel = `@${targetJid.split('@')[0]}'s`;
        }

        await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });

        let profilePic = null;
        try {
            profilePic = await sock.profilePictureUrl(targetJid, 'image');
        } catch (_) {
            profilePic = null;
        }

        if (!profilePic) {
            await sock.sendMessage(chatId, { react: { text: null, key: message.key } });
            return sock.sendMessage(chatId, {
                text: `❌ No profile picture found for *${targetLabel.replace("'s", '')}*.\n\nThey may have hidden it from non-contacts.`,
                ...channelInfo,
            }, { quoted: message });
        }

        const axios = require('axios');
        const response = await axios.get(profilePic, { responseType: 'arraybuffer' });
        const imgBuffer = Buffer.from(response.data);
        const number = targetJid.split('@')[0];

        await sock.sendMessage(chatId, {
            image: imgBuffer,
            caption: `*👤 ${targetLabel} Profile Picture*\n\n📱 Number: +${number}\n\n_Downloaded by BATMAN MD_`,
            ...channelInfo,
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: null, key: message.key } });
    } catch (err) {
        console.error('[Profile] Error:', err);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to fetch profile picture. Please try again.',
            ...channelInfo,
        }, { quoted: message });
    }
}

module.exports = profileCommand;
