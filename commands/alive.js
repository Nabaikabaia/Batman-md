const settings = require("../settings");
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');

// Store bot start time
const botStartTime = Date.now();

// ============================================
// MULTIPLE IMAGE URLS FOR RANDOM SELECTION
// ============================================
const imageUrls = [
    'https://eliteprotech-url.zone.id/17738209879847o227e.jpg',
    'https://eliteprotech-url.zone.id/1773820972620l5kfaj.jpg',
    'https://eliteprotech-url.zone.id/1773820961364sqlh4z.jpg',
    'https://eliteprotech-url.zone.id/1773820922047xds28h.jpg',
    'https://eliteprotech-url.zone.id/1773820936402tvozdz.jpg'
];

// ============================================
// FUNCTION TO GET RANDOM URL FROM ARRAY
// ============================================
function getRandomImageUrl() {
    const randomIndex = Math.floor(Math.random() * imageUrls.length);
    return imageUrls[randomIndex];
}

// ============================================
// FETCH PROFILE PICTURE FROM WHATSAPP
// ============================================
async function fetchProfilePicture(sock, jid) {
    try {
        const ppUrl = await sock.profilePictureUrl(jid, 'image');
        const response = await axios.get(ppUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    } catch (error) {
        console.log('Failed to fetch profile picture, using fallback');
        return null;
    }
}

// ============================================
// GET QUOTED CONTACT WITH PROFILE PREVIEW
// ============================================
async function getQuotedContact(sock) {
    const ownerJid = settings.ownerNumber + '@s.whatsapp.net';
    const profilePic = await fetchProfilePicture(sock, ownerJid);
    
    // Load local fallback image if needed
    let contactThumb = null;
    try {
        const thumbPath = path.join(__dirname, '../assets/owner.jpg');
        if (fs.existsSync(thumbPath)) {
            contactThumb = fs.readFileSync(thumbPath);
        }
    } catch (_) {}
    
    return {
        key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
        message: {
            contactMessage: {
                displayName: settings.botOwner || 'BATMAN MD',
                vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${settings.botOwner || 'BATMAN MD'}\nORG:${settings.botName || 'BATMAN MD'};\nTEL;waid=${settings.ownerNumber}:${settings.ownerNumber}\nURL:${settings.website || 'https://nabees.online'}\nEND:VCARD`,
                jpegThumbnail: profilePic || contactThumb
            }
        }
    };
}

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
    let reactionSent = false;
    try {
        // Send reaction
        await sock.sendMessage(chatId, { react: { text: '⚡', key: message.key } });
        reactionSent = true;

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

        // Get random image URL
        const randomImageUrl = getRandomImageUrl();
        console.log(`🎲 Alive command - Selected random image: ${randomImageUrl}`);

        // Beautiful alive message with frames
        const aliveMessage = `╭━━⪨ 🤖 *${settings.botName || 'BATMAN MD'}* ⪩━━┈⊷
┃
┃ 🟢 *STATUS:* ████████ 100% Online
┃
┃ ⏰ *TIME:* ${currentTime}
┃ 📅 *DATE:* ${currentDate}
┃ 🔄 *UPTIME:* ${uptime}
┃
┃ 🌍 *MODE:* ${settings.mode || 'public'}
┃ 🛠️ *PREFIX:* ${settings.prefix || '.'}
┃ 🚀 *VERSION:* ${settings.version || '1.0.0'}
┃ 👤 *OWNER:* ${settings.botOwner || 'Nabees Tech'}
┃
╰━━━━━━━━━━━━━━━┈⊷

╭━━⪨ 💻 *SYSTEM INFO* ⪩━━┈⊷
┃
┃ 💾 *RAM USAGE:* ${sysInfo.usedMemory}GB / ${sysInfo.totalMemory}GB
┃ 🔋 *FREE RAM:* ${sysInfo.freeMemory}GB
┃ 🖥️ *CPU:* ${sysInfo.cpuModel.substring(0, 35)}...
┃ ⚙️ *CORES:* ${sysInfo.cpuCores}
┃
╰━━━━━━━━━━━━━━━┈⊷

╭━━⪨ ✨ *FEATURES* ⪩━━┈⊷
┃
┃ ♧ Group Management
┃ ♧ Antilink Protection
┃ ♧ Antibadword Filter
┃ ♧ Fun Commands
┃ ♧ AI Integration
┃ ♧ Downloader Tools
┃ ♧ Sticker Maker
┃ ♧ And 100+ more!
┃
╰━━━━━━━━━━━━━━━┈⊷

╭━━⪨ 📞 *CONTACT* ⪩━━┈⊷
┃
┃ 👨‍💻 *Developer:* ${settings.botOwner || 'NABEES TECH'}
┃ 📱 *WhatsApp:* wa.me/${settings.ownerNumber}
┃ 🌐 *Website:* ${settings.website || 'https://nabees.online'}
┃
╰━━━━━━━━━━━━━━━┈⊷

> *⚡ Ready to serve! Type ${settings.prefix || '.'}menu for commands*
> *© Powered by ${settings.botName || 'BATMAN MD'} v${settings.version || '1.0.0'}*`;

        // Newsletter context info
        const contextInfo = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: settings.newsletterJid,
                newsletterName: settings.botName || 'BATMAN MD',
                serverMessageId: 13
            }
        };

        // Get quoted contact with profile picture
        const quotedContact = await getQuotedContact(sock);

        // Send with random image from URL
        await sock.sendMessage(chatId, {
            image: { url: randomImageUrl },
            caption: aliveMessage,
            contextInfo: contextInfo
        }, { quoted: quotedContact });

        // Optional: Send audio if exists
        const songPath = path.join(__dirname, '../assets/alive_song.mp3');
        if (fs.existsSync(songPath)) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const songBuffer = fs.readFileSync(songPath);
            await sock.sendMessage(chatId, {
                audio: songBuffer,
                mimetype: 'audio/mpeg',
                ptt: false,
                contextInfo: contextInfo
            }, { quoted: quotedContact });
            console.log('🎵 Alive song sent');
        }

        // Remove reaction
        await sock.sendMessage(chatId, { react: { text: null, key: message.key } });
        reactionSent = false;

        console.log(`✅ Alive command executed - Uptime: ${uptime}`);

    } catch (error) {
        console.error('Error in alive command:', error);
        
        // Remove reaction if it was sent
        if (reactionSent) {
            try { await sock.sendMessage(chatId, { react: { text: null, key: message.key } }); } catch (_) {}
        }
        
        // Fallback message with frames
        const fallbackMessage = `╭━━⪨ 🤖 *${settings.botName || 'BATMAN MD'}* ⪩━━┈⊷
┃
┃ 🟢 *STATUS:* Online & Ready!
┃ 🚀 *VERSION:* ${settings.version || '1.0.0'}
┃
┃ 💡 *Type ${settings.prefix || '.'}menu for commands*
╰━━━━━━━━━━━━━━━┈⊷

> *Powered by ${settings.botName || 'BATMAN MD'}*`;
        
        await sock.sendMessage(chatId, { 
            text: fallbackMessage,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: settings.newsletterJid,
                    newsletterName: settings.botName || 'BATMAN MD',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });
    }
}

module.exports = aliveCommand;