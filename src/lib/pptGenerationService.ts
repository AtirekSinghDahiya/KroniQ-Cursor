import { getOpenRouterResponse } from './openRouterService';
import PptxGenJS from 'pptxgenjs';

export interface SlideContent {
  title: string;
  content: string[];
  notes?: string;
  layout?: 'title' | 'content' | 'section' | 'two-column' | 'big-number' | 'quote' | 'conclusion' | 'title_slide' | 'content_slide' | 'data_visualization' | 'comparison_matrix' | 'timeline_flow' | 'executive_summary' | 'market_analysis' | 'competitive_landscape' | 'financial_projection' | 'conclusion_call_to_action';
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

  const prompt = `Create an exceptional, visually stunning presentation about "${topic}" with exactly ${slideCount} slides. Design for maximum visual impact and executive-level communication.

**CRITICAL DESIGN REQUIREMENTS:**
1. **Premium Visual Design**: Each slide must have sophisticated design elements, gradients, professional layouts
2. **Executive-Level Content**: Focus on strategic insights, data-driven content, compelling narratives
3. **Modern Aesthetics**: Use ${theme} theme with contemporary design principles

**SLIDE STRUCTURE:**
For each slide, provide:
1. **Title**: Impactful, memorable headline (max 8 words)
2. **Content**: 3-6 strategic bullet points with metrics, insights, or key takeaways
3. **Visual Elements**: Describe premium design features (charts, icons, gradients, layouts)
4. **Speaker Notes**: 3-4 sentences with deep strategic analysis
5. **Layout**: Choose from: title_slide, content_slide, data_visualization, executive_summary, competitive_landscape, market_analysis, conclusion

**CONTENT FRAMEWORK:**
- **Title Slide**: Hero design with compelling hook
- **Content Slides**: Mix of data visualization, strategic insights, competitive analysis
- **Executive Summary**: High-level overview with key metrics
- **Conclusion**: Strong call-to-action with memorable close

**VISUAL EXCELLENCE:**
- Use professional color schemes matching ${theme}
- Incorporate data visualizations and strategic frameworks
- Ensure visual hierarchy with proper typography
- Include premium design elements (gradients, shadows, overlays)

Return in this exact JSON format:
{
  "title": "Premium Executive Presentation Title",
  "subtitle": "Strategic Intelligence & Market Leadership",
  "theme": "${theme}",
  "design_style": "premium_executive",
  "slides": [
    {
      "title": "Executive Strategic Overview",
      "content": ["Market opportunity: $X.XB TAM with XX% CAGR", "Competitive differentiation through proprietary technology", "Projected ROI: XXX% IRR with X-year payback"],
      "visual_elements": "Large hero image with gradient overlay, KPI dashboard, executive portrait styling",
      "notes": "This presentation represents a comprehensive strategic analysis of the ${topic} market opportunity. Our research indicates a $X.X billion total addressable market with accelerated growth driven by digital transformation trends.",
      "layout": "title_slide",
      "design_complexity": "high"
    }
  ]
}`;

