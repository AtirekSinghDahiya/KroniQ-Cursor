/**
 * PPT Theme Intelligence Service
 * 
 * Analyzes user prompts to automatically detect the best theme, 
 * style, and image generation prompts for presentations.
 */

import { generateKieImage } from './kieAIService';

// Theme categories with their detection keywords and styling
export const THEME_CATEGORIES = {
    ocean_wildlife: {
        keywords: ['shark', 'fish', 'ocean', 'sea', 'marine', 'whale', 'water', 'underwater', 'aquatic', 'beach', 'coral', 'dolphin', 'submarine', 'diving', 'reef'],
        theme: 'ocean',
        imageStyle: 'underwater photography, marine life, deep blue aquatic tones, professional nature documentary style',
        colorScheme: { primary: '0369A1', secondary: '0EA5E9', accent: '22D3EE', text: '0C4A6E', light: 'E0F2FE', dark: '082F49' }
    },
    nature_wildlife: {
        keywords: ['animal', 'wildlife', 'nature', 'forest', 'jungle', 'safari', 'bird', 'lion', 'tiger', 'elephant', 'bear', 'wolf', 'zoo', 'ecosystem', 'biodiversity'],
        theme: 'nature',
        imageStyle: 'wildlife photography, natural environments, earthy tones, national geographic style',
        colorScheme: { primary: '166534', secondary: '22C55E', accent: 'A3E635', text: '14532D', light: 'DCFCE7', dark: '052E16' }
    },
    pitch_business: {
        keywords: ['pitch', 'investor', 'startup', 'business', 'revenue', 'market', 'growth', 'funding', 'series', 'valuation', 'vc', 'venture', 'equity', 'roi', 'profit'],
        theme: 'professional',
        imageStyle: 'corporate photography, business graphics, clean modern office aesthetics, professional stock',
        colorScheme: { primary: '1E3A8A', secondary: '3B82F6', accent: '60A5FA', text: '1F2937', light: 'F0F9FF', dark: '0F172A' }
    },
    tech_innovation: {
        keywords: ['technology', 'AI', 'artificial intelligence', 'digital', 'software', 'app', 'robot', 'future', 'innovation', 'machine learning', 'blockchain', 'crypto', 'cloud', 'data', 'cyber'],
        theme: 'tech',
        imageStyle: 'futuristic technology, digital art, neon accents, sci-fi aesthetics, clean tech visuals',
        colorScheme: { primary: '7C3AED', secondary: 'A855F7', accent: '06B6D4', text: 'E9D5FF', light: 'FAF5FF', dark: '1E1B4B' }
    },
    education: {
        keywords: ['learn', 'education', 'school', 'university', 'course', 'training', 'study', 'teach', 'student', 'academic', 'research', 'degree', 'lecture', 'class'],
        theme: 'education',
        imageStyle: 'educational graphics, clean illustrations, academic style, bright and welcoming',
        colorScheme: { primary: '0891B2', secondary: '06B6D4', accent: '67E8F9', text: '164E63', light: 'ECFEFF', dark: '083344' }
    },
    health_medical: {
        keywords: ['health', 'medical', 'hospital', 'doctor', 'medicine', 'healthcare', 'wellness', 'patient', 'treatment', 'pharma', 'clinical', 'therapy'],
        theme: 'health',
        imageStyle: 'medical photography, healthcare visuals, clean clinical aesthetics, trustworthy and professional',
        colorScheme: { primary: '059669', secondary: '10B981', accent: '34D399', text: '064E3B', light: 'D1FAE5', dark: '022C22' }
    },
    creative_design: {
        keywords: ['design', 'creative', 'art', 'brand', 'marketing', 'aesthetic', 'visual', 'graphic', 'portfolio', 'agency', 'campaign'],
        theme: 'creative',
        imageStyle: 'artistic, vibrant colors, bold design, creative portfolio style',
        colorScheme: { primary: 'DC2626', secondary: 'F59E0B', accent: 'FBBF24', text: '1F2937', light: 'FEF3C7', dark: '7C2D12' }
    },
    elegant_luxury: {
        keywords: ['luxury', 'premium', 'exclusive', 'elegant', 'sophisticated', 'high-end', 'boutique', 'fashion', 'jewelry', 'real estate'],
        theme: 'elegant',
        imageStyle: 'luxury photography, elegant aesthetics, gold accents, premium and sophisticated',
        colorScheme: { primary: '292524', secondary: '78716C', accent: 'F59E0B', text: 'F5F5F4', light: 'A8A29E', dark: '0C0A09' }
    }
};

