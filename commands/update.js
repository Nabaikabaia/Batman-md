// commands/update.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const settings = require('../settings');

const newsletterContext = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363367299421766@newsletter',
            newsletterName: 'BATMAN MD',
            serverMessageId: 13
        }
    }
};

// Header style
const HDR_TOP = '┌❏';
const HDR_LINE = '├❏';
const HDR_BOTTOM = '└❏';

function formatHeader(title, lines) {
    let result = `${HDR_TOP} *${title}* ❏\n`;
    result += `│\n`;
    lines.forEach(line => {
        result += `${HDR_LINE} ${line}\n`;
    });
    result += `│\n`;
    result += `${HDR_BOTTOM} ❏`;
    return result;
}

function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
            if (err) return reject(new Error((stderr || stdout || err.message || '').toString()));
            resolve((stdout || '').toString());
        });
    });
}

async function hasGitRepo() {
    const gitDir = path.join(process.cwd(), '.git');
    if (!fs.existsSync(gitDir)) return false;
    try {
        await run('git --version');
        return true;
    } catch {
        return false;
    }
}

async function getCurrentVersion() {
    try {
        const pkgPath = path.join(process.cwd(), 'package.json');
        if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            return pkg.version || '1.0.0';
        }
    } catch (e) {}
    return settings.version || '1.0.0';
}

async function getLatestVersion() {
    try {
        const response = await axios.get('https://raw.githubusercontent.com/Nabaikabaia/Batman-md/main/package.json', {
            timeout: 10000,
            headers: { 'User-Agent': 'BATMAN-MD/1.0' }
        });
        return response.data.version || '1.0.0';
    } catch (e) {
        return null;
    }
}

async function getChangelog() {
    try {
        const response = await axios.get('https://raw.githubusercontent.com/Nabaikabaia/Batman-md/main/updates.md', {
            timeout: 10000
        });
        return response.data;
    } catch (e) {
        return null;
    }
}

async function performUpdate() {
    await run('git fetch --all --prune');
    const newRev = await run('git rev-parse origin/main');
    await run(`git reset --hard ${newRev.trim()}`);
    await run('git clean -fd');
    await run('npm install --no-audit --no-fund');
}

async function updateCommand(sock, chatId, message) {
    const senderId = message.key.participant || message.key.remoteJid;
    let senderNumber = senderId.split('@')[0].replace(/[^0-9]/g, '');
    const ownerNumber = settings.ownerNumber || '2349049636843';
    
    if (senderNumber !== ownerNumber && !message.key.fromMe) {
        await sock.sendMessage(chatId, { text: "❌ Owner only." }, { quoted: message });
        return;
    }

    // React: 🔄
    await sock.sendMessage(chatId, { react: { text: "🔄", key: message.key } });

    try {
        // Check if git repo exists
        if (!await hasGitRepo()) {
            const lines = [`❌ Not a git repository`, `Update via git clone only`];
            const msg = formatHeader('UPDATE FAILED', lines);
            await sock.sendMessage(chatId, { text: msg, ...newsletterContext }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
            return;
        }

        const currentVersion = await getCurrentVersion();
        const latestVersion = await getLatestVersion();
        
        if (!latestVersion) {
            const lines = [`❌ Could not fetch latest version`, `Check your internet connection`];
            const msg = formatHeader('UPDATE FAILED', lines);
            await sock.sendMessage(chatId, { text: msg, ...newsletterContext }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
            return;
        }
        
        if (currentVersion === latestVersion) {
            const lines = [`✅ Already up to date`, `Current version: v${currentVersion}`];
            const msg = formatHeader('UPDATE CHECK', lines);
            await sock.sendMessage(chatId, { text: msg, ...newsletterContext }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
            return;
        }
        
        // Get and show changelog
        const changelog = await getChangelog();
        
        if (changelog) {
            // Extract latest version changes
            const lines = changelog.split('\n');
            let changelogLines = [`📢 *New Update Available!*`, ``, `v${currentVersion} → v${latestVersion}`, ``];
            let found = false;
            for (const line of lines) {
                if (line.includes(`v${latestVersion}`)) {
                    found = true;
                    continue;
                }
                if (found) {
                    if (line.startsWith('##') || line.startsWith('---')) break;
                    if (line.trim() && !line.startsWith('#')) {
                        changelogLines.push(line);
                    }
                }
            }
            if (changelogLines.length === 4) {
                changelogLines.push(`- Update available`);
            }
            
            const msg = formatHeader('UPDATE AVAILABLE', changelogLines.slice(0, 15));
            await sock.sendMessage(chatId, { text: msg, ...newsletterContext }, { quoted: message });
        }
        
        // Perform update
        await sock.sendMessage(chatId, { 
            text: `🔄 *Updating to v${latestVersion}...*\n\nPlease wait, bot will restart automatically.`,
            ...newsletterContext
        }, { quoted: message });
        
        await performUpdate();
        
        const restartLines = [`✅ *Update Complete!*`, `📦 Version: ${latestVersion}`, `🔄 Bot restarting...`];
        const restartMsg = formatHeader('UPDATE SUCCESS', restartLines);
        await sock.sendMessage(chatId, { text: restartMsg, ...newsletterContext }, { quoted: message });
        
        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
        
        // Restart after 2 seconds
        setTimeout(() => process.exit(0), 2000);
        
    } catch (err) {
        console.error('Update failed:', err);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        const errorLines = [`❌ Update failed`, `🔧 ${err.message.substring(0, 100)}`];
        const errorMsg = formatHeader('UPDATE FAILED', errorLines);
        await sock.sendMessage(chatId, { text: errorMsg, ...newsletterContext }, { quoted: message });
    }
}

module.exports = updateCommand;
