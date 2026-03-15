const settings = require('../settings');
const fs = require('fs');
const path = require('path');

// Store bot start time
const botStartTime = Date.now();

// ============================================
// ENHANCEMENT: Quoted contact template (from ping.js)
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
// ENHANCEMENT: Newsletter channel info (matching ping.js pattern)
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
// ENHANCEMENT: Function to create invisible spacing
// ============================================
function getSpacing(lines = 1) {
    return '\u200E'.repeat(200 * lines);
}

function getUptime() {
    const uptimeSeconds = Math.floor((Date.now() - botStartTime) / 1000);
    
    const days = Math.floor(uptimeSeconds / (3600 * 24));
    const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

// ============================================
// ENHANCEMENT: Random header selector
// ============================================
function getRandomHeader(senderName, prefix, uptime) {
    const headers = [
        // Header Style 1 - Original BATMAN MD
        `╭━◈〔 🔥 ${settings.botName || 'BATMAN MD'} v${settings.version || '1.0.0'} 〕╼
┃ ❀ Owner : 𖤍 ${settings.botOwner || 'Nabees Tech'} 𖤍
┃ ❀ User  : ${senderName}
┃ ❀ Mode  : 🌍 ${settings.mode || 'public'}
┃ ❀ Prefix : ${prefix}
┃ ❀ Commands : 100+ online
┃ ❀ Runtime : ${uptime}
╰━◈━━━━━━━━❁━━━━━━━━━◈━╯`,

        // Header Style 2 - Orman XMD Style
        `╭━𑁍〔🔥 ${settings.botName || 'BATMAN MD'} v${settings.version || '1.0.0'} 〕╼
┃ ❀ Owner : 𖤍 ${settings.botOwner || 'Nabees Tech'} 𖤍
┃ ❀ User  : ${senderName}
┃ ❀ Mode  : 🌍 ${settings.mode || 'public'}
┃ ❀ Prefix : ${prefix}
┃ ❀ Commands : 100+ online
┃ ❀ Runtime : ${uptime}
╰━𑁍━══━═━❁━═━══━𑁍━╯`,

        // Header Style 3 - Queen Riam Style
        `*『 👑 ${settings.botName || 'BATMAN MD'} 』*
*│ 👤 ᴏᴡɴᴇʀ     : ${settings.botOwner || 'Nabees Tech'}*
*│ 👤 ᴜsᴇʀ      : ${senderName}*
*│ 🌍 ᴍᴏᴅᴇ      : [ ${settings.mode || 'public'} ]*
*│ 🛠️ ᴘʀᴇғɪx    : [ ${prefix} ]*
*│ 🔄 ᴜᴘᴛɪᴍᴇ    : ${uptime}*
*╰─────────⟢*`,

        // Header Style 4 - Knight Bot Style
        `╔══════════════════╗
║   🤖 ${settings.botName || 'BATMAN MD'}   ║
╠══════════════════╣
║ Owner: ${settings.botOwner || 'Nabees Tech'}
║ User: ${senderName}
║ Mode: ${settings.mode || 'public'}
║ Prefix: ${prefix}
║ Uptime: ${uptime}
╚══════════════════╝`,

        // Header Style 5 - Minimalist Style
        `┏━━〔 ${settings.botName || 'BATMAN MD'} 〕━━┓
┃ Owner  : ${settings.botOwner || 'Nabees Tech'}
┃ User    : ${senderName}
┃ Mode    : ${settings.mode || 'public'}
┃ Prefix  : ${prefix}
┃ Uptime  : ${uptime}
┗━━━━━━━━━━━━━━━━━━┛`,

        // Header Style 6 - Gothic Style
        `🕸️━━━━━━◈━━━━━━🕸️
◈  ${settings.botName || 'BATMAN MD'} v${settings.version || '1.0.0'}  ◈
◈ Owner : ${settings.botOwner || 'Nabees Tech'}
◈ User   : ${senderName}
◈ Mode   : ${settings.mode || 'public'}
◈ Prefix : ${prefix}
◈ Uptime : ${uptime}
🕸️━━━━━━◈━━━━━━🕸️`,

        // Header Style 7 - Neon Style
        `╔═══❖═══❖═══╗
    ${settings.botName || 'BATMAN MD'}
╚═══❖═══❖═══╝
👑 Owner : ${settings.botOwner || 'Nabees Tech'}
👤 User   : ${senderName}
🌍 Mode   : ${settings.mode || 'public'}
⚡ Prefix : ${prefix}
⏱️ Uptime : ${uptime}`,

        // Header Style 8 - Japanese Style
        `🌸━━━━━━❁━━━━━━🌸
    ✦ ${settings.botName || 'BATMAN MD'} ✦
🌸━━━━━━❁━━━━━━🌸
┃ 所有者: ${settings.botOwner || 'Nabees Tech'}
┃ ユーザー: ${senderName}
┃ モード: ${settings.mode || 'public'}
┃ プレフィックス: ${prefix}
┃ 稼働時間: ${uptime}
🌸━━━━━━❁━━━━━━🌸`,

        // Header Style 9 - Retro Style
        `╔══════════════════╗
║ ★ ${settings.botName || 'BATMAN MD'} ★ ║
╠══════════════════╣
║ ▸ Owner: ${settings.botOwner || 'Nabees Tech'}
║ ▸ User: ${senderName}
║ ▸ Mode: ${settings.mode || 'public'}
║ ▸ Prefix: ${prefix}
║ ▸ Uptime: ${uptime}
╚══════════════════╝`,

        // Header Style 10 - Simple Box
        `┌─── ⋆⋅☆⋅⋆ ───┐
  ${settings.botName || 'BATMAN MD'}
├─── ⋆⋅☆⋅⋆ ───┤
  Owner : ${settings.botOwner || 'Nabees Tech'}
  User   : ${senderName}
  Mode   : ${settings.mode || 'public'}
  Prefix : ${prefix}
  Uptime : ${uptime}
└─── ⋆⋅☆⋅⋆ ───┘`
    ];

    // Pick a random header
    const randomIndex = Math.floor(Math.random() * headers.length);
    return headers[randomIndex];
}

async function helpCommand(sock, chatId, message) {
    try {
        // Get the current prefix from settings
        const prefix = settings.prefix || '.';
        
        // Get sender name
        const senderId = message.key.participant || message.key.remoteJid;
        let senderName = senderId.split('@')[0];
        
        // Try to get push name if available
        try {
            if (message.pushName) {
                senderName = message.pushName;
            }
        } catch (e) {}
        
        // Get uptime
        const uptime = getUptime();
        
        // Paths for assets
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        const songPath = path.join(__dirname, '../assets/menu.mp3');
        
        // Get random header
        const randomHeader = getRandomHeader(senderName, prefix, uptime);

        // Menu text with your preferred command frames
        const menuText = `
${randomHeader}
${getSpacing(2)}

*『 🤖 𝘼𝙄 𝙈𝙚𝙣𝙪 』*
*│ ♧ ${prefix}gpt*
*│ ♧ ${prefix}gemini*
*│ ♧ ${prefix}deepseek*
*│ ♧ ${prefix}imagine*
*│ ♧ ${prefix}flux*
*│ ♧ ${prefix}sora*
*╰─────────⟢*
${getSpacing(2)}

*『 📥 𝘿𝙤𝙬𝙣𝙡𝙤𝙖𝙙 𝙈𝙚𝙣𝙪 』*
*│ ♧ ${prefix}play*
*│ ♧ ${prefix}song*
*│ ♧ ${prefix}spotify*
*│ ♧ ${prefix}instagram*
*│ ♧ ${prefix}facebook*
*│ ♧ ${prefix}tiktok*
*│ ♧ ${prefix}video*
*│ ♧ ${prefix}gitclone*
*│ ♧ ${prefix}ytmp4*
*╰─────────⟢*
${getSpacing(2)}

*『 🎯 𝙁𝙪𝙣 𝙈𝙚𝙣𝙪 』*
*│ ♧ ${prefix}compliment*
*│ ♧ ${prefix}insult*
*│ ♧ ${prefix}flirt*
*│ ♧ ${prefix}shayari*
*│ ♧ ${prefix}goodnight*
*│ ♧ ${prefix}roseday*
*│ ♧ ${prefix}character*
*│ ♧ ${prefix}crush*
*│ ♧ ${prefix}simp*
*│ ♧ ${prefix}stupid*
*│ ♧ ${prefix}wasted*
*│ ♧ ${prefix}ship*
*╰─────────⟢*
${getSpacing(2)}

*『 🎮 𝙂𝙖𝙢𝙚𝙨 𝙈𝙚𝙣𝙪 』*
*│ ♧ ${prefix}tictactoe*
*│ ♧ ${prefix}hangman*
*│ ♧ ${prefix}guess*
*│ ♧ ${prefix}trivia*
*│ ♧ ${prefix}answer*
*│ ♧ ${prefix}truth*
*│ ♧ ${prefix}dare*
*╰─────────⟢*
${getSpacing(2)}

*『 👥 𝙂𝙧𝙤𝙪𝙥 𝙈𝙚𝙣𝙪 』*
*│ ♧ ${prefix}ban*
*│ ♧ ${prefix}promote*
*│ ♧ ${prefix}demote*
*│ ♧ ${prefix}mute*
*│ ♧ ${prefix}unmute*
*│ ♧ ${prefix}delete*
*│ ♧ ${prefix}kick*
*│ ♧ ${prefix}warnings*
*│ ♧ ${prefix}warn*
*│ ♧ ${prefix}antilink*
*│ ♧ ${prefix}antibadword*
*│ ♧ ${prefix}clear*
*│ ♧ ${prefix}tag*
*│ ♧ ${prefix}tagall*
*│ ♧ ${prefix}hidetag*
*│ ♧ ${prefix}tagnotadmin*
*│ ♧ ${prefix}chatbot*
*│ ♧ ${prefix}resetlink*
*│ ♧ ${prefix}antitag*
*│ ♧ ${prefix}welcome*
*│ ♧ ${prefix}goodbye*
*│ ♧ ${prefix}setgdesc*
*│ ♧ ${prefix}setgname*
*│ ♧ ${prefix}setgpp*
*╰─────────⟢*
${getSpacing(2)}

*『 🌐 𝙂𝙚𝙣𝙚𝙧𝙖𝙡 𝙈𝙚𝙣𝙪 』*
*│ ♧ ${prefix}menu*
*│ ♧ ${prefix}ping*
*│ ♧ ${prefix}alive*
*│ ♧ ${prefix}tts*
*│ ♧ ${prefix}owner*
*│ ♧ ${prefix}joke*
*│ ♧ ${prefix}quote*
*│ ♧ ${prefix}fact*
*│ ♧ ${prefix}weather*
*│ ♧ ${prefix}news*
*│ ♧ ${prefix}attp*
*│ ♧ ${prefix}lyrics*
*│ ♧ ${prefix}8ball*
*│ ♧ ${prefix}groupinfo*
*│ ♧ ${prefix}admins*
*│ ♧ ${prefix}vv*
*│ ♧ ${prefix}trt*
*│ ♧ ${prefix}ss*
*│ ♧ ${prefix}jid*
*│ ♧ ${prefix}url*
*╰─────────⟢*
${getSpacing(2)}

*『 🔒 𝙊𝙬𝙣𝙚𝙧 𝙈𝙚𝙣𝙪 』*
*│ ♧ ${prefix}mode*
*│ ♧ ${prefix}anticall*
*│ ♧ ${prefix}autoread*
*│ ♧ ${prefix}autotyping*
*│ ♧ ${prefix}autoreact*
*│ ♧ ${prefix}autostatus*
*│ ♧ ${prefix}clearsession*
*│ ♧ ${prefix}antidelete*
*│ ♧ ${prefix}antiedit*
*│ ♧ ${prefix}cleartmp*
*│ ♧ ${prefix}setpp*
*│ ♧ ${prefix}getpp*
*│ ♧ ${prefix}settings*
*│ ♧ ${prefix}update*
*│ ♧ ${prefix}pmblocker*
*│ ♧ ${prefix}setmention*
*│ ♧ ${prefix}mention*
*╰─────────⟢*
${getSpacing(2)}

*『 🎨 𝙋𝙝𝙤𝙩𝙤 𝙈𝙚𝙣𝙪 』*
*│ ♧ ${prefix}blur*
*│ ♧ ${prefix}simage*
*│ ♧ ${prefix}sticker*
*│ ♧ ${prefix}tgsticker*
*│ ♧ ${prefix}removebg*
*│ ♧ ${prefix}remini*
*│ ♧ ${prefix}crop*
*│ ♧ ${prefix}meme*
*│ ♧ ${prefix}take*
*│ ♧ ${prefix}emojimix*
*│ ♧ ${prefix}igs*
*│ ♧ ${prefix}igsc*
*╰─────────⟢*
${getSpacing(2)}

*『 🖼️ 𝙋𝙞𝙚𝙨 𝙈𝙚𝙣𝙪 』*
*│ ♧ ${prefix}pies*
*│ ♧ ${prefix}china*
*│ ♧ ${prefix}indonesia*
*│ ♧ ${prefix}japan*
*│ ♧ ${prefix}korea*
*│ ♧ ${prefix}hijab*
*╰─────────⟢*
${getSpacing(2)}

*『 🔤 𝙏𝙚𝙭𝙩 𝙈𝙚𝙣𝙪 』*
*│ ♧ ${prefix}metallic*
*│ ♧ ${prefix}ice*
*│ ♧ ${prefix}snow*
*│ ♧ ${prefix}impressive*
*│ ♧ ${prefix}matrix*
*│ ♧ ${prefix}light*
*│ ♧ ${prefix}neon*
*│ ♧ ${prefix}devil*
*│ ♧ ${prefix}purple*
*│ ♧ ${prefix}thunder*
*│ ♧ ${prefix}leaves*
*│ ♧ ${prefix}1917*
*│ ♧ ${prefix}arena*
*│ ♧ ${prefix}hacker*
*│ ♧ ${prefix}sand*
*│ ♧ ${prefix}blackpink*
*│ ♧ ${prefix}glitch*
*│ ♧ ${prefix}fire*
*╰─────────⟢*
${getSpacing(2)}

*『 🧩 𝙈𝙄𝙎𝘾 𝙈𝙚𝙣𝙪 』*
*│ ♧ ${prefix}heart*
*│ ♧ ${prefix}horny*
*│ ♧ ${prefix}circle*
*│ ♧ ${prefix}lgbt*
*│ ♧ ${prefix}lolice*
*│ ♧ ${prefix}its-so-stupid*
*│ ♧ ${prefix}namecard*
*│ ♧ ${prefix}oogway*
*│ ♧ ${prefix}tweet*
*│ ♧ ${prefix}ytcomment*
*│ ♧ ${prefix}comrade*
*│ ♧ ${prefix}gay*
*│ ♧ ${prefix}glass*
*│ ♧ ${prefix}jail*
*│ ♧ ${prefix}passed*
*│ ♧ ${prefix}triggered*
*╰─────────⟢*
${getSpacing(2)}

*『 🖼️ 𝘼𝙉𝙄𝙈𝙀 𝙈𝙚𝙣𝙪 』*
*│ ♧ ${prefix}nom*
*│ ♧ ${prefix}poke*
*│ ♧ ${prefix}cry*
*│ ♧ ${prefix}kiss*
*│ ♧ ${prefix}pat*
*│ ♧ ${prefix}hug*
*│ ♧ ${prefix}wink*
*│ ♧ ${prefix}facepalm*
*╰─────────⟢*
${getSpacing(2)}

*『 💻 𝙂𝙞𝙩𝙝𝙪𝙗 𝙈𝙚𝙣𝙪 』*
*│ ♧ ${prefix}git*
*│ ♧ ${prefix}github*
*│ ♧ ${prefix}sc*
*│ ♧ ${prefix}script*
*│ ♧ ${prefix}repo*
*╰─────────⟢*
${getSpacing(2)}

◈━═━〔 *INFO & CREDITS* 〕━═━◈
◈ *_Powered By_* : ${settings.botOwner || 'Nabees Tech'} ᵗᵐ
◈ Developer: 𝓝𝓪𝓫𝓮𝓮𝓼 𝓣𝓮𝓬𝓱
◈ Bot: 𝘽𝘼𝙏𝙈𝘼𝙉 𝙈𝘿 v${settings.version || '1.0.0'}
◈━══━══━══━❁━══━══━══━◈`;

        // Send the main menu message with image + newsletter metadata, quoting the contact template
        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: menuText,
                ...channelInfo
            }, { 
                quoted: quotedContact // Using the contact template for quoting
            });
        } else {
            // Fallback to text-only if image doesn't exist
            await sock.sendMessage(chatId, { 
                text: menuText,
                ...channelInfo
            }, { 
                quoted: quotedContact // Using the contact template for quoting
            });
        }

        // Send the song file after a delay with newsletter metadata, quoting the contact template
        if (fs.existsSync(songPath)) {
            const songBuffer = fs.readFileSync(songPath);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            await sock.sendMessage(chatId, {
                audio: songBuffer,
                mimetype: 'audio/mpeg',
                ptt: false,
                ...channelInfo // Add newsletter metadata to audio too
            }, { 
                quoted: quotedContact // Using the contact template for quoting
            });
            
            console.log('🎵 Song sent successfully with newsletter metadata');
        }

    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { 
            text: 'Error loading menu',
            ...channelInfo
        }, { 
            quoted: quotedContact // Using the contact template for quoting
        });
    }
}

module.exports = helpCommand;