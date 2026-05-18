// commands/terminal.js
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');
const execPromise = util.promisify(exec);
const settings = require('../settings');

async function terminalCommand(sock, chatId, message, args) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const ownerNumber = settings.ownerNumber || '2349049636843';
        
        let senderNumber = '';
        
        if (message.key.fromMe) {
            senderNumber = ownerNumber;
        }
        
        if (!senderNumber) {
            const digits = senderId.match(/\d{10,15}/g);
            if (digits && digits.length > 0) {
                senderNumber = digits[0];
            }
        }
        
        const botNumber = sock.user.id.split(':')[0].replace(/[^0-9]/g, '');
        if (senderNumber === botNumber) {
            senderNumber = ownerNumber;
        }
        
        if (senderNumber !== ownerNumber && !message.key.fromMe) {
            await sock.sendMessage(chatId, { text: "❌ Owner only command." }, { quoted: message });
            return;
        }

        const fullCommand = args.join(' ');
        
        if (!fullCommand) {
            await sock.sendMessage(chatId, { 
                text: "💻 *Terminal*\n\n.exec <command>\n.exec get <filepath> - Send file from server\n\n📋 *Examples:*\n.exec ls -la\n.exec pm2 list\n.exec get ./session/creds.json"
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: "💻", key: message.key } });

        // ============ SEND FILE COMMAND ============
        if (fullCommand.startsWith('get ')) {
            const filePath = fullCommand.slice(4).trim();
            const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
            
            if (!fs.existsSync(fullPath)) {
                await sock.sendMessage(chatId, { text: `❌ File not found: ${fullPath}` }, { quoted: message });
                await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
                return;
            }
            
            const stat = fs.statSync(fullPath);
            const fileSizeMB = stat.size / 1024 / 1024;
            
            if (fileSizeMB > 100) {
                await sock.sendMessage(chatId, { text: `❌ File too large (${fileSizeMB.toFixed(2)}MB). Max 100MB.` }, { quoted: message });
                await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
                return;
            }
            
            await sock.sendMessage(chatId, { react: { text: "📤", key: message.key } });
            
            const ext = path.extname(fullPath).toLowerCase();
            let mimetype = 'application/octet-stream';
            if (['.jpg', '.jpeg'].includes(ext)) mimetype = 'image/jpeg';
            else if (ext === '.png') mimetype = 'image/png';
            else if (ext === '.mp4') mimetype = 'video/mp4';
            else if (ext === '.mp3') mimetype = 'audio/mpeg';
            else if (ext === '.json') mimetype = 'application/json';
            else if (ext === '.txt') mimetype = 'text/plain';
            else if (ext === '.js') mimetype = 'text/javascript';
            else if (ext === '.pdf') mimetype = 'application/pdf';
            else if (ext === '.zip') mimetype = 'application/zip';
            
            await sock.sendMessage(chatId, {
                document: { url: fullPath },
                fileName: path.basename(fullPath),
                mimetype: mimetype,
                caption: `📁 *${path.basename(fullPath)}*\n📊 ${fileSizeMB.toFixed(2)}MB\n📍 ${fullPath}`
            }, { quoted: message });
            
            await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
            return;
        }

        // ============ DANGEROUS COMMANDS BLOCK ============
        const dangerous = ['rm -rf', 'sudo', 'reboot', 'shutdown', 'mkfs', 'dd if=', 'chmod 777', 'kill -9'];
        for (const pattern of dangerous) {
            if (fullCommand.toLowerCase().includes(pattern)) {
                await sock.sendMessage(chatId, { text: "⛔ Blocked." }, { quoted: message });
                await sock.sendMessage(chatId, { react: { text: "⛔", key: message.key } });
                return;
            }
        }

        // ============ LS COMMAND WITH EMOJIS (folders first, alphabetical) ============
        if (fullCommand === 'ls' || (fullCommand.startsWith('ls ') && !fullCommand.includes('-l') && !fullCommand.includes('-a'))) {
            let targetPath = process.cwd();
            const parts = fullCommand.split(' ');
            if (parts.length > 1 && !parts[1].startsWith('-')) {
                targetPath = path.resolve(targetPath, parts[1]);
            }
            
            if (!fs.existsSync(targetPath)) {
                await sock.sendMessage(chatId, { text: `❌ Path not found: ${targetPath}` }, { quoted: message });
                await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
                return;
            }
            
            const items = fs.readdirSync(targetPath);
            const folders = [];
            const files = [];
            
            for (const item of items) {
                const itemPath = path.join(targetPath, item);
                try {
                    const stat = fs.statSync(itemPath);
                    if (stat.isDirectory()) {
                        folders.push(`📁 ${item}/`);
                    } else {
                        files.push(`📄 ${item}`);
                    }
                } catch (e) {}
            }
            
            folders.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
            files.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
            
            let output = '';
            if (folders.length) output += folders.join('\n');
            if (folders.length && files.length) output += '\n';
            if (files.length) output += files.join('\n');
            if (!output) output = '📂 Empty directory';
            
            await sock.sendMessage(chatId, {
                text: `💻 *${fullCommand}*\n\`\`\`\n${output}\n\`\`\``
            }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
            return;
        }
        
        // ============ REGULAR COMMAND EXECUTION ============
        try {
            const { stdout, stderr } = await execPromise(fullCommand, {
                timeout: 30000,
                maxBuffer: 10 * 1024 * 1024
            });
            
            let output = stdout || stderr;
            if (!output || output.trim() === '') output = '✅ Done';
            if (output.length > 4000) output = output.slice(0, 4000) + '\n\n📄 ... (truncated)';
            
            await sock.sendMessage(chatId, {
                text: `💻 *${fullCommand}*\n\`\`\`\n${output}\n\`\`\``
            }, { quoted: message });
            
            await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
            
        } catch (err) {
            let errorMsg = err.message;
            if (err.stderr) errorMsg = err.stderr;
            if (errorMsg.length > 4000) errorMsg = errorMsg.slice(0, 4000) + '\n\n📄 ... (truncated)';
            
            await sock.sendMessage(chatId, {
                text: `❌ *Error*\n\`\`\`\n${errorMsg}\n\`\`\``
            }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        }

    } catch (error) {
        console.error('Terminal error:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        await sock.sendMessage(chatId, { text: `❌ Terminal error: ${error.message}` }, { quoted: message });
    }
}

module.exports = terminalCommand;