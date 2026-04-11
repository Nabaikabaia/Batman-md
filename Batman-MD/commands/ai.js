const axios = require('axios');
const fetch = require('node-fetch');

async function aiCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        
        if (!text) {
            return await sock.sendMessage(chatId, { 
                text: "Please provide a question after .gpt or .gemini\n\nExample: .gpt write a basic html code"
            }, {
                quoted: message
            });
        }

        // Get the command and query
        const parts = text.split(' ');
        const command = parts[0].toLowerCase();
        const query = parts.slice(1).join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, { 
                text: "Please provide a question after .gpt or .gemini"
            }, {quoted:message});
        }

        try {
            // Show processing message
            await sock.sendMessage(chatId, {
                react: { text: '🤖', key: message.key }
            });

            // Newsletter context info for all AI responses
            const newsletterContext = {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363367299421766@newsletter',
                    newsletterName: 'BATMAN MD',
                    serverMessageId: 127
                }
            };

            if (command === '.gpt') {
                // Call the GPT API
                const response = await axios.get(`https://apis.davidcyril.name.ng/ai/gpt4?text=${encodeURIComponent(query)}`);
                
                if (response.data && response.data.message) {
                    let answer = response.data.message;
                    
                    // Format GPT response for WhatsApp
                    answer = answer
                        .replace(/\\n/g, '\n') // Replace \n with actual newlines
                        .replace(/\\"/g, '"') // Fix escaped quotes
                        .replace(/\\'/g, "'") // Fix escaped apostrophes
                        .replace(/\\t/g, ' ') // Replace tabs with spaces
                        .replace(/\\+/g, '') // Remove any remaining backslashes
                        .replace(/\*\*(.*?)\*\*/g, '*$1*') // Convert **bold** to *bold* for WhatsApp
                        .replace(/__(.*?)__/g, '*$1*') // Convert __underline__ to *bold* as well
                        .replace(/`([^`]+)`/g, '```$1```') // Convert inline code to code blocks
                        .replace(/```(\w+)?\n?([\s\S]*?)```/g, '```$2```') // Clean up code blocks
                        .replace(/^#{1,6}\s+(.*?)$/gm, '*$1*') // Convert headers to bold
                        .replace(/^\s*[\-\*]\s+(.*?)$/gm, '• $1') // Convert bullet points
                        .replace(/^\s*\d+\.\s+(.*?)$/gm, '• $1') // Convert numbered lists to bullets
                        .replace(/!\[(.*?)\]\((.*?)\)/g, '🖼️ $1') // Replace image links
                        .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)') // Format links
                        .replace(/~~(.*?)~~/g, '$1') // Remove strikethrough
                        .replace(/^\s*[-=*_]{3,}\s*$/gm, '━━━━━━━━━━━━━━') // Replace horizontal rules
                        .replace(/\|/g, '│') // Replace pipes with vertical bars for tables
                        .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
                        .trim();
                    
                    await sock.sendMessage(chatId, {
                        text: answer,
                        contextInfo: newsletterContext
                    }, {
                        quoted: message
                    });
                    
                } else {
                    throw new Error('Invalid response from API');
                }
                
                // Remove reaction after response
                await sock.sendMessage(chatId, {
                    react: { text: '', key: message.key }
                });
                
            } else if (command === '.gemini') {
                const apis = [
                    `https://apis.davidcyril.name.ng/ai/gemini?text=${encodeURIComponent(query)}`,
                    `https://vapis.my.id/api/gemini?q=${encodeURIComponent(query)}`,
                    `https://api.siputzx.my.id/api/ai/gemini-pro?content=${encodeURIComponent(query)}`,
                    `https://api.ryzendesu.vip/api/ai/gemini?text=${encodeURIComponent(query)}`,
                    `https://zellapi.autos/ai/chatbot?text=${encodeURIComponent(query)}`,
                    `https://api.giftedtech.my.id/api/ai/geminiai?apikey=gifted&q=${encodeURIComponent(query)}`,
                    `https://api.giftedtech.my.id/api/ai/geminiaipro?apikey=gifted&q=${encodeURIComponent(query)}`
                ];

                for (const api of apis) {
                    try {
                        const response = await fetch(api);
                        const data = await response.json();

                        if (data.message || data.data || data.answer || data.result) {
                            let answer = data.message || data.data || data.answer || data.result;
                            
                            // Format Gemini response for WhatsApp (same formatting as GPT)
                            answer = answer
                                .replace(/\\n/g, '\n')
                                .replace(/\\"/g, '"')
                                .replace(/\\'/g, "'")
                                .replace(/\\t/g, ' ')
                                .replace(/\\+/g, '')
                                .replace(/\*\*(.*?)\*\*/g, '*$1*')
                                .replace(/__(.*?)__/g, '*$1*')
                                .replace(/`([^`]+)`/g, '```$1```')
                                .replace(/```(\w+)?\n?([\s\S]*?)```/g, '```$2```')
                                .replace(/^#{1,6}\s+(.*?)$/gm, '*$1*')
                                .replace(/^\s*[\-\*]\s+(.*?)$/gm, '• $1')
                                .replace(/^\s*\d+\.\s+(.*?)$/gm, '• $1')
                                .replace(/!\[(.*?)\]\((.*?)\)/g, '🖼️ $1')
                                .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)')
                                .replace(/~~(.*?)~~/g, '$1')
                                .replace(/^\s*[-=*_]{3,}\s*$/gm, '━━━━━━━━━━━━━━')
                                .replace(/\|/g, '│')
                                .replace(/\n{3,}/g, '\n\n')
                                .trim();
                            
                            await sock.sendMessage(chatId, {
                                text: answer,
                                contextInfo: newsletterContext
                            }, {
                                quoted: message
                            });
                            
                            // Remove reaction after response
                            await sock.sendMessage(chatId, {
                                react: { text: '', key: message.key }
                            });
                            
                            return;
                        }
                    } catch (e) {
                        continue;
                    }
                }
                throw new Error('All Gemini APIs failed');
                
            } else if (command === '.deepseek') {
                // Set timeout for DeepSeek API (30 seconds)
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('DeepSeek API timeout after 30 seconds')), 30000);
                });
                
                const apiPromise = axios.get(`https://apis.davidcyril.name.ng/ai/deepseek-r1?text=${encodeURIComponent(query)}`);
                
                // Race between API and timeout
                const response = await Promise.race([apiPromise, timeoutPromise]);
                
                if (response.data && response.data.response) {
                    let answer = response.data.response;
                    
                    // Format DeepSeek response for WhatsApp
                    answer = answer
                        .replace(/<\/?think>/g, '')
                        .replace(/\\n/g, '\n')
                        .replace(/\\"/g, '"')
                        .replace(/\\'/g, "'")
                        .replace(/\\t/g, ' ')
                        .replace(/\\+/g, '')
                        .replace(/\*\*(.*?)\*\*/g, '*$1*')
                        .replace(/__(.*?)__/g, '*$1*')
                        .replace(/`([^`]+)`/g, '```$1```')
                        .replace(/```(\w+)?\n?([\s\S]*?)```/g, '```$2```')
                        .replace(/^#{1,6}\s+(.*?)$/gm, '*$1*')
                        .replace(/^\s*[\-\*]\s+(.*?)$/gm, '• $1')
                        .replace(/^\s*\d+\.\s+(.*?)$/gm, '• $1')
                        .replace(/!\[(.*?)\]\((.*?)\)/g, '🖼️ $1')
                        .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)')
                        .replace(/~~(.*?)~~/g, '$1')
                        .replace(/^\s*[-=*_]{3,}\s*$/gm, '━━━━━━━━━━━━━━')
                        .replace(/\|/g, '│')
                        .replace(/\n{3,}/g, '\n\n')
                        .trim();
                    
                    await sock.sendMessage(chatId, {
                        text: answer,
                        contextInfo: newsletterContext
                    }, {
                        quoted: message
                    });
                    
                } else {
                    throw new Error('Invalid response from DeepSeek API');
                }
                
                // Remove reaction after response
                await sock.sendMessage(chatId, {
                    react: { text: '', key: message.key }
                });
            }
        } catch (error) {
            console.error('API Error:', error);
            
            // Remove reaction on error too
            await sock.sendMessage(chatId, {
                react: { text: '', key: message.key }
            });
            
            await sock.sendMessage(chatId, {
                text: "❌ Failed to get response. Please try again later.",
                contextInfo: {
                    mentionedJid: [message.key.participant || message.key.remoteJid],
                    quotedMessage: message.message,
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363367299421766@newsletter',
                        newsletterName: 'BATMAN MD',
                        serverMessageId: 127
                    }
                }
            }, {
                quoted: message
            });
        }
    } catch (error) {
        console.error('AI Command Error:', error);
        
        // Remove reaction on error too
        await sock.sendMessage(chatId, {
            react: { text: '', key: message.key }
        });
        
        await sock.sendMessage(chatId, {
            text: "❌ An error occurred. Please try again later.",
            contextInfo: {
                mentionedJid: [message.key.participant || message.key.remoteJid],
                quotedMessage: message.message,
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363367299421766@newsletter',
                    newsletterName: 'BATMAN MD',
                    serverMessageId: 127
                }
            }
        }, {
            quoted: message
        });
    }
}

module.exports = aiCommand;