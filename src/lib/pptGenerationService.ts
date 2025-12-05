import { getOpenRouterResponse } from './openRouterService';
import PptxGenJS from 'pptxgenjs';

export interface SlideContent {
  title: string;
  content: string[];
  notes?: string;
  layout?: 'title' | 'content' | 'section' | 'two-column' | 'big-number' | 'quote' | 'conclusion';
}

export interface PPTGenerationOptions {
  topic: string;
  slideCount: number;
  theme: 'professional' | 'modern' | 'creative' | 'minimal';
  includeImages?: boolean;
}

export interface GeneratedPPT {
  slides: SlideContent[];
  title: string;
  subtitle: string;
  theme: string;
}

export async function generatePPTContent(options: PPTGenerationOptions): Promise<GeneratedPPT> {
  const { topic, slideCount, theme } = options;

  console.log('🎯 Generating PPT content:', { topic, slideCount, theme });

  const prompt = `Create a professional presentation outline about "${topic}" with exactly ${slideCount} slides.

For each slide, provide:
1. Slide title (concise and clear)
2. 3-5 bullet points of content (each max 10 words)
3. Speaker notes (2-3 sentences)

Theme: ${theme}

Return the response in this exact JSON format:
{
  "title": "Main presentation title",
  "subtitle": "Brief subtitle or tagline",
  "slides": [
    {
      "title": "Slide 1 Title",
      "content": ["Point 1", "Point 2", "Point 3"],
      "notes": "Speaker notes here",
      "layout": "title"
    },
    {
      "title": "Slide 2 Title",
      "content": ["Point 1", "Point 2", "Point 3", "Point 4"],
      "notes": "Speaker notes here",
      "layout": "content"
    }
  ]
}

Guidelines:
- First slide should be title slide (layout: "title")
- Last slide should be conclusion/thank you (layout: "conclusion")
- Middle slides should be content slides (layout: "content")
- Make content professional, clear, and actionable
- Keep bullet points concise
- Include relevant details in speaker notes`;

  try {
    const response = await getOpenRouterResponse(
      prompt,
      'moonshotai/kimi-k2-thinking',
      []
    );

    console.log('✅ Received AI response');

    let pptData: GeneratedPPT;

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        pptData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      console.log('Using fallback PPT generation');
      pptData = createFallbackPPT(topic, slideCount, response);
    }

    // Ensure exact slide count
    if (pptData.slides.length < slideCount) {
      const additionalNeeded = slideCount - pptData.slides.length;
      for (let i = 0; i < additionalNeeded; i++) {
        pptData.slides.splice(pptData.slides.length - 1, 0, {
          title: `Key Point ${pptData.slides.length}`,
          content: ['Strategic insight', 'Implementation detail', 'Success metric', 'Action item'],
          notes: 'Additional speaker notes',
          layout: 'content'
        });
      }
    } else if (pptData.slides.length > slideCount) {
      pptData.slides = pptData.slides.slice(0, slideCount);
    }

    console.log('✅ PPT content generated successfully:', pptData.slides.length, 'slides');
    return pptData;

  } catch (error) {
    console.error('❌ Error generating PPT content:', error);
    console.log('⚠️ Using emergency fallback for PPT');
    return createFallbackPPT(topic, slideCount, '');
  }
}