// Presentation style presets
export const PRESENTATION_STYLES = {
    pitch_deck: {
        name: 'Pitch Deck',
        description: 'Investor-ready business presentation',
        slideTypes: ['title_slide', 'problem', 'solution', 'market_size', 'business_model', 'traction', 'team', 'financials', 'ask', 'conclusion'],
        imageKeySlides: [0, 2, 6]
    },
    educational: {
        name: 'Educational',
        description: 'Course or training material',
        slideTypes: ['title_slide', 'agenda', 'content', 'content', 'content', 'examples', 'summary', 'quiz', 'resources', 'conclusion'],
        imageKeySlides: [0, 5]
    },
    creative: {
        name: 'Creative',
        description: 'Visual and artistic presentation',
        slideTypes: ['title_slide', 'vision', 'content', 'gallery', 'content', 'gallery', 'inspiration', 'content', 'cta', 'conclusion'],
        imageKeySlides: [0, 1, 3, 5, 6]
    },
    report: {
        name: 'Report',
        description: 'Data-driven analysis presentation',
        slideTypes: ['title_slide', 'executive_summary', 'methodology', 'findings', 'data_viz', 'data_viz', 'analysis', 'recommendations', 'next_steps', 'conclusion'],
        imageKeySlides: [0]
    }
};

export interface ThemeRecommendation {
    recommendedTheme: string;
    category: string;
    imageStyle: string;
    colorScheme: {
        primary: string;
        secondary: string;
        accent: string;
        text: string;
        light: string;
        dark: string;
    };
    confidence: number;
    presentationStyle: string;
}

/**
 * Analyze a user prompt and recommend the best theme
 */
export function analyzePromptForTheme(prompt: string): ThemeRecommendation {
    const lowerPrompt = prompt.toLowerCase();

    let bestMatch = {
        category: 'pitch_business',
        score: 0
    };

    for (const [categoryKey, category] of Object.entries(THEME_CATEGORIES)) {
        let score = 0;
        for (const keyword of category.keywords) {
            if (lowerPrompt.includes(keyword.toLowerCase())) {
                score += keyword.length;
            }
        }

        if (score > bestMatch.score) {
            bestMatch = { category: categoryKey, score };
        }
    }

    const matchedCategory = THEME_CATEGORIES[bestMatch.category as keyof typeof THEME_CATEGORIES];

    let presentationStyle = 'pitch_deck';
    if (lowerPrompt.includes('learn') || lowerPrompt.includes('course') || lowerPrompt.includes('teach')) {
        presentationStyle = 'educational';
    } else if (lowerPrompt.includes('report') || lowerPrompt.includes('analysis') || lowerPrompt.includes('data')) {
        presentationStyle = 'report';
    } else if (lowerPrompt.includes('creative') || lowerPrompt.includes('design') || lowerPrompt.includes('portfolio')) {
        presentationStyle = 'creative';
    }

    return {
        recommendedTheme: matchedCategory.theme,
        category: bestMatch.category,
        imageStyle: matchedCategory.imageStyle,
        colorScheme: matchedCategory.colorScheme,
        confidence: bestMatch.score > 0 ? Math.min(bestMatch.score / 20, 1) : 0.3,
        presentationStyle
    };
}

/**
 * Generate an image prompt for a specific slide
 */
export function generateSlideImagePrompt(
    slideTitle: string,
    slideContent: string[],
    topic: string,
    themeAnalysis: ThemeRecommendation
): string {
    const contentSummary = slideContent.slice(0, 2).join(', ');

    return `${themeAnalysis.imageStyle}, professional presentation visual for slide titled "${slideTitle}" about ${topic}. Key points: ${contentSummary}. High quality, 16:9 aspect ratio, minimal text overlay, suitable for business presentation background.`;
}

/**
 * Generate AI images for key slides
 */
export async function generateSlideImages(
    slides: Array<{ title: string; content: string[]; layout?: string }>,
    topic: string,
    themeAnalysis: ThemeRecommendation,
    onProgress?: (message: string) => void
): Promise<Map<number, string>> {
    const imageMap = new Map<number, string>();

    const style = PRESENTATION_STYLES[themeAnalysis.presentationStyle as keyof typeof PRESENTATION_STYLES]
        || PRESENTATION_STYLES.pitch_deck;

    const imageSlideIndices = style.imageKeySlides.filter(i => i < slides.length);

    for (const slideIndex of imageSlideIndices) {
        const slide = slides[slideIndex];
        if (!slide) continue;

        onProgress?.(`Generating image for slide ${slideIndex + 1}...`);

        try {
            const imagePrompt = generateSlideImagePrompt(
                slide.title,
                slide.content,
                topic,
                themeAnalysis
            );

            const imageUrl = await generateKieImage(imagePrompt, 'flux-kontext');
            imageMap.set(slideIndex, imageUrl);

            console.log(`✅ Generated image for slide ${slideIndex + 1}`);
        } catch (error) {
            console.warn(`⚠️ Failed to generate image for slide ${slideIndex + 1}:`, error);
        }
    }

    return imageMap;
}

