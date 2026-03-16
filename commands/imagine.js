const axios = require('axios');
const { fetchBuffer } = require('../lib/myfunc');

async function imagineCommand(sock, chatId, message) {
    try {
        // Get the prompt from the message
        const prompt = message.message?.conversation?.trim() || 
                      message.message?.extendedTextMessage?.text?.trim() || '';
        
        // Remove the command prefix and trim
        const imagePrompt = prompt.slice(8).trim();
        
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

        // Newsletter context for all responses
        const newsletterContext = {
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363367299421766@newsletter',
                newsletterName: 'BATMAN MD',
                serverMessageId: 127
            }
        };

        // Enhance the prompt with quality keywords
        const enhancedPrompt = enhancePrompt(imagePrompt);

        // Make API request
        const response = await axios.get(`https://apis.davidcyril.name.ng/fluxv2?prompt=${encodeURIComponent(enhancedPrompt)}`);
        
        // Handle the new response format with result URL
        if (response.data && response.data.success && response.data.result) {
            const imageUrl = response.data.result;
            
            // Fetch the image buffer from the URL
            const imageBuffer = await fetchBuffer(imageUrl);

            // Send the generated image with newsletter context
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: `🎨 Generated image for prompt: "${imagePrompt}"`,
                contextInfo: newsletterContext
            }, {
                quoted: message
            });
        } else {
            throw new Error('Invalid response from Flux API');
        }

    } catch (error) {
        console.error('Error in imagine command:', error);
        
        // Newsletter context for error messages
        const errorContext = {
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363367299421766@newsletter',
                newsletterName: 'BATMAN MD',
                serverMessageId: 127
            }
        };
        
        await sock.sendMessage(chatId, {
            text: '❌ Failed to generate image. Please try again later.',
            contextInfo: errorContext
        }, {
            quoted: message
        });
    }
}

// Function to enhance the prompt
function enhancePrompt(prompt) {
    // Quality enhancing keywords
    const qualityEnhancers = [
        'high quality',
        'detailed',
        'masterpiece',
        'best quality',
        'ultra realistic',
        '4k',
        'highly detailed',
        'professional photography',
        'cinematic lighting',
        'sharp focus'
    ];

    // Randomly select 3-4 enhancers
    const numEnhancers = Math.floor(Math.random() * 2) + 3; // Random number between 3-4
    const selectedEnhancers = qualityEnhancers
        .sort(() => Math.random() - 0.5)
        .slice(0, numEnhancers);

    // Combine original prompt with enhancers
    return `${prompt}, ${selectedEnhancers.join(', ')}`;
}

module.exports = imagineCommand;