function createFallbackPPT(topic: string, slideCount: number, aiResponse: string): GeneratedPPT {
  const slides: SlideContent[] = [];

  // Slide 1: Title slide
  slides.push({
    title: topic,
    content: ['Investor Pitch Deck', 'Powered by KroniQ AI'],
    notes: `Professional presentation about ${topic}`,
    layout: 'title'
  });

  // Calculate content slides needed (total - title - conclusion)
  const contentSlidesNeeded = slideCount - 2;

  const pitchSections = [
    { title: 'The Problem', content: ['Market pain points', 'Current solutions falling short', 'Gap in the market', 'Customer struggles'], layout: 'content' },
    { title: 'Our Solution', content: ['Innovative approach', 'Key differentiators', 'Technology advantage', 'Customer benefits'], layout: 'content' },
    { title: 'Market Opportunity', content: ['Total addressable market (TAM)', 'Target customer segments', 'Market growth trends', 'Competitive positioning'], layout: 'big-number' },
    { title: 'Business Model', content: ['Revenue streams', 'Pricing strategy', 'Customer acquisition', 'Unit economics'], layout: 'content' },
    { title: 'Product Overview', content: ['Core features', 'User experience', 'Technical innovation', 'Roadmap highlights'], layout: 'content' },
    { title: 'Traction & Metrics', content: ['Customer growth', 'Revenue milestones', 'Key partnerships', 'Market validation'], layout: 'big-number' },
    { title: 'Go-to-Market Strategy', content: ['Distribution channels', 'Marketing approach', 'Sales process', 'Growth tactics'], layout: 'content' },
    { title: 'Competitive Landscape', content: ['Main competitors', 'Our advantages', 'Barriers to entry', 'Market positioning'], layout: 'two-column' },
    { title: 'The Team', content: ['Founders & expertise', 'Advisory board', 'Key hires', 'Company culture'], layout: 'content' },
    { title: 'Financial Projections', content: ['Revenue forecast', 'Cost structure', 'Profitability timeline', 'Key assumptions'], layout: 'big-number' },
    { title: 'Funding Ask', content: ['Investment needed', 'Use of funds', 'Milestones to achieve', 'Expected outcomes'], layout: 'section' },
    { title: 'Investment Highlights', content: ['Strong value proposition', 'Proven market demand', 'Experienced team', 'Clear path to scale'], layout: 'content' },
    { title: 'Risk Mitigation', content: ['Identified risks', 'Mitigation strategies', 'Contingency plans', 'Market resilience'], layout: 'content' }
  ];

  // Add content slides
  for (let i = 0; i < contentSlidesNeeded; i++) {
    const section = pitchSections[i % pitchSections.length];
    slides.push({
      title: section.title,
      content: section.content,
      notes: `Detailed explanation of ${section.title} for ${topic}`,
      layout: section.layout as any
    });
  }

  // Last slide: Conclusion
  slides.push({
    title: 'Thank You',
    content: ['Questions?', 'Contact: info@company.com', 'Let\'s discuss next steps'],
    notes: 'Closing remarks and call to action',
    layout: 'conclusion'
  });

  console.log(`✅ Generated ${slides.length} slides (requested: ${slideCount})`);

  return {
    title: topic,
    subtitle: 'Investor Pitch Deck',
    slides,
    theme: 'professional'
  };
}

