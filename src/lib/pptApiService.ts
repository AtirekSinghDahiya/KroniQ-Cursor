/**
 * PowerPoint Generator API Service
 * Uses PowerPointGeneratorAPI.com for professional PPT generation
 */

// API Configuration
const PPT_API_AUTH_URL = 'https://auth.powerpointgeneratorapi.com/v1.0/token/create';
const PPT_API_GENERATOR_URL = 'https://gen.powerpointgeneratorapi.com/v1.0/generator/create';

// Credentials - In production, move to environment variables
const PPT_API_KEY = '1410b279-5325-4434-97c1-1d81654bc8da';
const PPT_API_USERNAME = 'atirek.sd11@gmail.com';
const PPT_API_PASSWORD = 'atireksinghdahiya';

// Token cache - tokens are valid for 24 hours
let cachedToken: { token: string; expiresAt: number } | null = null;

interface PPTSlide {
    type: 'slide';
    slide_index: number;
    shapes: {
        name: string;
        content: string;
    }[];
}

interface PPTJsonPayload {
    presentation: {
        template: string;
        export_version: string;
        resultFileName: string;
        slides: PPTSlide[];
    };
}

export interface PPTGenerationRequest {
    topic: string;
    slideCount: number;
    theme?: string;
    slides?: {
        title: string;
        content: string[];
    }[];
}

/**
 * Get authentication token from PowerPointGeneratorAPI
 * Note: User must register and provide their credentials
 */
export async function getPPTAuthToken(username: string, password: string): Promise<string> {
    // Check cache first (tokens valid for 24 hours)
    if (cachedToken && cachedToken.expiresAt > Date.now()) {
        console.log('🔑 Using cached PPT API token');
        return cachedToken.token;
    }

    console.log('🔐 Requesting new PPT API token...');

    try {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('key', PPT_API_KEY);

        const response = await fetch(PPT_API_AUTH_URL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ PPT API Auth Error:', errorText);
            throw new Error(`Authentication failed: ${response.status}`);
        }

        const data = await response.text();
        const token = data.trim();

        // Cache token for 23 hours (1 hour buffer before 24h expiry)
        cachedToken = {
            token,
            expiresAt: Date.now() + (23 * 60 * 60 * 1000)
        };

        console.log('✅ PPT API token obtained successfully');
        return token;
    } catch (error: any) {
        console.error('❌ Failed to get PPT API token:', error);
        throw new Error(`Failed to authenticate with PPT API: ${error.message}`);
    }
}

/**
 * Generate a PowerPoint presentation using the API
 */
export async function generatePPTWithAPI(
    authToken: string,
    templateFile: File | Blob,
    slides: { title: string; content: string[] }[],
    resultFileName: string = 'presentation'
): Promise<Blob> {
    console.log('📊 Generating PPT with API...', { slideCount: slides.length, resultFileName });

    // Convert slides to API format
    const pptSlides: PPTSlide[] = slides.map((slide, index) => ({
        type: 'slide',
        slide_index: index,
        shapes: [
            { name: 'Title 1', content: slide.title },
            { name: 'Content Placeholder 2', content: slide.content.join('\n• ') }
        ]
    }));

    const jsonPayload: PPTJsonPayload = {
        presentation: {
            template: 'template.pptx',
            export_version: 'Pptx2010',
            resultFileName,
            slides: pptSlides
        }
    };

    try {
        const formData = new FormData();
        formData.append('files', templateFile, 'template.pptx');
        formData.append('jsonData', JSON.stringify(jsonPayload));

        const response = await fetch(PPT_API_GENERATOR_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ PPT Generation Error:', errorText);

            if (response.status === 401) {
                // Clear cached token on auth failure
                cachedToken = null;
                throw new Error('Authentication expired. Please re-authenticate.');
            }

            throw new Error(`Generation failed: ${response.status} - ${errorText}`);
        }

        // Response is a byte array (binary data)
        const blob = await response.blob();
        console.log('✅ PPT generated successfully!', { size: blob.size });

        return blob;
    } catch (error: any) {
        console.error('❌ Failed to generate PPT:', error);
        throw new Error(`PPT generation failed: ${error.message}`);
    }
}

