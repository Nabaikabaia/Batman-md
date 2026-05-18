// commands/http.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

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

const MAX_TEXT_LENGTH = 3500;

async function httpCommand(sock, chatId, message, args) {
    try {
        if (args.length < 2) {
            await sock.sendMessage(chatId, { 
                text: "🌐 *HTTP Request Tool*\n\n*Methods:* GET, POST, PUT, DELETE, PATCH\n\n*Usage:*\n.http <method> <url>\n\n*With Headers:*\n.http <method> <url> -H \"Header: value\"\n\n*Examples:*\n.http get https://api.github.com/users/nabaikabaia\n.http get \"https://api.example.com/data?param=value\"\n.http post https://httpbin.org/post {\"name\":\"BATMAN MD\"}"
            }, { quoted: message });
            return;
        }

        let method = args[0].toLowerCase();
        
        // Find the URL - it could be the second argument or might contain spaces if wrapped in quotes
        let url = null;
        let urlStartIndex = 1;
        
        // Check if URL is wrapped in quotes (starts with " or ')
        if (args[1] && (args[1].startsWith('"') || args[1].startsWith("'"))) {
            // Find the closing quote by joining subsequent args
            let urlParts = [];
            let foundClosing = false;
            for (let i = 1; i < args.length; i++) {
                urlParts.push(args[i]);
                if (args[i].endsWith('"') || args[i].endsWith("'")) {
                    urlStartIndex = i + 1;
                    foundClosing = true;
                    break;
                }
            }
            if (foundClosing) {
                url = urlParts.join(' ').replace(/^["']|["']$/g, '');
            }
        }
        
        // If not wrapped in quotes, the URL is just the second argument
        if (!url) {
            url = args[1];
            urlStartIndex = 2;
        }
        
        if (!url || !url.startsWith('http')) {
            await sock.sendMessage(chatId, { text: "❌ Invalid URL. Must start with http:// or https://" }, { quoted: message });
            return;
        }
        
        let bodyData = null;
        let customHeaders = {};
        let currentArg = urlStartIndex;
        
        // Parse remaining arguments for headers and body
        while (currentArg < args.length) {
            const arg = args[currentArg];
            
            if (arg === '-H' && currentArg + 1 < args.length) {
                const headerStr = args[currentArg + 1];
                const colonIndex = headerStr.indexOf(':');
                if (colonIndex > 0) {
                    const key = headerStr.substring(0, colonIndex).trim();
                    const value = headerStr.substring(colonIndex + 1).trim();
                    customHeaders[key] = value;
                }
                currentArg += 2;
            }
            else if (arg === '-B' && currentArg + 1 < args.length) {
                const token = args[currentArg + 1];
                customHeaders['Authorization'] = `Bearer ${token}`;
                currentArg += 2;
            }
            else if (arg === '-K' && currentArg + 1 < args.length) {
                const apiKey = args[currentArg + 1];
                customHeaders['X-API-Key'] = apiKey;
                currentArg += 2;
            }
            else if (arg === '-A' && currentArg + 1 < args.length) {
                const authStr = args[currentArg + 1];
                const encoded = Buffer.from(authStr).toString('base64');
                customHeaders['Authorization'] = `Basic ${encoded}`;
                currentArg += 2;
            }
            else if (!arg.startsWith('-')) {
                try {
                    bodyData = JSON.parse(arg);
                    currentArg++;
                } catch (e) {
                    currentArg++;
                }
            } else {
                currentArg++;
            }
        }
        
        const validMethods = ['get', 'post', 'put', 'delete', 'patch'];
        if (!validMethods.includes(method)) {
            await sock.sendMessage(chatId, { text: "❌ Unsupported method. Use: get, post, put, delete, patch" }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: "🌐", key: message.key } });

        const defaultHeaders = {
            'User-Agent': 'BATMAN-MD/1.0',
            'Accept': 'application/json, text/plain, */*'
        };
        
        const headers = { ...defaultHeaders, ...customHeaders };
        
        if (['post', 'put', 'patch'].includes(method) && bodyData && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
        
        const config = {
            method: method,
            url: url,
            headers: headers,
            timeout: 60000,
            validateStatus: status => status >= 200 && status < 500
        };
        
        if (bodyData && ['post', 'put', 'patch'].includes(method)) {
            config.data = bodyData;
        }
        
        const startTime = Date.now();
        const response = await axios(config);
        const responseTime = Date.now() - startTime;
        
        let responseStr = typeof response.data === 'object' 
            ? JSON.stringify(response.data, null, 2) 
            : String(response.data);
        
        // Build header info
        let headerInfo = `🌐 *${method.toUpperCase()} Request*\n📡 URL: ${url}\n📊 Status: ${response.status}\n⏱️ Time: ${responseTime}ms\n`;
        
        if (Object.keys(customHeaders).length > 0) {
            headerInfo += `🔐 *Headers:*\n`;
            for (const [key, value] of Object.entries(customHeaders)) {
                const maskedValue = key.toLowerCase().includes('authorization') || key.toLowerCase().includes('api-key')
                    ? value.slice(0, 10) + '...' 
                    : value;
                headerInfo += `   ${key}: ${maskedValue}\n`;
            }
        }
        
        // Check if response is too long
        if (responseStr.length > MAX_TEXT_LENGTH) {
            const tmpDir = path.join(process.cwd(), 'tmp');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
            
            const fileName = `response_${Date.now()}.json`;
            const filePath = path.join(tmpDir, fileName);
            
            const fileContent = `${headerInfo}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📦 *RESPONSE BODY:*\n\n${responseStr}`;
            fs.writeFileSync(filePath, fileContent);
            
            await sock.sendMessage(chatId, { 
                text: `${headerInfo}\n\n📁 *Response too large, sending as file:*`,
                ...newsletterContext
            }, { quoted: message });
            
            await sock.sendMessage(chatId, {
                document: fs.readFileSync(filePath),
                mimetype: 'application/json',
                fileName: `response_${method}_${Date.now()}.json`,
                caption: `📦 *Response saved*\n📊 Size: ${(responseStr.length / 1024).toFixed(1)}KB`,
                ...newsletterContext
            }, { quoted: message });
            
            fs.unlinkSync(filePath);
        } else {
            let output = `${headerInfo}\n\n📦 *Response:*\n\`\`\`json\n${responseStr}\n\`\`\``;
            
            if (output.length > 4000) {
                const tmpDir = path.join(process.cwd(), 'tmp');
                if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
                
                const fileName = `response_${Date.now()}.json`;
                const filePath = path.join(tmpDir, fileName);
                fs.writeFileSync(filePath, `${headerInfo}\n\n${responseStr}`);
                
                await sock.sendMessage(chatId, {
                    document: fs.readFileSync(filePath),
                    mimetype: 'application/json',
                    fileName: `response_${method}_${Date.now()}.json`,
                    caption: `📦 *API Response*\n📊 Status: ${response.status}\n⏱️ Time: ${responseTime}ms`,
                    ...newsletterContext
                }, { quoted: message });
                
                fs.unlinkSync(filePath);
            } else {
                await sock.sendMessage(chatId, { text: output, ...newsletterContext }, { quoted: message });
            }
        }
        
        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

    } catch (error) {
        console.error('HTTP error:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
        
        let errorMsg = `❌ *Request Failed*\n`;
        if (error.response) {
            errorMsg += `📊 Status: ${error.response.status}\n📝 ${error.response.statusText || error.message}`;
            if (error.response.data) {
                const errData = typeof error.response.data === 'object' 
                    ? JSON.stringify(error.response.data, null, 2).slice(0, 1000)
                    : String(error.response.data).slice(0, 1000);
                errorMsg += `\n📦 *Error Response:*\n${errData}`;
            }
        } else if (error.request) {
            errorMsg += `🌐 No response from server\nCheck URL and connection`;
        } else {
            errorMsg += `🔧 ${error.message}`;
        }
        
        if (errorMsg.length > 4000) {
            const tmpDir = path.join(process.cwd(), 'tmp');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
            const fileName = `error_${Date.now()}.txt`;
            const filePath = path.join(tmpDir, fileName);
            fs.writeFileSync(filePath, errorMsg);
            await sock.sendMessage(chatId, {
                document: fs.readFileSync(filePath),
                mimetype: 'text/plain',
                fileName: `error_${Date.now()}.txt`,
                caption: `❌ *Error Details*`,
                ...newsletterContext
            }, { quoted: message });
            fs.unlinkSync(filePath);
        } else {
            await sock.sendMessage(chatId, { text: errorMsg, ...newsletterContext }, { quoted: message });
        }
    }
}

module.exports = httpCommand;