/**██████╗  █████╗ ████████╗███╗   ███╗ █████╗ ███╗   ██╗    ███╗   ███╗██████╗ ",
* ██╔══██╗██╔══██╗╚══██╔══╝████╗ ████║██╔══██╗████╗  ██║    ████╗ ████║██╔══██╗",
* ██████╔╝███████║   ██║   ██╔████╔██║███████║██╔██╗ ██║    ██╔████╔██║██║  ██║",
* ██╔══██╗██╔══██║   ██║   ██║╚██╔╝██║██╔══██║██║╚██╗██║    ██║╚██╔╝██║██║  ██║",
* ██████╔╝██║  ██║   ██║   ██║ ╚═╝ ██║██║  ██║██║ ╚████║    ██║ ╚═╝ ██║██████╔╝",
*╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝    ╚═╝     ╚═╝╚═════╝
*/
// Batman-md A WhatsApp Bot
// Copyright (c) 2026 Nabees Tech 
// Website: https://nabees.online/
// This program is free software: you can redistribute it and/or modify It under the terms of the MIT License.
// Credits:
// Baileys Library by #adiwajshing


































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































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
const { demoteCommand } = require('./commands/demote');
const muteCommand = require('./commands/mute');
const unmuteCommand = require('./commands/unmute');
const stickerCommand = require('./commands/sticker');
const isAdmin = require('./lib/isAdmin');
const warnCommand = require('./commands/warn');
const warningsCommand = require('./commands/warnings');
const ttsCommand = require('./commands/tts');
const { tictactoeCommand, handleTicTacToeMove } = require('./commands/tictactoe');
const { incrementMessageCount, topMembers } = require('./commands/topmembers');
const ownerCommand = require('./commands/owner');
const deleteCommand = require('./commands/delete');
const { handleAntilinkCommand, handleLinkDetection } = require('./commands/antilink');
const { handleAntitagCommand, handleTagDetection } = require('./commands/antitag');
const { Antilink } = require('./lib/antilink');
const { handleMentionDetection, mentionToggleCommand, setMentionCommand } = require('./commands/mention');
const memeCommand = require('./commands/meme');
const tagCommand = require('./commands/tag');
const tagNotAdminCommand = require('./commands/tagnotadmin');
const hideTagCommand = require('./commands/hidetag');
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
const { lyricsCommand } = require('./commands/lyrics');
const { dareCommand } = require('./commands/dare');
const { truthCommand } = require('./commands/truth');
const { clearCommand } = require('./commands/clear');
const pingCommand = require('./commands/ping');
const aliveCommand = require('./commands/alive');
const blurCommand = require('./commands/img-blur');
const { welcomeCommand, handleJoinEvent } = require('./commands/welcome');
const { goodbyeCommand, handleLeaveEvent } = require('./commands/goodbye');
const githubCommand = require('./commands/github');
const { handleAntiBadwordCommand, handleBadwordDetection } = require('./lib/antibadword');
const antibadwordCommand = require('./commands/antibadword');
const { handleChatbotCommand, handleChatbotResponse } = require('./commands/chatbot');
const takeCommand = require('./commands/take');
const { flirtCommand } = require('./commands/flirt');
const characterCommand = require('./commands/character');
const wastedCommand = require('./commands/wasted');
const shipCommand = require('./commands/ship');
const groupInfoCommand = require('./commands/groupinfo');
const resetlinkCommand = require('./commands/resetlink');
const staffCommand = require('./commands/staff');
const unbanCommand = require('./commands/unban');
const emojimixCommand = require('./commands/emojimix');
const { handlePromotionEvent } = require('./commands/promote');
const { handleDemotionEvent } = require('./commands/demote');
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
const apkCommand = require('./commands/apk');
const channelCommand = require('./commands/channel'); // NEW CHANNEL COMMAND

// Restore all existing user bot sessions on startup
setTimeout(() => restoreExistingSessions(), 5000);

