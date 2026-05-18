// lib/imagehandler.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const cheerio = require('cheerio');

/**
 * Remove background using pixa.ai (working)
 */
async function removeBackgroundPixa(inputBuffer, inputPath) {
    try {
        const form = new FormData();
        form.append('image', inputBuffer, {
            filename: 'image.jpg',
            contentType: 'image/jpeg'
        });
        form.append('format', 'png');
        form.append('model', 'v1');

        const response = await fetch('https://api2.pixelcut.app/image/matte/v1', {
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'x-locale': 'en',
                'x-client-version': 'web:pixa.com:4a5b0af2',
                'origin': 'https://www.pixa.com',
                'referer': 'https://www.pixa.com/',
                ...form.getHeaders()
            },
            body: form
        });

        const buffer = await response.arrayBuffer();
        return Buffer.from(buffer);
    } catch (error) {
        console.error('Pixa RemoveBG error:', error);
        throw error;
    }
}

/**
 * AI Image Generation (unrestricted)
 */
async function generateImage(prompt, style = 'anime') {
    const styles = ['photorealistic', 'digital-art', 'impressionist', 'anime', 'fantasy', 'sci-fi', 'vintage'];
    
    if (!styles.includes(style)) {
        throw new Error(`Available styles: ${styles.join(', ')}`);
    }

    const client = axios.create({
        withCredentials: true,
        headers: {
            origin: "https://unrestrictedaiimagegenerator.com",
            referer: "https://unrestrictedaiimagegenerator.com/",
            "user-agent": "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Mobile Safari/537.36",
        },
    });

    const { data: html, headers } = await client.get("https://unrestrictedaiimagegenerator.com/");
    
    const cookies = headers["set-cookie"]?.join("; ");
    if (cookies) client.defaults.headers.Cookie = cookies;

    const $ = cheerio.load(html);
    const nonce = $('input[name="_wpnonce"]').val();
    if (!nonce) throw new Error("Nonce not found");

    const form = new URLSearchParams({
        generate_image: "true",
        image_description: prompt,
        image_style: style,
        _wpnonce: nonce,
    });

    const { data: resultHtml } = await client.post(
        "https://unrestrictedaiimagegenerator.com/",
        form.toString(),
        {
            headers: { "content-type": "application/x-www-form-urlencoded" },
        }
    );

    const $$ = cheerio.load(resultHtml);
    const img = $$("img#resultImage").attr("src");
    if (!img) throw new Error("Image not found");

    return img;
}

/**
 * Upscale image using AI Enhancer (working)
 */
async function upscaleImage(buffer) {
    try {
        const base64 = buffer.toString('base64');
        
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
            'Content-Type': 'application/json',
            'origin': 'https://aienhancer.ai',
            'referer': 'https://aienhancer.ai/ai-image-upscaler'
        };

        const create = await axios.post('https://aienhancer.ai/api/v1/r/image-enhance/create',
            {
                model: 3,
                image: `data:image/jpeg;base64,${base64}`,
                settings: 'kRpBbpnRCD2nL2RxnnuoMo7MBc0zHndTDkWMl9aW+Gw='
            },
            { headers }
        );

        const id = create.data.data.id;

        for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 2500));
            
            const result = await axios.post('https://aienhancer.ai/api/v1/r/image-enhance/result',
                { task_id: id },
                { headers }
            );

            const data = result.data.data;
            if (data && data.output) {
                // Download the upscaled image
                const imgResponse = await axios.get(data.output, { responseType: 'arraybuffer' });
                return {
                    id,
                    output: data.output,
                    input: data.input,
                    buffer: Buffer.from(imgResponse.data)
                };
            }
        }
        throw new Error('Upscale timeout');
    } catch (error) {
        console.error('Upscale error:', error);
        throw error;
    }
}

/**
 * Image to Prompt (get prompt from image)
 */
async function imageToPrompt(buffer) {
    try {
        const base64 = buffer.toString('base64');
        
        const response = await axios.post(
            'https://imageprompt.org/api/ai/prompts/image',
            {
                base64Url: `data:image/webp;base64,${base64}`,
                imageModelId: 0,
                language: 'en'
            },
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
                    'Content-Type': 'application/json',
                    'origin': 'https://imageprompt.org',
                    'referer': 'https://imageprompt.org/image-to-prompt'
                }
            }
        );

        return {
            prompt: response.data.prompt,
            generatedAt: response.data.generatedAt
        };
    } catch (error) {
        console.error('ImageToPrompt error:', error);
        throw error;
    }
}

module.exports = {
    removeBackgroundPixa,
    generateImage,
    upscaleImage,
    imageToPrompt
};