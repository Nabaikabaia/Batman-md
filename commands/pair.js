/**
 * Multi-Session Pairing Command for Batman MD
 * 
 * When a user sends ".pair", this command:
 *  1. Extracts the sender's WhatsApp number
 *  2. Checks storage limits dynamically
 *  3. Prevents duplicate sessions
 *  4. Creates a session folder under /sessions/<number>/
 *  5. Generates a real pairing code via Baileys requestPairingCode()
 *  6. Sends the code to the user
 *  7. After successful pairing, launches a child bot process for that user
 */
const path = require('path');
const fs = require('fs');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');

const {
    getAvailableSlots,
    sessionExists,
    createSessionFolder,
    deleteSessionFolder,
    launchUserBot,
    activeProcesses
} = require('../lib/sessionManager');

const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363367299421766@newsletter',
            newsletterName: 'BATMAN MD',
            serverMessageId: -1
        }
    }
};

// Track ongoing pairing attempts to prevent duplicates
const pairingInProgress = new Set();

/**
 * Extract a clean phone number from a WhatsApp JID
 * e.g. "2349049636843@s.whatsapp.net" -> "2349049636843"
 */
function extractNumberFromJid(jid) {
    if (!jid) return null;
    return jid.replace(/[^0-9]/g, '').replace(/:\d+$/, '');
}

/**
 * Main .pair command handler
 * Called with: .pair (no args needed — uses sender's own number)
 */
