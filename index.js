/**
 * Knight Bot - A WhatsApp Bot
 * Copyright (c) 2024 Professor
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 * 
 * Credits:
 * - Baileys Library by @adiwajshing
 * - Pair Code implementation inspired by TechGod143 & DGXEON
 */
require('./settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
// Using a lightweight persisted store instead of makeInMemoryStore (compat across versions)
const pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics')
const { rmSync, existsSync } = require('fs')
const { join } = require('path')

// ========== NEWSLETTER CONFIGURATION ==========
const NEWSLETTER_JID = '120363367299421766@newsletter';
const NEWSLETTER_NAME = 'BATMAN MD';
const AUTO_FOLLOW_NEWSLETTER = true;  // Set to false to disable auto-follow
const AUTO_REACT_NEWSLETTER = true;   // Set to false to disable auto-reaction
const REACT_EMOJIS = ['🤖', '🔥', '💯', '❤️', '👍', '💫', '✨', '👏', '😎', '🚀', '⚡', '💥', '🌟', '💪'];
// =============================================

// Enhanced logger with beautiful formatting
const logger = {
    success: (msg) => console.log(chalk.green('✅ ') + chalk.greenBright(msg)),
    error: (msg) => console.log(chalk.red('❌ ') + chalk.redBright(msg)),
    warn: (msg) => console.log(chalk.yellow('⚠️ ') + chalk.yellowBright(msg)),
    info: (msg) => console.log(chalk.blue('ℹ️ ') + chalk.blueBright(msg)),
    debug: (msg) => console.log(chalk.gray('🔍 ') + chalk.gray(msg)),
    waiting: (msg) => console.log(chalk.cyan('⏳ ') + chalk.cyanBright(msg)),
    done: (msg) => console.log(chalk.green('✨ ') + chalk.greenBright(msg)),
    memory: (msg) => console.log(chalk.magenta('🧠 ') + chalk.magentaBright(msg)),
    connection: (msg) => console.log(chalk.yellow('🔌 ') + chalk.yellowBright(msg)),
    auth: (msg) => console.log(chalk.blue('🔐 ') + chalk.blueBright(msg)),
    star: (msg) => console.log(chalk.yellow('⭐ ') + chalk.yellowBright(msg)),
    rocket: (msg) => console.log(chalk.cyan('🚀 ') + chalk.cyanBright(msg)),
    heart: (msg) => console.log(chalk.red('❤️ ') + chalk.redBright(msg)),
    newsletter: (msg) => console.log(chalk.magenta('📰 ') + chalk.magentaBright(msg)),
    
    divider: (color = 'cyan', style = 'single') => {
        const colors = {
            cyan: chalk.cyan,
            green: chalk.green,
            yellow: chalk.yellow,
            red: chalk.red,
            blue: chalk.blue,
            magenta: chalk.magenta
        }
        const colorFunc = colors[color] || chalk.cyan
        const line = style === 'double' ? '═══════════════════════════════════════════════════════════' : '───────────────────────────────────────────────────────────'
        console.log(colorFunc(line))
    },
    
    // Special function for BATMAN MD banner
showBatmanBanner: () => {
    const colors = [chalk.red, chalk.yellow, chalk.green, chalk.cyan, chalk.blue, chalk.magenta]

    const banner = [
"██████╗  █████╗ ████████╗███╗   ███╗ █████╗ ███╗   ██╗    ███╗   ███╗██████╗ ",
"██╔══██╗██╔══██╗╚══██╔══╝████╗ ████║██╔══██╗████╗  ██║    ████╗ ████║██╔══██╗",
"██████╔╝███████║   ██║   ██╔████╔██║███████║██╔██╗ ██║    ██╔████╔██║██║  ██║",
"██╔══██╗██╔══██║   ██║   ██║╚██╔╝██║██╔══██║██║╚██╗██║    ██║╚██╔╝██║██║  ██║",
"██████╔╝██║  ██║   ██║   ██║ ╚═╝ ██║██║  ██║██║ ╚████║    ██║ ╚═╝ ██║██████╔╝",
"╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝    ╚═╝     ╚═╝╚═════╝ "
    ]
        
        console.log('')
        banner.forEach((line, index) => {
            // Apply gradient-like colors
            console.log(colors[index % colors.length](line))
        })
        console.log('')
        
        // Decorative line
        console.log(chalk.cyan('▰') + chalk.white('▱').repeat(60) + chalk.cyan('▰'))
        console.log(chalk.yellow('⚡') + chalk.white(' WhatsApp Multi-Device Bot ') + chalk.yellow('⚡'))
        console.log(chalk.cyan('▰') + chalk.white('▱').repeat(60) + chalk.cyan('▰'))
        console.log('')
    },
    
    // Info box with different styles
    infoBox: (title, content, color = 'cyan') => {
        const colors = {
            cyan: chalk.cyan,
            green: chalk.green,
            yellow: chalk.yellow,
            red: chalk.red,
            blue: chalk.blue,
            magenta: chalk.magenta
        }
        const colorFunc = colors[color] || chalk.cyan
        
        console.log(colorFunc('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'))
        console.log(colorFunc('┃ ') + chalk.bold.yellow(title.padEnd(54)) + colorFunc(' ┃'))
        console.log(colorFunc('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫'))
        
        if (Array.isArray(content)) {
            content.forEach(line => {
                console.log(colorFunc('┃ ') + line + ' '.repeat(Math.max(0, 56 - line.length)) + colorFunc(' ┃'))
            })
        } else {
            console.log(colorFunc('┃ ') + content + ' '.repeat(Math.max(0, 56 - content.length)) + colorFunc(' ┃'))
        }
        
        console.log(colorFunc('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'))
    },
    
    // Status line with icon
    statusLine: (icon, label, value, status = 'info') => {
        const statusColors = {
            success: chalk.green,
            error: chalk.red,
            warning: chalk.yellow,
            info: chalk.blue,
            highlight: chalk.magenta
        }
        const valueColor = statusColors[status] || chalk.white
        console.log(`${icon} ${chalk.yellow(label.padEnd(15))} : ${valueColor(value)}`)
    }
}

// ========== NEWSLETTER FUNCTIONS ==========
/**
 * Follow newsletter automatically
 * @param {Object} sock - WhatsApp socket
 */
async function followNewsletter(sock) {
    if (!AUTO_FOLLOW_NEWSLETTER) return;
    
    try {
        // Check if newsletterFollow method exists
        if (typeof sock.newsletterFollow === 'function') {
            logger.waiting(`📰 Attempting to follow newsletter: ${NEWSLETTER_JID}`)
            await sock.newsletterFollow(NEWSLETTER_JID);
            logger.success(`✅ Successfully followed newsletter: ${NEWSLETTER_NAME}`)
            
            // Try to get newsletter info
            try {
                if (typeof sock.newsletterInfo === 'function') {
                    const info = await sock.newsletterInfo(NEWSLETTER_JID);
                    if (info && info.name) {
                        logger.newsletter(`📰 Newsletter Name: ${info.name}`)
                    }
                }
            } catch (infoErr) {
                // Ignore info fetch errors
            }
        } else {
            logger.warn(`⚠️ newsletterFollow method not available in this Baileys version`)
        }
    } catch (err) {
        logger.error(`❌ Failed to follow newsletter: ${err.message}`)
    }
}

/**
 * Handle newsletter messages with auto-reaction
 * @param {Object} sock - WhatsApp socket
 * @param {Object} message - The message object
 * @param {Object} key - The message key
 */
async function handleNewsletterMessage(sock, message, key) {
    if (!AUTO_REACT_NEWSLETTER) return;
    
    try {
        // Select random emoji
        const randomEmoji = REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)];
        
        // Send reaction
        await sock.sendMessage(key.remoteJid, {
            react: {
                text: randomEmoji,
                key: key
            }
        });
        
        logger.newsletter(`✅ Auto-reacted with ${randomEmoji} to newsletter post`)
        
        // Small delay to avoid rate limiting
        await delay(500);
        
    } catch (err) {
        logger.error(`❌ Newsletter reaction failed: ${err.message}`)
    }
}
// ==========================================

