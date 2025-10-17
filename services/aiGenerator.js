const { pipeline } = require('@xenova/transformers');

class AIGenerator {
    constructor() {
        this.generator = null;
        this.modelName = 'Xenova/gpt2';
    }

    async initialize() {
        if (!this.generator) {
            try {
                console.log('Loading AI model for text generation...');
                this.generator = await pipeline('text-generation', this.modelName);
                console.log('AI model loaded successfully');
            } catch (error) {
                console.error('Failed to load AI model:', error);
                throw new Error('AI model initialization failed');
            }
        }
    }

    async generatePost(vehicleData, options = {}) {
        try {
            await this.initialize();

            const {
                tone = 'professional',
                length = 'medium',
                includeHashtags = true,
                includeEmoji = true
            } = options;

            // Build prompt from vehicle data
            const prompt = this.buildPrompt(vehicleData, tone, length);

            // Generate text using local transformer model
            const result = await this.generator(prompt, {
                max_new_tokens: this.getMaxTokens(length),
                temperature: this.getTemperature(tone),
                do_sample: true,
                top_k: 50,
                top_p: 0.95
            });

            let generatedText = result[0].generated_text;
            
            // Clean up and format the generated text
            generatedText = this.cleanupText(generatedText, prompt);

            // Add hashtags if requested
            if (includeHashtags) {
                const hashtags = this.generateHashtags(vehicleData);
                generatedText += '\n\n' + hashtags;
            }

            // Add emojis if requested
            if (includeEmoji) {
                generatedText = this.addEmojis(generatedText, vehicleData);
            }

            return generatedText;
        } catch (error) {
            console.error('Generation error:', error);
            // Fallback to template-based generation
            return this.generateTemplate(vehicleData, options);
        }
    }

    buildPrompt(vehicleData, tone, length) {
        const { year, make, model, price, mileage, condition } = vehicleData;
        
        const toneInstructions = {
            professional: 'Write a professional, informative social media post',
            casual: 'Write a friendly, casual social media post',
            exciting: 'Write an exciting, enthusiastic social media post',
            luxury: 'Write an elegant, luxury-focused social media post'
        };

        const instruction = toneInstructions[tone] || toneInstructions.professional;

        return `${instruction} about a ${year} ${make} ${model}. ${condition ? `This is a ${condition} vehicle.` : ''} ${price ? `Priced at ${price}.` : ''} ${mileage ? `It has ${mileage} miles.` : ''}\n\nPost: `;
    }

    getMaxTokens(length) {
        const tokens = {
            short: 50,
            medium: 100,
            long: 150
        };
        return tokens[length] || tokens.medium;
    }

    getTemperature(tone) {
        const temps = {
            professional: 0.7,
            casual: 0.8,
            exciting: 0.9,
            luxury: 0.75
        };
        return temps[tone] || 0.7;
    }

    cleanupText(text, prompt) {
        // Remove the prompt from the generated text
        text = text.replace(prompt, '').trim();
        
        // Remove incomplete sentences at the end
        const sentences = text.split(/[.!?]+/);
        if (sentences.length > 1 && sentences[sentences.length - 1].length < 20) {
            sentences.pop();
        }
        text = sentences.join('. ').trim();
        
        // Add period if needed
        if (text && !text.match(/[.!?]$/)) {
            text += '.';
        }

        return text;
    }

    generateHashtags(vehicleData) {
        const hashtags = [];
        
        if (vehicleData.make) hashtags.push(`#${vehicleData.make.replace(/\s+/g, '')}`);
        if (vehicleData.model) hashtags.push(`#${vehicleData.model.replace(/\s+/g, '')}`);
        if (vehicleData.year) hashtags.push(`#${vehicleData.year}`);
        
        // Add generic hashtags
        hashtags.push('#CarForSale', '#AutoSales', '#VehicleForSale');
        
        if (vehicleData.condition === 'Used') {
            hashtags.push('#UsedCar');
        } else if (vehicleData.condition === 'New') {
            hashtags.push('#NewCar');
        }

        return hashtags.slice(0, 8).join(' ');
    }

    addEmojis(text, vehicleData) {
        // Add relevant emojis based on context
        const emojis = ['🚗', '✨'];
        
        if (vehicleData.condition === 'New') {
            emojis.push('🆕');
        }
        
        if (text.toLowerCase().includes('luxury')) {
            emojis.push('💎');
        }
        
        return `${emojis.join(' ')} ${text}`;
    }

    generateTemplate(vehicleData, options = {}) {
        const { year, make, model, price, mileage, condition, features = [] } = vehicleData;
        const { tone = 'professional', includeHashtags = true, includeEmoji = true } = options;

        let text = '';

        // Tone-specific templates
        const templates = {
            professional: `Check out this ${year} ${make} ${model}! ${condition ? `${condition} condition.` : ''} ${price ? `Priced at ${price}.` : ''} ${mileage ? `${mileage} miles.` : ''} ${features.length > 0 ? `Features include: ${features.slice(0, 3).join(', ')}.` : ''} Contact us today for more information!`,
            
            casual: `Hey! Looking for a great ride? Check out this awesome ${year} ${make} ${model}! ${price ? `Only ${price}!` : ''} ${mileage ? `${mileage} miles.` : ''} This one won't last long!`,
            
            exciting: `🎉 AMAZING DEAL ALERT! 🎉 This stunning ${year} ${make} ${model} is ready for you! ${price ? `Unbeatable price: ${price}!` : ''} ${features.length > 0 ? `Loaded with: ${features.slice(0, 3).join(', ')}!` : ''} Don't miss out!`,
            
            luxury: `Experience elegance with this pristine ${year} ${make} ${model}. ${condition === 'New' ? 'Brand new and ready to impress.' : 'Meticulously maintained.'} ${features.length > 0 ? `Premium features include ${features.slice(0, 3).join(', ')}.` : ''} ${price ? `${price}.` : ''} Inquire today.`
        };

        text = templates[tone] || templates.professional;

        if (includeHashtags) {
            text += '\n\n' + this.generateHashtags(vehicleData);
        }

        if (includeEmoji && tone !== 'luxury') {
            text = `🚗 ${text}`;
        }

        return text;
    }
}

module.exports = AIGenerator;

