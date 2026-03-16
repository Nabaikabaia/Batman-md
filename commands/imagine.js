const axios = require('axios');
const { fetchBuffer } = require('../lib/myfunc');

async function imagineCommand(sock, chatId, message) {
    try {
        // Get the prompt from the message - FIXED: More reliable way to extract
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
            text: '🎨 Generating your image... Please wait.'
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

        // Try David Cyril API first
        try {
            const apiUrl = `https://apis.davidcyril.name.ng/fluxv2?prompt=${encodeURIComponent(enhancedPrompt)}`;
            console.log('🔗 Trying David Cyril:', apiUrl);
            
            const response = await axios.get(apiUrl, { timeout: 30000 });
            console.log('📦 David Cyril response:', JSON.stringify(response.data, null, 2));
            
            if (response.data && response.data.success && response.data.result) {
                const imageUrl = response.data.result;
                const imageBuffer = await fetchBuffer(imageUrl);
                
                await sock.sendMessage(chatId, {
                    image: imageBuffer,
                    caption: `🎨 Generated image for prompt: "${imagePrompt}"`,
                    contextInfo: newsletterContext
                }, { quoted: message });
                
                return; // Success! Exit function
            }
        } catch (err) {
            console.log('❌ David Cyril failed:', err.message);
        }

        // If David Cyril fails, try Rynekoo
        try {
            const apiUrl = `https://rynekoo-api.hf.space/image.gen/flux/dev?prompt=${encodeURIComponent(enhancedPrompt)}&ratio=1%3A1`;
            console.log('🔗 Trying Rynekoo:', apiUrl);
            
            const response = await axios.get(apiUrl, { timeout: 30000 });
            console.log('📦 Rynekoo response:', JSON.stringify(response.data, null, 2));
            
            if (response.data && response.data.success && response.data.result) {
                const imageUrl = response.data.result;
                const imageBuffer = await fetchBuffer(imageUrl);
                
                await sock.sendMessage(chatId, {
                    image: imageBuffer,
                    caption: `🎨 Generated image for prompt: "${imagePrompt}"`,
                    contextInfo: newsletterContext
                }, { quoted: message });
                
                return; // Success! Exit function
            }
        } catch (err) {
            console.log('❌ Rynekoo failed:', err.message);
        }

        // If both APIs fail
        throw new Error('All image generation APIs failed');

    } catch (error) {
        console.error('❌ Error in imagine command:', error);
        
        await sock.sendMessage(chatId, {
            text: '❌ Failed to generate image. Please try again later.',
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
