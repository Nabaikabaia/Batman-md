// 🧹 Fix for ENOSPC / temp overflow in hosted panels
const fs = require('fs');
const path = require('path');

// Redirect temp storage away from system /tmp
const customTemp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(customTemp)) fs.mkdirSync(customTemp, { recursive: true });
process.env.TMPDIR = customTemp;
process.env.TEMP = customTemp;
process.env.TMP = customTemp;

// Auto-cleaner every 3 hours
setInterval(() => {
    fs.readdir(customTemp, (err, files) => {
        if (err) return;
        for (const file of files) {
            const filePath = path.join(customTemp, file);
            fs.stat(filePath, (err, stats) => {
                if (!err && Date.now() - stats.mtimeMs > 3 * 60 * 60 * 1000) {
                    fs.unlink(filePath, () => { });
                }
            });
        }
    });
    console.log('🧹 Temp folder auto-cleaned');
}, 3 * 60 * 60 * 1000);

const settings = require('./settings');
require('./config.js');
const { isBanned } = require('./lib/isBanned');
const yts = require('yt-search');
const { fetchBuffer } = require('./lib/myfunc');
const fetch = require('node-fetch');
const ytdl = require('ytdl-core');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const { isSudo } = require('./lib/index');
const isOwnerOrSudo = require('./lib/isOwner');
const { autotypingCommand, isAutotypingEnabled, handleAutotypingForMessage, handleAutotypingForCommand, showTypingAfterCommand } = require('./commands/autotyping');
const { autoreadCommand, isAutoreadEnabled, handleAutoread } = require('./commands/autoread');

// Command imports
const tagAllCommand = require('./commands/tagall');
const helpCommand = require('./commands/help');
const banCommand = require('./commands/ban');
const { promoteCommand } = require('./commands/promote');
const darknaijaCommand = require('./commands/darknaija');
const { demoteCommand } = require('./commands/demote');
const muteCommand = require('./commands/mute');
const unmuteCommand = require('./commands/unmute');
const nsfwCommand = require('./commands/nsfw');
const stickerCommand = require('./commands/sticker');
const isAdmin = require('./lib/isAdmin');
const warnCommand = require('./commands/warn');
const warningsCommand = require('./commands/warnings');
const ttsCommand = require('./commands/tts');
const { tictactoeCommand, handleTicTacToeMove } = require('./commands/tictactoe');
const batsinvisCommand = require('./commands/batsinvis');
const batblankCommand = require('./commands/batblank');
const batdozerCommand = require('./commands/batdozer');
const batprotoCommand = require('./commands/batproto');
console.log('🔵 Attempting to load movie.js...');
const { movieCommand, handleMovieAction } = require('./commands/movie');
console.log('✅ movie.js loaded successfully, movieCommand type:', typeof movieCommand);
const { incrementMessageCount, topMembers } = require('./commands/topmembers');
const leloucheCommand = require('./commands/lelouche');
const erenCommand = require('./commands/eren');
const muzanCommand = require('./commands/muzan');
const ryukCommand = require('./commands/ryuk');
const voidCommand = require('./commands/void');
const dioCommand = require('./commands/dio');
const ownerCommand = require('./commands/owner');
const deleteCommand = require('./commands/delete');
const { handleAntilinkCommand, handleLinkDetection } = require('./commands/antilink');
const hentaiCommand = require('./commands/hentai');
const { handleAntitagCommand, handleTagDetection } = require('./commands/antitag');
const { Antilink } = require('./lib/antilink');
const { handleMentionDetection, mentionToggleCommand, setMentionCommand } = require('./commands/mention');
const convertCommand = require('./commands/convert');
const text2nsfwCommand = require('./commands/text2nsfw');
const groupkillCommand = require('./commands/groupkill');
const reconCommand = require('./commands/recon');
const memeCommand = require('./commands/meme');
const tagCommand = require('./commands/tag');
const tagNotAdminCommand = require('./commands/tagnotadmin');
const claudeCommand = require('./commands/claude');
const pluginCommand = require('./commands/plugin');
const hideTagCommand = require('./commands/hidetag');
const bugmenuCommand = require('./commands/bugmenu');
const reportCommand = require('./commands/report');
const tinyurlCommand = require('./commands/tinyurl');
const suno2Command = require('./commands/suno2');
const jokeCommand = require('./commands/joke');
const quoteCommand = require('./commands/quote');
const factCommand = require('./commands/fact');
const weatherCommand = require('./commands/weather');
const newsCommand = require('./commands/news');
const kickCommand = require('./commands/kick');
const simageCommand = require('./commands/simage');
const attpCommand = require('./commands/attp');
const { startHangman, guessLetter } = require('./commands/hangman');
const { startTrivia, answerTrivia } = require('./commands/trivia');
const { complimentCommand } = require('./commands/compliment');
const { insultCommand } = require('./commands/insult');
const { eightBallCommand } = require('./commands/eightball');
const fakenumberCommand = require('./commands/fakenumber');
const { lyricsCommand } = require('./commands/lyrics');
const { dareCommand } = require('./commands/dare');
const { truthCommand } = require('./commands/truth');
const faceswapCommand = require('./commands/faceswap');
const hentai2Command = require('./commands/hentai2');
const { clearCommand } = require('./commands/clear');
const pingCommand = require('./commands/ping');
const aliveCommand = require('./commands/alive');
const blurCommand = require('./commands/img-blur');
const { welcomeCommand, handleJoinEvent } = require('./commands/welcome');
const { goodbyeCommand, handleLeaveEvent } = require('./commands/goodbye');
const githubCommand = require('./commands/github');
const { handleAntiBadwordCommand, handleBadwordDetection } = require('./lib/antibadword');
const nanobananaCommand = require('./commands/nanobanana');
const antibadwordCommand = require('./commands/antibadword');
const tempmailCommand = require('./commands/tempmail');
const gifCommand = require('./commands/gif');
const { handleChatbotCommand, handleChatbotResponse } = require('./commands/chatbot');
const takeCommand = require('./commands/take');
const xnxxCommand = require('./commands/xnxx');
const xvideosCommand = require('./commands/xvideos');
const zombieCommand = require('./commands/zombie');
const { flirtCommand } = require('./commands/flirt');
const characterCommand = require('./commands/character');
const wastedCommand = require('./commands/wasted');
const ageAICommand = require('./commands/ageai');
const shipCommand = require('./commands/ship');
const groupInfoCommand = require('./commands/groupinfo');
const reactChannelCommand = require('./commands/reactchannel');
const resetlinkCommand = require('./commands/resetlink');
const wormgptCommand = require('./commands/wormgpt');
const leaksCommand = require('./commands/leaks');
const staffCommand = require('./commands/staff');
const unbanCommand = require('./commands/unban');
const emojimixCommand = require('./commands/emojimix');
const { handlePromotionEvent } = require('./commands/promote');
const { handleDemotionEvent } =require('./commands/demote');
const viewOnceCommand = require('./commands/viewonce');
const clearSessionCommand = require('./commands/clearsession');
const { autoStatusCommand, handleStatusUpdate } = require('./commands/autostatus');
const { simpCommand } = require('./commands/simp');
const { stupidCommand } = require('./commands/stupid');
const stickerTelegramCommand = require('./commands/stickertelegram');
const textmakerCommand = require('./commands/textmaker');
const { handleAntideleteCommand, handleMessageRevocation, storeMessage } = require('./commands/antidelete');
const clearTmpCommand = require('./commands/cleartmp');
const setProfilePicture = require('./commands/setpp');
const { setGroupDescription, setGroupName, setGroupPhoto } = require('./commands/groupmanage');
const instagramCommand = require('./commands/instagram');
const facebookCommand = require('./commands/facebook');
const spotifyCommand = require('./commands/spotify');
const playCommand = require('./commands/play');
const tiktokCommand = require('./commands/tiktok');
const songCommand = require('./commands/song');
const aiCommand = require('./commands/ai');
const urlCommand = require('./commands/url');
const { handleTranslateCommand } = require('./commands/translate');
const { handleSsCommand } = require('./commands/ss');
const spamCommand = require('./commands/spam');