// Import lightweight store
const store = require('./lib/lightweight_store')

// Initialize store
store.readFromFile()
const settings = require('./settings')
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

// Memory optimization - Force garbage collection if available
setInterval(() => {
    if (global.gc) {
        global.gc()
        logger.memory('🧹 Garbage collection completed')
    }
}, 60_000) // every 1 minute

// Memory monitoring - Restart if RAM gets too high
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 400) {
        logger.warn(`⚠️ RAM too high (${Math.round(used)}MB > 400MB), restarting bot...`)
        process.exit(1) // Panel will auto-restart
    } else {
        logger.debug(`📊 Memory usage: ${Math.round(used)}MB`)
    }
}, 30_000) // check every 30 seconds

let phoneNumber = "2349049636843"
let owner = JSON.parse(fs.readFileSync('./data/owner.json'))

global.botname = "BATMAN MD"
global.themeemoji = "•"
const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

// Only create readline interface if we're in an interactive environment
const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => {
    if (rl) {
        return new Promise((resolve) => rl.question(text, resolve))
    } else {
        // In non-interactive environment, use ownerNumber from settings
        return Promise.resolve(settings.ownerNumber || phoneNumber)
    }
}

async function startXeonBotInc() {
    try {
        let { version, isLatest } = await fetchLatestBaileysVersion()
        
        // Beautiful startup sequence
        console.clear()
        logger.showBatmanBanner()
        logger.divider('magenta', 'double')
        logger.rocket('Initializing BATMAN MD System...')
        logger.statusLine('📦', 'Baileys', version, isLatest ? 'success' : 'warning')
        
        // Support running as a user bot with a custom session folder (set by sessionManager via env)
        const sessionFolder = process.env.SESSION_FOLDER || path.join(process.cwd(), 'session');
        if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder, { recursive: true });
        const { state, saveCreds } = await useMultiFileAuthState(sessionFolder)
        const msgRetryCounterCache = new NodeCache()

        logger.waiting('🔄 Establishing secure connection to WhatsApp servers...')
        const XeonBotInc = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: !pairingCode,
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            getMessage: async (key) => {
                let jid = jidNormalizedUser(key.remoteJid)
                let msg = await store.loadMessage(jid, key.id)
                return msg?.message || ""
            },
            msgRetryCounterCache,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
        })

        // Save credentials when they update
        XeonBotInc.ev.on('creds.update', saveCreds)

    store.bind(XeonBotInc.ev)

    // Message handling
    XeonBotInc.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                logger.debug('📱 Status update received')
                await handleStatus(XeonBotInc, chatUpdate);
                return;
            }
            
            // ========== NEWSLETTER AUTO-REACTION ==========
            // Check if message is from our newsletter and auto-react
            if (mek.key && mek.key.remoteJid === NEWSLETTER_JID) {
                logger.newsletter(`📬 Newsletter message received from ${NEWSLETTER_NAME}`)
                await handleNewsletterMessage(XeonBotInc, mek.message, mek.key);
                // Continue processing if needed - uncomment next line if you want newsletter messages to be ignored as commands
                // return;
            }
            // ==============================================
            
            // In private mode, only block non-group messages (allow groups for moderation)
            // Note: XeonBotInc.public is not synced, so we check mode in main.js instead
            // This check is kept for backward compatibility but mainly blocks DMs
            if (!XeonBotInc.public && !mek.key.fromMe && chatUpdate.type === 'notify') {
                const isGroup = mek.key?.remoteJid?.endsWith('@g.us')
                if (!isGroup) {
                    logger.debug('🚫 Blocked DM in private mode')
                    return // Block DMs in private mode, but allow group messages
                }
            }
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return

            // Clear message retry cache to prevent memory bloat
            if (XeonBotInc?.msgRetryCounterCache) {
                XeonBotInc.msgRetryCounterCache.clear()
            }

            try {
                await handleMessages(XeonBotInc, chatUpdate, true)
            } catch (err) {
                logger.error(`❌ Error in handleMessages: ${err.message}`)
                // Only try to send error message if we have a valid chatId
                if (mek.key && mek.key.remoteJid) {
                    await XeonBotInc.sendMessage(mek.key.remoteJid, {
                        text: '❌ An error occurred while processing your message.',
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: NEWSLETTER_JID,
                                newsletterName: NEWSLETTER_NAME,
                                serverMessageId: -1
                            }
                        }
                    }).catch(console.error);
                }
            }
        } catch (err) {
            logger.error(`❌ Error in messages.upsert: ${err.message}`)
        }
    })

    // Add these event handlers for better functionality
    XeonBotInc.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    XeonBotInc.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = XeonBotInc.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    XeonBotInc.getName = (jid, withoutContact = false) => {
        id = XeonBotInc.decodeJid(jid)
        withoutContact = XeonBotInc.withoutContact || withoutContact
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = XeonBotInc.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === XeonBotInc.decodeJid(XeonBotInc.user.id) ?
            XeonBotInc.user :
            (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    XeonBotInc.public = true

    XeonBotInc.serializeM = (m) => smsg(XeonBotInc, m, store)

    // Handle pairing code
    if (pairingCode && !XeonBotInc.authState.creds.registered) {
        if (useMobile) throw new Error('Cannot use pairing code with mobile api')

        let phoneNumber
        if (!!global.phoneNumber) {
            phoneNumber = global.phoneNumber
        } else {
            phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`📱 Please type your WhatsApp number 😍\nFormat: 6281376552730 (without + or spaces) : `)))
        }

        // Clean the phone number - remove any non-digit characters
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

        // Validate the phone number using awesome-phonenumber
        const pn = require('awesome-phonenumber');
        if (!pn('+' + phoneNumber).isValid()) {
            logger.error('❌ Invalid phone number. Please enter your full international number (e.g., 15551234567 for US, 447911123456 for UK, etc.) without + or spaces.')
            process.exit(1);
        }

        setTimeout(async () => {
            try {
                logger.waiting('🔑 Requesting pairing code from WhatsApp...')
                let code = await XeonBotInc.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                
                // Display pairing code in a beautiful box
                logger.divider('green', 'double')
                logger.infoBox('🔐 PAIRING CODE', [
                    '',
                    chalk.bold.cyan('  ' + code.split('-').map(part => chalk.bgWhite.black(` ${part} `)).join(chalk.yellow(' - ')) + '  '),
                    '',
                    'Follow these steps:'
                ], 'green')
                
                logger.statusLine('1️⃣', 'Step 1', 'Open WhatsApp on your phone', 'info')
                logger.statusLine('2️⃣', 'Step 2', 'Settings > Linked Devices', 'highlight')
                logger.statusLine('3️⃣', 'Step 3', 'Tap "Link a Device"', 'success')
                logger.statusLine('4️⃣', 'Step 4', 'Enter this code:', 'warning')
                
                // Display code prominently
                console.log('')
                console.log(chalk.bgGreen.black(' '.repeat(15) + code.split('-').map(part => ` ${part} `).join(' - ') + ' '.repeat(15)))
                console.log('')
                
                logger.divider('green', 'double')
            } catch (error) {
                logger.error(`❌ Failed to get pairing code: ${error.message}`)
            }
        }, 3000)
    }

    // Connection handling
    XeonBotInc.ev.on('connection.update', async (s) => {
        const { connection, lastDisconnect, qr } = s
        
        if (qr) {
            logger.infoBox('📱 QR CODE', [
                '',
                'Please scan with your WhatsApp app',
                ''
            ], 'yellow')
        }
        
        if (connection === 'connecting') {
            logger.connection('🔄 Connecting to WhatsApp servers...')
        }
        
        if (connection == "open") {
            // Clear screen and show BATMAN MD banner
            console.clear()
            logger.showBatmanBanner()
            logger.success('✅ WhatsApp Connection Established Successfully!')
            
            // ========== AUTO-FOLLOW NEWSLETTER ON CONNECT ==========
            await followNewsletter(XeonBotInc);
            // =======================================================
            
            logger.divider('green', 'single')

            try {
                const botNumber = XeonBotInc.user.id.split(':')[0] + '@s.whatsapp.net';
                await XeonBotInc.sendMessage(botNumber, {
                    text: `🤖 *BATMAN MD Connected Successfully!*\n\n⏰ *Time:* ${new Date().toLocaleString()}\n✅ *Status:* Online and Ready!\n📰 *Newsletter:* ${AUTO_FOLLOW_NEWSLETTER ? 'Following ✅' : 'Not Following ❌'}\n🤖 *Auto-react:* ${AUTO_REACT_NEWSLETTER ? 'Enabled ✅' : 'Disabled ❌'}\n\n📢 *Join our channel for updates*`,
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: NEWSLETTER_JID,
                            newsletterName: NEWSLETTER_NAME,
                            serverMessageId: -1
                        }
                    }
                });
                logger.done('📨 Startup message sent to bot number')
            } catch (error) {
                logger.warn(`⚠️ Could not send startup message: ${error.message}`)
            }

            await delay(1999)
            
            // Display beautiful system information
            logger.infoBox('🚀 SYSTEM INFORMATION', [
                '',
                chalk.yellow('Bot Name:    ') + chalk.white(global.botname || 'KNIGHT BOT'),
                chalk.yellow('Version:     ') + chalk.white(settings.version),
                chalk.yellow('Owner:       ') + chalk.white(owner),
                chalk.yellow('Newsletter:  ') + (AUTO_FOLLOW_NEWSLETTER ? chalk.green('Following ✅') : chalk.red('Not Following ❌')),
                chalk.yellow('Auto-react:  ') + (AUTO_REACT_NEWSLETTER ? chalk.green('Enabled ✅') : chalk.red('Disabled ❌')),
                chalk.yellow('Status:      ') + chalk.green('● Online'),
                chalk.yellow('Memory:      ') + chalk.white(`${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`),
                chalk.yellow('Platform:    ') + chalk.white(process.platform),
                chalk.yellow('Node Version:') + chalk.white(process.version),
                ''
            ], 'cyan')
            
            logger.divider('magenta', 'single')
            
            // Creator credits
            logger.infoBox('👑 CREATOR INFORMATION', [
                '',
                chalk.yellow('Website:  ') + chalk.cyan('https://nabees.online'),
                chalk.yellow('GitHub:   ') + chalk.cyan('mrunqiuehacker'),
                chalk.yellow('WhatsApp: ') + chalk.cyan(owner),
                chalk.yellow('Creator:  ') + chalk.cyan('MR UNIQUE HACKER'),
                '',
                chalk.cyan('⚡ Powered by NABEES TECH ⚡'),
                ''
            ], 'magenta')
            
            logger.divider('green', 'double')
            logger.success('🎉 BATMAN MD is now fully operational!')
            logger.rocket('Ready to serve with maximum power!')
            logger.newsletter(`📰 Newsletter: ${NEWSLETTER_NAME} is ${AUTO_FOLLOW_NEWSLETTER ? 'followed' : 'not followed'}`)
            logger.heart('Made with love for the community')
            logger.divider('green', 'single')
        }
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut
            const statusCode = lastDisconnect?.error?.output?.statusCode
            
            logger.warn(`🔌 Connection closed: ${lastDisconnect?.error?.message || 'Unknown reason'}`)
            logger.statusLine('🔄', 'Reconnecting', shouldReconnect ? 'Yes' : 'No', shouldReconnect ? 'success' : 'error')
            
            if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                try {
                    rmSync(sessionFolder, { recursive: true, force: true })
                    logger.warn('🗑️ Session folder deleted due to logout.')
                } catch (error) {
                    logger.error(`❌ Error deleting session: ${error.message}`)
                }
                logger.error('🔐 Session logged out. Please re-authenticate.')
            }
            
            if (shouldReconnect) {
                logger.waiting('⏳ Attempting to reconnect in 5 seconds...')
                await delay(5000)
                startXeonBotInc()
            }
        }
    })

    // Track recently-notified callers to avoid spamming messages
    const antiCallNotified = new Set();

    // Anticall handler: block callers when enabled
    XeonBotInc.ev.on('call', async (calls) => {
        try {
            const { readState: readAnticallState } = require('./commands/anticall');
            const state = readAnticallState();
            if (!state.enabled) return;
            
            logger.warn(`📞 Incoming call detected, anti-call is enabled`)
            
            for (const call of calls) {
                const callerJid = call.from || call.peerJid || call.chatId;
                if (!callerJid) continue;
                try {
                    // First: attempt to reject the call if supported
                    try {
                        if (typeof XeonBotInc.rejectCall === 'function' && call.id) {
                            await XeonBotInc.rejectCall(call.id, callerJid);
                            logger.success('📵 Call rejected successfully')
                        } else if (typeof XeonBotInc.sendCallOfferAck === 'function' && call.id) {
                            await XeonBotInc.sendCallOfferAck(call.id, callerJid, 'reject');
                            logger.success('📵 Call rejected successfully')
                        }
                    } catch {}

                    // Notify the caller only once within a short window
                    if (!antiCallNotified.has(callerJid)) {
                        antiCallNotified.add(callerJid);
                        setTimeout(() => antiCallNotified.delete(callerJid), 60000);
                        await XeonBotInc.sendMessage(callerJid, { text: '📵 Anticall is enabled. Your call was rejected and you will be blocked.' });
                        logger.info(`📨 Notified caller: ${callerJid}`)
                    }
                } catch {}
                // Then: block after a short delay to ensure rejection and message are processed
                setTimeout(async () => {
                    try { 
                        await XeonBotInc.updateBlockStatus(callerJid, 'block'); 
                        logger.success(`🚫 Blocked caller: ${callerJid}`)
                    } catch {}
                }, 800);
            }
        } catch (e) {
            logger.error(`❌ Anti-call error: ${e.message}`)
        }
    });

    XeonBotInc.ev.on('group-participants.update', async (update) => {
        await handleGroupParticipantUpdate(XeonBotInc, update);
    });

    XeonBotInc.ev.on('messages.upsert', async (m) => {
        if (m.messages[0].key && m.messages[0].key.remoteJid === 'status@broadcast') {
            await handleStatus(XeonBotInc, m);
        }
    });

    XeonBotInc.ev.on('status.update', async (status) => {
        await handleStatus(XeonBotInc, status);
    });

    XeonBotInc.ev.on('messages.reaction', async (status) => {
        await handleStatus(XeonBotInc, status);
    });

    return XeonBotInc
    } catch (error) {
        logger.error(`❌ Fatal error in startXeonBotInc: ${error.message}`)
        await delay(5000)
        startXeonBotInc()
    }
}