/**
 * Get theme configuration by name - includes all 35+ themes
 */
export function getThemeColors(themeName: string): { primary: string; secondary: string; accent: string; text: string; light: string; dark: string } {
    const allThemes: Record<string, { primary: string; secondary: string; accent: string; text: string; light: string; dark: string }> = {
        // Classic Business Themes
        professional: { primary: '1E3A8A', secondary: '3B82F6', accent: '60A5FA', text: '1F2937', light: 'F0F9FF', dark: '0F172A' },
        corporate: { primary: '1F2937', secondary: '4B5563', accent: '9CA3AF', text: '111827', light: 'F9FAFB', dark: '111827' },
        startup: { primary: '7C3AED', secondary: 'EC4899', accent: 'F472B6', text: '1F2937', light: 'FDF4FF', dark: '4C1D95' },
        executive: { primary: '0F172A', secondary: '334155', accent: '64748B', text: 'F8FAFC', light: 'F1F5F9', dark: '020617' },

        // Modern & Tech Themes
        modern: { primary: '6366F1', secondary: '8B5CF6', accent: 'A78BFA', text: '1F2937', light: 'F5F3FF', dark: '1E1B4B' },
        tech: { primary: '7C3AED', secondary: 'A855F7', accent: '06B6D4', text: 'E9D5FF', light: 'FAF5FF', dark: '1E1B4B' },
        neon: { primary: 'F0ABFC', secondary: '06B6D4', accent: 'A5F3FC', text: '0C0A09', light: 'F0FDFF', dark: '18181B' },
        cyber: { primary: '0EA5E9', secondary: 'A855F7', accent: 'C4B5FD', text: 'F8FAFC', light: 'F0F9FF', dark: '0C0A09' },
        futuristic: { primary: '1E1B4B', secondary: '06B6D4', accent: '22D3EE', text: 'F0FDFF', light: 'ECFEFF', dark: '0F172A' },

        // Nature & Environment Themes
        ocean: { primary: '0369A1', secondary: '0EA5E9', accent: '22D3EE', text: '0C4A6E', light: 'E0F2FE', dark: '082F49' },
        nature: { primary: '166534', secondary: '22C55E', accent: 'A3E635', text: '14532D', light: 'DCFCE7', dark: '052E16' },
        forest: { primary: '14532D', secondary: '22C55E', accent: '4ADE80', text: 'F0FDF4', light: 'DCFCE7', dark: '052E16' },
        tropical: { primary: '059669', secondary: 'FBBF24', accent: 'FCD34D', text: '064E3B', light: 'FEF3C7', dark: '022C22' },
        arctic: { primary: '0C4A6E', secondary: 'E0F2FE', accent: 'BAE6FD', text: '0369A1', light: 'F0F9FF', dark: '0C4A6E' },
        sunset: { primary: 'F97316', secondary: 'EC4899', accent: 'FB7185', text: '1C1917', light: 'FFF7ED', dark: '7C2D12' },

        // Elegant & Premium Themes
        elegant: { primary: '292524', secondary: '78716C', accent: 'F59E0B', text: 'F5F5F4', light: 'A8A29E', dark: '0C0A09' },
        luxury: { primary: '1C1917', secondary: 'D4AF37', accent: 'F59E0B', text: 'FEF3C7', light: 'FFFBEB', dark: '0C0A09' },
        rose_gold: { primary: '44403C', secondary: 'FBBF24', accent: 'FCD34D', text: 'FAFAF9', light: 'FEF3C7', dark: '1C1917' },
        midnight: { primary: '0F172A', secondary: '6366F1', accent: '818CF8', text: 'F8FAFC', light: 'E0E7FF', dark: '020617' },

        // Creative & Artistic Themes
        creative: { primary: 'DC2626', secondary: 'F59E0B', accent: 'FBBF24', text: '1F2937', light: 'FEF3C7', dark: '7C2D12' },
        vibrant: { primary: 'E11D48', secondary: '8B5CF6', accent: 'C4B5FD', text: 'FAFAFA', light: 'FAF5FF', dark: '4C1D95' },
        pastel: { primary: 'FDF2F8', secondary: 'E0E7FF', accent: 'C7D2FE', text: '4B5563', light: 'FEFCE8', dark: 'E5E7EB' },
        vintage: { primary: '78350F', secondary: 'D97706', accent: 'FBBF24', text: 'FFFBEB', light: 'FEF3C7', dark: '451A03' },

        // Industry-Specific Themes
        health: { primary: '059669', secondary: '10B981', accent: '34D399', text: '064E3B', light: 'D1FAE5', dark: '022C22' },
        education: { primary: '0891B2', secondary: '06B6D4', accent: '67E8F9', text: '164E63', light: 'ECFEFF', dark: '083344' },
        finance: { primary: '15803D', secondary: '4ADE80', accent: '86EFAC', text: '052E16', light: 'DCFCE7', dark: '14532D' },
        legal: { primary: '1E3A5F', secondary: '64748B', accent: '94A3B8', text: 'F8FAFC', light: 'F1F5F9', dark: '0F172A' },

        // Minimal & Clean Themes
        minimal: { primary: '111827', secondary: '374151', accent: '6B7280', text: '1F2937', light: 'F9FAFB', dark: '030712' },
        clean: { primary: 'F8FAFC', secondary: 'E2E8F0', accent: 'CBD5E1', text: '334155', light: 'FFFFFF', dark: 'F1F5F9' },
        monochrome: { primary: '18181B', secondary: '52525B', accent: '71717A', text: 'FAFAFA', light: 'E4E4E7', dark: '09090B' },

        // Color-Based Themes
        green: { primary: '059669', secondary: '10B981', accent: '34D399', text: '1F2937', light: 'D1FAE5', dark: '064E3B' },
        blue: { primary: '2563EB', secondary: '3B82F6', accent: '60A5FA', text: '1F2937', light: 'DBEAFE', dark: '1E3A8A' },
        purple: { primary: '7C3AED', secondary: '8B5CF6', accent: 'A78BFA', text: '1F2937', light: 'EDE9FE', dark: '4C1D95' },
        orange: { primary: 'EA580C', secondary: 'F97316', accent: 'FB923C', text: '1F2937', light: 'FFEDD5', dark: '9A3412' },
        red: { primary: 'DC2626', secondary: 'EF4444', accent: 'F87171', text: '1F2937', light: 'FEE2E2', dark: '7F1D1D' },
        pink: { primary: 'DB2777', secondary: 'EC4899', accent: 'F9A8D4', text: '1F2937', light: 'FCE7F3', dark: '831843' },
        teal: { primary: '0D9488', secondary: '14B8A6', accent: '5EEAD4', text: '1F2937', light: 'CCFBF1', dark: '134E4A' },
        indigo: { primary: '4338CA', secondary: '6366F1', accent: '818CF8', text: '1F2937', light: 'E0E7FF', dark: '312E81' }
    };

    return allThemes[themeName] || allThemes.professional;
}

