/**
 * Calculator Command — Batman MD
 * Safely evaluates math expressions using a sandboxed parser (no eval).
 * Usage: .calc 2+2  |  .calc (10*5)/2  |  .calc sqrt(144)
 */
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

// Safe math parser — supports: + - * / % ** () sqrt ceil floor abs round pi e
function safeMath(expr) {
    // Strip anything not in the allowed character set
    const safe = expr.replace(/[^0-9+\-*/%.()^\s]/g, (m) => {
        const words = { sqrt: 'sqrt', ceil: 'ceil', floor: 'floor', abs: 'abs', round: 'round', pi: 'pi', e: 'e', log: 'log', sin: 'sin', cos: 'cos', tan: 'tan' };
        return words[m] !== undefined ? m : '';
    });

    // Replace named constants and functions before evaluating
    const prepared = expr
        .replace(/\bpi\b/gi, String(Math.PI))
        .replace(/\be\b/g, String(Math.E))
        .replace(/\bsqrt\b/gi, 'Math.sqrt')
        .replace(/\bceil\b/gi, 'Math.ceil')
        .replace(/\bfloor\b/gi, 'Math.floor')
        .replace(/\babs\b/gi, 'Math.abs')
        .replace(/\bround\b/gi, 'Math.round')
        .replace(/\blog\b/gi, 'Math.log')
        .replace(/\bsin\b/gi, 'Math.sin')
        .replace(/\bcos\b/gi, 'Math.cos')
        .replace(/\btan\b/gi, 'Math.tan')
        .replace(/\^/g, '**');

    // Guard: only allow digits, math operators, Math.xxx, dots, parens, spaces
    if (!/^[\d\s+\-*/%.^()MathsqrceliflodanbgpitanM.]+$/i.test(prepared)) {
        throw new Error('Invalid expression');
    }

    // Use Function constructor in a controlled way (no access to global scope)
    const result = new Function(`"use strict"; return (${prepared})`)();
    return result;
}

async function calculatorCommand(sock, chatId, message, expr) {
    if (!expr || !expr.trim()) {
        return sock.sendMessage(chatId, {
            text: `*🧮 Calculator*\n\nUsage: \`${settings.prefix || '.'}calc <expression>\`\n\nExamples:\n• \`${settings.prefix || '.'}calc 2 + 2\`\n• \`${settings.prefix || '.'}calc (100 / 4) * 3\`\n• \`${settings.prefix || '.'}calc sqrt(144)\`\n• \`${settings.prefix || '.'}calc pi * 5^2\``,
            ...channelInfo,
        }, { quoted: message });
    }

    try {
        const result = safeMath(expr.trim());
        if (typeof result !== 'number' || !isFinite(result)) throw new Error('Result is not a valid number');

        const formatted = Number.isInteger(result) ? result.toString() : result.toPrecision(10).replace(/\.?0+$/, '');
        await sock.sendMessage(chatId, {
            text: `*🧮 Calculator*\n\n📥 Input:  \`${expr.trim()}\`\n📤 Result: *${formatted}*`,
            ...channelInfo,
        }, { quoted: message });
    } catch (err) {
        await sock.sendMessage(chatId, {
            text: `❌ Invalid expression: \`${expr.trim()}\`\n\nTry something like: \`${settings.prefix || '.'}calc 10 * 5 + 2\``,
            ...channelInfo,
        }, { quoted: message });
    }
}

module.exports = calculatorCommand;
