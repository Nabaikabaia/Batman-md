const axios = require('axios');
const { fetchBuffer } = require('../lib/myfunc');

async function imagineCommand(sock, chatId, message) {
    try {
        // Get the prompt from the message
        const fullText = message.message?.conversation || 
                        message.message?.extendedTextMessage?.text || '';
        
        // Split into command and prompt
        const parts = fullText.split(' ');
        const command = parts[0].toLowerCase();
        const imagePrompt = parts.slice(1).join(' ').trim();
        
        if (!imagePrompt) {
            await sock.sendMessage(chatId, {
                text: 'Please provide a prompt for the image generation.\nExample: .imagine a beautiful sunset over mountains'
            }, {
                quoted: message
            });
            return;
        }

        // Send processing message
        await sock.sendMessage(chatId, {
            text: '🎨 Generating your images from multiple AI models... Please wait.'
        }, {
            quoted: message
        });

        // Newsletter context
        const newsletterContext = {
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363367299421766@newsletter',
                newsletterName: 'BATMAN MD',
                serverMessageId: 127
            }
        };

        // Enhance the prompt
        const enhancedPrompt = enhancePrompt(imagePrompt);
        
        console.log('🎨 Original prompt:', imagePrompt);
        console.log('🎨 Enhanced prompt:', enhancedPrompt);

        // Array of all APIs to try independently
        const apis = [
            {
                url: `https://apis.davidcyril.name.ng/fluxv2?prompt=${encodeURIComponent(enhancedPrompt)}`,
                name: 'David Cyril Flux',
                responseHandler: (data) => data.success && data.result ? data.result : null
            },
            {
                url: `https://rynekoo-api.hf.space/image.gen/flux/dev?prompt=${encodeURIComponent(enhancedPrompt)}&ratio=1%3A1`,
                name: 'Rynekoo Flux',
                responseHandler: (data) => data.success && data.result ? data.result : null
            },
            {
                url: `https://rynekoo-api.hf.space/image.gen/writecream?prompt=${encodeURIComponent(enhancedPrompt)}&ratio=1%3A1`,
                name: 'Rynekoo WriteCream',
                responseHandler: (data) => data.success && data.result ? data.result : null
            },
            {
                url: `https://api.silvatech.co.ke/ai/imagine?q=${encodeURIComponent(enhancedPrompt)}&width=1280&height=720`,
                name: 'SilvaTech',
                responseHandler: (data) => data.status && data.result?.image_url ? data.result.image_url : null
            }
        ];

        let successCount = 0;
        let failedCount = 0;

        // Send initial status message
        await sock.sendMessage(chatId, {
            text: `🔄 *Generating images from 4 AI models...*\n\n⏳ This may take a moment.`,
            contextInfo: newsletterContext
        }, { quoted: message });

        // Try each API independently
        for (const api of apis) {
            try {
                console.log(`🎨 Trying ${api.name} API...`);
                
                const response = await axios.get(api.url, { timeout: 30000 });
                
                // Use the custom response handler
                const imageUrl = api.responseHandler(response.data);
                
                if (imageUrl) {
                    console.log(`✅ ${api.name} API succeeded! URL:`, imageUrl);
                    
                    // Fetch the image buffer
                    const imageBuffer = await fetchBuffer(imageUrl);
                    
                    // Send the image immediately
                    await sock.sendMessage(chatId, {
                        image: imageBuffer,
                        caption: `🖼️ *${api.name}*\n\n🎨 *Prompt:* "${imagePrompt}"`,
                        contextInfo: newsletterContext
                    }, { quoted: message });
                    
                    successCount++;
                    
                    // Small delay between images
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                } else {
                    console.log(`❌ ${api.name} returned invalid format`);
                    failedCount++;
                }
            } catch (err) {
                console.log(`❌ ${api.name} API failed:`, err.message);
                failedCount++;
            }
        }

        // Send summary message
        const summaryMessage = `✅ *Generation Complete!*\n\n` +
            `📊 *Results:*\n` +
            `• ${successCount} images generated successfully\n` +
            `• ${failedCount} APIs failed\n\n` +
            `🎨 *Prompt:* ${imagePrompt}`;

        await sock.sendMessage(chatId, {
            text: summaryMessage,
            contextInfo: newsletterContext
        }, { quoted: message });

    } catch (error) {
        console.error('❌ Error in imagine command:', error);
        
        await sock.sendMessage(chatId, {
            text: '❌ Failed to generate images. Please try again later.',
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363367299421766@newsletter',
                    newsletterName: 'BATMAN MD',
                    serverMessageId: 127
                }
            }
        }, { quoted: message });
    }
}

// Function to enhance the prompt
function enhancePrompt(prompt) {
    const qualityEnhancers = [
        'high quality', 'detailed', 'masterpiece', 'best quality',
        'ultra realistic', '4k', 'highly detailed', 'professional photography',
        'cinematic lighting', 'sharp focus'
    ];

    const numEnhancers = Math.floor(Math.random() * 2) + 3;
    const selectedEnhancers = qualityEnhancers
        .sort(() => Math.random() - 0.5)
        .slice(0, numEnhancers);

    return `${prompt}, ${selectedEnhancers.join(', ')}`;
}

module.exports = imagineCommand;