/**
 * Theme preview data for UI - 35+ Professional Themes
 */
export const THEME_PREVIEWS = {
    // Classic Business Themes
    professional: { name: 'Professional', gradient: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)', category: 'business' },
    corporate: { name: 'Corporate', gradient: 'linear-gradient(135deg, #1F2937 0%, #4B5563 100%)', category: 'business' },
    startup: { name: 'Startup', gradient: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)', category: 'business' },
    executive: { name: 'Executive', gradient: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)', category: 'business' },

    // Modern & Tech Themes
    modern: { name: 'Modern', gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', category: 'modern' },
    tech: { name: 'Tech', gradient: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)', category: 'modern' },
    neon: { name: 'Neon', gradient: 'linear-gradient(135deg, #F0ABFC 0%, #06B6D4 100%)', category: 'modern' },
    cyber: { name: 'Cyber', gradient: 'linear-gradient(135deg, #0EA5E9 0%, #A855F7 100%)', category: 'modern' },
    futuristic: { name: 'Futuristic', gradient: 'linear-gradient(135deg, #1E1B4B 0%, #06B6D4 100%)', category: 'modern' },

    // Nature & Environment Themes
    ocean: { name: 'Ocean', gradient: 'linear-gradient(135deg, #0369A1 0%, #22D3EE 100%)', category: 'nature' },
    nature: { name: 'Nature', gradient: 'linear-gradient(135deg, #166534 0%, #A3E635 100%)', category: 'nature' },
    forest: { name: 'Forest', gradient: 'linear-gradient(135deg, #14532D 0%, #22C55E 100%)', category: 'nature' },
    tropical: { name: 'Tropical', gradient: 'linear-gradient(135deg, #059669 0%, #FBBF24 100%)', category: 'nature' },
    arctic: { name: 'Arctic', gradient: 'linear-gradient(135deg, #0C4A6E 0%, #E0F2FE 100%)', category: 'nature' },
    sunset: { name: 'Sunset', gradient: 'linear-gradient(135deg, #F97316 0%, #EC4899 100%)', category: 'nature' },

    // Elegant & Premium Themes
    elegant: { name: 'Elegant', gradient: 'linear-gradient(135deg, #292524 0%, #F59E0B 100%)', category: 'premium' },
    luxury: { name: 'Luxury', gradient: 'linear-gradient(135deg, #1C1917 0%, #D4AF37 100%)', category: 'premium' },
    rose_gold: { name: 'Rose Gold', gradient: 'linear-gradient(135deg, #44403C 0%, #FBBF24 100%)', category: 'premium' },
    midnight: { name: 'Midnight', gradient: 'linear-gradient(135deg, #0F172A 0%, #6366F1 100%)', category: 'premium' },

    // Creative & Artistic Themes
    creative: { name: 'Creative', gradient: 'linear-gradient(135deg, #DC2626 0%, #F59E0B 100%)', category: 'creative' },
    vibrant: { name: 'Vibrant', gradient: 'linear-gradient(135deg, #E11D48 0%, #8B5CF6 100%)', category: 'creative' },
    pastel: { name: 'Pastel', gradient: 'linear-gradient(135deg, #FDF2F8 0%, #E0E7FF 100%)', category: 'creative' },
    vintage: { name: 'Vintage', gradient: 'linear-gradient(135deg, #78350F 0%, #D97706 100%)', category: 'creative' },

    // Industry-Specific Themes
    health: { name: 'Health', gradient: 'linear-gradient(135deg, #059669 0%, #34D399 100%)', category: 'industry' },
    education: { name: 'Education', gradient: 'linear-gradient(135deg, #0891B2 0%, #67E8F9 100%)', category: 'industry' },
    finance: { name: 'Finance', gradient: 'linear-gradient(135deg, #15803D 0%, #4ADE80 100%)', category: 'industry' },
    legal: { name: 'Legal', gradient: 'linear-gradient(135deg, #1E3A5F 0%, #64748B 100%)', category: 'industry' },

    // Minimal & Clean Themes
    minimal: { name: 'Minimal', gradient: 'linear-gradient(135deg, #111827 0%, #374151 100%)', category: 'minimal' },
    clean: { name: 'Clean', gradient: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)', category: 'minimal' },
    monochrome: { name: 'Monochrome', gradient: 'linear-gradient(135deg, #18181B 0%, #52525B 100%)', category: 'minimal' },

    // Color-Based Themes
    green: { name: 'Green', gradient: 'linear-gradient(135deg, #059669 0%, #34D399 100%)', category: 'color' },
    blue: { name: 'Blue', gradient: 'linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)', category: 'color' },
    purple: { name: 'Purple', gradient: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)', category: 'color' },
    orange: { name: 'Orange', gradient: 'linear-gradient(135deg, #EA580C 0%, #FB923C 100%)', category: 'color' },
    red: { name: 'Red', gradient: 'linear-gradient(135deg, #DC2626 0%, #F87171 100%)', category: 'color' },
    pink: { name: 'Pink', gradient: 'linear-gradient(135deg, #DB2777 0%, #F9A8D4 100%)', category: 'color' },
    teal: { name: 'Teal', gradient: 'linear-gradient(135deg, #0D9488 0%, #5EEAD4 100%)', category: 'color' },
    indigo: { name: 'Indigo', gradient: 'linear-gradient(135deg, #4338CA 0%, #818CF8 100%)', category: 'color' }
};

export type ThemeName = keyof typeof THEME_PREVIEWS;

/**
 * Get all themes grouped by category
 */
export function getThemesByCategory(): Record<string, Array<{ id: string; name: string; gradient: string }>> {
    const grouped: Record<string, Array<{ id: string; name: string; gradient: string }>> = {};

    for (const [id, theme] of Object.entries(THEME_PREVIEWS)) {
        const category = (theme as { name: string; gradient: string; category: string }).category;
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push({ id, name: theme.name, gradient: theme.gradient });
    }

    return grouped;
}