// Display initial banner with animation effect
console.clear()
console.log(chalk.cyan('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'))
console.log(chalk.cyan('┃ ') + chalk.bold.yellow('                    BATMAN MD SYSTEM                          '.padEnd(56)) + chalk.cyan(' ┃'))
console.log(chalk.cyan('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫'))
console.log(chalk.cyan('┃ ') + chalk.white(' Initializing...'.padEnd(56)) + chalk.cyan(' ┃'))
console.log(chalk.cyan('┃ ') + chalk.white(` Time: ${new Date().toLocaleString()}`.padEnd(56)) + chalk.cyan(' ┃'))
console.log(chalk.cyan('┃ ') + chalk.white(' Made with ❤️ by NABEES TECH'.padEnd(56)) + chalk.cyan(' ┃'))
console.log(chalk.cyan('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'))
console.log('')

// Start the bot with error handling
startXeonBotInc().catch(error => {
    logger.error(`❌ Fatal error: ${error.message}`)
    process.exit(1)
})

process.on('uncaughtException', (err) => {
    logger.error(`❌ Uncaught Exception: ${err.message}`)
})

process.on('unhandledRejection', (err) => {
    logger.error(`❌ Unhandled Rejection: ${err.message}`)
})

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    logger.info(`🔄 File updated: ${__filename}`)
    delete require.cache[file]
    require(file)
})