/**
 * Create a basic PPT template programmatically
 * This is used when no template file is provided
 */
export async function createBasicTemplate(): Promise<Blob> {
    // Import pptxgenjs for creating a basic template
    const PptxGenJS = (await import('pptxgenjs')).default;
    const pres = new PptxGenJS();

    pres.layout = 'LAYOUT_WIDE';
    pres.author = 'KroniQ AI';
    pres.company = 'KroniQ';

    // Create a title slide template
    const slide = pres.addSlide();

    // Add placeholder text boxes that the API will replace
    slide.addText('Title 1', {
        placeholder: 'title',
        x: 0.5,
        y: 2,
        w: 9,
        h: 1.5,
        fontSize: 44,
        bold: true,
        color: '363636',
        align: 'center'
    });

    slide.addText('Content Placeholder 2', {
        placeholder: 'body',
        x: 0.5,
        y: 4,
        w: 9,
        h: 3,
        fontSize: 24,
        color: '666666',
        align: 'center'
    });

    const blob = await pres.write({ outputType: 'blob' }) as Blob;
    return blob;
}

/**
 * High-level function to generate PPT (handles auth + generation)
 * Uses stored credentials by default
 */
export async function generatePresentationWithAPI(
    request: PPTGenerationRequest,
    credentials?: { username: string; password: string }
): Promise<Blob> {
    // Use stored credentials if not provided
    const creds = credentials || {
        username: PPT_API_USERNAME,
        password: PPT_API_PASSWORD
    };

    // Step 1: Get auth token
    const authToken = await getPPTAuthToken(creds.username, creds.password);

    // Step 2: Create or use template
    const template = await createBasicTemplate();

    // Step 3: Prepare slides if not provided
    const slides = request.slides || generateDefaultSlides(request.topic, request.slideCount);

    // Step 4: Generate PPT
    return await generatePPTWithAPI(authToken, template, slides, request.topic.replace(/[^a-zA-Z0-9]/g, '_'));
}

/**
 * Simple function to generate PPT with just topic and slide count
 * Uses all defaults including stored credentials
 */
export async function generatePPT(topic: string, slideCount: number = 10): Promise<Blob> {
    return generatePresentationWithAPI({ topic, slideCount });
}

/**
 * Generate default slide content based on topic
 */
function generateDefaultSlides(topic: string, count: number): { title: string; content: string[] }[] {
    const slides: { title: string; content: string[] }[] = [
        {
            title: topic,
            content: ['Professional Presentation', 'Generated by KroniQ AI']
        }
    ];

    const sections = [
        { title: 'Introduction', content: ['Overview of the topic', 'Key context and background', 'Why this matters'] },
        { title: 'Problem Statement', content: ['Current challenges', 'Impact on stakeholders', 'Need for solution'] },
        { title: 'Solution Overview', content: ['Proposed approach', 'Key benefits', 'Implementation strategy'] },
        { title: 'Key Features', content: ['Feature 1: Core capability', 'Feature 2: Unique advantage', 'Feature 3: Value proposition'] },
        { title: 'Implementation', content: ['Phase 1: Planning', 'Phase 2: Development', 'Phase 3: Deployment'] },
        { title: 'Timeline', content: ['Milestone 1: Q1', 'Milestone 2: Q2', 'Milestone 3: Q3-Q4'] },
        { title: 'Results & Metrics', content: ['Key performance indicators', 'Success metrics', 'Impact measurement'] },
        { title: 'Next Steps', content: ['Immediate actions', 'Short-term goals', 'Long-term vision'] },
        { title: 'Conclusion', content: ['Summary of key points', 'Call to action', 'Thank you for your attention'] }
    ];

    for (let i = 0; i < Math.min(count - 2, sections.length); i++) {
        slides.push(sections[i]);
    }

    slides.push({
        title: 'Thank You',
        content: ['Questions?', 'Contact us for more information']
    });

    return slides.slice(0, count);
}

/**
 * Download generated PPT file
 */
export function downloadPPT(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.pptx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('✅ PPT download triggered:', filename);
}
