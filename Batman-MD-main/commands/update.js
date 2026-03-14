const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const settings = require('../settings');
const isOwnerOrSudo = require('../lib/isOwner');

// ============================================
// ENHANCEMENT: Quoted contact template
// ============================================
const quotedContact = {
  key: {
    fromMe: false,
    participant: `0@s.whatsapp.net`,
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "NABEES TECH",
      vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:BATMAN MD\nORG:BATMAN MD;\nTEL;type=CELL;type=VOICE;waid=+2347072182960:+2347072182960\nEND:VCARD"
    }
  }
};

// ============================================
// ENHANCEMENT: Newsletter channel info
// ============================================
const channelInfo = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363367299421766@newsletter',
            newsletterName: 'BATMAN MD',
            serverMessageId: 150
        }
    }
};

// ============================================
// ENHANCEMENT: Helper function for stylish messages
// ============================================
function formatUpdateMessage(title, content, type = 'info') {
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
        update: '🔄',
        github: '🐙',
        restart: '⚡',
        git: '🔰'
    };
    
    return `*『 ${emojis[type]} ${title} 』*
╭─────────⟢
${content}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
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

async function updateViaGit() {
    const oldRev = (await run('git rev-parse HEAD').catch(() => 'unknown')).trim();
    await run('git fetch --all --prune');
    const newRev = (await run('git rev-parse origin/main')).trim();
    const alreadyUpToDate = oldRev === newRev;
    const commits = alreadyUpToDate ? '' : await run(`git log --pretty=format:"%h %s (%an)" ${oldRev}..${newRev}`).catch(() => '');
    const files = alreadyUpToDate ? '' : await run(`git diff --name-status ${oldRev} ${newRev}`).catch(() => '');
    await run(`git reset --hard ${newRev}`);
    await run('git clean -fd');
    return { oldRev, newRev, alreadyUpToDate, commits, files };
}

function downloadFile(url, dest, visited = new Set()) {
    return new Promise((resolve, reject) => {
        try {
            // Avoid infinite redirect loops
            if (visited.has(url) || visited.size > 5) {
                return reject(new Error('Too many redirects'));
            }
            visited.add(url);

            const useHttps = url.startsWith('https://');
            const client = useHttps ? require('https') : require('http');
            const req = client.get(url, {
                headers: {
                    'User-Agent': 'Batmanmd-Updater/1.0',
                    'Accept': '*/*'
                }
            }, res => {
                // Handle redirects
                if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
                    const location = res.headers.location;
                    if (!location) return reject(new Error(`HTTP ${res.statusCode} without Location`));
                    const nextUrl = new URL(location, url).toString();
                    res.resume();
                    return downloadFile(nextUrl, dest, visited).then(resolve).catch(reject);
                }

                if (res.statusCode !== 200) {
                    return reject(new Error(`HTTP ${res.statusCode}`));
                }

                const file = fs.createWriteStream(dest);
                res.pipe(file);
                file.on('finish', () => file.close(resolve));
                file.on('error', err => {
                    try { file.close(() => {}); } catch {}
                    fs.unlink(dest, () => reject(err));
                });
            });
            req.on('error', err => {
                fs.unlink(dest, () => reject(err));
            });
        } catch (e) {
            reject(e);
        }
    });
}

async function extractZip(zipPath, outDir) {
    // Try to use platform tools; no extra npm modules required
    if (process.platform === 'win32') {
        const cmd = `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir.replace(/\\/g, '/')}' -Force"`;
        await run(cmd);
        return;
    }
    // Linux/mac: try unzip, else 7z, else busybox unzip
    try {
        await run('command -v unzip');
        await run(`unzip -o '${zipPath}' -d '${outDir}'`);
        return;
    } catch {}
    try {
        await run('command -v 7z');
        await run(`7z x -y '${zipPath}' -o'${outDir}'`);
        return;
    } catch {}
    try {
        await run('busybox unzip -h');
        await run(`busybox unzip -o '${zipPath}' -d '${outDir}'`);
        return;
    } catch {}
    throw new Error("No system unzip tool found (unzip/7z/busybox). Git mode is recommended on this panel.");
}

function copyRecursive(src, dest, ignore = [], relative = '', outList = []) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
        if (ignore.includes(entry)) continue;
        const s = path.join(src, entry);
        const d = path.join(dest, entry);
        const stat = fs.lstatSync(s);
        if (stat.isDirectory()) {
            copyRecursive(s, d, ignore, path.join(relative, entry), outList);
        } else {
            fs.copyFileSync(s, d);
            if (outList) outList.push(path.join(relative, entry).replace(/\\/g, '/'));
        }
    }
}