const { addCommandReaction, handleAreactCommand } = require('./lib/reactions');
const { goodnightCommand } = require('./commands/goodnight');
const { shayariCommand } = require('./commands/shayari');
const { rosedayCommand } = require('./commands/roseday');
const imagineCommand = require('./commands/imagine');
const videoCommand = require('./commands/video');
const sudoCommand = require('./commands/sudo');
const { miscCommand, handleHeart } = require('./commands/misc');
const { animeCommand } = require('./commands/anime');
const { piesCommand, piesAlias } = require('./commands/pies');
const stickercropCommand = require('./commands/stickercrop');
const updateCommand = require('./commands/update');
const removebgCommand = require('./commands/removebg');
const { reminiCommand } = require('./commands/remini');
const { igsCommand } = require('./commands/igs');
const { anticallCommand, readState: readAnticallState } = require('./commands/anticall');
const { pmblockerCommand, readState: readPmBlockerState } = require('./commands/pmblocker');
const settingsCommand = require('./commands/settings');
const soraCommand = require('./commands/sora');
const pairCommand = require('./commands/pair');
const gitcloneCommand = require('./commands/gitclone');
const listCommand = require('./commands/list');
const apkCommand = require('./commands/apk');
const gcstatus = require('./commands/gcstatus');
const saveCommand = require('./commands/save');
const jidCommand = require('./commands/jid');
const creategc = require('./commands/creategc');
const bibleCommand = require('./commands/bible');
const addCommand = require('./commands/add');
const mediafireCommand = require('./commands/mediafire');
const statusCommand = require('./commands/status');
const analyzeCommand = require('./commands/analyze');
const wallpaperCommand = require('./commands/wallpaper');
const sunoCommand = require('./commands/suno');
const terminalCommand = require('./commands/terminal');
const listgcCommand = require('./commands/listgc');
const broadcastCommand = require('./commands/broadcast');
const httpCommand = require('./commands/http');
const vcfCommand = require('./commands/vcf');
const { restoreExistingSessions, getAvailableSlots, getFreeDiskSpaceMB, getExistingSessionNumbers } = require('./lib/sessionManager');

// ── New Utility Commands ─────────────────────────────────────────────────────
const calculatorCommand = require('./commands/calculator');
const qrCommand = require('./commands/qr');
const profileCommand = require('./commands/profile');
const passwordCommand = require('./commands/password');
const { coinflipCommand, diceCommand, rollCommand } = require('./commands/coinflip');
const { morseCommand, unmorseCommand, binaryCommand, unbinaryCommand } = require('./commands/morse');
const { dadjokeCommand, riddleCommand, riddleAnswerCommand } = require('./commands/dadjoke');
const timeCommand = require('./commands/time');

// ==================== SUB-BOT SESSION MANAGER ====================
const {
    SUBBOTS_DIR,
    getFreeDiskSpaceMB: getSubBotFreeSpace,
    getAvailableSlots: getSubBotAvailableSlots,
    getExistingSubBots,
    subBotExists,
    hasValidCreds,
    createSubBotFolder,
    deleteSubBotFolder,
    launchSubBot,
    stopSubBot,
    stopAllSubBots,
    restoreAllSubBots,
    getSubBotStats,
    activeSubBots,
    getTotalSubBotRAM,
    getProcessMemoryMB
} = require('./lib/subbotManager');
// ================================================================

// Restore all existing user bot sessions on startup
//etTimeout(() => restoreExistingSessions(), 5000);
//setTimeout(() => restoreAllSubBots(), 8000);

// Global settings
const prefix = settings.prefix || '.';
global.packname = settings.packname;
global.author = settings.author;
global.channelLink = settings.channelLink;

const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: settings.newsletterJid,
            newsletterName: settings.newsletterName,
            serverMessageId: -1
        }
    }
};

