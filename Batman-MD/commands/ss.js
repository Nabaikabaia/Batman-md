const fetch = require('node-fetch');

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
function formatSsMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        screenshot: '📸',
        link: '🔗',
        web: '🌐'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

async function handleSsCommand(sock, chatId, message, match) {
    if (!match) {
        // ENHANCEMENT: Stylish usage message
        const usageMsg = formatSsMessage(
            'SCREENSHOT TOOL',
            `│ 📸 Take screenshots of any website!\n│\n│ *Usage:*\n│ ♧ .ss <url>\n│ ♧ .ssweb <url>\n│ ♧ .screenshot <url>\n│\n│ *Example:*\n│ ♧ .ss https://google.com\n│ ♧ .ssweb https://github.com`,
            'screenshot'
        );
        await sock.sendMessage(chatId, {
            text: usageMsg,
            ...channelInfo,
            quoted: message
        });
        return;
    }

    try {
        // Show typing indicator
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);

        // Extract URL from command
        const url = match.trim();
        
        // Validate URL
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            // ENHANCEMENT: Stylish invalid URL message
            const invalidMsg = formatSsMessage(
                'INVALID URL',
                `│ ❌ Please provide a valid URL\n│    starting with http:// or https://\n│\n│ *Example:*\n│ ♧ .ss https://google.com`,
                'link'
            );
            return sock.sendMessage(chatId, {
                text: invalidMsg,
                ...channelInfo,
                quoted: message
            });
        }

        // Processing message
        const processingMsg = formatSsMessage(
            'TAKING SCREENSHOT',
            `│ 📸 Capturing screenshot of:\n│ 🌐 ${url}\n│\n│ ⏳ Please wait...`,
            'screenshot'
        );
        await sock.sendMessage(chatId, {
            text: processingMsg,
            ...channelInfo,
            quoted: message
        });

        // Call the API
        const apiUrl = `https://api.siputzx.my.id/api/tools/ssweb?url=${encodeURIComponent(url)}&theme=light&device=desktop`;
        const response = await fetch(apiUrl, { headers: { 'accept': '*/*' } });
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        // Get the image buffer
        const imageBuffer = await response.buffer();

        // ENHANCEMENT: Stylish success caption
        const successCaption = `📸 *Screenshot Captured!*

🌐 *URL:* ${url}
⏱️ *Time:* ${new Date().toLocaleString()}

𝗖𝗔𝗣𝗧𝗨𝗥𝗘𝗗 𝗕𝗬 BATMAN MD

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;

        // Send the screenshot with newsletter
        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: successCaption,
            ...channelInfo
        }, {
            quoted: message
        });

    } catch (error) {
        console.error('❌ Error in ss command:', error);
        
        // ENHANCEMENT: Stylish error message
        let errorTitle = 'SCREENSHOT FAILED';
        let errorContent = '❌ Failed to take screenshot.';
        
        if (error.message.includes('404')) {
            errorTitle = 'URL NOT FOUND';
            errorContent = '❌ The website could not be reached.';
        } else if (error.message.includes('403')) {
            errorTitle = 'ACCESS BLOCKED';
            errorContent = '❌ The website is blocking screenshots.';
        } else if (error.message.includes('timeout')) {
            errorTitle = 'TIMEOUT';
            errorContent = '⏰ Request timed out. Please try again.';
        }
        
        const errorMsg = formatSsMessage(
            errorTitle,
            `│ ${errorContent}\n│\n│ *Possible reasons:*\n│ • Invalid URL\n│ • Website blocking screenshots\n│ • Website is down\n│ • Service temporarily unavailable`,
            'error'
        );
        
        await sock.sendMessage(chatId, {
            text: errorMsg,
            ...channelInfo,
            quoted: message
        });
    }
}

module.exports = {
    handleSsCommand
};