// Global settings — all values come from settings.js
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
            const chatId = message.key.remoteJid;

            if (buttonId === 'channel') {
                await sock.sendMessage(chatId, {
                    text: `📢 *Join our Channel:*\n${settings.channelLink}`
                }, { quoted: message });
                return;
            } else if (buttonId === 'owner') {
                const ownerCommand = require('./commands/owner');
                await ownerCommand(sock, chatId);
                return;
            } else if (buttonId === 'support') {
                await sock.sendMessage(chatId, {
                    text: `🔗 *Support*\n\nhttps://chat.whatsapp.com/GA4WrOFythU6g3BFVubYM7?mode=wwt`
                }, { quoted: message });
                return;
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

        // Get the current prefix from settings
        const currentPrefix = settings.prefix || '.';
        
        // Only log command usage
        if (userMessage.startsWith(currentPrefix)) {
            console.log(`📝 Command used in ${isGroup ? 'group' : 'private'}: ${userMessage}`);
        }
        
        // Read bot mode once; don't early-return so moderation can still run in private mode
        let isPublic = true;
        try {
            const data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
            if (typeof data.isPublic === 'boolean') isPublic = data.isPublic;
        } catch (error) {
            console.error('Error checking access mode:', error);
            // default isPublic=true on error
        }
        const isOwnerOrSudoCheck = message.key.fromMe || senderIsOwnerOrSudo;
        // Check if user is banned (skip ban check for unban command)
        if (isBanned(senderId) && !userMessage.startsWith(currentPrefix + 'unban')) {
            // Only respond occasionally to avoid spam
            if (Math.random() < 0.1) {
                await sock.sendMessage(chatId, {
                    text: '❌ You are banned from using the bot. Contact an admin to get unbanned.',
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

        // Check for bad words and antilink FIRST, before ANY other processing
        // Always run moderation in groups, regardless of mode
        if (isGroup) {
            if (userMessage) {
                await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
            }
            // Antilink checks message text internally, so run it even if userMessage is empty
            await Antilink(message, sock);
        }

        // PM blocker: block non-owner DMs when enabled (do not ban)
        if (!isGroup && !message.key.fromMe && !senderIsSudo) {
            try {
                const pmState = readPmBlockerState();
                if (pmState.enabled) {
                    // Inform user, delay, then block without banning globally
                    await sock.sendMessage(chatId, { text: pmState.message || 'Private messages are blocked. Please contact the owner in groups only.' });
                    await new Promise(r => setTimeout(r, 1500));
                    try { await sock.updateBlockStatus(chatId, 'block'); } catch (e) { }
                    return;
                }
            } catch (e) { }
        }

        // Then check for command prefix
        if (!userMessage.startsWith(currentPrefix)) {
            // Show typing indicator if autotyping is enabled
            await handleAutotypingForMessage(sock, chatId, userMessage);

            if (isGroup) {
                // Always run moderation features (antitag) regardless of mode
                await handleTagDetection(sock, chatId, message, senderId);
                await handleMentionDetection(sock, chatId, message);

                // Only run chatbot in public mode or for owner/sudo
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

        // Remove the prefix from the message for command processing
        const withoutPrefix = userMessage.slice(currentPrefix.length);
        
        // Split into command and args
        const parts = withoutPrefix.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1).join(' ');

        // List of admin commands (without prefix for checking)
        const adminCommands = ['mute', 'unmute', 'ban', 'unban', 'promote', 'demote', 'kick', 'tagall', 'tagnotadmin', 'hidetag', 'antilink', 'antitag', 'setgdesc', 'setgname', 'setgpp'];
        const isAdminCommand = adminCommands.includes(command);

        // List of owner commands (without prefix for checking)
        const ownerCommands = ['mode', 'autostatus', 'antidelete', 'cleartmp', 'setpp', 'clearsession', 'areact', 'autoreact', 'autotyping', 'autoread', 'pmblocker'];
        const isOwnerCommand = ownerCommands.includes(command);

        let isSenderAdmin = false;
        let isBotAdmin = false;

        // Check admin status only for admin commands in groups
        if (isGroup && isAdminCommand) {
            const adminStatus = await isAdmin(sock, chatId, senderId);
            isSenderAdmin = adminStatus.isSenderAdmin;
            isBotAdmin = adminStatus.isBotAdmin;

            if (!isBotAdmin) {
                await sock.sendMessage(chatId, { text: 'Please make the bot an admin to use admin commands.', ...channelInfo }, { quoted: message });
                return;
            }

            if (
                command === 'mute' ||
                command === 'unmute' ||
                command === 'ban' ||
                command === 'unban' ||
                command === 'promote' ||
                command === 'demote'
            ) {
                if (!isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, {
                        text: 'Sorry, only group admins can use this command.',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
            }
        }

        // Check owner status for owner commands
        if (isOwnerCommand) {
            if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                await sock.sendMessage(chatId, { text: '❌ This command is only available for the owner or sudo!' }, { quoted: message });
                return;
            }
        }

        // Command handlers - Execute commands immediately without waiting for typing indicator
        // We'll show typing indicator after command execution if needed
        let commandExecuted = false;

        switch (command) {
            case 'simage': {
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (quotedMessage?.stickerMessage) {
                    await simageCommand(sock, quotedMessage, chatId);
                } else {
                    await sock.sendMessage(chatId, { text: 'Please reply to a sticker with the .simage command to convert it.', ...channelInfo }, { quoted: message });
                }
                commandExecuted = true;
                break;
            }
            case 'kick':
                const mentionedJidListKick = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await kickCommand(sock, chatId, senderId, mentionedJidListKick, message);
                break;
            case 'mute':
                {
                    const muteArg = args;
                    const muteDuration = muteArg !== '' ? parseInt(muteArg, 10) : undefined;
                    if (muteArg !== '' && (isNaN(muteDuration) || muteDuration <= 0)) {
                        await sock.sendMessage(chatId, { text: 'Please provide a valid number of minutes or use .mute with no number to mute immediately.', ...channelInfo }, { quoted: message });
                    } else {
                        await muteCommand(sock, chatId, senderId, message, muteDuration);
                    }
                }
                break;
            case 'unmute':
                await unmuteCommand(sock, chatId, senderId);
                break;
            case 'ban':
                if (!isGroup) {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: 'Only owner/sudo can use .ban in private chat.' }, { quoted: message });
                        break;
                    }
                }
                await banCommand(sock, chatId, message);
                break;
            case 'unban':
                if (!isGroup) {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: 'Only owner/sudo can use .unban in private chat.' }, { quoted: message });
                        break;
                    }
                }
                await unbanCommand(sock, chatId, message);
                break;
            case 'help':
            case 'menu':
            case 'bot':
                await helpCommand(sock, chatId, message, global.channelLink);
                commandExecuted = true;
                break;
            case 'list':
                await listCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case 'sticker':
            case 's':
                await stickerCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case 'warnings':
                const mentionedJidListWarnings = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await warningsCommand(sock, chatId, mentionedJidListWarnings);
                break;
            case 'warn':
                const mentionedJidListWarn = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await warnCommand(sock, chatId, senderId, mentionedJidListWarn, message);
                break;
            case 'tts':
                await ttsCommand(sock, chatId, args, message);
                break;
            case 'delete':
            case 'del':
                await deleteCommand(sock, chatId, message, senderId);
                break;
            case 'attp':
                await attpCommand(sock, chatId, message);
                break;

            case 'settings':
                await settingsCommand(sock, chatId, message);
                break;
            case 'mode':
                // Check if sender is the owner
                if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                    await sock.sendMessage(chatId, { text: 'Only bot owner can use this command!', ...channelInfo }, { quoted: message });
                    return;
                }
                // Read current data first
                let data;
                try {
                    data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
                } catch (error) {
                    console.error('Error reading access mode:', error);
                    await sock.sendMessage(chatId, { text: 'Failed to read bot mode status', ...channelInfo });
                    return;
                }

                const action = args.toLowerCase();
                // If no argument provided, show current status
                if (!action) {
                    const currentMode = data.isPublic ? 'public' : 'private';
                    await sock.sendMessage(chatId, {
                        text: `Current bot mode: *${currentMode}*\n\nUsage: ${currentPrefix}mode public/private\n\nExample:\n${currentPrefix}mode public - Allow everyone to use bot\n${currentPrefix}mode private - Restrict to owner only`,
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }

                if (action !== 'public' && action !== 'private') {
                    await sock.sendMessage(chatId, {
                        text: `Usage: ${currentPrefix}mode public/private\n\nExample:\n${currentPrefix}mode public - Allow everyone to use bot\n${currentPrefix}mode private - Restrict to owner only`,
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }

                try {
                    // Update access mode
                    data.isPublic = action === 'public';

                    // Save updated data
                    fs.writeFileSync('./data/messageCount.json', JSON.stringify(data, null, 2));

                    await sock.sendMessage(chatId, { text: `Bot is now in *${action}* mode`, ...channelInfo });
                } catch (error) {
                    console.error('Error updating access mode:', error);
                    await sock.sendMessage(chatId, { text: 'Failed to update bot access mode', ...channelInfo });
                }
                break;
            case 'anticall':
                if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                    await sock.sendMessage(chatId, { text: 'Only owner/sudo can use anticall.' }, { quoted: message });
                    break;
                }
                {
                    await anticallCommand(sock, chatId, message, args);
                }
                break;
            case 'pmblocker':
                {
                    await pmblockerCommand(sock, chatId, message, args);
                }
                commandExecuted = true;
                break;
            case 'owner':
                await ownerCommand(sock, chatId);
                break;

            // ====== MULTI-SESSION PAIRING COMMAND ======
            case 'pair':
                {
                    await pairCommand(sock, chatId, message, args);
                }
                commandExecuted = true;
                break;

            // ====== SESSION MANAGER STATUS (owner only) ======
            case 'sessions':
                {
                    if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                        await sock.sendMessage(chatId, { text: '❌ Only the bot owner can view sessions.', ...channelInfo }, { quoted: message });
                        break;
                    }
                    const freeMB = getFreeDiskSpaceMB();
                    const slots = getAvailableSlots();
                    const existingSessions = getExistingSessionNumbers();
                    await sock.sendMessage(chatId, {
                        text: `📊 *Session Manager Status*\n\n` +
                              `💾 Free disk space: *${freeMB} MB*\n` +
                              `🆓 Available session slots: *${slots}*\n` +
                              `👥 Active sessions: *${existingSessions.length}*\n\n` +
                              `*Sessions:*\n${existingSessions.length > 0 ? existingSessions.map(n => `• ${n}`).join('\n') : 'None yet'}`,
                        ...channelInfo
                    }, { quoted: message });
                }
                commandExecuted = true;
                break;
            // =========================================

            case 'tagall':
                await tagAllCommand(sock, chatId, senderId, message);
                break;
            case 'tagnotadmin':
                await tagNotAdminCommand(sock, chatId, senderId, message);
                break;
            case 'hidetag':
                {
                    const messageText = rawText.slice(currentPrefix.length + 8).trim();
                    const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                    await hideTagCommand(sock, chatId, senderId, messageText, replyMessage, message);
                }
                break;
            case 'tag':
                const messageText = rawText.slice(currentPrefix.length + 4).trim();  // use rawText here
                const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                await tagCommand(sock, chatId, senderId, messageText, replyMessage, message);
                break;
            case 'antilink':
                if (!isGroup) {
                    await sock.sendMessage(chatId, {
                        text: 'This command can only be used in groups.',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, {
                        text: 'Please make the bot an admin first.',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
                await handleAntilinkCommand(sock, chatId, currentPrefix + command + ' ' + args, senderId, isSenderAdmin, message);
                break;
            case 'antitag':
                if (!isGroup) {
                    await sock.sendMessage(chatId, {
                        text: 'This command can only be used in groups.',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, {
                        text: 'Please make the bot an admin first.',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
                await handleAntitagCommand(sock, chatId, currentPrefix + command + ' ' + args, senderId, isSenderAdmin, message);
                break;
            case 'meme':
                await memeCommand(sock, chatId, message);
                break;
            case 'joke':
                await jokeCommand(sock, chatId, message);
                break;
            case 'quote':
                await quoteCommand(sock, chatId, message);
                break;
            case 'fact':
                await factCommand(sock, chatId, message, message);
                break;
            case 'weather':
                if (args) {
                    await weatherCommand(sock, chatId, message, args);
                } else {
                    await sock.sendMessage(chatId, { text: `Please specify a city, e.g., ${currentPrefix}weather London`, ...channelInfo }, { quoted: message });
                }
                break;
            case 'news':
                await newsCommand(sock, chatId);
                break;
            case 'ttt':
            case 'tictactoe':
                await tictactoeCommand(sock, chatId, senderId, args);
                break;
            case 'move':
                const position = parseInt(args);
                if (isNaN(position)) {
                    await sock.sendMessage(chatId, { text: 'Please provide a valid position number for Tic-Tac-Toe move.', ...channelInfo }, { quoted: message });
                } else {
                    // tictactoeMove function needed here
                }
                break;
            case 'topmembers':
                topMembers(sock, chatId, isGroup);
                break;
            case 'hangman':
                startHangman(sock, chatId);
                break;
            case 'guess':
                if (args) {
                    guessLetter(sock, chatId, args);
                } else {
                    sock.sendMessage(chatId, { text: 'Please guess a letter using .guess <letter>', ...channelInfo }, { quoted: message });
                }
                break;
            case 'trivia':
                startTrivia(sock, chatId);
                break;
            case 'answer':
                if (args) {
                    answerTrivia(sock, chatId, args);
                } else {
                    sock.sendMessage(chatId, { text: 'Please provide an answer using .answer <answer>', ...channelInfo }, { quoted: message });
                }
                break;
            case 'compliment':
                await complimentCommand(sock, chatId, message);
                break;
            case 'insult':
                await insultCommand(sock, chatId, message);
                break;
            case '8ball':
                await eightBallCommand(sock, chatId, args);
                break;
            case 'lyrics':
                await lyricsCommand(sock, chatId, args, message);
                break;
            case 'simp':
                const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await simpCommand(sock, chatId, quotedMsg, mentionedJid, senderId);
                break;
            case 'stupid':
            case 'itssostupid':
            case 'iss':
                const stupidQuotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const stupidMentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                const stupidArgs = args.split(' ');
                await stupidCommand(sock, chatId, stupidQuotedMsg, stupidMentionedJid, senderId, stupidArgs);
                break;
            case 'dare':
                await dareCommand(sock, chatId, message);
                break;
            case 'truth':
                await truthCommand(sock, chatId, message);
                break;
            case 'clear':
                if (isGroup) await clearCommand(sock, chatId);
                break;
            case 'promote':
                const mentionedJidListPromote = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await promoteCommand(sock, chatId, mentionedJidListPromote, message);
                break;
            case 'demote':
                const mentionedJidListDemote = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await demoteCommand(sock, chatId, mentionedJidListDemote, message);
                break;
            case 'ping':
                await pingCommand(sock, chatId, message);
                break;
            case 'alive':
                await aliveCommand(sock, chatId, message);
                break;
            case 'mention':
                {
                    const isOwner = message.key.fromMe || senderIsSudo;
                    await mentionToggleCommand(sock, chatId, message, args, isOwner);
                }
                break;
            case 'setmention':
                {
                    const isOwner = message.key.fromMe || senderIsSudo;
                    await setMentionCommand(sock, chatId, message, isOwner);
                }
                break;
            case 'blur':
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                await blurCommand(sock, chatId, message, quotedMessage);
                break;
            case 'welcome':
                if (isGroup) {
                    // Check admin status if not already checked
                    if (!isSenderAdmin) {
                        const adminStatus = await isAdmin(sock, chatId, senderId);
                        isSenderAdmin = adminStatus.isSenderAdmin;
                    }

                    if (isSenderAdmin || message.key.fromMe) {
                        await welcomeCommand(sock, chatId, message);
                    } else {
                        await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use this command.', ...channelInfo }, { quoted: message });
                    }
                } else {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                }
                break;
            case 'goodbye':
                if (isGroup) {
                    // Check admin status if not already checked
                    if (!isSenderAdmin) {
                        const adminStatus = await isAdmin(sock, chatId, senderId);
                        isSenderAdmin = adminStatus.isSenderAdmin;
                    }

                    if (isSenderAdmin || message.key.fromMe) {
                        await goodbyeCommand(sock, chatId, message);
                    } else {
                        await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use this command.', ...channelInfo }, { quoted: message });
                    }
                } else {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                }
                break;
            case 'gitclone':
                {
                    const gitMatch = rawText.slice(currentPrefix.length + 8).trim();
                    await gitcloneCommand(sock, chatId, message, gitMatch);
                }
                break;
            case 'git':
            case 'github':
            case 'sc':
            case 'script':
            case 'repo':
                await githubCommand(sock, chatId, message);
                break;
            case 'antibadword':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                    return;
                }

                const adminStatus = await isAdmin(sock, chatId, senderId);
                isSenderAdmin = adminStatus.isSenderAdmin;
                isBotAdmin = adminStatus.isBotAdmin;

                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, { text: '*Bot must be admin to use this feature*', ...channelInfo }, { quoted: message });
                    return;
                }

                await antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin);
                break;
            case 'chatbot':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                    return;
                }

                // Check if sender is admin or bot owner
                const chatbotAdminStatus = await isAdmin(sock, chatId, senderId);
                if (!chatbotAdminStatus.isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, { text: '*Only admins or bot owner can use this command*', ...channelInfo }, { quoted: message });
                    return;
                }

                await handleChatbotCommand(sock, chatId, message, args);
                break;
            case 'take':
            case 'steal':
                {
                    const isSteal = command === 'steal';
                    const takeArgs = args.split(' ');
                    await takeCommand(sock, chatId, message, takeArgs);
                }
                break;
            case 'flirt':
                await flirtCommand(sock, chatId, message);
                break;
            case 'character':
                await characterCommand(sock, chatId, message);
                break;
            case 'waste':
                await wastedCommand(sock, chatId, message);
                break;
            case 'ship':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message });
                    return;
                }
                await shipCommand(sock, chatId, message);
                break;
            case 'groupinfo':
            case 'infogp':
            case 'infogrupo':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message });
                    return;
                }
                await groupInfoCommand(sock, chatId, message);
                break;
            case 'resetlink':
            case 'revoke':
            case 'anularlink':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message });
                    return;
                }
                await resetlinkCommand(sock, chatId, senderId);
                break;
            case 'staff':
            case 'admins':
            case 'listadmin':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message });
                    return;
                }
                await staffCommand(sock, chatId, message);
                break;
            case 'tourl':
            case 'url':
                await urlCommand(sock, chatId, message);
                break;
            case 'emojimix':
            case 'emix':
                await emojimixCommand(sock, chatId, message);
                break;
            case 'tg':
            case 'stickertelegram':
            case 'tgsticker':
            case 'telesticker':
                await stickerTelegramCommand(sock, chatId, message);
                break;

            case 'vv':
                await viewOnceCommand(sock, chatId, message);
                break;
            case 'clearsession':
            case 'clearsesi':
                await clearSessionCommand(sock, chatId, message);
                break;
            case 'autostatus':
                const autoStatusArgs = args.split(' ');
                await autoStatusCommand(sock, chatId, message, autoStatusArgs);
                break;
            case 'metallic':
                await textmakerCommand(sock, chatId, message, currentPrefix + command + ' ' + args, 'metallic');
                break;
            case 'ice':
                await textmakerCommand(sock, chatId, message, currentPrefix + command + ' ' + args, 'ice');
                break;
            case 'snow':
                await textmakerCommand(sock, chatId, message, currentPrefix + command + ' ' + args, 'snow');
                break;
            case 'impressive':
                await textmakerCommand(sock, chatId, message, currentPrefix + command + ' ' + args, 'impressive');
                break;
            case 'matrix':
                await textmakerCommand(sock, chatId, message, currentPrefix + command + ' ' + args, 'matrix');
                break;
            case 'light':
                await textmakerCommand(sock, chatId, message, currentPrefix + command + ' ' + args, 'light');
                break;
            case 'neon':
                await textmakerCommand(sock, chatId, message, currentPrefix + command + ' ' + args, 'neon');
                break;
            case 'devil':
                await textmakerCommand(sock, chatId, message, currentPrefix + command + ' ' + args, 'devil');
                break;
            case 'purple':
                await textmakerCommand(sock, chatId, message, currentPrefix + command + ' ' + args, 'purple');
                break;
            case 'thunder':
                await textmakerCommand(sock, chatId, message, currentPrefix + command + ' ' + args, 'thunder');
                break;
            case 'leaves':
                await textmakerCommand(sock, chatId, message, currentPrefix + command + ' ' + args, 'leaves');
                break;
            case '1917':
                await textmakerCommand(sock, chatId, message, currentPrefix + command + ' ' + args, '1917');
                break;
            case 'arena':
                await textmakerCommand(sock, chatId, message, currentPrefix + command + ' ' + args, 'arena');
                break;
            case 'hacker':
                await textmakerCommand(sock, chatId, message, currentPrefix + command + ' ' + args, 'hacker');
                break;
            case 'sand':
                await textmakerCommand(sock, chatId, message, currentPrefix + command + ' ' + args, 'sand');
                break;
            case 'blackpink':
                await textmakerCommand(sock, chatId, message, currentPrefix + command + ' ' + args, 'blackpink');
                break;
            case 'glitch':
                await textmakerCommand(sock, chatId, message, currentPrefix + command + ' ' + args, 'glitch');
                break;
            case 'fire':
                await textmakerCommand(sock, chatId, message, currentPrefix + command + ' ' + args, 'fire');
                break;
            case 'antidelete':
                await handleAntideleteCommand(sock, chatId, message, args);
                break;
            case 'surrender':
                // Handle surrender command for tictactoe game
                await handleTicTacToeMove(sock, chatId, senderId, 'surrender');
                break;
            case 'cleartmp':
                await clearTmpCommand(sock, chatId, message);
                break;
            case 'setpp':
                await setProfilePicture(sock, chatId, message);
                break;
            case 'setgdesc':
                {
                    const text = rawText.slice(currentPrefix.length + 8).trim();
                    await setGroupDescription(sock, chatId, senderId, text, message);
                }
                break;
            case 'setgname':
                {
                    const text = rawText.slice(currentPrefix.length + 8).trim();
                    await setGroupName(sock, chatId, senderId, text, message);
                }
                break;
            case 'setgpp':
                await setGroupPhoto(sock, chatId, senderId, message);
                break;
            case 'instagram':
            case 'insta':
            case 'ig':
                await instagramCommand(sock, chatId, message);
                break;
            case 'igsc':
                await igsCommand(sock, chatId, message, true);
                break;
            case 'igs':
                await igsCommand(sock, chatId, message, false);
                break;
            case 'fb':
            case 'facebook':
                await facebookCommand(sock, chatId, message);
                break;
            case 'music':
                await playCommand(sock, chatId, message);
                break;
            case 'spotify':
                await spotifyCommand(sock, chatId, message);
                break;
            case 'play':
            case 'mp3':
            case 'ytmp3':
            case 'song':
                await songCommand(sock, chatId, message);
                break;
            case 'video':
            case 'ytmp4':
                await videoCommand(sock, chatId, message);
                break;
            case 'tiktok':
            case 'tt':
                await tiktokCommand(sock, chatId, message);
                break;
            case 'gpt':
            case 'gemini':
                await aiCommand(sock, chatId, message);
                break;
            case 'translate':
            case 'trt':
                await handleTranslateCommand(sock, chatId, message, args);
                return;
            case 'ss':
            case 'ssweb':
            case 'screenshot':
                await handleSsCommand(sock, chatId, message, args);
                break;
            case 'areact':
            case 'autoreact':
            case 'autoreaction':
                await handleAreactCommand(sock, chatId, message, isOwnerOrSudoCheck);
                break;
            case 'sudo':
                await sudoCommand(sock, chatId, message);
                break;
            case 'goodnight':
            case 'lovenight':
            case 'gn':
                await goodnightCommand(sock, chatId, message);
                break;
            case 'shayari':
            case 'shayri':
                await shayariCommand(sock, chatId, message);
                break;
            case 'roseday':
                await rosedayCommand(sock, chatId, message);
                break;
            case 'imagine':
            case 'flux':
            case 'dalle':
                await imagineCommand(sock, chatId, message);
                break;
            case 'jid':
                await groupJidCommand(sock, chatId, message);
                break;
            case 'autotyping':
                await autotypingCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case 'autoread':
                await autoreadCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case 'heart':
                await handleHeart(sock, chatId, message);
                break;
            case 'horny':
                {
                    const parts = args.trim().split(/\s+/);
                    const miscArgs = ['horny', ...parts.filter(p => p)];
                    await miscCommand(sock, chatId, message, miscArgs);
                }
                break;
            case 'circle':
                {
                    const parts = args.trim().split(/\s+/);
                    const miscArgs = ['circle', ...parts.filter(p => p)];
                    await miscCommand(sock, chatId, message, miscArgs);
                }
                break;
            case 'lgbt':
                {
                    const parts = args.trim().split(/\s+/);
                    const miscArgs = ['lgbt', ...parts.filter(p => p)];
                    await miscCommand(sock, chatId, message, miscArgs);
                }
                break;
            case 'lolice':
                {
                    const parts = args.trim().split(/\s+/);
                    const miscArgs = ['lolice', ...parts.filter(p => p)];
                    await miscCommand(sock, chatId, message, miscArgs);
                }
                break;
            case 'simpcard':
                {
                    const parts = args.trim().split(/\s+/);
                    const miscArgs = ['simpcard', ...parts.filter(p => p)];
                    await miscCommand(sock, chatId, message, miscArgs);
                }
                break;
            case 'tonikawa':
                {
                    const parts = args.trim().split(/\s+/);
                    const miscArgs = ['tonikawa', ...parts.filter(p => p)];
                    await miscCommand(sock, chatId, message, miscArgs);
                }
                break;
            case 'its-so-stupid':
                {
                    const parts = args.trim().split(/\s+/);
                    const miscArgs = ['its-so-stupid', ...parts.filter(p => p)];
                    await miscCommand(sock, chatId, message, miscArgs);
                }
                break;
            case 'namecard':
                {
                    const parts = args.trim().split(/\s+/);
                    const miscArgs = ['namecard', ...parts.filter(p => p)];
                    await miscCommand(sock, chatId, message, miscArgs);
                }
                break;

            case 'oogway2':
            case 'oogway':
                {
                    const parts = args.trim().split(/\s+/);
                    const sub = command === 'oogway2' ? 'oogway2' : 'oogway';
                    const miscArgs = [sub, ...parts.filter(p => p)];
                    await miscCommand(sock, chatId, message, miscArgs);
                }
                break;
            case 'tweet':
                {
                    const parts = args.trim().split(/\s+/);
                    const miscArgs = ['tweet', ...parts.filter(p => p)];
                    await miscCommand(sock, chatId, message, miscArgs);
                }
                break;
            case 'ytcomment':
                {
                    const parts = args.trim().split(/\s+/);
                    const miscArgs = ['youtube-comment', ...parts.filter(p => p)];
                    await miscCommand(sock, chatId, message, miscArgs);
                }
                break;
            case 'comrade':
            case 'gay':
            case 'glass':
            case 'jail':
            case 'passed':
            case 'triggered':
                {
                    const parts = args.trim().split(/\s+/);
                    const miscArgs = [command, ...parts.filter(p => p)];
                    await miscCommand(sock, chatId, message, miscArgs);
                }
                break;
            case 'animu':
                {
                    const parts = args.trim().split(/\s+/);
                    await animeCommand(sock, chatId, message, parts);
                }
                break;
            // animu aliases
            case 'nom':
            case 'poke':
            case 'cry':
            case 'kiss':
            case 'pat':
            case 'hug':
            case 'wink':
            case 'facepalm':
            case 'face-palm':
            case 'animuquote':
            case 'loli':
                {
                    let sub = command;
                    if (sub === 'facepalm') sub = 'face-palm';
                    if (sub === 'animuquote') sub = 'quote';
                    await animeCommand(sock, chatId, message, [sub]);
                }
                break;
            case 'crop':
                await stickercropCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case 'pies':
                {
                    const parts = rawText.trim().split(/\s+/);
                    const piesArgs = parts.slice(1);
                    await piesCommand(sock, chatId, message, piesArgs);
                    commandExecuted = true;
                }
                break;
            case 'china':
                await piesAlias(sock, chatId, message, 'china');
                commandExecuted = true;
                break;
            case 'indonesia':
                await piesAlias(sock, chatId, message, 'indonesia');
                commandExecuted = true;
                break;
            case 'japan':
                await piesAlias(sock, chatId, message, 'japan');
                commandExecuted = true;
                break;
            case 'korea':
                await piesAlias(sock, chatId, message, 'korea');
                commandExecuted = true;
                break;
            case 'india':
                await piesAlias(sock, chatId, message, 'india');
                commandExecuted = true;
                break;
            case 'malaysia':
                await piesAlias(sock, chatId, message, 'malaysia');
                commandExecuted = true;
                break;
            case 'thailand':
                await piesAlias(sock, chatId, message, 'thailand');
                commandExecuted = true;
                break;
            case 'update':
                {
                    const zipArg = args && args.startsWith('http') ? args : '';
                    await updateCommand(sock, chatId, message, zipArg);
                }
                commandExecuted = true;
                break;
            case 'removebg':
            case 'rmbg':
            case 'nobg':
                await removebgCommand.exec(sock, message, args.split(' '));
                break;
            case 'remini':
            case 'enhance':
            case 'upscale':
                await reminiCommand(sock, chatId, message, args.split(' '));
                break;
            case 'sora':
                await soraCommand(sock, chatId, message);
                break;

            // ── Utility Commands ────────────────────────────────────────────
            case 'calc':
            case 'calculator':
                await calculatorCommand(sock, chatId, message, args);
                break;
            case 'qr':
            case 'qrcode':
                await qrCommand(sock, chatId, message, args);
                break;
            case 'profile':
            case 'dp':
            case 'pfp':
                await profileCommand(sock, chatId, message);
                break;
            case 'password':
            case 'pass':
            case 'pwgen':
                await passwordCommand(sock, chatId, message, args);
                break;
            case 'flip':
            case 'coinflip':
            case 'coin':
                await coinflipCommand(sock, chatId, message);
                break;
            case 'dice':
                await diceCommand(sock, chatId, message, args);
                break;
            case 'roll':
                await rollCommand(sock, chatId, message, args);
                break;
            case 'morse':
                await morseCommand(sock, chatId, message, args);
                break;
            case 'unmorse':
            case 'morsetotext':
                await unmorseCommand(sock, chatId, message, args);
                break;
            case 'binary':
                await binaryCommand(sock, chatId, message, args);
                break;
            case 'unbinary':
            case 'bintotext':
                await unbinaryCommand(sock, chatId, message, args);
                break;
            case 'dadjoke':
                await dadjokeCommand(sock, chatId, message);
                break;
            case 'riddle':
                await riddleCommand(sock, chatId, message);
                break;
            case 'time':
            case 'worldtime':
            case 'timezone':
                await timeCommand(sock, chatId, message, args);
                break;

            // ── APK DOWNLOAD COMMAND ────────────────────────────────────────
            case 'apk':
                await apkCommand(sock, chatId, message);
                commandExecuted = true;
                break;

            // ── CHANNEL INFO COMMAND ────────────────────────────────────────
            case 'channel':
            case 'ch':
            case 'channelinfo':
                await channelCommand(sock, chatId, message, args);
                commandExecuted = true;
                break;

            default:
                if (isGroup) {
                    // Handle non-command group messages
                    if (userMessage) {  // Make sure there's a message
                        await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
                    }
                    await handleTagDetection(sock, chatId, message, senderId);
                    await handleMentionDetection(sock, chatId, message);
                }
                commandExecuted = false;
                break;
        }

        // If a command was executed, show typing status after command execution
        if (commandExecuted !== false) {
            // Command was executed, now show typing status after command execution
            await showTypingAfterCommand(sock, chatId);
        }

        // Function to handle .groupjid command
        async function groupJidCommand(sock, chatId, message) {
            const groupJid = message.key.remoteJid;

            if (!groupJid.endsWith('@g.us')) {
                return await sock.sendMessage(chatId, {
                    text: "❌ This command can only be used in a group."
                });
            }

            await sock.sendMessage(chatId, {
                text: `✅ Group JID: ${groupJid}`
            }, {
                quoted: message
            });
        }

        if (userMessage.startsWith(currentPrefix)) {
            // After command is processed successfully
            await addCommandReaction(sock, message);
        }
    } catch (error) {
        console.error('❌ Error in message handler:', error.message);
        // Only try to send error message if we have a valid chatId
        if (chatId) {
            await sock.sendMessage(chatId, {
                text: '❌ Failed to process command!',
                ...channelInfo
            });
        }
    }
}