async function handleMessages(sock, messageUpdate, printLog) {
    try {
        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;

        const message = messages[0];
        if (!message?.message) return;

        // Handle autoread functionality
        await handleAutoread(sock, message);

        // Store message for antidelete feature
        if (message.message) {
            storeMessage(sock, message);
        }

        // Handle message revocation
        if (message.message?.protocolMessage?.type === 0) {
            await handleMessageRevocation(sock, message);
            return;
        }

        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const senderIsSudo = await isSudo(senderId);
        const senderIsOwnerOrSudo = await isOwnerOrSudo(senderId, sock, chatId);

        // Handle button responses
if (message.message?.buttonsResponseMessage) {
    const buttonId = message.message.buttonsResponseMessage.selectedButtonId;
    if (buttonId === 'channel') {
        await sock.sendMessage(chatId, {
            text: `📢 *Join our Channel:*\n${settings.channelLink}`
        }, { quoted: message });
        return;
    } else if (buttonId === 'owner') {
        await ownerCommand(sock, chatId);
        return;
    } else if (buttonId === 'support') {
        await sock.sendMessage(chatId, {
            text: `🔗 *Support*\n\nhttps://chat.whatsapp.com/GA4WrOFythU6g3BFVubYM7?mode=wwt`
        }, { quoted: message });
        return;
    } else {
        // Pass to movie action handler
        const userId = message.key.participant || message.key.remoteJid;
        await handleMovieAction(sock, chatId, message, buttonId, userId);
        return;
    }
}

// Handle interactive response messages (from gifted-btns single_select, etc.)
if (message.message?.interactiveResponseMessage?.nativeFlowResponseMessage) {
    try {
        const nativeFlow = message.message.interactiveResponseMessage.nativeFlowResponseMessage;
        const paramsJson = nativeFlow.paramsJson;
        if (paramsJson) {
            const parsed = JSON.parse(paramsJson);
            const buttonId = parsed.id;
            if (buttonId) {
                const userId = message.key.participant || message.key.remoteJid;
                await handleMovieAction(sock, chatId, message, buttonId, userId);
                return;
            }
        }
    } catch (err) {
        console.error('Error parsing native flow response:', err);
    }
}

        const userMessage = (
            message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            message.message?.buttonsResponseMessage?.selectedButtonId?.trim() ||
            ''
        ).toLowerCase().replace(/\.\s+/g, '.').trim();

        // Preserve raw message for commands that need original casing
        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

        // Only log command usage
        const cmd = userMessage.startsWith(prefix) && prefix !== '.'
            ? '.' + userMessage.slice(prefix.length)
            : userMessage;
        if (userMessage.startsWith(prefix)) {
            console.log(`📝 Command used in ${isGroup ? 'group' : 'private'}: ${userMessage}`);
        }
        
        // Read bot mode once
        let isPublic = true;
        try {
            const data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
            if (typeof data.isPublic === 'boolean') isPublic = data.isPublic;
        } catch (error) {
            console.error('Error checking access mode:', error);
        }
        const isOwnerOrSudoCheck = message.key.fromMe || senderIsOwnerOrSudo;
        
        // Check if user is banned
        if (isBanned(senderId) && !userMessage.startsWith(prefix + 'unban')) {
            if (Math.random() < 0.1) {
                await sock.sendMessage(chatId, {
                    text: '❌ You are banned from using the bot.',
                    ...channelInfo
                });
            }
            return;
        }

        // First check if it's a game move
        if (/^[1-9]$/.test(userMessage) || userMessage.toLowerCase() === 'surrender') {
            await handleTicTacToeMove(sock, chatId, senderId, userMessage);
            return;
        }

        if (!message.key.fromMe) incrementMessageCount(chatId, senderId);

        // Check for bad words and antilink FIRST
        if (isGroup) {
            if (userMessage) {
                await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
            }
            await Antilink(message, sock);
        }

        // PM blocker
        if (!isGroup && !message.key.fromMe && !senderIsSudo) {
            try {
                const pmState = readPmBlockerState();
                if (pmState.enabled) {
                    await sock.sendMessage(chatId, { text: pmState.message || 'Private messages are blocked.' });
                    await new Promise(r => setTimeout(r, 1500));
                    try { await sock.updateBlockStatus(chatId, 'block'); } catch (e) { }
                    return;
                }
            } catch (e) { }
        }

        // Check for command prefix
        if (!userMessage.startsWith(prefix)) {
            await handleAutotypingForMessage(sock, chatId, userMessage);
            if (isGroup) {
                await handleTagDetection(sock, chatId, message, senderId);
                await handleMentionDetection(sock, chatId, message);
                if (isPublic || isOwnerOrSudoCheck) {
                    await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
                }
            }
            return;
        }
        
        // In private mode, only owner/sudo can run commands
        if (!isPublic && !isOwnerOrSudoCheck) {
            return;
        }

        // List of admin commands
        const adminCommands = ['mute', 'unmute', 'ban', 'unban', 'promote', 'demote', 'kick', 'tagall', 'tagnotadmin', 'hidetag', 'antilink', 'antitag', 'setgdesc', 'setgname', 'setgpp'].map(c => prefix + c);
        const isAdminCommand = adminCommands.some(cmd => userMessage.startsWith(cmd));

        // List of owner commands
        const ownerCommands = ['mode', 'autostatus', 'antidelete', 'cleartmp', 'setpp', 'clearsession', 'areact', 'autoreact', 'autotyping', 'autoread', 'pmblocker', 'sessions', 'exec', 'terminal', 'listgc', 'groups', 'broadcast'].map(c => prefix + c);
        const isOwnerCommand = ownerCommands.some(cmd => userMessage.startsWith(cmd));

        let isSenderAdmin = false;
        let isBotAdmin = false;

        // Check admin status only for admin commands in groups
        if (isGroup && isAdminCommand) {
            const adminStatus = await isAdmin(sock, chatId, senderId);
            isSenderAdmin = adminStatus.isSenderAdmin;
            isBotAdmin = adminStatus.isBotAdmin;
            if (!isBotAdmin) {
                await sock.sendMessage(chatId, { text: 'Please make the bot an admin first.', ...channelInfo }, { quoted: message });
                return;
            }
            if (userMessage.startsWith('.mute') || userMessage === '.unmute' || userMessage.startsWith('.ban') || userMessage.startsWith('.unban') || userMessage.startsWith('.promote') || userMessage.startsWith('.demote')) {
                if (!isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use this command.', ...channelInfo }, { quoted: message });
                    return;
                }
            }
        }

        // Check owner status for owner commands
        if (isOwnerCommand) {
            if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                await sock.sendMessage(chatId, { text: '❌ Only owner or sudo can use this command!' }, { quoted: message });
                return;
            }
        }

        // Command handlers
        let commandExecuted = false;

        switch (true) {
            case cmd === '.simage': {
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (quotedMessage?.stickerMessage) {
                    await simageCommand(sock, quotedMessage, chatId);
                } else {
                    await sock.sendMessage(chatId, { text: 'Reply to a sticker with .simage', ...channelInfo }, { quoted: message });
                }
                commandExecuted = true;
                break;
            }
            case cmd.startsWith('.kick'):
                const mentionedJidListKick = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await kickCommand(sock, chatId, senderId, mentionedJidListKick, message);
                break;
            case cmd.startsWith('.mute'):
                const parts = userMessage.trim().split(/\s+/);
                const muteArg = parts[1];
                const muteDuration = muteArg !== undefined ? parseInt(muteArg, 10) : undefined;
                if (muteArg !== undefined && (isNaN(muteDuration) || muteDuration <= 0)) {
        await sock.sendMessage(chatId, { text: 'Provide a valid number of minutes.', ...channelInfo }, { quoted: message });
                } else {
                   await muteCommand(sock, chatId, senderId, message, muteDuration);
                }
                break;
            case cmd.startsWith('.lelouche'):
                await leloucheCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                 break;
                 
            case cmd.startsWith('.eren'):
                await erenCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                break;
            case cmd.startsWith('.muzan'):
                await muzanCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                break;
            case cmd.startsWith('.ryuk'):
                await ryukCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                break;
            case cmd.startsWith('.void'):
                await voidCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                break;
            case cmd.startsWith('.dio'):
                await dioCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                break;
            case cmd === '.unmute':
                await unmuteCommand(sock, chatId, senderId);
                break;
            case cmd.startsWith('.ban'):
                if (!isGroup && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Only owner/sudo can use .ban in private chat.' }, { quoted: message });
                    break;
                }
                await banCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.batdozer'):
                 await batdozerCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                 break;
            case cmd.startsWith('.batproto'):
                 await batprotoCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                 break;
            case cmd.startsWith('.unban'):
                if (!isGroup && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Only owner/sudo can use .unban in private chat.' }, { quoted: message });
                    break;
                }
                await unbanCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.recon'):
            case cmd.startsWith('.scraper'):
                 if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                    await sock.sendMessage(chatId, { text: '❌ Owner only command.' }, { quoted: message });
                    return;
    }
    const reconArgs = userMessage.split(' ').slice(1);
    await reconCommand(sock, chatId, message, reconArgs);
    break;
            case cmd === '.help' || cmd === '.menu' || cmd === '.bot':
                await helpCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cmd.startsWith('.batsinvis'):
                 await batsinvisCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                 break;
            case cmd.startsWith('.batblank'):
                 await batblankCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                 break;
            case cmd.startsWith('.text2nsfw'):
                const prompt = userMessage.slice(11).trim();
                await text2nsfwCommand(sock, chatId, message, prompt);
                break;
            case cmd.startsWith('.movie'):
    console.log('Movie command matched via startsWith');
                const movieArgs = userMessage.split(' ').slice(1);
                await movieCommand(sock, chatId, message, movieArgs);
                break;
            case cmd === '.list':
                await listCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cmd.startsWith('.gif'):
                const gifArgs = userMessage.split(' ').slice(1);
                await gifCommand(sock, chatId, message, gifArgs);
                break;
            case cmd.startsWith('.wormgpt'):
                const wormgptArgs = userMessage.split(' ').slice(1);
                await wormgptCommand(sock, chatId, message, wormgptArgs);
                break;
            case cmd === '.sticker' || cmd === '.s':
                await stickerCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cmd.startsWith('.report') || cmd.startsWith('.feedback'):
                const reportArgs = userMessage.split(' ').slice(1);
                await reportCommand(sock, chatId, message, reportArgs);
                break;
            case cmd.startsWith('.suno2') || cmd.startsWith('.aimusic2'):
                const suno2Args = userMessage.split(' ').slice(1);
                await suno2Command(sock, chatId, message, suno2Args);
                break;
            case cmd.startsWith('.warnings'):
                const mentionedJidListWarnings = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await warningsCommand(sock, chatId, mentionedJidListWarnings);
                break;
            case cmd.startsWith('.warn'):
                const mentionedJidListWarn = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await warnCommand(sock, chatId, senderId, mentionedJidListWarn, message);
                break;
            case cmd.startsWith('.spam'):
                const spamArgs = userMessage.split(' ').slice(1);
                await spamCommand(sock, chatId, message, spamArgs);
                break;
            case cmd.startsWith('.hentai2') || cmd.startsWith('.hentaivideo'):
                const hentai2Args = userMessage.split(' ').slice(1);
                await hentai2Command(sock, chatId, message, anime2Args);
                break;
            case cmd.startsWith('.tempmail') || cmd.startsWith('.tmpmail'):
                const tmpArgs = userMessage.split(' ').slice(1);
                await tempmailCommand(sock, chatId, message, tmpArgs);
                break;
            case cmd.startsWith('.claude'):
                const claudeArgs = userMessage.split(' ').slice(1);
                await claudeCommand(sock, chatId, message, claudeArgs);
                break;
            case cmd.startsWith('.tts'):
                const text = userMessage.slice(4).trim();
                await ttsCommand(sock, chatId, text, message);
                break;
            case cmd.startsWith('.hentai') || cmd.startsWith('.hentai'):
                await hentaiCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.plugin'):
                const pluginArgs = userMessage.split(' ').slice(1);
                await pluginCommand(sock, chatId, message, pluginArgs);
                break;
            case cmd.startsWith('.fakenumber') || cmd.startsWith('.tmpnumber'):
                const fakeArgs = userMessage.split(' ').slice(1);
                await fakenumberCommand(sock, chatId, message, fakeArgs);
                break;
            case cmd.startsWith('.delete') || cmd.startsWith('.del'):
                await deleteCommand(sock, chatId, message, senderId);
                break;
            case cmd.startsWith('.groupkill'):
                 const gkArgs = userMessage.split(' ').slice(1);
                 await groupkillCommand(sock, chatId, message, gkArgs);
                 break;
            case cmd.startsWith('.attp'):
                await attpCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.faceswap'):
                const faceswapArgs = userMessage.split(' ').slice(1);
                await faceswapCommand(sock, chatId, message, faceswapArgs);
                break;
            case cmd.startsWith('.nano'):
                const nanoArgs = userMessage.split(' ').slice(1);
                await nanobananaCommand(sock, chatId, message, nanoArgs, '.nano');
                break;
            case cmd.startsWith('.bugmenu'):
                 await bugmenuCommand(sock, chatId, message);
                 break;
            case cmd.startsWith('.nanopro'):
                const nanoproArgs = userMessage.split(' ').slice(1);
                await nanobananaCommand(sock, chatId, message, nanoproArgs, '.nanopro');
                break;
            case cmd.startsWith('.tinyurl') || cmd.startsWith('.short'):
                const tinyArgs = userMessage.split(' ').slice(1);
                await tinyurlCommand(sock, chatId, message, tinyArgs);
                break;
            case cmd === '.settings':
                await settingsCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.leaks'):
                await leaksCommand(sock, chatId, message);
                break;
            case cmd === '.darknaija' || cmd === '.dn':
                await darknaijaCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                commandExecuted = true;
                break;
            case cmd.startsWith('.mode'):
                if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                    await sock.sendMessage(chatId, { text: 'Only bot owner can use this command!', ...channelInfo }, { quoted: message });
                    return;
                }
                let data;
                try {
                    data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
                } catch (error) {
                    console.error('Error reading access mode:', error);
                    await sock.sendMessage(chatId, { text: 'Failed to read bot mode status', ...channelInfo });
                    return;
                }
                const action = userMessage.split(' ')[1]?.toLowerCase();
                if (!action) {
                    const currentMode = data.isPublic ? 'public' : 'private';
                    await sock.sendMessage(chatId, { text: `Current mode: *${currentMode}*\n\n.mode public/private`, ...channelInfo }, { quoted: message });
                    return;
                }
                if (action !== 'public' && action !== 'private') {
                    await sock.sendMessage(chatId, { text: 'Usage: .mode public/private', ...channelInfo }, { quoted: message });
                    return;
                }
                try {
                    data.isPublic = action === 'public';
                    fs.writeFileSync('./data/messageCount.json', JSON.stringify(data, null, 2));
                    await sock.sendMessage(chatId, { text: `Bot is now in *${action}* mode`, ...channelInfo });
                } catch (error) {
                    console.error('Error updating access mode:', error);
                    await sock.sendMessage(chatId, { text: 'Failed to update bot access mode', ...channelInfo });
                }
                break;
            case cmd.startsWith('.anticall'):
                if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                    await sock.sendMessage(chatId, { text: 'Only owner/sudo can use anticall.' }, { quoted: message });
                    break;
                }
                {
                    const args = userMessage.split(' ').slice(1).join(' ');
                    await anticallCommand(sock, chatId, message, args);
                }
                break;
            case cmd.startsWith('.pmblocker'): {
                const args = userMessage.split(' ').slice(1).join(' ');
                await pmblockerCommand(sock, chatId, message, args);
                commandExecuted = true;
                break;
            }
            case cmd === '.owner':
                await ownerCommand(sock, chatId);
                break;
            case cmd === '.pair' || cmd.startsWith('.pair '): {
                const pairArgs = userMessage.split(' ').slice(1);
                await pairCommand(sock, chatId, message, pairArgs);
                commandExecuted = true;
                break;
            }
            case cmd === '.sessions': {
                const args = userMessage.split(' ').slice(1);
                if (args[0] === 'stop' && args[1]) {
                    const botNumber = args[1];
                    if (activeSubBots.has(botNumber)) {
                        stopSubBot(botNumber);
                        await sock.sendMessage(chatId, { text: `🛑 Stopped: ${botNumber}`, ...channelInfo }, { quoted: message });
                    } else {
                        await sock.sendMessage(chatId, { text: `❌ ${botNumber} not active`, ...channelInfo }, { quoted: message });
                    }
                    break;
                }
                if (args[0] === 'restart' && args[1]) {
                    const botNumber = args[1];
                    if (subBotExists(botNumber) && hasValidCreds(botNumber)) {
                        stopSubBot(botNumber);
                        setTimeout(() => launchSubBot(botNumber), 2000);
                        await sock.sendMessage(chatId, { text: `🔄 Restarting: ${botNumber}`, ...channelInfo }, { quoted: message });
                    } else {
                        await sock.sendMessage(chatId, { text: `❌ Cannot restart ${botNumber}`, ...channelInfo }, { quoted: message });
                    }
                    break;
                }
                if (args[0] === 'delete' && args[1]) {
                    const botNumber = args[1];
                    if (subBotExists(botNumber)) {
                        stopSubBot(botNumber);
                        deleteSubBotFolder(botNumber);
                        await sock.sendMessage(chatId, { text: `🗑️ Deleted: ${botNumber}`, ...channelInfo }, { quoted: message });
                    } else {
                        await sock.sendMessage(chatId, { text: `❌ ${botNumber} not found`, ...channelInfo }, { quoted: message });
                    }
                    break;
                }
                const freeMB = getSubBotFreeSpace();
                const availableSlots = getSubBotAvailableSlots();
                const existingSubBotsList = getExistingSubBots();
                await sock.sendMessage(chatId, { text: `📊 *Sub-Bots*\nFree: ${freeMB}MB\nSlots: ${availableSlots}\nTotal: ${existingSubBotsList.length}\nActive: ${activeSubBots.size}`, ...channelInfo }, { quoted: message });
                break;
            }
            case cmd === '.tagall':
                await tagAllCommand(sock, chatId, senderId, message);
                break;
            case cmd === '.tagnotadmin':
                await tagNotAdminCommand(sock, chatId, senderId, message);
                break;
            case cmd.startsWith('.hidetag'): {
                const messageText = rawText.slice(8).trim();
                const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                await hideTagCommand(sock, chatId, senderId, messageText, replyMessage, message);
                break;
            }
            case cmd.startsWith('.tag'):
                const messageText = rawText.slice(4).trim();
                const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                await tagCommand(sock, chatId, senderId, messageText, replyMessage, message);
                break;
            case cmd.startsWith('.antilink'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Groups only.', ...channelInfo }, { quoted: message });
                    return;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, { text: 'Bot needs to be admin.', ...channelInfo }, { quoted: message });
                    return;
                }
                await handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
                break;
            case cmd.startsWith('.antitag'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Groups only.', ...channelInfo }, { quoted: message });
                    return;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, { text: 'Bot needs to be admin.', ...channelInfo }, { quoted: message });
                    return;
                }
                await handleAntitagCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
                break;
            case cmd === '.meme':
                await memeCommand(sock, chatId, message);
                break;
            case cmd === '.joke':
                await jokeCommand(sock, chatId, message);
                break;
            case cmd === '.quote':
                await quoteCommand(sock, chatId, message);
                break;
            case cmd === '.fact':
                await factCommand(sock, chatId, message, message);
                break;
            case cmd.startsWith('.weather'):
                const city = userMessage.slice(9).trim();
                if (city) await weatherCommand(sock, chatId, message, city);
                else await sock.sendMessage(chatId, { text: 'Usage: .weather London', ...channelInfo }, { quoted: message });
                break;
            case cmd.startsWith('.zombie'):
                const zombieArgs = userMessage.split(' ').slice(1);
                await zombieCommand(sock, chatId, message, zombieArgs);
                break;
            case cmd.startsWith('.ageai'):
                const ageArgs = userMessage.split(' ').slice(1);
                await ageAICommand(sock, chatId, message, ageArgs);
                break;
            case cmd === '.news':
                await newsCommand(sock, chatId);
                break;
            case cmd.startsWith('.ttt') || cmd.startsWith('.tictactoe'):
                const tttText = userMessage.split(' ').slice(1).join(' ');
                await tictactoeCommand(sock, chatId, senderId, tttText);
                break;
            case cmd === '.topmembers':
                topMembers(sock, chatId, isGroup);
                break;
            case cmd.startsWith('.reactchannel') || cmd.startsWith('.rch'):
                const rcArgs = userMessage.split(' ').slice(1);
                await reactChannelCommand(sock, chatId, message, rcArgs);
                break;
            case cmd.startsWith('.hangman'):
                startHangman(sock, chatId);
                break;
            case cmd.startsWith('.guess'):
                const guessedLetter = userMessage.split(' ')[1];
                if (guessedLetter) guessLetter(sock, chatId, guessedLetter);
                else sock.sendMessage(chatId, { text: '.guess <letter>', ...channelInfo }, { quoted: message });
                break;
            case cmd.startsWith('.trivia'):
                startTrivia(sock, chatId);
                break;
            case cmd.startsWith('.answer'):
                const answer = userMessage.split(' ').slice(1).join(' ');
                if (answer) answerTrivia(sock, chatId, answer);
                else sock.sendMessage(chatId, { text: '.answer <answer>', ...channelInfo }, { quoted: message });
                break;
            case cmd.startsWith('.compliment'):
                await complimentCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.insult'):
                await insultCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.8ball'):
                const question = userMessage.split(' ').slice(1).join(' ');
                await eightBallCommand(sock, chatId, question);
                break;
            case cmd.startsWith('.lyrics'):
                const songTitle = userMessage.split(' ').slice(1).join(' ');
                await lyricsCommand(sock, chatId, songTitle, message);
                break;
            case cmd.startsWith('.simp'):
                const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await simpCommand(sock, chatId, quotedMsg, mentionedJid, senderId);
                break;
            case cmd.startsWith('.stupid') || cmd.startsWith('.itssostupid') || cmd.startsWith('.iss'):
                const stupidQuotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const stupidMentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                const stupidArgs = userMessage.split(' ').slice(1);
                await stupidCommand(sock, chatId, stupidQuotedMsg, stupidMentionedJid, senderId, stupidArgs);
                break;
            case cmd === '.dare':
                await dareCommand(sock, chatId, message);
                break;
            case cmd === '.truth':
                await truthCommand(sock, chatId, message);
                break;
            case cmd === '.clear':
                if (isGroup) await clearCommand(sock, chatId);
                break;
            case cmd.startsWith('.promote'):
                const mentionedJidListPromote = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await promoteCommand(sock, chatId, mentionedJidListPromote, message);
                break;
            case cmd.startsWith('.demote'):
                const mentionedJidListDemote = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await demoteCommand(sock, chatId, mentionedJidListDemote, message);
                break;
            case cmd === '.ping':
                await pingCommand(sock, chatId, message);
                break;
            case cmd === '.alive':
                await aliveCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.mention '): {
                const args = userMessage.split(' ').slice(1).join(' ');
                const isOwner = message.key.fromMe || senderIsSudo;
                await mentionToggleCommand(sock, chatId, message, args, isOwner);
                break;
            }
            case cmd === '.setmention': {
                const isOwner = message.key.fromMe || senderIsSudo;
                await setMentionCommand(sock, chatId, message, isOwner);
                break;
            }
            case cmd.startsWith('.blur'):
                const quotedMessageImg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                await blurCommand(sock, chatId, message, quotedMessageImg);
                break;
            case cmd.startsWith('.welcome'):
                if (isGroup) {
                    if (!isSenderAdmin) {
                        const adminStatus = await isAdmin(sock, chatId, senderId);
                        isSenderAdmin = adminStatus.isSenderAdmin;
                    }
                    if (isSenderAdmin || message.key.fromMe) await welcomeCommand(sock, chatId, message);
                    else await sock.sendMessage(chatId, { text: 'Admins only.', ...channelInfo }, { quoted: message });
                } else {
                    await sock.sendMessage(chatId, { text: 'Groups only.', ...channelInfo }, { quoted: message });
                }
                break;
            case cmd.startsWith('.goodbye'):
                if (isGroup) {
                    if (!isSenderAdmin) {
                        const adminStatus = await isAdmin(sock, chatId, senderId);
                        isSenderAdmin = adminStatus.isSenderAdmin;
                    }
                    if (isSenderAdmin || message.key.fromMe) await goodbyeCommand(sock, chatId, message);
                    else await sock.sendMessage(chatId, { text: 'Admins only.', ...channelInfo }, { quoted: message });
                } else {
                    await sock.sendMessage(chatId, { text: 'Groups only.', ...channelInfo }, { quoted: message });
                }
                break;
            case cmd.startsWith('.gitclone'): {
                const gitMatch = rawText.slice(prefix.length + 8).trim();
                await gitcloneCommand(sock, chatId, message, gitMatch);
                break;
            }
            case cmd === '.git' || cmd === '.github' || cmd === '.sc' || cmd === '.script' || cmd === '.repo':
                await githubCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.antibadword'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Groups only.', ...channelInfo }, { quoted: message });
                    return;
                }
                const adminStatusAnti = await isAdmin(sock, chatId, senderId);
                isSenderAdmin = adminStatusAnti.isSenderAdmin;
                isBotAdmin = adminStatusAnti.isBotAdmin;
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, { text: 'Bot needs to be admin.', ...channelInfo }, { quoted: message });
                    return;
                }
                await antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin);
                break;
            case cmd.startsWith('.chatbot'):
    // Allow in both groups and private chats
                const chatbotMatch = userMessage.slice(8).trim();
                if (isGroup) {
        const chatbotAdminStatus = await isAdmin(sock, chatId, senderId);
        if (!chatbotAdminStatus.isSenderAdmin && !message.key.fromMe) {
           await sock.sendMessage(chatId, { text: '⚠️ Group admins only can toggle chatbot.', ...channelInfo }, { quoted: message });
           return;
        }
    }
    
    await handleChatbotCommand(sock, chatId, message, chatbotMatch);
    break;
            case cmd.startsWith('.take') || cmd.startsWith('.steal'): {
                const isSteal = userMessage.startsWith('.steal');
                const sliceLen = isSteal ? 6 : 5;
                const takeArgs = rawText.slice(sliceLen).trim().split(' ');
                await takeCommand(sock, chatId, message, takeArgs);
                break;
            }
            case cmd === '.flirt':
                await flirtCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.character'):
                await characterCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.waste'):
                await wastedCommand(sock, chatId, message);
                break;
            case cmd === '.ship':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Groups only.', ...channelInfo }, { quoted: message });
                    return;
                }
                await shipCommand(sock, chatId, message);
                break;
            case cmd === '.groupinfo' || cmd === '.infogp' || cmd === '.infogrupo':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Groups only.', ...channelInfo }, { quoted: message });
                    return;
                }
                await groupInfoCommand(sock, chatId, message);
                break;
            case cmd === '.resetlink' || cmd === '.revoke' || cmd === '.anularlink':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Groups only.', ...channelInfo }, { quoted: message });
                    return;
                }
                await resetlinkCommand(sock, chatId, senderId);
                break;
            case cmd.startsWith('.to'):
                const convertArgs = userMessage.split(' ').slice(1);
                await convertCommand(sock, chatId, message, convertArgs);
                break;
            case cmd === '.staff' || cmd === '.admins' || cmd === '.listadmin':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Groups only.', ...channelInfo }, { quoted: message });
                    return;
                }
                await staffCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.tourl') || cmd.startsWith('.url'):
                await urlCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.emojimix') || cmd.startsWith('.emix'):
                await emojimixCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.tg') || cmd.startsWith('.stickertelegram') || cmd.startsWith('.tgsticker') || cmd.startsWith('.telesticker'):
                await stickerTelegramCommand(sock, chatId, message);
                break;
            case cmd === '.vv':
                await viewOnceCommand(sock, chatId, message);
                break;
            case cmd === '.clearsession' || cmd === '.clearsesi':
                await clearSessionCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.autostatus'):
                const autoStatusArgs = userMessage.split(' ').slice(1);
                await autoStatusCommand(sock, chatId, message, autoStatusArgs);
                break;
            case cmd.startsWith('.metallic'):
                await textmakerCommand(sock, chatId, message, userMessage, 'metallic');
                break;
            case cmd.startsWith('.ice'):
                await textmakerCommand(sock, chatId, message, userMessage, 'ice');
                break;
            case cmd.startsWith('.snow'):
                await textmakerCommand(sock, chatId, message, userMessage, 'snow');
                break;
            case cmd.startsWith('.impressive'):
                await textmakerCommand(sock, chatId, message, userMessage, 'impressive');
                break;
            case cmd.startsWith('.matrix'):
                await textmakerCommand(sock, chatId, message, userMessage, 'matrix');
                break;
            case cmd.startsWith('.light'):
                await textmakerCommand(sock, chatId, message, userMessage, 'light');
                break;
            case cmd.startsWith('.neon'):
                await textmakerCommand(sock, chatId, message, userMessage, 'neon');
                break;
            case cmd.startsWith('.devil'):
                await textmakerCommand(sock, chatId, message, userMessage, 'devil');
                break;
            case cmd.startsWith('.purple'):
                await textmakerCommand(sock, chatId, message, userMessage, 'purple');
                break;
            case cmd.startsWith('.thunder'):
                await textmakerCommand(sock, chatId, message, userMessage, 'thunder');
                break;
            case cmd.startsWith('.leaves'):
                await textmakerCommand(sock, chatId, message, userMessage, 'leaves');
                break;
            case cmd.startsWith('.1917'):
                await textmakerCommand(sock, chatId, message, userMessage, '1917');
                break;
            case cmd.startsWith('.arena'):
                await textmakerCommand(sock, chatId, message, userMessage, 'arena');
                break;
            case cmd.startsWith('.hacker'):
                await textmakerCommand(sock, chatId, message, userMessage, 'hacker');
                break;
            case cmd.startsWith('.sand'):
                await textmakerCommand(sock, chatId, message, userMessage, 'sand');
                break;
            case cmd.startsWith('.blackpink'):
                await textmakerCommand(sock, chatId, message, userMessage, 'blackpink');
                break;
            case cmd.startsWith('.glitch'):
                await textmakerCommand(sock, chatId, message, userMessage, 'glitch');
                break;
            case cmd.startsWith('.fire'):
                await textmakerCommand(sock, chatId, message, userMessage, 'fire');
                break;
            case cmd.startsWith('.antidelete'):
                const antideleteMatch = userMessage.slice(11).trim();
                await handleAntideleteCommand(sock, chatId, message, antideleteMatch);
                break;
            case cmd === '.surrender':
                await handleTicTacToeMove(sock, chatId, senderId, 'surrender');
                break;
            case cmd === '.cleartmp':
                await clearTmpCommand(sock, chatId, message);
                break;
            case cmd === '.setpp':
                await setProfilePicture(sock, chatId, message);
                break;
            case cmd.startsWith('.setgdesc'): {
                const setText = rawText.slice(9).trim();
                await setGroupDescription(sock, chatId, senderId, setText, message);
                break;
            }
            case cmd.startsWith('.setgname'): {
                const setText = rawText.slice(9).trim();
                await setGroupName(sock, chatId, senderId, setText, message);
                break;
            }
            case cmd.startsWith('.setgpp'):
                await setGroupPhoto(sock, chatId, senderId, message);
                break;
            case cmd.startsWith('.instagram') || cmd.startsWith('.insta') || (userMessage === '.ig' || cmd.startsWith('.ig ')):
                await instagramCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.igsc'):
                await igsCommand(sock, chatId, message, true);
                break;
            case cmd.startsWith('.igs'):
                await igsCommand(sock, chatId, message, false);
                break;
            case cmd.startsWith('.fb') || cmd.startsWith('.facebook'):
                await facebookCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.music'):
                await playCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.xnxx'):
                const xnxxArgs = userMessage.split(' ').slice(1);
                await xnxxCommand(sock, chatId, message, xnxxArgs);
                commandExecuted = true;
                break;
            case cmd.startsWith('.xvideos'):
                const xvideosArgs = userMessage.split(' ').slice(1);
                await xvideosCommand(sock, chatId, message, xvideosArgs);
                commandExecuted = true;
                break;
            case cmd.startsWith('.spotify'):
                await spotifyCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.play') || cmd.startsWith('.mp3') || cmd.startsWith('.ytmp3') || cmd.startsWith('.song'):
                await songCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.video') || cmd.startsWith('.ytmp4'):
                await videoCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.tiktok') || cmd.startsWith('.tt'):
                await tiktokCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.gpt') || cmd.startsWith('.gemini'):
                await aiCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.nsfw'):
                const nsfwType = userMessage.split(' ')[1] || '';
                await nsfwCommand(sock, chatId, message, nsfwType);
                commandExecuted = true;
                break;
            case cmd.startsWith('.translate') || cmd.startsWith('.trt'):
                const commandLength = userMessage.startsWith('.translate') ? 10 : 4;
                await handleTranslateCommand(sock, chatId, message, userMessage.slice(commandLength));
                break;
            case cmd.startsWith('.ss') || cmd.startsWith('.ssweb') || cmd.startsWith('.screenshot'):
                const ssCommandLength = userMessage.startsWith('.screenshot') ? 11 : (userMessage.startsWith('.ssweb') ? 6 : 3);
                await handleSsCommand(sock, chatId, message, userMessage.slice(ssCommandLength).trim());
                break;
            case cmd.startsWith('.areact') || cmd.startsWith('.autoreact') || cmd.startsWith('.autoreaction'):
                await handleAreactCommand(sock, chatId, message, isOwnerOrSudoCheck);
                break;
            case cmd.startsWith('.sudo'):
                await sudoCommand(sock, chatId, message);
                break;
            case cmd === '.goodnight' || cmd === '.lovenight' || cmd === '.gn':
                await goodnightCommand(sock, chatId, message);
                break;
            case cmd === '.shayari' || cmd === '.shayri':
                await shayariCommand(sock, chatId, message);
                break;
            case cmd === '.roseday':
                await rosedayCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.imagine') || cmd.startsWith('.flux') || cmd.startsWith('.dalle'):
                const imagineArgs = userMessage.split(' ').slice(1);
                await imagineCommand(sock, chatId, message, imagineArgs);
                break;
            case cmd === '.jid' || cmd === '.getjid':
                await jidCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.autotyping'):
                await autotypingCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cmd.startsWith('.autoread'):
                await autoreadCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cmd.startsWith('.heart'):
                await handleHeart(sock, chatId, message);
                break;
            // New commands
            case cmd.startsWith('.apk'):
                const apkArgs = userMessage.split(' ').slice(1);
                await apkCommand(sock, chatId, message, apkArgs);
                break;
            case cmd.startsWith('.gcstatus'):
                const statusArgs = userMessage.split(' ').slice(1);
                await gcstatus(sock, chatId, message, statusArgs);
                break;
            case cmd === '.save':
                await saveCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.creategc'):
                const gcArgs = userMessage.split(' ').slice(1);
                await creategc(sock, chatId, message, gcArgs);
                break;
            case cmd.startsWith('.bible'):
                const bibleArgs = userMessage.split(' ').slice(1);
                await bibleCommand(sock, chatId, message, bibleArgs);
                break;
            case cmd.startsWith('.add') || cmd.startsWith('.invite'):
                const addArgs = userMessage.split(' ').slice(1);
                await addCommand(sock, chatId, message, addArgs);
                break;
            case cmd.startsWith('.mediafire') || cmd.startsWith('.mf'):
                const mfArgs = userMessage.split(' ').slice(1);
                await mediafireCommand(sock, chatId, message, mfArgs);
                break;
            case cmd.startsWith('.status'):
                const statusArgs2 = userMessage.split(' ').slice(1);
                await statusCommand(sock, chatId, message, statusArgs2);
                break;
            case cmd.startsWith('.removebg') || cmd.startsWith('.rmbg') || cmd.startsWith('.nobg'):
                const removebgArgs = userMessage.split(' ').slice(1);
                await removebgCommand(sock, chatId, message, removebgArgs);
                break;
            case cmd.startsWith('.remini') || cmd.startsWith('.enhance'):
                const reminiArgs = userMessage.split(' ').slice(1);
                await reminiCommand(sock, chatId, message, reminiArgs);
                break;
            case cmd.startsWith('.sora'):
                await soraCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.analyze') || cmd.startsWith('.ocr'):
                const ocrArgs = userMessage.split(' ').slice(1);
                await analyzeCommand(sock, chatId, message, ocrArgs);
                break;
            case cmd.startsWith('.wallpaper') || cmd.startsWith('.wp'):
                const wpArgs = userMessage.split(' ').slice(1);
                await wallpaperCommand(sock, chatId, message, wpArgs);
                break;
            case cmd.startsWith('.suno') || cmd.startsWith('.aimusic'):
                const sunoArgs = userMessage.split(' ').slice(1);
                await sunoCommand(sock, chatId, message, sunoArgs);
                break;
            case cmd.startsWith('.exec') || cmd.startsWith('.terminal'):
                const termArgs = userMessage.split(' ').slice(1);
                await terminalCommand(sock, chatId, message, termArgs);
                break;
            case cmd === '.listgc' || cmd === '.groups':
                await listgcCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.broadcast'):
                const broadcastArgs = userMessage.split(' ').slice(1);
                await broadcastCommand(sock, chatId, message, broadcastArgs);
                break;
            case cmd.startsWith('.http'):
                const httpArgs = userMessage.split(' ').slice(1);
                await httpCommand(sock, chatId, message, httpArgs);
                break;
            case cmd.startsWith('.vcf') || cmd.startsWith('.export'):
                await vcfCommand(sock, chatId, message);
                break;
            // Misc commands
            case cmd.startsWith('.horny'): {
                const parts = userMessage.trim().split(/\s+/);
                const args = ['horny', ...parts.slice(1)];
                await miscCommand(sock, chatId, message, args);
                break;
            }
            case cmd.startsWith('.circle'): {
                const parts = userMessage.trim().split(/\s+/);
                const args = ['circle', ...parts.slice(1)];
                await miscCommand(sock, chatId, message, args);
                break;
            }
            case cmd.startsWith('.lgbt'): {
                const parts = userMessage.trim().split(/\s+/);
                const args = ['lgbt', ...parts.slice(1)];
                await miscCommand(sock, chatId, message, args);
                break;
            }
            case cmd.startsWith('.lolice'): {
                const parts = userMessage.trim().split(/\s+/);
                const args = ['lolice', ...parts.slice(1)];
                await miscCommand(sock, chatId, message, args);
                break;
            }
            case cmd.startsWith('.simpcard'): {
                const parts = userMessage.trim().split(/\s+/);
                const args = ['simpcard', ...parts.slice(1)];
                await miscCommand(sock, chatId, message, args);
                break;
            }
            case cmd.startsWith('.tonikawa'): {
                const parts = userMessage.trim().split(/\s+/);
                const args = ['tonikawa', ...parts.slice(1)];
                await miscCommand(sock, chatId, message, args);
                break;
            }
            case cmd.startsWith('.its-so-stupid'): {
                const parts = userMessage.trim().split(/\s+/);
                const args = ['its-so-stupid', ...parts.slice(1)];
                await miscCommand(sock, chatId, message, args);
                break;
            }
            case cmd.startsWith('.namecard'): {
                const parts = userMessage.trim().split(/\s+/);
                const args = ['namecard', ...parts.slice(1)];
                await miscCommand(sock, chatId, message, args);
                break;
            }
            case cmd.startsWith('.oogway2'):
            case cmd.startsWith('.oogway'): {
                const parts = userMessage.trim().split(/\s+/);
                const sub = userMessage.startsWith('.oogway2') ? 'oogway2' : 'oogway';
                const args = [sub, ...parts.slice(1)];
                await miscCommand(sock, chatId, message, args);
                break;
            }
            case cmd.startsWith('.tweet'): {
                const parts = userMessage.trim().split(/\s+/);
                const args = ['tweet', ...parts.slice(1)];
                await miscCommand(sock, chatId, message, args);
                break;
            }
            case cmd.startsWith('.ytcomment'): {
                const parts = userMessage.trim().split(/\s+/);
                const args = ['youtube-comment', ...parts.slice(1)];
                await miscCommand(sock, chatId, message, args);
                break;
            }
            case cmd.startsWith('.comrade'):
            case cmd.startsWith('.gay'):
            case cmd.startsWith('.glass'):
            case cmd.startsWith('.jail'):
            case cmd.startsWith('.passed'):
            case cmd.startsWith('.triggered'): {
                const parts = userMessage.trim().split(/\s+/);
                const sub = userMessage.slice(1).split(/\s+/)[0];
                const args = [sub, ...parts.slice(1)];
                await miscCommand(sock, chatId, message, args);
                break;
            }
            case cmd.startsWith('.animu'): {
                const parts = userMessage.trim().split(/\s+/);
                const args = parts.slice(1);
                await animeCommand(sock, chatId, message, args);
                break;
            }
            case cmd.startsWith('.nom'):
            case cmd.startsWith('.poke'):
            case cmd.startsWith('.cry'):
            case cmd.startsWith('.kiss'):
            case cmd.startsWith('.pat'):
            case cmd.startsWith('.hug'):
            case cmd.startsWith('.wink'):
            case cmd.startsWith('.facepalm'):
            case cmd.startsWith('.face-palm'):
            case cmd.startsWith('.animuquote'):
            case cmd.startsWith('.loli'): {
                const parts = userMessage.trim().split(/\s+/);
                let sub = parts[0].slice(1);
                if (sub === 'facepalm') sub = 'face-palm';
                if (sub === 'quote' || sub === 'animuquote') sub = 'quote';
                await animeCommand(sock, chatId, message, [sub]);
                break;
            }
            case cmd === '.crop':
                await stickercropCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case cmd.startsWith('.pies'): {
                const parts = rawText.trim().split(/\s+/);
                const args = parts.slice(1);
                await piesCommand(sock, chatId, message, args);
                commandExecuted = true;
                break;
            }
            case cmd === '.china':
                await piesAlias(sock, chatId, message, 'china');
                commandExecuted = true;
                break;
            case cmd === '.indonesia':
                await piesAlias(sock, chatId, message, 'indonesia');
                commandExecuted = true;
                break;
            case cmd === '.japan':
                await piesAlias(sock, chatId, message, 'japan');
                commandExecuted = true;
                break;
            case cmd === '.korea':
                await piesAlias(sock, chatId, message, 'korea');
                commandExecuted = true;
                break;
            case cmd === '.india':
                await piesAlias(sock, chatId, message, 'india');
                commandExecuted = true;
                break;
            case cmd === '.malaysia':
                await piesAlias(sock, chatId, message, 'malaysia');
                commandExecuted = true;
                break;
            case cmd === '.thailand':
                await piesAlias(sock, chatId, message, 'thailand');
                commandExecuted = true;
                break;
            case cmd.startsWith('.update'): {
                const parts = rawText.trim().split(/\s+/);
                const zipArg = parts[1] && parts[1].startsWith('http') ? parts[1] : '';
                await updateCommand(sock, chatId, message, zipArg);
                commandExecuted = true;
                break;
            }
            // Utility Commands
            case cmd.startsWith('.calc') || cmd.startsWith('.calculator'):
                await calculatorCommand(sock, chatId, message, userMessage.split(' ').slice(1).join(' '));
                break;
            case cmd.startsWith('.qr') || cmd.startsWith('.qrcode'):
                await qrCommand(sock, chatId, message, userMessage.split(' ').slice(1).join(' '));
                break;
            case cmd.startsWith('.profile') || cmd.startsWith('.dp') || cmd.startsWith('.pfp'):
                await profileCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.password') || cmd.startsWith('.pass') || cmd.startsWith('.pwgen'):
                await passwordCommand(sock, chatId, message, userMessage.split(' ').slice(1).join(' '));
                break;
            case cmd.startsWith('.flip') || cmd.startsWith('.coinflip') || cmd.startsWith('.coin'):
                await coinflipCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.dice'):
                await diceCommand(sock, chatId, message, userMessage.split(' ').slice(1).join(' '));
                break;
            case cmd.startsWith('.roll'):
                await rollCommand(sock, chatId, message, userMessage.split(' ').slice(1).join(' '));
                break;
            case cmd.startsWith('.morse'):
                await morseCommand(sock, chatId, message, userMessage.split(' ').slice(1).join(' '));
                break;
            case cmd.startsWith('.unmorse') || cmd.startsWith('.morsetotext'):
                await unmorseCommand(sock, chatId, message, userMessage.split(' ').slice(1).join(' '));
                break;
            case cmd.startsWith('.binary'):
                await binaryCommand(sock, chatId, message, userMessage.split(' ').slice(1).join(' '));
                break;
            case cmd.startsWith('.unbinary') || cmd.startsWith('.bintotext'):
                await unbinaryCommand(sock, chatId, message, userMessage.split(' ').slice(1).join(' '));
                break;
            case cmd.startsWith('.dadjoke') || cmd.startsWith('.joke'):
                await dadjokeCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.riddle'):
                await riddleCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.answer'):
                await riddleAnswerCommand(sock, chatId, message);
                break;
            case cmd.startsWith('.time') || cmd.startsWith('.worldtime') || cmd.startsWith('.timezone'):
                await timeCommand(sock, chatId, message, userMessage.split(' ').slice(1).join(' '));
                break;
            default:
                if (isGroup) {
                    if (userMessage) {
                        await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
                    }
                    await handleTagDetection(sock, chatId, message, senderId);
                    await handleMentionDetection(sock, chatId, message);
                }
                commandExecuted = false;
                break;
        }

        if (commandExecuted !== false) {
            await showTypingAfterCommand(sock, chatId);
        }

        if (userMessage.startsWith('.')) {
            await addCommandReaction(sock, message);
        }
    } catch (error) {
        console.error('❌ Error in message handler:', error.message);
        if (chatId) {
            await sock.sendMessage(chatId, { text: '❌ Failed to process command!', ...channelInfo });
        }
    }
}

async function handleGroupParticipantUpdate(sock, update) {
    try {
        const { id, participants, action, author } = update;
        if (!id.endsWith('@g.us')) return;

        let isPublic = true;
        try {
            const modeData = JSON.parse(fs.readFileSync('./data/messageCount.json'));
            if (typeof modeData.isPublic === 'boolean') isPublic = modeData.isPublic;
        } catch (e) {}

        if (action === 'promote') {
            if (!isPublic) return;
            await handlePromotionEvent(sock, id, participants, author);
            return;
        }

        if (action === 'demote') {
            if (!isPublic) return;
            await handleDemotionEvent(sock, id, participants, author);
            return;
        }

        if (action === 'add') {
            await handleJoinEvent(sock, id, participants);
        }

        if (action === 'remove') {
            await handleLeaveEvent(sock, id, participants);
        }
    } catch (error) {
        console.error('Error in handleGroupParticipantUpdate:', error);
    }
}

module.exports = {
    handleMessages,
    handleGroupParticipantUpdate,
    handleStatus: async (sock, status) => {
        await handleStatusUpdate(sock, status);
    }
};