async function pairCommand(sock, chatId, message, q) {
    const senderId = message.key.participant || message.key.remoteJid;
    const senderNumber = extractNumberFromJid(senderId);

    if (!senderNumber || senderNumber.length < 7) {
        return await sock.sendMessage(chatId, {
            text: '❌ Could not determine your WhatsApp number. Please try again.',
            ...channelInfo
        }, { quoted: message });
    }

    // Prevent duplicate pairing attempts
    if (pairingInProgress.has(senderNumber)) {
        return await sock.sendMessage(chatId, {
            text: '⏳ A pairing request is already in progress for your number. Please wait...',
            ...channelInfo
        }, { quoted: message });
    }

    // Check if already paired and running
    if (activeProcesses.has(senderNumber)) {
        return await sock.sendMessage(chatId, {
            text: `✅ Your bot session (*${senderNumber}*) is already active and running!\n\nIf you want to re-pair, contact the bot owner.`,
            ...channelInfo
        }, { quoted: message });
    }

    // Check if session folder exists (already paired but maybe not running)
    if (sessionExists(senderNumber)) {
        const sessionPath = path.join(require('../lib/sessionManager').SESSIONS_DIR, senderNumber);
        const credsPath = path.join(sessionPath, 'creds.json');
        if (fs.existsSync(credsPath)) {
            // Session already exists, just restart the bot
            await sock.sendMessage(chatId, {
                text: `✅ Found an existing session for *${senderNumber}*. Restarting your bot...`,
                ...channelInfo
            }, { quoted: message });
            launchUserBot(senderNumber);
            return;
        }
    }

    // Check storage availability
    const availableSlots = getAvailableSlots();
    if (availableSlots <= 0) {
        return await sock.sendMessage(chatId, {
            text: '❌ Server storage is full. No new sessions can be created at this time. Please contact the bot owner.',
            ...channelInfo
        }, { quoted: message });
    }

    // Mark as in-progress
    pairingInProgress.add(senderNumber);

    try {
        // Create session folder
        const sessionPath = createSessionFolder(senderNumber);

        await sock.sendMessage(chatId, {
            text: `🔐 *Generating your pairing code...*\n\n📁 Session: \`${senderNumber}\`\n\nPlease wait a moment...`,
            ...channelInfo
        }, { quoted: message });

        // Set up auth state for the new session
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();

        // Create a temporary socket for this user's pairing
        const userSock = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' }))
            },
            printQRInTerminal: false,
            logger: pino({ level: 'fatal' }).child({ level: 'fatal' }),
            browser: ['Batman MD', 'Chrome', '120.0.0'],
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 30000,
            keepAliveIntervalMs: 10000,
            generateHighQualityLinkPreview: false,
            getMessage: async () => undefined
        });

        let pairingCodeSent = false;
        let connectionTimeout;

        // Request pairing code after connection is ready
        userSock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (!pairingCodeSent && !userSock.authState.creds.registered) {
                pairingCodeSent = true;
                try {
                    // Small delay to let socket stabilize
                    await new Promise(r => setTimeout(r, 3000));

                    const code = await userSock.requestPairingCode(senderNumber);
                    const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;

                    await sock.sendMessage(chatId, {
                        text: `✅ *Your Pairing Code:*\n\n` +
                              `🔢 \`${formattedCode}\`\n\n` +
                              `📱 *How to use:*\n` +
                              `1. Open WhatsApp on your phone\n` +
                              `2. Go to ⚙️ Settings → Linked Devices\n` +
                              `3. Tap "Link a Device"\n` +
                              `4. Select "Link with phone number instead"\n` +
                              `5. Enter the code above\n\n` +
                              `⏰ This code expires in a few minutes!`,
                        ...channelInfo
                    }, { quoted: message });

                    // Set timeout: if not connected in 3 minutes, clean up
                    connectionTimeout = setTimeout(async () => {
                        console.log(`[Pair] Timeout waiting for ${senderNumber} to pair`);
                        try { userSock.end(); } catch (_) {}
                        deleteSessionFolder(senderNumber);
                        pairingInProgress.delete(senderNumber);
                        await sock.sendMessage(chatId, {
                            text: `⏰ Pairing code for *${senderNumber}* expired. Please send *.pair* again to get a new code.`,
                            ...channelInfo
                        });
                    }, 3 * 60 * 1000);

                } catch (err) {
                    console.error('[Pair] Failed to get pairing code:', err.message);
                    pairingInProgress.delete(senderNumber);
                    deleteSessionFolder(senderNumber);
                    try { userSock.end(); } catch (_) {}
                    await sock.sendMessage(chatId, {
                        text: `❌ Failed to generate pairing code. Please try again.\n\nError: ${err.message}`,
                        ...channelInfo
                    }, { quoted: message });
                }
            }

            if (connection === 'open') {
                // User successfully paired
                clearTimeout(connectionTimeout);
                pairingInProgress.delete(senderNumber);
                console.log(`[SessionManager] User ${senderNumber} successfully paired!`);

                // Save credentials
                await saveCreds();

                // Close the temporary pairing socket
                setTimeout(() => {
                    try { userSock.end(); } catch (_) {}
                }, 2000);

                await sock.sendMessage(chatId, {
                    text: `🎉 *Pairing Successful!*\n\n✅ Your WhatsApp (*${senderNumber}*) is now linked!\n\n🤖 Your personal bot is starting up...\n\nYou can now use all bot commands with your own bot session!`,
                    ...channelInfo
                });

                // Launch the user's bot process
                setTimeout(() => {
                    launchUserBot(senderNumber);
                }, 3000);
            }

            if (connection === 'close') {
                const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
                const loggedOut = statusCode === DisconnectReason.loggedOut;

                if (loggedOut) {
                    clearTimeout(connectionTimeout);
                    pairingInProgress.delete(senderNumber);
                    deleteSessionFolder(senderNumber);
                    console.log(`[Pair] ${senderNumber} logged out during pairing`);
                }
            }
        });

        userSock.ev.on('creds.update', saveCreds);

    } catch (error) {
        pairingInProgress.delete(senderNumber);
        console.error('[Pair] Error in pairCommand:', error);
        await sock.sendMessage(chatId, {
            text: '❌ An error occurred while setting up your session. Please try again later.',
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = pairCommand;