async function handleGroupParticipantUpdate(sock, update) {
    try {
        const { id, participants, action, author } = update;

        // Check if it's a group
        if (!id.endsWith('@g.us')) return;

        // Respect bot mode: only announce promote/demote in public mode
        let isPublic = true;
        try {
            const modeData = JSON.parse(fs.readFileSync('./data/messageCount.json'));
            if (typeof modeData.isPublic === 'boolean') isPublic = modeData.isPublic;
        } catch (e) {
            // If reading fails, default to public behavior
        }

        // Handle promotion events
        if (action === 'promote') {
            if (!isPublic) return;
            await handlePromotionEvent(sock, id, participants, author);
            return;
        }

        // Handle demotion events
        if (action === 'demote') {
            if (!isPublic) return;
            await handleDemotionEvent(sock, id, participants, author);
            return;
        }

        // Handle join events
        if (action === 'add') {
            await handleJoinEvent(sock, id, participants);
        }

        // Handle leave events
        if (action === 'remove') {
            await handleLeaveEvent(sock, id, participants);
        }
    } catch (error) {
        console.error('Error in handleGroupParticipantUpdate:', error);
    }
}

// Instead, export the handlers along with handleMessages
module.exports = {
    handleMessages,
    handleGroupParticipantUpdate,
    handleStatus: async (sock, status) => {
        await handleStatusUpdate(sock, status);
    }
};