  try {
    const response = await getOpenRouterResponse(
      prompt,
      [],
      undefined,
      'kimi-k2'
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
      pptData = createFallbackPPT(topic, slideCount);
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
    return createFallbackPPT(topic, slideCount);
  }
}

function createFallbackPPT(topic: string, slideCount: number): GeneratedPPT {
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
    const layout = slideData.layout || 'content_slide';

    if (layout === 'title' || layout === 'title_slide') {
      // PREMIUM TITLE SLIDE with stunning visuals
      slide.background = { color: theme.primary };

      // Full background gradient
      slide.addShape(pres.ShapeType.rect, {
        x: 0,
        y: 0,
        w: '100%',
        h: '100%',
        fill: { color: theme.primary }
      });

      // Large decorative geometric shapes
      slide.addShape(pres.ShapeType.ellipse, {
        x: 6,
        y: 2,
        w: 6,
        h: 6,
        fill: { color: theme.secondary, transparency: 30 }
      });

      slide.addShape(pres.ShapeType.ellipse, {
        x: -2,
        y: -2,
        w: 4,
        h: 4,
        fill: { color: theme.accent, transparency: 25 }
      });

      // Triangle accent
      slide.addShape(pres.ShapeType.triangle, {
        x: 8.5,
        y: 5.5,
        w: 2,
        h: 2,
        fill: { color: theme.accent, transparency: 40 }
      });

      // Main title with premium typography
      slide.addText(slideData.title, {
        x: 1,
        y: 2,
        w: 8,
        h: 2,
        fontSize: 72,
        bold: true,
        color: 'FFFFFF',
        align: 'left',
        valign: 'middle'
      });

      // Subtitle with elegant styling
      if (pptData.subtitle) {
        slide.addText(pptData.subtitle, {
          x: 1,
          y: 4.5,
          w: 7,
          h: 0.8,
          fontSize: 32,
          color: 'FFFFFF',
          align: 'left'
        });
      }

      // Decorative accent line
      slide.addShape(pres.ShapeType.rect, {
        x: 1,
        y: 5.4,
        w: 4,
        h: 0.15,
        fill: { color: theme.accent }
      });

      // Powered by branding
      slide.addText('Powered by KroniQ AI', {
        x: 7,
        y: 6.5,
        w: 3,
        h: 0.4,
        fontSize: 16,
        color: 'FFFFFF',
        transparency: 70,
        align: 'right'
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

    } else if (layout === 'content' || layout === 'content_slide') {
      // PREMIUM CONTENT SLIDE with sophisticated design
      slide.background = { color: theme.primary };

      // Full background with gradient
      slide.addShape(pres.ShapeType.rect, {
        x: 0,
        y: 0,
        w: '100%',
        h: '100%',
        fill: { color: theme.primary }
      });

      // Decorative geometric elements
      slide.addShape(pres.ShapeType.triangle, {
        x: 8.5,
        y: 0.5,
        w: 2,
        h: 2,
        fill: { color: theme.accent, transparency: 40 }
      });

      slide.addShape(pres.ShapeType.ellipse, {
        x: -1.5,
        y: 5,
        w: 3,
        h: 3,
        fill: { color: theme.secondary, transparency: 30 }
      });

      // Main content card with glassmorphism
      slide.addShape(pres.ShapeType.rect, {
        x: 1,
        y: 0.8,
        w: 8,
        h: 5.5,
        fill: { color: 'FFFFFF', transparency: 15 },
        line: { color: 'FFFFFF', width: 3, transparency: 60 },
        shadow: { type: 'outer', blur: 30, opacity: 0.2, offset: 5, angle: 90 }
      });

      // Title with premium typography
      slide.addText(slideData.title, {
        x: 1.5,
        y: 1.2,
        w: 7,
        h: 0.8,
        fontSize: 48,
        bold: true,
        color: theme.text,
        align: 'left'
      });

      // Enhanced bullet points with icons and better spacing
      slideData.content.forEach((point, i) => {
        slide.addText([{
          text: '▸  ',
          options: { color: theme.accent, fontSize: 24, bold: true }
        }, {
          text: point,
          options: { color: theme.text, fontSize: 28 }
        }], {
          x: 1.8,
          y: 2.5 + (i * 0.9),
          w: 6.5,
          h: 0.8
        });
      });

      // Accent line
      slide.addShape(pres.ShapeType.rect, {
        x: 1.5,
        y: 2.2,
        w: 4,
        h: 0.08,
        fill: { color: theme.accent }
      });

      // Slide number with elegant styling
      slide.addText(`${index + 1}`, {
        x: 8.5,
        y: 6.2,
        w: 1,
        h: 0.6,
        fontSize: 24,
        bold: true,
        color: 'FFFFFF',
        align: 'center'
      });

    } else if (layout === 'data_visualization') {
      // DATA VISUALIZATION SLIDE - Charts and metrics
      slide.background = { color: 'FFFFFF' };

      // Header with accent bar
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
        fontSize: 36,
        bold: true,
        color: 'FFFFFF'
      });

      // Data visualization area with multiple metrics
      slideData.content.forEach((point, i) => {
        const yPos = 1.5 + (i * 1.2);
        // Metric box
        slide.addShape(pres.ShapeType.rect, {
          x: 0.8,
          y: yPos,
          w: 8,
          h: 0.8,
          fill: { color: theme.light },
          line: { color: theme.primary, width: 2 }
        });

        slide.addText(point, {
          x: 1.2,
          y: yPos + 0.2,
          w: 7,
          h: 0.5,
          fontSize: 24,
          bold: true,
          color: theme.primary
        });
      });

    } else if (layout === 'comparison_matrix') {
      // COMPARISON MATRIX SLIDE
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
        fontSize: 36,
        bold: true,
        color: 'FFFFFF'
      });

