/**
 * Multi-Session Pairing — Batman MD
 * Uses the same requestPairingCode() mechanism as index.js.
 */
const path = require('path');
const fs = require('fs');
const settings = require('../settings');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const PhoneNumber = require('awesome-phonenumber');

const {
    getAvailableSlots,
    sessionExists,
    createSessionFolder,
    deleteSessionFolder,
    launchUserBot,
    activeProcesses,
    SESSIONS_DIR,
} = require('../lib/sessionManager');

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

const pairingInProgress = new Set();

function extractNumber(jid) {
    if (!jid) return null;
    return jid.replace(/[^0-9]/g, '').replace(/:\d+$/, '');
}

// ============================================
// FIX: Proper phone number formatting
// ============================================
function formatPhoneNumber(number) {
    // Remove any non-digit characters
    let cleaned = number.replace(/[^0-9]/g, '');
    
    // If number starts with '0', remove it (WhatsApp needs international format without +)
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }
    
    return cleaned;
}

// ============================================
// FIX: Validate phone number - more lenient
// ============================================
function isValidPhoneNumber(number) {
    const cleaned = formatPhoneNumber(number);
    // Basic validation: should be between 9-15 digits (international numbers)
    return cleaned.length >= 9 && cleaned.length <= 15;
}

async function pairCommand(sock, chatId, message, args) {
    const senderId = message.key.participant || message.key.remoteJid;
    const senderNumber = extractNumber(senderId);

    // Get phone number from args or use sender's number
    let phoneToPair;
    
    if (args && args.trim()) {
        // User provided a number in the command
        phoneToPair = args.trim();
    } else {
        // Use the sender's number
        phoneToPair = senderNumber;
    }
    
    // Format and validate the number
    phoneToPair = formatPhoneNumber(phoneToPair);
    
    if (!isValidPhoneNumber(phoneToPair)) {
        return sock.sendMessage(chatId, {
            text: `❌ *Invalid Phone Number*\n\n` +
                  `Please provide a valid international number without + or spaces.\n\n` +
                  `*Examples:*\n` +
                  `• ${settings.prefix || '.'}pair 2347072182960\n` +
                  `• ${settings.prefix || '.'}pair 6281234567890\n` +
                  `• ${settings.prefix || '.'}pair 919876543210\n\n` +
                  `*Usage:* ${settings.prefix || '.'}pair <number>`,
            ...channelInfo,
        }, { quoted: message });
    }

    if (pairingInProgress.has(phoneToPair)) {
        return sock.sendMessage(chatId, {
            text: '⏳ A pairing request is already in progress for your number. Please wait...',
            ...channelInfo,
        }, { quoted: message });
    }

    if (activeProcesses.has(phoneToPair)) {
        return sock.sendMessage(chatId, {
            text: `✅ Your bot (*${phoneToPair}*) is already active!\n\nContact the owner if you need to re-pair.`,
            ...channelInfo,
        }, { quoted: message });
    }

    // If session already has creds — just relaunch
    if (sessionExists(phoneToPair)) {
        const credsPath = path.join(SESSIONS_DIR, phoneToPair, 'creds.json');
        if (fs.existsSync(credsPath)) {
            await sock.sendMessage(chatId, {
                text: `✅ Existing session found for *${phoneToPair}*. Restarting your bot...`,
                ...channelInfo,
            }, { quoted: message });
            launchUserBot(phoneToPair);
            return;
        }
    }

    const availableSlots = getAvailableSlots();
    if (availableSlots <= 0) {
        return sock.sendMessage(chatId, {
            text: '❌ Server storage is full. No new sessions can be created. Contact the bot owner.',
            ...channelInfo,
        }, { quoted: message });
    }

    pairingInProgress.add(phoneToPair);

    try {
        const sessionPath = createSessionFolder(phoneToPair);
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();

        // Log the number being used
        console.log(`[Pair] Pairing request for: ${phoneToPair}`);

        // Create a temporary socket for this user
        const userSock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            browser: ['Ubuntu', 'Chrome', '20.0.04'],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(
                    state.keys,
                    pino({ level: 'fatal' }).child({ level: 'fatal' })
                ),
            },
            markOnlineOnConnect: false,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
        });

        userSock.ev.on('creds.update', saveCreds);

        // Request pairing code
        if (!userSock.authState.creds.registered) {
            await sock.sendMessage(chatId, {
                text: `⏳ *Generating pairing code*\n\n📱 Number: +${phoneToPair}\n\nThis takes a few seconds...`,
                ...channelInfo,
            }, { quoted: message });

            setTimeout(async () => {
                try {
                    console.log(`[Pair] Requesting code for: ${phoneToPair}`);
                    
                    let code = await userSock.requestPairingCode(phoneToPair);
                    code = code?.match(/.{1,4}/g)?.join("-") || code;

                    console.log(`[Pair] Code generated for ${phoneToPair}: ${code}`);

                    // Beautiful pairing code message
                    const codeMessage = `╭━━⪨ 🔐 *PAIRING CODE* ⪩━━┈⊷
┃
┃ 📱 *Number:* +${phoneToPair}
┃ 🔑 *Code:* \`${code}\`
┃
┃ 📋 *Steps to link:*
┃
┃ 1️⃣ Open WhatsApp on your phone
┃ 2️⃣ Settings → Linked Devices
┃ 3️⃣ Tap "Link a Device"
┃ 4️⃣ Choose "Link with phone number"
┃ 5️⃣ Enter this code: *${code}*
┃
┃ ⏰ Code expires in ~60 seconds
┃
┃ ⚠️ *Make sure you're using: +${phoneToPair}*
╰━━━━━━━━━━━━━━━┈⊷

> *Powered by BATMAN MD*`;

                    await sock.sendMessage(chatId, {
                        text: codeMessage,
                        ...channelInfo,
                    }, { quoted: message });

                    // Wait for successful connection
                    const connectionPromise = new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            reject(new Error('Connection timeout'));
                        }, 60000);

                        userSock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
                            if (connection === 'open') {
                                clearTimeout(timeout);
                                resolve();
                            }
                            if (connection === 'close') {
                                const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
                                if (statusCode === DisconnectReason.loggedOut) {
                                    clearTimeout(timeout);
                                    reject(new Error('Logged out'));
                                }
                            }
                        });
                    });

                    try {
                        await connectionPromise;
                        // Pairing successful
                        pairingInProgress.delete(phoneToPair);
                        
                        const successMessage = `╭━━⪨ 🎉 *PAIRING SUCCESSFUL* ⪩━━┈⊷
┃
┃ ✅ *${phoneToPair}* is now linked!
┃ 🤖 Your personal bot is starting up...
┃
┃ You can now use all bot commands!
┃
┃ 💡 *Try:* ${settings.prefix || '.'}menu
╰━━━━━━━━━━━━━━━┈⊷

> *Powered by BATMAN MD*`;

                        await sock.sendMessage(chatId, {
                            text: successMessage,
                            ...channelInfo,
                        }, { quoted: message });

                        setTimeout(() => { try { userSock.end(); } catch (_) {} }, 2000);
                        setTimeout(() => launchUserBot(phoneToPair), 3500);
                        
                    } catch (connError) {
                        // Pairing failed
                        pairingInProgress.delete(phoneToPair);
                        deleteSessionFolder(phoneToPair);
                        
                        await sock.sendMessage(chatId, {
                            text: `❌ *Pairing Failed*\n\n` +
                                  `The connection timed out or was cancelled.\n` +
                                  `Please try again with: ${settings.prefix || '.'}pair ${phoneToPair}`,
                            ...channelInfo,
                        }, { quoted: message });
                    }

                } catch (err) {
                    pairingInProgress.delete(phoneToPair);
                    console.error('[Pair] requestPairingCode failed:', err.message);
                    deleteSessionFolder(phoneToPair);
                    
                    let errorMessage = 'Failed to generate pairing code.';
                    if (err.message.includes('rate')) {
                        errorMessage = 'Rate limited. Please wait a few minutes before trying again.';
                    } else if (err.message.includes('invalid')) {
                        errorMessage = `Invalid phone number: ${phoneToPair}. Please check your number.`;
                    } else if (err.message.includes('timeout')) {
                        errorMessage = 'Connection timeout. Please try again.';
                    } else if (err.message.includes('not-authorized')) {
                        errorMessage = 'This number may not have WhatsApp installed.';
                    }
                    
                    await sock.sendMessage(chatId, {
                        text: `❌ *Pairing Error*\n\n${errorMessage}\n\nPlease try again in a moment.`,
                        ...channelInfo,
                    }, { quoted: message });
                }
            }, 3000);
        }

        // Safety timeout — 2 minutes max
        setTimeout(() => {
            if (pairingInProgress.has(phoneToPair)) {
                pairingInProgress.delete(phoneToPair);
                try { userSock.end(); } catch (_) {}
                try { deleteSessionFolder(phoneToPair); } catch (_) {}
                console.log(`[Pair] Timeout for ${phoneToPair} — cleaned up.`);
            }
        }, 120_000);

    } catch (error) {
        pairingInProgress.delete(phoneToPair);
        console.error('[Pair] Error:', error);
        try { deleteSessionFolder(phoneToPair); } catch (_) {}
        await sock.sendMessage(chatId, {
            text: '❌ An error occurred while setting up your session. Please try again.',
            ...channelInfo,
        }, { quoted: message });
    }
}

module.exports = pairCommand;