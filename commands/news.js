const axios = require('axios');

// ============================================
// ENHANCEMENT: Newsletter channel info with correct JID
// ============================================
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

module.exports = async function (sock, chatId) {
    try {
        const apiKey = 'dcd720a6f1914e2d9dba9790c188c08c';  // Replace with your NewsAPI key
        const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`);
        const articles = response.data.articles.slice(0, 5); // Get top 5 articles
        
        // ENHANCEMENT: Stylish news format
        let newsMessage = `*『 📰 LATEST NEWS 』*
╭─────────⟢\n`;
        
        articles.forEach((article, index) => {
            newsMessage += `│ ${index + 1}. *${article.title}*\n`;
            newsMessage += `│ ♧ ${article.description || 'No description available'}\n`;
            newsMessage += `│ 🔗 ${article.url}\n`;
            if (index < articles.length - 1) newsMessage += `│\n`;
        });
        
        newsMessage += `╰─────────⟢\n\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
        
        await sock.sendMessage(chatId, { 
            text: newsMessage,
            ...channelInfo 
        });
        
    } catch (error) {
        console.error('Error fetching news:', error);
        
        // ENHANCEMENT: Stylish error message
        const errorMsg = `*『 ❌ NEWS ERROR 』*
╭─────────⟢
│ Sorry, I could not fetch
│ news right now.
│ 🔧 Error: ${error.message}
╰─────────⟢

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙᴀᴛᴍᴀɴ ᴍᴅ*`;
        
        await sock.sendMessage(chatId, { 
            text: errorMsg,
            ...channelInfo 
        });
    }
};