export async function generatePPTXFile(pptData: GeneratedPPT): Promise<Blob> {
  console.log('📊 Generating production-level PPTX file with', pptData.slides.length, 'slides');

  const pres = new PptxGenJS();

  pres.author = 'KroniQ AI';
  pres.company = 'KroniQ';
  pres.subject = pptData.title;
  pres.title = pptData.title;
  pres.layout = 'LAYOUT_WIDE';

  const themeConfigs = {
    professional: {
      primary: '1E3A8A',
      secondary: '3B82F6',
      accent: '60A5FA',
      text: '1F2937',
      light: 'F0F9FF',
      dark: '0F172A'
    },
    modern: {
      primary: '6366F1',
      secondary: '8B5CF6',
      accent: 'A78BFA',
      text: '1F2937',
      light: 'F5F3FF',
      dark: '1E1B4B'
    },
    creative: {
      primary: 'DC2626',
      secondary: 'F59E0B',
      accent: 'FBBF24',
      text: '1F2937',
      light: 'FEF3C7',
      dark: '7C2D12'
    },
    minimal: {
      primary: '111827',
      secondary: '374151',
      accent: '6B7280',
      text: '1F2937',
      light: 'F9FAFB',
      dark: '030712'
    }
  };

  const theme = themeConfigs[pptData.theme as keyof typeof themeConfigs] || themeConfigs.professional;

  pptData.slides.forEach((slideData, index) => {
    const slide = pres.addSlide();
    const layout = slideData.layout || 'content';

    if (layout === 'title') {
      // TITLE SLIDE - Full gradient background
      slide.background = { color: theme.primary };

      // Gradient overlay
      slide.addShape(pres.ShapeType.rect, {
        x: 0,
        y: 0,
        w: '100%',
        h: '100%',
        fill: { color: theme.primary }
      });

      // Large decorative circles
      slide.addShape(pres.ShapeType.ellipse, {
        x: 7,
        y: 3.5,
        w: 4,
        h: 4,
        fill: { color: theme.secondary, transparency: 60 }
      });

      slide.addShape(pres.ShapeType.ellipse, {
        x: -1,
        y: -1,
        w: 3,
        h: 3,
        fill: { color: theme.accent, transparency: 40 }
      });

      // Title
      slide.addText(slideData.title, {
        x: 0.7,
        y: 2.8,
        w: 8,
        h: 1.8,
        fontSize: 60,
        bold: true,
        color: 'FFFFFF',
        align: 'left',
        valign: 'middle'
      });

      // Subtitle
      if (pptData.subtitle) {
        slide.addText(pptData.subtitle, {
          x: 0.7,
          y: 4.8,
          w: 7,
          h: 0.7,
          fontSize: 28,
          color: theme.light,
          align: 'left'
        });
      }

      // Accent line
      slide.addShape(pres.ShapeType.rect, {
        x: 0.7,
        y: 4.6,
        w: 3,
        h: 0.12,
        fill: { color: theme.accent }
      });

    } else if (layout === 'section') {
      // SECTION HEADER - Bold statement slide
      slide.background = { color: theme.dark };

      // Decorative element
      slide.addShape(pres.ShapeType.ellipse, {
        x: 8,
        y: 2,
        w: 5,
        h: 5,
        fill: { color: theme.primary, transparency: 50 }
      });

      slide.addText(slideData.title, {
        x: 1,
        y: 3,
        w: 8,
        h: 1.5,
        fontSize: 52,
        bold: true,
        color: 'FFFFFF',
        align: 'left',
        valign: 'middle'
      });

      // Subtitle if content exists
      if (slideData.content.length > 0) {
        slide.addText(slideData.content.join(' • '), {
          x: 1,
          y: 4.7,
          w: 7,
          h: 0.8,
          fontSize: 20,
          color: theme.light,
          align: 'left'
        });
      }

    } else if (layout === 'big-number') {
      // BIG NUMBER/STAT SLIDE
      slide.background = { color: theme.light };

      // Header bar
      slide.addShape(pres.ShapeType.rect, {
        x: 0,
        y: 0,
        w: '100%',
        h: 0.9,
        fill: { color: theme.primary }
      });

      slide.addText(slideData.title, {
        x: 0.6,
        y: 0.2,
        w: 8,
        h: 0.5,
        fontSize: 32,
        bold: true,
        color: 'FFFFFF',
        align: 'left'
      });

      // Big number card
      slide.addShape(pres.ShapeType.rect, {
        x: 1.5,
        y: 2,
        w: 7,
        h: 3.2,
        fill: { color: 'FFFFFF' },
        line: { color: theme.primary, width: 3 }
      });

      // Content
      slideData.content.forEach((point, i) => {
        slide.addText(point, {
          x: 2,
          y: 2.4 + (i * 0.7),
          w: 6,
          h: 0.6,
          fontSize: 22,
          bold: i === 0,
          color: theme.text,
          align: 'left'
        });
      });

    } else if (layout === 'two-column') {
      // TWO COLUMN LAYOUT
      slide.background = { color: 'FFFFFF' };

      // Header
      slide.addShape(pres.ShapeType.rect, {
        x: 0,
        y: 0,
        w: '100%',
        h: 0.9,
        fill: { color: theme.primary }
      });

      slide.addText(slideData.title, {
        x: 0.6,
        y: 0.2,
        w: 8,
        h: 0.5,
        fontSize: 32,
        bold: true,
        color: 'FFFFFF'
      });

      // Left column
      slide.addShape(pres.ShapeType.rect, {
        x: 0.5,
        y: 1.5,
        w: 4.4,
        h: 4.8,
        fill: { color: theme.light }
      });

      // Right column
      slide.addShape(pres.ShapeType.rect, {
        x: 5.1,
        y: 1.5,
        w: 4.4,
        h: 4.8,
        fill: { color: 'F9FAFB' }
      });

      // Content split
      const midPoint = Math.ceil(slideData.content.length / 2);
      const leftContent = slideData.content.slice(0, midPoint);
      const rightContent = slideData.content.slice(midPoint);

      leftContent.forEach((point, i) => {
        slide.addText('• ' + point, {
          x: 0.8,
          y: 2 + (i * 0.6),
          w: 3.8,
          h: 0.5,
          fontSize: 18,
          color: theme.text
        });
      });

      rightContent.forEach((point, i) => {
        slide.addText('• ' + point, {
          x: 5.4,
          y: 2 + (i * 0.6),
          w: 3.8,
          h: 0.5,
          fontSize: 18,
          color: theme.text
        });
      });

    } else if (layout === 'conclusion') {
      // CONCLUSION SLIDE
      slide.background = { color: theme.secondary };

      // Large circle decoration
      slide.addShape(pres.ShapeType.ellipse, {
        x: 6.5,
        y: 1.5,
        w: 5,
        h: 5,
        fill: { color: theme.accent, transparency: 50 }
      });

      slide.addText(slideData.title, {
        x: 1,
        y: 2.5,
        w: 8,
        h: 1.2,
        fontSize: 56,
        bold: true,
        color: 'FFFFFF',
        align: 'center',
        valign: 'middle'
      });

      // Contact info
      slideData.content.forEach((point, i) => {
        slide.addText(point, {
          x: 1.5,
          y: 4.2 + (i * 0.5),
          w: 7,
          h: 0.4,
          fontSize: 20,
          color: 'FFFFFF',
          align: 'center'
        });
      });

    } else {
      // STANDARD CONTENT SLIDE
      slide.background = { color: 'FAFAFA' };

      // Colored header bar
      slide.addShape(pres.ShapeType.rect, {
        x: 0,
        y: 0,
        w: '100%',
        h: 0.9,
        fill: { color: theme.primary }
      });

      // Accent stripe
      slide.addShape(pres.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 0.18,
        h: 0.9,
        fill: { color: theme.accent }
      });

      // Title
      slide.addText(slideData.title, {
        x: 0.6,
        y: 0.2,
        w: 8,
        h: 0.5,
        fontSize: 34,
        bold: true,
        color: 'FFFFFF',
        align: 'left'
      });

      // Content card
      slide.addShape(pres.ShapeType.rect, {
        x: 0.7,
        y: 1.6,
        w: 8.6,
        h: 4.6,
        fill: { color: 'FFFFFF' },
        shadow: { type: 'outer', blur: 20, opacity: 0.15, offset: 5, angle: 90 }
      });

      // Bullet points
      slideData.content.forEach((point, i) => {
        slide.addText([{
          text: '◆  ',
          options: { color: theme.accent, fontSize: 16, bold: true }
        }, {
          text: point,
          options: { color: theme.text, fontSize: 20 }
        }], {
          x: 1.3,
          y: 2.1 + (i * 0.75),
          w: 7.4,
          h: 0.6
        });
      });

      // Decorative corner
      slide.addShape(pres.ShapeType.ellipse, {
        x: 8.8,
        y: -0.4,
        w: 1.5,
        h: 1.5,
        fill: { color: theme.secondary, transparency: 60 }
      });

      // Footer
      slide.addShape(pres.ShapeType.rect, {
        x: 0,
        y: 6.7,
        w: '100%',
        h: 0.8,
        fill: { color: theme.light }
      });

      slide.addText(`${index + 1}`, {
        x: 9.2,
        y: 6.85,
        w: 0.6,
        h: 0.5,
        fontSize: 18,
        bold: true,
        color: theme.primary,
        align: 'center'
      });
    }

    if (slideData.notes) {
      slide.addNotes(slideData.notes);
    }
  });

  const blob = await pres.write({ outputType: 'blob' }) as Blob;

  console.log('✅ Production PPTX generated with', pptData.slides.length, 'slides');
  return blob;
}

export function downloadPPTX(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.pptx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log('✅ Download triggered:', filename);
}