      // Comparison table
      const items = slideData.content;
      items.forEach((item, i) => {
        const yPos = 1.2 + (i * 0.8);
        slide.addShape(pres.ShapeType.rect, {
          x: 0.5,
          y: yPos,
          w: 9,
          h: 0.7,
          fill: { color: i % 2 === 0 ? theme.light : 'F9FAFB' },
          line: { color: theme.primary, width: 1 }
        });

        slide.addText(item, {
          x: 0.8,
          y: yPos + 0.2,
          w: 8,
          h: 0.4,
          fontSize: 20,
          color: theme.text
        });
      });

    } else if (layout === 'timeline_flow') {
      // TIMELINE FLOW SLIDE
      slide.background = { color: theme.light };

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
        fontSize: 36,
        bold: true,
        color: 'FFFFFF'
      });

      // Timeline elements
      slideData.content.forEach((point, i) => {
        const xPos = 0.5 + (i * 2.2);
        // Timeline dot
        slide.addShape(pres.ShapeType.ellipse, {
          x: xPos,
          y: 1.5,
          w: 0.3,
          h: 0.3,
          fill: { color: theme.accent }
        });

        // Timeline line
        if (i < slideData.content.length - 1) {
          slide.addShape(pres.ShapeType.rect, {
            x: xPos + 0.3,
            y: 1.65,
            w: 1.9,
            h: 0.05,
            fill: { color: theme.accent }
          });
        }

        // Content
        slide.addText(point, {
          x: xPos - 0.8,
          y: 2.2,
          w: 2.5,
          h: 1,
          fontSize: 16,
          color: theme.text,
          align: 'center'
        });
      });

    } else if (layout === 'executive_summary') {
      // EXECUTIVE SUMMARY SLIDE - Premium design
      slide.background = { color: theme.primary };

      // Decorative elements
      slide.addShape(pres.ShapeType.ellipse, {
        x: 7,
        y: 1,
        w: 4,
        h: 4,
        fill: { color: theme.secondary, transparency: 30 }
      });

      slide.addShape(pres.ShapeType.ellipse, {
        x: -1,
        y: -1,
        w: 3,
        h: 3,
        fill: { color: theme.accent, transparency: 20 }
      });

      slide.addText(slideData.title, {
        x: 0.7,
        y: 1,
        w: 8,
        h: 1,
        fontSize: 48,
        bold: true,
        color: 'FFFFFF'
      });

      // Summary points in elegant layout
      slideData.content.forEach((point, i) => {
        slide.addText(`✓ ${point}`, {
          x: 0.7,
          y: 2.5 + (i * 0.5),
          w: 7,
          h: 0.4,
          fontSize: 24,
          color: 'FFFFFF'
        });
      });

    } else if (layout === 'market_analysis') {
      // MARKET ANALYSIS SLIDE
      slide.background = { color: 'FFFFFF' };

      // Header with market focus
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
        fontSize: 36,
        bold: true,
        color: 'FFFFFF'
      });

      // Market data visualization
      slideData.content.forEach((point, i) => {
        const yPos = 1.5 + (i * 0.8);
        // Data card
        slide.addShape(pres.ShapeType.rect, {
          x: 0.5,
          y: yPos,
          w: 4,
          h: 0.6,
          fill: { color: theme.light },
          line: { color: theme.primary, width: 2 }
        });

        slide.addText(point, {
          x: 0.8,
          y: yPos + 0.2,
          w: 3.4,
          h: 0.3,
          fontSize: 18,
          color: theme.text
        });
      });

    } else if (layout === 'competitive_landscape') {
      // COMPETITIVE LANDSCAPE SLIDE
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
        fontSize: 36,
        bold: true,
        color: 'FFFFFF'
      });

      // Competitive matrix
      const competitors = slideData.content;
      competitors.forEach((competitor, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const xPos = 0.5 + (col * 4.5);
        const yPos = 1.5 + (row * 1);

        slide.addShape(pres.ShapeType.rect, {
          x: xPos,
          y: yPos,
          w: 4,
          h: 0.8,
          fill: { color: theme.light },
          line: { color: theme.primary, width: 2 }
        });

        slide.addText(competitor, {
          x: xPos + 0.2,
          y: yPos + 0.2,
          w: 3.6,
          h: 0.5,
          fontSize: 16,
          color: theme.text
        });
      });

    } else if (layout === 'financial_projection') {
      // FINANCIAL PROJECTION SLIDE
      slide.background = { color: 'FFFFFF' };

      // Header with financial theme
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
        fontSize: 36,
        bold: true,
        color: 'FFFFFF'
      });

      // Financial metrics
      slideData.content.forEach((point, i) => {
        const yPos = 1.5 + (i * 0.7);
        // Financial card
        slide.addShape(pres.ShapeType.rect, {
          x: 0.5,
          y: yPos,
          w: 9,
          h: 0.6,
          fill: { color: theme.light },
          line: { color: theme.primary, width: 2 }
        });

        slide.addText(point, {
          x: 0.8,
          y: yPos + 0.2,
          w: 8,
          h: 0.3,
          fontSize: 20,
          bold: true,
          color: theme.primary
        });
      });

    } else if (layout === 'conclusion_call_to_action' || layout === 'conclusion' || layout === 'quote') {
      // CONCLUSION & CALL TO ACTION SLIDE
      slide.background = { color: theme.secondary };

      // Large decorative element
      slide.addShape(pres.ShapeType.ellipse, {
        x: 6,
        y: 1,
        w: 6,
        h: 6,
        fill: { color: theme.accent, transparency: 40 }
      });

      slide.addText(slideData.title, {
        x: 1,
        y: 1.5,
        w: 8,
        h: 1.2,
        fontSize: 56,
        bold: true,
        color: 'FFFFFF',
        align: 'center'
      });

      // Call to action points
      slideData.content.forEach((point, i) => {
        slide.addText(point, {
          x: 1.5,
          y: 3.5 + (i * 0.6),
          w: 7,
          h: 0.5,
          fontSize: 24,
          color: 'FFFFFF',
          align: 'center'
        });
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
