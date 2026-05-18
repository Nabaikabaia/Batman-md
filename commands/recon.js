// commands/recon.js
const axios = require('axios');
const url = require('url');
const dns = require('dns').promises;

// Newsletter context for ALL outgoing messages
const channelInfo = {
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

// Static Batman contact (with newsletter context embedded)
const fakeMeta = {
    key: {
        participant: '0@s.whatsapp.net',
        remoteJid: 'status@broadcast',
        fromMe: false,
        id: 'RECON_META_' + Date.now()
    },
    message: {
        contactMessage: {
            displayName: 'BATMAN MD',
            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:BATMAN MD;;;;\nFN:BATMAN MD\nTEL;waid=2349049636843:+234 904 963 6843\nEND:VCARD`,
            sendEphemeral: true
        }
    },
    messageTimestamp: Math.floor(Date.now() / 1000),
    pushName: 'BATMAN MD'
};

// Extended patterns for JS file detection
const JS_PATTERNS = [
    /src="([^"]*\.js[^"]*)"/gi,
    /src='([^']*\.js[^']*)'/gi,
    /href="([^"]*\.js[^"]*)"/gi,
    /src=["'](\/static\/[^"']+\.js)["']/gi,
    /src=["'](\/js\/[^"']+\.js)["']/gi,
    /src=["'](\/_next\/static\/chunks\/[^"']+\.js)["']/gi,
    /src=["'](\/assets\/[^"']+\.js)["']/gi,
    /src=["'](\/build\/[^"']+\.js)["']/gi,
];

// Secret patterns
const SECRET_PATTERNS = [
    { pattern: /[a-zA-Z0-9]{32,40}/g, name: 'Potential API Key' },
    { pattern: /sk-[a-zA-Z0-9]{48}/g, name: 'OpenAI Secret Key' },
    { pattern: /AIza[0-9A-Za-z\-_]{35}/g, name: 'Google API Key' },
    { pattern: /SG\.[a-zA-Z0-9\-_]{22}\.[a-zA-Z0-9\-_]{43}/g, name: 'SendGrid API Key' },
    { pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9._-]{50,}/g, name: 'JWT Token' },
    { pattern: /ghp_[a-zA-Z0-9]{36}/g, name: 'GitHub Token' },
    { pattern: /process\.env\.[A-Z_]+/g, name: 'Env Variable Reference' },
    { pattern: /API_KEY['"]?\s*[:=]\s*['"][^'"]+['"]/gi, name: 'API Key Assignment' },
];

// CDN detection patterns
function detectCDN(headers, hostname) {
    const serverHeader = headers['server'] || '';
    const cfRay = headers['cf-ray'];
    const cfCache = headers['cf-cache-status'];
    
    if (cfRay || cfCache || serverHeader.includes('cloudflare')) return 'Cloudflare';
    if (serverHeader.includes('Fastly')) return 'Fastly';
    if (serverHeader.includes('Akamai')) return 'Akamai';
    if (serverHeader.includes('Amazon') || serverHeader.includes('AWS')) return 'AWS CloudFront';
    if (serverHeader.includes('CloudFront')) return 'Amazon CloudFront';
    if (serverHeader.includes('Netlify')) return 'Netlify';
    if (serverHeader.includes('Vercel')) return 'Vercel';
    if (serverHeader.includes('GitHub')) return 'GitHub Pages';
    if (hostname.includes('shopify')) return 'Shopify';
    if (hostname.includes('wordpress')) return 'WordPress';
    return 'Unknown/VPS';
}

// Get IP address and basic DNS info
async function getDNSInfo(hostname) {
    try {
        const addresses = await dns.resolve4(hostname);
        const ip = addresses[0] || 'N/A';
        
        let reverseDns = 'N/A';
        try {
            const rev = await dns.reverse(ip);
            reverseDns = rev[0] || 'N/A';
        } catch (e) {
            reverseDns = 'No PTR record';
        }
        
        return { ip, reverseDns, allIps: addresses.slice(0, 5) };
    } catch (error) {
        return { ip: 'Resolution failed', reverseDns: 'N/A', allIps: [] };
    }
}

function extractJsUrls(html, baseUrl) {
    const jsUrls = new Set();
    
    for (const pattern of JS_PATTERNS) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
            let jsPath = match[1];
            const absoluteUrl = url.resolve(baseUrl, jsPath);
            jsUrls.add(absoluteUrl);
        }
    }
    
    return Array.from(jsUrls);
}

async function fetchWithTimeout(url, timeout = 15000) {
    try {
        const response = await axios.get(url, {
            timeout: timeout,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            maxRedirects: 5
        });
        return response;
    } catch (error) {
        console.log(`[Recon] Failed to fetch ${url}: ${error.message}`);
        return null;
    }
}

async function reconCommand(sock, chatId, message, args) {
    try {
        let targetUrl = args.join(' ').trim();
        if (!targetUrl) {
            await sock.sendMessage(chatId, {
                text: '🕵️ *Recon Tool*\n\nUsage: .recon <url>\nExample: .recon https://example.com\n\n⚠️ Security scanning tool – use responsibly.',
                ...channelInfo
            }, { quoted: fakeMeta });
            return;
        }

        if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;
        
        const parsedUrl = new url.URL(targetUrl);
        const hostname = parsedUrl.hostname;

        await sock.sendMessage(chatId, { react: { text: "🕵️", key: message.key } });

        const processingMsg = await sock.sendMessage(chatId, {
            text: `🛰️ *Reconnaissance in progress*\nTarget: ${targetUrl}\nPhase 1: Fetching and analyzing...`,
            ...channelInfo
        }, { quoted: fakeMeta });

        // Get DNS info first
        const dnsInfo = await getDNSInfo(hostname);
        
        // Fetch main page
        const mainResponse = await fetchWithTimeout(targetUrl, 30000);
        if (!mainResponse) throw new Error('Failed to fetch target URL');
        
        const html = mainResponse.data;
        const baseUrl = mainResponse.config.url || targetUrl;
        const headers = mainResponse.headers;
        
        const cdn = detectCDN(headers, hostname);
        const jsUrls = extractJsUrls(html, baseUrl);
        
        await sock.sendMessage(chatId, {
            text: `🛰️ *Recon in progress*\nTarget: ${targetUrl}\nPhase 2: Scanning ${jsUrls.length} JavaScript files...`,
            edit: processingMsg.key,
            ...channelInfo
        });

        let apiEndpoints = new Set();
        let secretFindings = [];
        let securityHeaders = {};
        
        const securityChecks = {
            'strict-transport-security': 'HSTS',
            'content-security-policy': 'CSP',
            'x-frame-options': 'Clickjacking Protection',
            'x-content-type-options': 'MIME Sniffing Protection',
            'referrer-policy': 'Referrer Policy'
        };
        
        for (const [header, name] of Object.entries(securityChecks)) {
            if (headers[header]) {
                securityHeaders[name] = headers[header];
            } else {
                securityHeaders[name] = '⚠️ Missing';
            }
        }
        
        // Scan each JS file
        for (let i = 0; i < Math.min(jsUrls.length, 20); i++) {
            const jsUrl = jsUrls[i];
            const response = await fetchWithTimeout(jsUrl, 20000);
            if (!response) continue;
            
            const code = response.data;
            
            const apiMatches = code.match(/https?:\/\/[a-zA-Z0-9.-]+\.[a-z]{2,}\/[a-zA-Z0-9/_\-.]*/g);
            if (apiMatches) {
                apiMatches.forEach(api => {
                    if (api.length > 20 && api.length < 500) {
                        apiEndpoints.add(api);
                    }
                });
            }
            
            const supabaseMatches = code.match(/https:\/\/[a-z0-9]{20}\.supabase\.co/g);
            if (supabaseMatches) supabaseMatches.forEach(u => apiEndpoints.add(u));
            
            for (const { pattern, name } of SECRET_PATTERNS) {
                const matches = code.match(pattern);
                if (matches) {
                    matches.forEach(secret => {
                        secretFindings.push({
                            secret: secret.length > 50 ? secret.substring(0, 30) + '...' + secret.slice(-10) : secret,
                            source: jsUrl.split('/').pop(),
                            type: name
                        });
                    });
                }
            }
        }
        
        // Remove duplicates
        const uniqueSecrets = [];
        const seen = new Set();
        for (const s of secretFindings) {
            if (!seen.has(s.secret)) {
                seen.add(s.secret);
                uniqueSecrets.push(s);
            }
        }
        
        // Build report with newsletter footer
        let report = `📂 *RECON INTELLIGENCE REPORT* ✅\n\n`;
        report += `🌐 *Target:* ${targetUrl}\n`;
        report += `🖥️ *Hostname:* ${hostname}\n`;
        report += `🌍 *IP Address:* \`${dnsInfo.ip}\`\n`;
        if (dnsInfo.reverseDns !== 'N/A' && dnsInfo.reverseDns !== 'No PTR record') {
            report += `↩️ *Reverse DNS:* \`${dnsInfo.reverseDns}\`\n`;
        }
        report += `☁️ *CDN/Platform:* ${cdn}\n`;
        report += `📁 *JS Files Scanned:* ${Math.min(jsUrls.length, 20)}/${jsUrls.length}\n`;
        report += `──────────────────\n\n`;
        
        report += `🔌 *API ENDPOINTS (${Math.min(apiEndpoints.size, 15)}):*\n`;
        if (apiEndpoints.size) {
            const endpoints = Array.from(apiEndpoints).slice(0, 15);
            report += endpoints.map(u => `> \`${u.replace(/https?:\/\//, '').substring(0, 80)}\``).join('\n');
            if (apiEndpoints.size > 15) report += `\n> *+${apiEndpoints.size - 15} more*`;
        } else {
            report += `> _None detected_`;
        }
        report += `\n\n`;
        
        report += `🔑 *SECRETS DETECTED (${uniqueSecrets.length}):*\n`;
        if (uniqueSecrets.length) {
            uniqueSecrets.slice(0, 10).forEach((s, idx) => {
                report += `*${idx+1}. ${s.type}:* \`${s.secret}\`\n`;
                report += `   └─ 📄 ${s.source}\n`;
            });
            if (uniqueSecrets.length > 10) report += `\n*+${uniqueSecrets.length - 10} more secrets*`;
        } else {
            report += `> _No secrets detected_`;
        }
        report += `\n\n`;
        
        report += `🛡️ *SECURITY HEADERS:*\n`;
        for (const [name, value] of Object.entries(securityHeaders)) {
            const status = value.includes('⚠️') ? '❌' : '✅';
            report += `${status} *${name}:* ${value.includes('⚠️') ? 'Missing' : 'Present'}\n`;
        }
        
        report += `\n🧬 *RECOMMENDATIONS:*\n`;
        if (!securityHeaders['HSTS'] || securityHeaders['HSTS'].includes('⚠️')) report += `> Enable HSTS for HTTPS enforcement\n`;
        if (!securityHeaders['CSP'] || securityHeaders['CSP'].includes('⚠️')) report += `> Implement Content Security Policy\n`;
        if (uniqueSecrets.length > 0) report += `> ⚠️ Remove exposed secrets from client-side code\n`;
        if (cdn.includes('Cloudflare')) report += `> 🔒 Site protected by Cloudflare\n`;
        report += `\n> *© BATMAN MD*`;
        
        // Send final report with newsletter context AND quoted with Batman contact
        await sock.sendMessage(chatId, {
            text: report,
            edit: processingMsg.key,
            ...channelInfo
        });
        
        await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });
        
    } catch (error) {
        console.error('[Recon] Error:', error.message);
        await sock.sendMessage(chatId, {
            text: `❌ *Recon Failed:* ${error.message}`,
            ...channelInfo
        }, { quoted: fakeMeta });
        await sock.sendMessage(chatId, { react: { text: "❌", key: message.key } });
    }
}

module.exports = reconCommand;