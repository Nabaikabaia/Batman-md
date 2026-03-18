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
// FIX: Validate phone number
// ============================================
function isValidPhoneNumber(number) {
    const cleaned = formatPhoneNumber(number);
    // Basic validation: should be at least 10 digits
    return cleaned.length >= 10 && cleaned.length <= 15;
}

async function pairCommand(sock, chatId, message) {
    const senderId = message.key.participant || message.key.remoteJid;
    const senderNumber = extractNumber(senderId);

    if (!senderNumber || senderNumber.length < 7) {
        return sock.sendMessage(chatId, {
            text: '❌ Could not read your WhatsApp number. Please try again.',
            ...channelInfo,
        }, { quoted: message });
    }

    if (pairingInProgress.has(senderNumber)) {
        return sock.sendMessage(chatId, {
            text: '⏳ A pairing request is already in progress for your number. Please wait...',
            ...channelInfo,
        }, { quoted: message });
    }

    if (activeProcesses.has(senderNumber)) {
        return sock.sendMessage(chatId, {
            text: `✅ Your bot (*${senderNumber}*) is already active!\n\nContact the owner if you need to re-pair.`,
            ...channelInfo,
        }, { quoted: message });
    }

    // If session already has creds — just relaunch
    if (sessionExists(senderNumber)) {
        const credsPath = path.join(SESSIONS_DIR, senderNumber, 'creds.json');
        if (fs.existsSync(credsPath)) {
            await sock.sendMessage(chatId, {
                text: `✅ Existing session found for *${senderNumber}*. Restarting your bot...`,
                ...channelInfo,
            }, { quoted: message });
            launchUserBot(senderNumber);
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

    pairingInProgress.add(senderNumber);

    try {
        const sessionPath = createSessionFolder(senderNumber);
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();

        // ============================================
        // FIX: Get properly formatted phone number
        // ============================================
        let phoneToPair = senderNumber;
        
        // Ask user to confirm number if needed (optional improvement)
        // For now, just format it properly
        phoneToPair = formatPhoneNumber(senderNumber);
        
        // Validate the formatted number
        if (!isValidPhoneNumber(phoneToPair)) {
            pairingInProgress.delete(senderNumber);
            deleteSessionFolder(senderNumber);
            return sock.sendMessage(chatId, {
                text: `❌ Invalid phone number format: ${senderNumber}\n\nPlease provide a valid international number without + or spaces.\nExample: 6281234567890`,
                ...channelInfo,
            }, { quoted: message });
        }

        // Create a temporary socket for this user — same options as index.js
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

        // ── Request pairing code after 3 s (same delay as index.js) ─────────
        if (!userSock.authState.creds.registered) {
            await sock.sendMessage(chatId, {
                text: `⏳ Generating pairing code for *${phoneToPair}*...\nThis takes a few seconds.`,
                ...channelInfo,
            }, { quoted: message });

            // ============================================
            // FIX: Better error handling and code display
            // ============================================
            setTimeout(async () => {
                try {
                    // Log the number being used (for debugging)
                    console.log(`[Pair] Requesting code for: ${phoneToPair}`);
                    
                    let code = await userSock.requestPairingCode(phoneToPair);
                    code = code?.match(/.{1,4}/g)?.join('-') || code;

                    // Also log the code (for debugging)
                    console.log(`[Pair] Code generated for ${phoneToPair}: ${code}`);

                    await sock.sendMessage(chatId, {
                        text: `🔐 *BATMAN MD — Pairing Code*\n\n` +
                              `📱 *Number:* ${phoneToPair}\n` +
                              `🔑 *Code:* \`${code}\`\n\n` +
                              `📋 *Steps to link:*\n` +
                              `1️⃣ Open WhatsApp on your phone\n` +
                              `2️⃣ Go to *Settings → Linked Devices*\n` +
                              `3️⃣ Tap *"Link a Device"*\n` +
                              `4️⃣ Choose *"Link with phone number"*\n` +
                              `5️⃣ Enter this code: *${code}*\n\n` +
                              `⏰ Code expires in ~60 seconds\n\n` +
                              `⚠️ *Make sure you're using the exact same number: ${phoneToPair}*`,
                        ...channelInfo,
                    }, { quoted: message });

                    // Wait for successful connection or timeout
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
                        pairingInProgress.delete(senderNumber);
                        
                        await sock.sendMessage(chatId, {
                            text: `🎉 *Pairing Successful!*\n\n` +
                                  `✅ *${phoneToPair}* is now linked to BATMAN MD!\n` +
                                  `🤖 Your personal bot is starting up...\n\n` +
                                  `You can now use all bot commands in your own sessions!`,
                            ...channelInfo,
                        }, { quoted: message });

                        setTimeout(() => { try { userSock.end(); } catch (_) {} }, 2000);
                        setTimeout(() => launchUserBot(senderNumber), 3500);
                        
                    } catch (connError) {
                        // Pairing failed
                        pairingInProgress.delete(senderNumber);
                        deleteSessionFolder(senderNumber);
                        
                        await sock.sendMessage(chatId, {
                            text: `❌ *Pairing Failed*\n\n` +
                                  `The connection timed out or was cancelled.\n` +
                                  `Please try again and make sure you enter the code correctly.`,
                            ...channelInfo,
                        }, { quoted: message });
                    }

                } catch (err) {
                    pairingInProgress.delete(senderNumber);
                    console.error('[Pair] requestPairingCode failed:', err.message);
                    deleteSessionFolder(senderNumber);
                    
                    // Check for specific error messages
                    let errorMessage = 'Failed to generate pairing code.';
                    if (err.message.includes('rate')) {
                        errorMessage = 'Rate limited. Please wait a few minutes before trying again.';
                    } else if (err.message.includes('invalid')) {
                        errorMessage = `Invalid phone number format: ${phoneToPair}. Please check your number.`;
                    } else if (err.message.includes('timeout')) {
                        errorMessage = 'Connection timeout. Please try again.';
                    }
                    
                    await sock.sendMessage(chatId, {
                        text: `❌ ${errorMessage}\n\nPlease try again in a moment.`,
                        ...channelInfo,
                    }, { quoted: message });
                }
            }, 3000);
        }

        // Safety timeout — 2 minutes max
        setTimeout(() => {
            if (pairingInProgress.has(senderNumber)) {
                pairingInProgress.delete(senderNumber);
                try { userSock.end(); } catch (_) {}
                try { deleteSessionFolder(senderNumber); } catch (_) {}
                console.log(`[Pair] Timeout for ${senderNumber} — cleaned up.`);
            }
        }, 120_000);

    } catch (error) {
        pairingInProgress.delete(senderNumber);
        console.error('[Pair] Error:', error);
        try { deleteSessionFolder(senderNumber); } catch (_) {}
        await sock.sendMessage(chatId, {
            text: '❌ An error occurred while setting up your session. Please try again.',
            ...channelInfo,
        }, { quoted: message });
    }
}

module.exports = pairCommand;
