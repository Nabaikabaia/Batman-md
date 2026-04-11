/**
 * Dad Joke / Riddle Command — Batman MD
 * Fetches a random dad joke from icanhazdadjoke.com (free, no key needed).
 * Also has a local riddle bank.
 * Usage: .dadjoke  |  .riddle
 */
const axios = require('axios');
const settings = require('../settings');

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

const RIDDLES = [
    { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", a: "An echo" },
    { q: "The more you take, the more you leave behind. What am I?", a: "Footsteps" },
    { q: "I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. What am I?", a: "A map" },
    { q: "What has hands but can't clap?", a: "A clock" },
    { q: "What gets wetter the more it dries?", a: "A towel" },
    { q: "I'm tall when I'm young and short when I'm old. What am I?", a: "A candle" },
    { q: "What has teeth but can't bite?", a: "A comb" },
    { q: "What runs but never walks, has a mouth but never talks?", a: "A river" },
    { q: "What can you catch but not throw?", a: "A cold" },
    { q: "What has one eye but can't see?", a: "A needle" },
    { q: "What begins with T, ends with T, and has T in it?", a: "A teapot" },
    { q: "I have no life, but I can die. What am I?", a: "A battery" },
];

async function dadjokeCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: '😄', key: message.key } });
        const res = await axios.get('https://icanhazdadjoke.com/', {
            headers: { Accept: 'application/json' },
            timeout: 7000,
        });
        const joke = res.data?.joke || 'Why don\'t scientists trust atoms? Because they make up everything!';
        await sock.sendMessage(chatId, {
            text: `*😄 Dad Joke*\n\n${joke}\n\n_😂 ba dum tss_`,
            ...channelInfo,
        }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: null, key: message.key } });
    } catch (_) {
        await sock.sendMessage(chatId, {
            text: `*😄 Dad Joke*\n\nI told my wife she was drawing her eyebrows too high. She looked surprised.\n\n_😂 ba dum tss_`,
            ...channelInfo,
        }, { quoted: message });
    }
}

const pendingRiddles = new Map();

async function riddleCommand(sock, chatId, message) {
    const riddle = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
    pendingRiddles.set(chatId, riddle.a);

    await sock.sendMessage(chatId, {
        text: `*🧩 Riddle Time!*\n\n❓ ${riddle.q}\n\n_Reply with your answer or type \`${settings.prefix || '.'}answer\` to reveal._`,
        ...channelInfo,
    }, { quoted: message });

    // Auto-reveal after 60 seconds
    setTimeout(() => {
        if (pendingRiddles.has(chatId)) {
            pendingRiddles.delete(chatId);
        }
    }, 60_000);
}

async function riddleAnswerCommand(sock, chatId, message) {
    const answer = pendingRiddles.get(chatId);
    if (!answer) {
        return sock.sendMessage(chatId, {
            text: `❌ No active riddle. Start one with \`${settings.prefix || '.'}riddle\``,
            ...channelInfo,
        }, { quoted: message });
    }
    pendingRiddles.delete(chatId);
    await sock.sendMessage(chatId, {
        text: `*🧩 Answer Revealed!*\n\n✅ The answer is: *${answer}*\n\n_Try another with \`${settings.prefix || '.'}riddle\`_`,
        ...channelInfo,
    }, { quoted: message });
}

module.exports = { dadjokeCommand, riddleCommand, riddleAnswerCommand };
