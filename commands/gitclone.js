const fetch = require("node-fetch");

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
            serverMessageId: 143
        }
    }
};

// ============================================
// ENHANCEMENT: Helper function for stylish messages
// ============================================
function formatGitMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        git: '🐙',
        repo: '📦',
        download: '📥'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
}

async function gitcloneCommand(sock, chatId, message, match) {
    try {
        // Extract the GitHub link from the command
        const link = match?.trim();
        
        if (!link) {
            // ENHANCEMENT: Stylish usage message
            const usageMsg = formatGitMessage(
                'GITHUB CLONE',
                `│ 📦 Download GitHub repositories as ZIP!\n│\n│ *Usage:* .gitclone <github-url>\n│\n│ *Example:*\n│ ♧ .gitclone https://github.com/Nabaikabaia/Batman-md`,
                'git'
            );
            await sock.sendMessage(chatId, { 
                text: usageMsg,
                ...channelInfo
            }, { quoted: quotedContact });
            return;
        }

        // Validate GitHub URL
        if (!/^https:\/\/github\.com\/[^\/]+\/[^\/]+/.test(link)) {
            const invalidMsg = formatGitMessage(
                'INVALID URL',
                `│ ⚠️ Please provide a valid GitHub repository link.\n│\n│ *Example:*\n│ ♧ https://github.com/Nabaikabaia/Batman-md`,
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

        // Extract user and repo - FIXED: Now handles .git extension properly
        const repoMatch = link.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/i);
        if (!repoMatch) {
            const extractMsg = formatGitMessage(
                'EXTRACTION FAILED',
                `│ ❌ Couldn't extract repository data from the link.`,
                'error'
            );
            await sock.sendMessage(chatId, { 
                text: extractMsg,
                ...channelInfo
            }, { quoted: quotedContact });
            return;
        }
        
        const user = repoMatch[1];
        // FIXED: Remove any trailing .git if it exists
        let repo = repoMatch[2].replace(/\.git$/, '');

        // Check if repository exists
        const downloadURL = `https://api.github.com/repos/${user}/${repo}/zipball`;
        const headCheck = await fetch(downloadURL, { method: "HEAD" });

        if (!headCheck.ok) {
            const notFoundMsg = formatGitMessage(
                'REPO NOT FOUND',
                `│ ❌ Repository "${user}/${repo}" not found.\n│ 🔍 Please check the link and try again.`,
                'error'
            );
            await sock.sendMessage(chatId, { 
                text: notFoundMsg,
                ...channelInfo
            }, { quoted: quotedContact });
            return;
        }

        // Get filename from headers
        const filenameHeader = headCheck.headers.get("content-disposition");
        const fileName = filenameHeader 
            ? filenameHeader.match(/filename="?(.+?)"?$/)?.[1] || `${repo}.zip`
            : `${repo}.zip`;

        // Send processing message
        const processingMsg = formatGitMessage(
            'DOWNLOADING',
            `│ 📦 *User:* ${user}\n│ 📁 *Repo:* ${repo}\n│ 📎 *File:* ${fileName}\n│\n│ ⏳ Please wait...`,
            'download'
        );
        
        await sock.sendMessage(chatId, { 
            text: processingMsg,
            ...channelInfo
        }, { quoted: quotedContact });

        // Send the ZIP file
        await sock.sendMessage(chatId, {
            document: { url: downloadURL },
            fileName: fileName,
            mimetype: 'application/zip',
            caption: `🐙 *GitHub Repository Downloaded!*\n\n📦 *Repo:* ${user}/${repo}\n📎 *File:* ${fileName}\n\n𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 BATMAN MD`,
            ...channelInfo
        }, { quoted: quotedContact });

    } catch (error) {
        console.error('❌ GitClone Error:', error);
        
        // ENHANCEMENT: Stylish error message
        const errorMsg = formatGitMessage(
            'DOWNLOAD FAILED',
            `│ ❌ Failed to download repository.\n│ 🔧 ${error.message}\n│\n│ 🔄 Please check the link or try again later.`,
            'error'
        );
        
        await sock.sendMessage(chatId, { 
            text: errorMsg,
            ...channelInfo
        }, { quoted: quotedContact });
    }
}

module.exports = gitcloneCommand;
