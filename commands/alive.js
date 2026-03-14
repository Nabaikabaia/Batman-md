const settings = require("../settings");
const fs = require('fs');
const path = require('path');
const os = require('os');

// Store bot start time (you can also import this from a global file)
const botStartTime = Date.now();

function getUptime() {
    const uptimeSeconds = Math.floor((Date.now() - botStartTime) / 1000);
    
    const days = Math.floor(uptimeSeconds / (3600 * 24));
    const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

function getSystemInfo() {
    const totalMemory = (os.totalmem() / (1024 ** 3)).toFixed(2);
    const freeMemory = (os.freemem() / (1024 ** 3)).toFixed(2);
    const usedMemory = (totalMemory - freeMemory).toFixed(2);
    const cpuModel = os.cpus()[0].model;
    const cpuCores = os.cpus().length;
    
    return {
        totalMemory,
        freeMemory,
        usedMemory,
        cpuModel,
        cpuCores
    };
}

async function aliveCommand(sock, chatId, message) {
    try {
        const sysInfo = getSystemInfo();
        const uptime = getUptime();
        const currentTime = new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        const currentDate = new Date().toLocaleDateString('en-US', { 
            month: '2-digit', 
            day: '2-digit', 
            year: 'numeric' 
        }).replace(/\//g, '/');

        const aliveMessage = `
*『 👑 𝘽𝘼𝙏𝙈𝘼𝙉 𝙈𝘿 』*
*│ 🤖 𝙎𝙩𝙖𝙩𝙪𝙨    : ████████ 100% Online*
*│ ⏰ 𝙏𝙞𝙢𝙚      : ${currentTime}*
*│ 📅 𝘿𝙖𝙩𝙚      : ${currentDate}*
*│ 🔄 𝙐𝙥𝙩𝙞𝙢𝙚    : ${uptime}*
*│ 🌍 𝙈𝙤𝙙𝙚      : [ ${settings.mode || 'public'} ]*
*│ 🛠️ 𝙋𝙧𝙚𝙛𝙞𝙭    : [ ${settings.prefix || '.'} ]*
*│ 🚀 𝙑𝙚𝙧𝙨𝙞𝙤𝙣   : ${settings.version || '1.0.0'}*
*│ 👤 𝙊𝙬𝙣𝙚𝙧     : ${settings.botOwner || 'Nabees Tech'}*
*╰─────────⟢*

*『 💻 𝙎𝙮𝙨𝙩𝙚𝙢 𝙄𝙣𝙛𝙤 』*
*│ 💾 𝙍𝘼𝙈 𝙐𝙨𝙖𝙜𝙚 : ${sysInfo.usedMemory}GB / ${sysInfo.totalMemory}GB*
*│ 🔋 𝙁𝙧𝙚𝙚 𝙍𝘼𝙈  : ${sysInfo.freeMemory}GB*
*│ 🖥️ 𝘾𝙋𝙐       : ${sysInfo.cpuModel.substring(0, 30)}...*
*│ ⚙️ 𝘾𝙤𝙧𝙚𝙨     : ${sysInfo.cpuCores}*
*╰─────────⟢*

*『 ✨ 𝙁𝙚𝙖𝙩𝙪𝙧𝙚𝙨 』*
*│ ♧ 𝙂𝙧𝙤𝙪𝙥 𝙈𝙖𝙣𝙖𝙜𝙚𝙢𝙚𝙣𝙩*
*│ ♧ 𝘼𝙣𝙩𝙞𝙡𝙞𝙣𝙠 𝙋𝙧𝙤𝙩𝙚𝙘𝙩𝙞𝙤𝙣*
*│ ♧ 𝘼𝙣𝙩𝙞𝙗𝙖𝙙𝙬𝙤𝙧𝙙*
*│ ♧ 𝙁𝙪𝙣 𝘾𝙤𝙢𝙢𝙖𝙣𝙙𝙨*
*│ ♧ 𝘼𝙄 𝙄𝙣𝙩𝙚𝙜𝙧𝙖𝙩𝙞𝙤𝙣*
*│ ♧ 𝘿𝙤𝙬𝙣𝙡𝙤𝙖𝙙𝙚𝙧 𝙏𝙤𝙤𝙡𝙨*
*│ ♧ 𝙎𝙩𝙞𝙘𝙠𝙚𝙧 𝙈𝙖𝙠𝙞𝙣𝙜*
*│ ♧ 𝘼𝙣𝙙 ${Object.keys(require('../commands') || {}).length || '50+'}+ 𝙢𝙤𝙧𝙚!*
*╰─────────⟢*

> *⚡ 𝙍𝙚𝙖𝙙𝙮 𝙩𝙤 𝙨𝙚𝙧𝙫𝙚! 𝙏𝙮𝙥𝙚 *.menu* 𝙛𝙤𝙧 𝙘𝙤𝙢𝙢𝙖𝙣𝙙 𝙡𝙞𝙨𝙩*
> *© 𝙥𝙤𝙬𝙚𝙧𝙚𝙙 𝙗𝙮 ${settings.botName || 'ʙᴀᴛᴍᴀɴ ᴍᴅ'}*`;

        // Path for optional alive image
        const imagePath = path.join(__dirname, '../assets/alive_image.jpg');
        const songPath = path.join(__dirname, '../assets/alive_song.mp3');

        // Common context info for newsletter forwarding
        const contextInfo = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363367299421766@newsletter',
                newsletterName: settings.botName?.toUpperCase() || 'BATMAN MD',
                serverMessageId: -1
            }
        };

        // Send with image if available
        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: aliveMessage,
                contextInfo: contextInfo
            }, { quoted: message });
        } 
        // Send with video if available (optional)
        else {
            const videoPath = path.join(__dirname, '../assets/alive_video.mp4');
            if (fs.existsSync(videoPath)) {
                const videoBuffer = fs.readFileSync(videoPath);
                await sock.sendMessage(chatId, {
                    video: videoBuffer,
                    caption: aliveMessage,
                    gifPlayback: false,
                    contextInfo: contextInfo
                }, { quoted: message });
            } else {
                // Just send text if no media
                await sock.sendMessage(chatId, { 
                    text: aliveMessage,
                    contextInfo: contextInfo
                }, { quoted: message });
            }
        }

        // Send an audio greeting if available
        if (fs.existsSync(songPath)) {
            const songBuffer = fs.readFileSync(songPath);
            
            // Small delay
            await new Promise(resolve => setTimeout(resolve, 800));
            
            await sock.sendMessage(chatId, {
                audio: songBuffer,
                mimetype: 'audio/mpeg',
                ptt: false,
                contextInfo: contextInfo
            }, { quoted: message });
            
            console.log('🎵 Alive song sent successfully');
        }

        console.log(`✅ Alive command executed - Uptime: ${uptime}`);

    } catch (error) {
        console.error('Error in alive command:', error);
        
        // Fallback message
        const fallbackMessage = `*『 👑 BATMAN MD 』*\n` +
                              `*Status:* ✅ Online & Ready!\n` +
                              `*Version:* ${settings.version || '1.0.0'}\n` +
                              `*Type* *.menu* *for commands*`;
        
        await sock.sendMessage(chatId, { 
            text: fallbackMessage,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363367299421766@newsletter',
                    newsletterName: 'BATMAN MD',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });
    }
}

module.exports = aliveCommand;