async function updateViaZip(sock, chatId, message, zipOverride) {
    const zipUrl = (zipOverride || settings.updateZipUrl || process.env.UPDATE_ZIP_URL || '').trim();
    if (!zipUrl) {
        throw new Error('No ZIP URL configured. Set settings.updateZipUrl or UPDATE_ZIP_URL env.');
    }
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const zipPath = path.join(tmpDir, 'update.zip');
    await downloadFile(zipUrl, zipPath);
    const extractTo = path.join(tmpDir, 'update_extract');
    if (fs.existsSync(extractTo)) fs.rmSync(extractTo, { recursive: true, force: true });
    await extractZip(zipPath, extractTo);

    // Find the top-level extracted folder (GitHub zips create REPO-branch folder)
    const [root] = fs.readdirSync(extractTo).map(n => path.join(extractTo, n));
    const srcRoot = fs.existsSync(root) && fs.lstatSync(root).isDirectory() ? root : extractTo;

    // Copy over while preserving runtime dirs/files
    const ignore = ['node_modules', '.git', 'session', 'tmp', 'tmp/', 'temp', 'data', 'baileys_store.json'];
    const copied = [];
    // Preserve ownerNumber from existing settings.js if present
    let preservedOwner = null;
    let preservedBotOwner = null;
    try {
        const currentSettings = require('../settings');
        preservedOwner = currentSettings && currentSettings.ownerNumber ? String(currentSettings.ownerNumber) : null;
        preservedBotOwner = currentSettings && currentSettings.botOwner ? String(currentSettings.botOwner) : null;
    } catch {}
    copyRecursive(srcRoot, process.cwd(), ignore, '', copied);
    if (preservedOwner) {
        try {
            const settingsPath = path.join(process.cwd(), 'settings.js');
            if (fs.existsSync(settingsPath)) {
                let text = fs.readFileSync(settingsPath, 'utf8');
                text = text.replace(/ownerNumber:\s*'[^']*'/, `ownerNumber: '${preservedOwner}'`);
                if (preservedBotOwner) {
                    text = text.replace(/botOwner:\s*'[^']*'/, `botOwner: '${preservedBotOwner}'`);
                }
                fs.writeFileSync(settingsPath, text);
            }
        } catch {}
    }
    // Cleanup extracted directory
    try { fs.rmSync(extractTo, { recursive: true, force: true }); } catch {}
    try { fs.rmSync(zipPath, { force: true }); } catch {}
    return { copiedFiles: copied };
}

async function restartProcess(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { 
            text: '✅ Update complete! Restarting…',
            ...channelInfo
        }, { quoted: quotedContact });
    } catch {}
    try {
        // Preferred: PM2
        await run('pm2 restart all');
        return;
    } catch {}
    // Panels usually auto-restart when the process exits.
    // Exit after a short delay to allow the above message to flush.
    setTimeout(() => {
        process.exit(0);
    }, 500);
}

async function updateCommand(sock, chatId, message, zipOverride) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
    
    if (!message.key.fromMe && !isOwner) {
        // ENHANCEMENT: Stylish owner-only message
        const ownerMsg = formatUpdateMessage(
            'OWNER ONLY',
            `│ 👑 Only bot owner or sudo\n│    can use the update command.`,
            'error'
        );
        await sock.sendMessage(chatId, { 
            text: ownerMsg,
            ...channelInfo
        }, { quoted: quotedContact });
        return;
    }
    try {
        // ENHANCEMENT: Stylish update start message
        const startMsg = formatUpdateMessage(
            'UPDATE STARTED',
            `│ 🔄 Updating the bot, please wait…\n│ ⏳ This may take a few moments.`,
            'update'
        );
        await sock.sendMessage(chatId, { 
            text: startMsg,
            ...channelInfo
        }, { quoted: quotedContact });
        
        if (await hasGitRepo()) {
            // silent
            const { oldRev, newRev, alreadyUpToDate, commits, files } = await updateViaGit();
            
            // ENHANCEMENT: Stylish git update message
            let content = '';
            if (alreadyUpToDate) {
                content = `│ ✅ Already up to date\n│ 🔰 *Version:* ${newRev.substring(0, 7)}`;
            } else {
                content = `│ ✅ Updated successfully\n│ 🔰 *Old:* ${oldRev.substring(0, 7)}\n│ 🔰 *New:* ${newRev.substring(0, 7)}`;
            }
            
            const gitMsg = formatUpdateMessage(
                alreadyUpToDate ? 'ALREADY UPDATED' : 'GIT UPDATE',
                content,
                alreadyUpToDate ? 'info' : 'success'
            );
            await sock.sendMessage(chatId, { 
                text: gitMsg,
                ...channelInfo
            }, { quoted: quotedContact });
            
            // silent
            await run('npm install --no-audit --no-fund');
        } else {
            const { copiedFiles } = await updateViaZip(sock, chatId, message, zipOverride);
            
            // ENHANCEMENT: Stylish zip update message
            const zipMsg = formatUpdateMessage(
                'ZIP UPDATE',
                `│ ✅ Update downloaded and extracted\n│ 📦 Files updated: ${copiedFiles.length || 'unknown'}`,
                'success'
            );
            await sock.sendMessage(chatId, { 
                text: zipMsg,
                ...channelInfo
            }, { quoted: quotedContact });
        }
        
        try {
            const v = require('../settings').version || '';
            const restartMsg = formatUpdateMessage(
                'RESTARTING',
                `│ ✅ Update complete!\n│ 🔄 Restarting bot to apply changes...\n│\n│ ⏳ Bot will restart in 5 seconds.`,
                'restart'
            );
            await sock.sendMessage(chatId, { 
                text: restartMsg,
                ...channelInfo
            }, { quoted: quotedContact });
        } catch {
            const fallbackMsg = formatUpdateMessage(
                'RESTARTING',
                `│ ✅ Restart completed successfully!\n│ 🔄 Type .ping to check latest version.`,
                'success'
            );
            await sock.sendMessage(chatId, { 
                text: fallbackMsg,
                ...channelInfo
            }, { quoted: quotedContact });
        }
        await restartProcess(sock, chatId, message);
    } catch (err) {
        console.error('Update failed:', err);
        
        // ENHANCEMENT: Stylish error message
        const errorMsg = formatUpdateMessage(
            'UPDATE FAILED',
            `│ ❌ Update failed:\n│ 🔧 ${String(err.message || err).substring(0, 100)}`,
            'error'
        );
        await sock.sendMessage(chatId, { 
            text: errorMsg,
            ...channelInfo
        }, { quoted: quotedContact });
    }
}

module.exports = updateCommand;