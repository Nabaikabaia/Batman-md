const axios = require('axios');

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
function formatSoraMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        video: '🎬',
        ai: '🤖',
        prompt: '📝'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

async function soraCommand(sock, chatId, message) {
    try {
        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

        // Extract prompt after command keyword or use quoted text
        const used = (rawText || '').split(/\s+/)[0] || '.sora';
        const args = rawText.slice(used.length).trim();
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
        const input = args || quotedText;

        if (!input) {
            // ENHANCEMENT: Stylish usage message
            const usageMsg = formatSoraMessage(
                'SORA AI VIDEO',
                `│ 🎬 Generate videos with AI!\n│\n│ *Usage:* .sora <prompt>\n│\n│ *Example:*\n│ ♧ .sora anime girl with short blue hair\n│ ♧ Reply to text with .sora`,
                'video'
            );
            await sock.sendMessage(chatId, { 
                text: usageMsg,
                ...channelInfo 
            }, { quoted: message });
            return;
        }

        // Send processing message
        const processingMsg = formatSoraMessage(
            'GENERATING VIDEO',
            `│ 🤖 AI is creating your video...\n│ 📝 *Prompt:*\n│ ♧ ${input}\n│\n│ ⏳ This may take up to 60 seconds.`,
            'ai'
        );
        
        await sock.sendMessage(chatId, { 
            text: processingMsg,
            ...channelInfo 
        }, { quoted: message });

        const apiUrl = `https://okatsu-rolezapiiz.vercel.app/ai/txt2video?text=${encodeURIComponent(input)}`;
        const { data } = await axios.get(apiUrl, { timeout: 60000, headers: { 'user-agent': 'Mozilla/5.0' } });

        const videoUrl = data?.videoUrl || data?.result || data?.data?.videoUrl;
        if (!videoUrl) {
            throw new Error('No videoUrl in API response');
        }

        // ENHANCEMENT: Stylish success caption
        const successCaption = `✨ *Video Generated Successfully!*

📝 *Prompt:* ${input}

𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗘𝗗 𝗕𝗬 BATMAN MD

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;

        await sock.sendMessage(chatId, {
            video: { url: videoUrl },
            mimetype: 'video/mp4',
            caption: successCaption,
            ...channelInfo
        }, { quoted: message });

    } catch (error) {
        console.error('[SORA] error:', error?.message || error);
        
        // ENHANCEMENT: Stylish error message
        let errorTitle = 'GENERATION FAILED';
        let errorContent = '❌ Failed to generate video.';
        
        if (error.message?.includes('timeout')) {
            errorTitle = 'TIMEOUT';
            errorContent = '⏰ Request timed out. Please try again.';
        } else if (error.response?.status === 429) {
            errorTitle = 'RATE LIMIT';
            errorContent = '⏰ Rate limit exceeded. Please try again later.';
        } else if (error.response?.status === 400) {
            errorTitle = 'INVALID PROMPT';
            errorContent = '❌ Invalid prompt. Please try a different description.';
        }
        
        const errorMsg = formatSoraMessage(
            errorTitle,
            `│ ${errorContent}\n│ 🔧 Try a different prompt later.`,
            'error'
        );
        
        await sock.sendMessage(chatId, { 
            text: errorMsg,
            ...channelInfo 
        }, { quoted: message });
    }
}

module.exports = soraCommand;