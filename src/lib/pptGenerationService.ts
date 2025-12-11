import { getOpenRouterResponse } from './openRouterService';
import PptxGenJS from 'pptxgenjs';
import { getThemeColors } from './pptThemeIntelligence';

export interface SlideContent {
  title: string;
  content: string[];
  notes?: string;
  layout?: 'title' | 'content' | 'section' | 'two-column' | 'big-number' | 'quote' | 'conclusion' | 'title_slide' | 'content_slide' | 'data_visualization' | 'comparison_matrix' | 'timeline_flow' | 'executive_summary' | 'market_analysis' | 'competitive_landscape' | 'financial_projection' | 'conclusion_call_to_action';
  backgroundImage?: string;
}

export interface PPTGenerationOptions {
  topic: string;
  slideCount: number;
  theme: string; // Now accepts any theme from pptThemeIntelligence
  includeImages?: boolean;
}

export interface GeneratedPPT {
  slides: SlideContent[];
  title: string;
  subtitle: string;
  theme: string;
}

// Classify the presentation type based on the topic
function classifyPresentationType(topic: string): 'educational' | 'business' | 'research' | 'creative' | 'technical' {
  const lowerTopic = topic.toLowerCase();

  // Educational keywords
  const educationalKeywords = [
    'what is', 'how does', 'explain', 'learn', 'teach', 'study', 'history of',
    'introduction to', 'basics of', 'fundamentals', 'theory', 'science', 'physics',
    'chemistry', 'biology', 'mathematics', 'geography', 'astronomy', 'black hole',
    'universe', 'evolution', 'climate', 'ecosystem', 'anatomy', 'literature',
    'philosophy', 'psychology', 'sociology', 'economics basics', 'world war',
    'ancient', 'civilization', 'art history', 'music theory', 'language'
  ];

  // Business keywords
  const businessKeywords = [
    'pitch', 'investor', 'startup', 'business model', 'revenue', 'market size',
    'tam', 'sam', 'som', 'funding', 'investment', 'company', 'enterprise',
    'b2b', 'b2c', 'saas', 'strategy', 'growth', 'roi', 'kpi', 'metrics',
    'sales', 'marketing', 'product launch', 'quarterly', 'annual report'
  ];

  // Research keywords
  const researchKeywords = [
    'research', 'study', 'analysis', 'findings', 'methodology', 'hypothesis',
    'conclusion', 'data', 'survey', 'experiment', 'thesis', 'dissertation',
    'academic', 'paper', 'journal', 'peer review', 'statistics'
  ];

  // Technical keywords
  const technicalKeywords = [
    'api', 'code', 'programming', 'software', 'architecture', 'database',
    'algorithm', 'framework', 'devops', 'cloud', 'infrastructure', 'machine learning',
    'ai', 'artificial intelligence', 'neural network', 'blockchain', 'cybersecurity'
  ];

  // Check each category
  for (const keyword of businessKeywords) {
    if (lowerTopic.includes(keyword)) return 'business';
  }

  for (const keyword of technicalKeywords) {
    if (lowerTopic.includes(keyword)) return 'technical';
  }

  for (const keyword of researchKeywords) {
    if (lowerTopic.includes(keyword)) return 'research';
  }

  for (const keyword of educationalKeywords) {
    if (lowerTopic.includes(keyword)) return 'educational';
  }

  // Default to educational for general topics
  return 'educational';
}

// Get appropriate prompt based on presentation type
function getPresentationPrompt(topic: string, slideCount: number, theme: string, type: string): string {
  const baseRequirements = `
**CRITICAL JSON FORMAT - MUST RETURN VALID JSON:**
{
  "title": "Your Title Here",
  "subtitle": "Subtitle Here",
  "theme": "${theme}",
  "slides": [
    {
      "title": "Slide Title",
      "content": ["Point 1", "Point 2", "Point 3", "Point 4"],
      "notes": "Speaker notes",
      "layout": "content_slide"
    }
  ]
}

**AVAILABLE LAYOUTS (use variety):**
- "title_slide": Opening slide (use for slide 1)
- "content_slide": Standard bullet points
- "section": Bold section divider
- "big-number": Highlight key fact/statistic
- "two-column": Compare/contrast
- "data_visualization": Charts/metrics focus
- "timeline_flow": Chronological/process
- "conclusion": Final slide (use for last slide)`;

  if (type === 'educational') {
    return `You are an expert educator and presentation designer. Create an informative, engaging educational presentation about "${topic}" with exactly ${slideCount} slides.

**GOAL:** Teach the audience about ${topic} in a clear, structured way. Make complex concepts understandable.

**STRUCTURE FOR EDUCATIONAL PRESENTATION:**
1. **Title Slide**: Engaging title about the topic
2. **Introduction**: What is ${topic}? Brief overview
3. **Key Concepts**: Core ideas and definitions
4. **Deep Dive**: Detailed explanation of main aspects
5. **Examples/Facts**: Real-world examples, interesting facts
6. **How It Works**: Process, mechanism, or system explained
7. **Importance/Impact**: Why does this matter?
8. **Applications**: Where is this used/relevant?
9. **Fun Facts**: Surprising or interesting information
10. **Summary**: Key takeaways and conclusions

**CONTENT REQUIREMENTS:**
- Use FACTUAL, ACCURATE information
- Include specific numbers, dates, measurements where relevant
- Use clear, educational language
- Add interesting facts to engage the audience
- Each bullet should be informative and substantive
- NO business jargon or investor language

${baseRequirements}`;
  }

  if (type === 'business') {
    return `You are an elite McKinsey presentation designer. Create a stunning investor pitch deck about "${topic}" with exactly ${slideCount} slides.

**STRUCTURE FOR BUSINESS PITCH:**
1. **Title Slide**: Company name and tagline
2. **Problem**: Market pain point
3. **Solution**: Your offering
4. **Market Size**: TAM/SAM/SOM
5. **Product**: Features and benefits
6. **Business Model**: Revenue streams
7. **Traction**: Key metrics
8. **Competition**: Competitive advantage
9. **Team**: Key people
10. **Ask**: Investment needed

**CONTENT REQUIREMENTS:**
- Include metrics: "$XX.XM", "XX%", "XXx"
- Power words: "Disrupt", "10x", "First-ever"
- Specific numbers and data points
- Professional, confident tone

${baseRequirements}`;
  }

  if (type === 'research') {
    return `You are an academic research presentation expert. Create a professional research presentation about "${topic}" with exactly ${slideCount} slides.

**STRUCTURE FOR RESEARCH:**
1. **Title Slide**: Research title and authors
2. **Abstract**: Brief overview
3. **Background**: Context and literature
4. **Methodology**: Research approach
5. **Data/Analysis**: Key findings
6. **Results**: Main outcomes
7. **Discussion**: Interpretation
8. **Limitations**: Scope boundaries
9. **Future Work**: Next steps
10. **Conclusion**: Summary and implications

**CONTENT REQUIREMENTS:**
- Academic tone
- Data-driven points
- Cite methodology
- Clear structure

${baseRequirements}`;
  }

  if (type === 'technical') {
    return `You are a technical documentation expert. Create a clear technical presentation about "${topic}" with exactly ${slideCount} slides.

**STRUCTURE FOR TECHNICAL:**
1. **Title Slide**: Technology/system name
2. **Overview**: What it is
3. **Architecture**: System design
4. **Components**: Key parts
5. **How It Works**: Technical flow
6. **Features**: Capabilities
7. **Implementation**: How to use
8. **Best Practices**: Recommendations
9. **Challenges**: Known issues
10. **Next Steps**: Roadmap

**CONTENT REQUIREMENTS:**
- Technical accuracy
- Clear terminology
- Logical flow
- Practical examples

${baseRequirements}`;
  }

  // Default creative/general
  return `You are a creative presentation designer. Create an engaging, visually-oriented presentation about "${topic}" with exactly ${slideCount} slides.

**STRUCTURE:**
1. **Title Slide**: Creative, attention-grabbing title
2. **Introduction**: Hook the audience
3. **Main Content**: 6-8 slides of key information
4. **Conclusion**: Memorable takeaway

**CONTENT REQUIREMENTS:**
- Engaging and creative
- Visual-first mindset
- Clear messaging
- Memorable points

${baseRequirements}`;
}

export async function generatePPTContent(options: PPTGenerationOptions): Promise<GeneratedPPT> {
  const { topic, slideCount, theme } = options;

  console.log('🎯 Generating PPT content:', { topic, slideCount, theme });

  // Step 1: Classify the presentation type
  const presentationType = classifyPresentationType(topic);
  console.log('📊 Detected presentation type:', presentationType);

  // Step 2: Get the appropriate prompt
  const prompt = getPresentationPrompt(topic, slideCount, theme, presentationType);

  try {
    const response = await getOpenRouterResponse(
      prompt,
      [],
      undefined,
      'deepseek-chat-v3-0324' // Using DeepSeek for better educational content
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
      pptData = createFallbackPPT(topic, slideCount, presentationType);
    }

    // Ensure exact slide count
    if (pptData.slides.length < slideCount) {
      const additionalNeeded = slideCount - pptData.slides.length;
      for (let i = 0; i < additionalNeeded; i++) {
        pptData.slides.splice(pptData.slides.length - 1, 0, {
          title: `Additional Information ${i + 1}`,
          content: ['Key point about ' + topic, 'Important detail', 'Relevant example', 'Supporting fact'],
          notes: 'Additional content',
          layout: 'content_slide'
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
    return createFallbackPPT(topic, slideCount, classifyPresentationType(topic));
  }
}

function createFallbackPPT(topic: string, slideCount: number, type: string = 'educational'): GeneratedPPT {
  const slides: SlideContent[] = [];

  // Get appropriate subtitle based on type
  const subtitles: Record<string, string> = {
    educational: 'Educational Presentation',
    business: 'Business Proposal',
    research: 'Research Findings',
    technical: 'Technical Overview',
    creative: 'Creative Presentation'
  };

  // Slide 1: Title slide
  slides.push({
    title: topic,
    content: [subtitles[type] || 'Presentation', 'Powered by KroniQ AI'],
    notes: `Professional presentation about ${topic}`,
    layout: 'title_slide'
  });

  // Calculate content slides needed (total - title - conclusion)
  const contentSlidesNeeded = slideCount - 2;

  // Different sections based on presentation type
  const sectionsByType: Record<string, Array<{ title: string; content: string[]; layout: string }>> = {
    educational: [
      { title: 'Introduction', content: [`What is ${topic}?`, 'Brief overview and context', 'Why this topic matters', 'Learning objectives'], layout: 'content_slide' },
      { title: 'Key Concepts', content: ['Core idea #1', 'Core idea #2', 'Core idea #3', 'How they connect'], layout: 'content_slide' },
      { title: 'Important Facts', content: ['Interesting fact about the topic', 'Key statistic', 'Real-world example', 'Common misconception'], layout: 'big-number' },
      { title: 'How It Works', content: ['Step 1: Process begins', 'Step 2: Development', 'Step 3: Outcome', 'Key mechanisms'], layout: 'timeline_flow' },
      { title: 'Real-World Examples', content: ['Example 1: Application', 'Example 2: Use case', 'Example 3: Impact', 'Lessons learned'], layout: 'two-column' },
      { title: 'Why It Matters', content: ['Impact on daily life', 'Future implications', 'Global significance', 'Personal relevance'], layout: 'content_slide' },
      { title: 'Fun Facts', content: ['Surprising fact #1', 'Surprising fact #2', 'Little-known detail', 'Interesting trivia'], layout: 'big-number' },
      { title: 'Key Takeaways', content: ['Main learning point 1', 'Main learning point 2', 'Main learning point 3', 'Remember this'], layout: 'content_slide' }
    ],
    business: [
      { title: 'The Problem', content: ['Market pain points', 'Current solutions falling short', 'Gap in the market', 'Customer struggles'], layout: 'content_slide' },
      { title: 'Our Solution', content: ['Innovative approach', 'Key differentiators', 'Technology advantage', 'Customer benefits'], layout: 'content_slide' },
      { title: 'Market Opportunity', content: ['Total addressable market', 'Target customer segments', 'Market growth trends', 'Competitive positioning'], layout: 'big-number' },
      { title: 'Business Model', content: ['Revenue streams', 'Pricing strategy', 'Customer acquisition', 'Unit economics'], layout: 'content_slide' },
      { title: 'Traction & Metrics', content: ['Customer growth', 'Revenue milestones', 'Key partnerships', 'Market validation'], layout: 'big-number' },
      { title: 'Competitive Landscape', content: ['Main competitors', 'Our advantages', 'Barriers to entry', 'Market positioning'], layout: 'two-column' },
      { title: 'The Team', content: ['Founders & expertise', 'Advisory board', 'Key hires', 'Company culture'], layout: 'content_slide' },
      { title: 'Investment Ask', content: ['Funding needed', 'Use of funds', 'Milestones to achieve', 'Expected returns'], layout: 'section' }
    ],
    research: [
      { title: 'Research Background', content: ['Context and motivation', 'Literature review', 'Research gap', 'Significance of study'], layout: 'content_slide' },
      { title: 'Methodology', content: ['Research design', 'Data collection methods', 'Sample size and selection', 'Analysis approach'], layout: 'content_slide' },
      { title: 'Key Findings', content: ['Finding 1', 'Finding 2', 'Finding 3', 'Statistical significance'], layout: 'big-number' },
      { title: 'Data Analysis', content: ['Quantitative results', 'Qualitative insights', 'Pattern identification', 'Correlation findings'], layout: 'data_visualization' },
      { title: 'Discussion', content: ['Interpretation of results', 'Comparison with prior work', 'Implications', 'Unexpected findings'], layout: 'content_slide' },
      { title: 'Limitations', content: ['Scope limitations', 'Methodology constraints', 'Data limitations', 'Future considerations'], layout: 'content_slide' },
      { title: 'Future Directions', content: ['Recommended next steps', 'Extended research areas', 'Policy implications', 'Practical applications'], layout: 'content_slide' },
      { title: 'Conclusions', content: ['Key contribution 1', 'Key contribution 2', 'Impact statement', 'Final remarks'], layout: 'content_slide' }
    ],
    technical: [
      { title: 'Technical Overview', content: ['System description', 'Core functionality', 'Key components', 'Architecture summary'], layout: 'content_slide' },
      { title: 'Architecture', content: ['System layers', 'Component interactions', 'Data flow', 'Integration points'], layout: 'two-column' },
      { title: 'Key Features', content: ['Feature 1: Capability', 'Feature 2: Performance', 'Feature 3: Scalability', 'Feature 4: Security'], layout: 'content_slide' },
      { title: 'Implementation', content: ['Setup requirements', 'Configuration steps', 'Deployment process', 'Best practices'], layout: 'timeline_flow' },
      { title: 'Performance Metrics', content: ['Benchmark 1', 'Benchmark 2', 'Comparison data', 'Optimization results'], layout: 'data_visualization' },
      { title: 'Best Practices', content: ['Recommendation 1', 'Recommendation 2', 'Common pitfalls', 'Optimization tips'], layout: 'content_slide' },
      { title: 'Troubleshooting', content: ['Common issue 1', 'Common issue 2', 'Debugging tips', 'Support resources'], layout: 'content_slide' },
      { title: 'Roadmap', content: ['Planned feature 1', 'Planned feature 2', 'Timeline', 'Version updates'], layout: 'timeline_flow' }
    ],
    creative: [
      { title: 'The Vision', content: ['Creative concept', 'Inspiration sources', 'Core message', 'Target audience'], layout: 'content_slide' },
      { title: 'Key Ideas', content: ['Idea 1', 'Idea 2', 'Idea 3', 'Connection theme'], layout: 'content_slide' },
      { title: 'Story', content: ['Beginning', 'Development', 'Climax', 'Resolution'], layout: 'timeline_flow' },
      { title: 'Highlights', content: ['Key moment 1', 'Key moment 2', 'Memorable element', 'Impact point'], layout: 'big-number' },
      { title: 'Details', content: ['Detail 1', 'Detail 2', 'Detail 3', 'Supporting elements'], layout: 'content_slide' },
      { title: 'Impact', content: ['Emotional impact', 'Visual impact', 'Message impact', 'Lasting impression'], layout: 'content_slide' }
    ]
  };

  const sections = sectionsByType[type] || sectionsByType.educational;

  // Add content slides
  for (let i = 0; i < contentSlidesNeeded; i++) {
    const section = sections[i % sections.length];
    slides.push({
      title: section.title,
      content: section.content,
      notes: `Detailed explanation of ${section.title} for ${topic}`,
      layout: section.layout as any
    });
  }

  // Last slide: Conclusion
  const conclusions: Record<string, string[]> = {
    educational: ['Key Takeaways', `Remember: ${topic} matters`, 'Questions?', 'Thank you for learning!'],
    business: ['Questions?', 'Contact us to learn more', 'Let\'s discuss next steps', 'Thank you!'],
    research: ['Summary of Findings', 'Implications for the field', 'Questions & Discussion', 'Thank you!'],
    technical: ['Summary', 'Resources & Documentation', 'Q&A', 'Thank you!'],
    creative: ['The End', 'Thank you for your attention', 'Let\'s connect', 'Questions?']
  };

  slides.push({
    title: 'Thank You',
    content: conclusions[type] || conclusions.educational,
    notes: 'Closing remarks',
    layout: 'conclusion'
  });

  console.log(`✅ Generated ${slides.length} fallback slides (requested: ${slideCount}) - Type: ${type}`);

  return {
    title: topic,
    subtitle: subtitles[type] || 'Presentation',
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

  // Get theme colors from pptThemeIntelligence - supports all 35+ themes
  const theme = getThemeColors(pptData.theme);

  // Auto-assign varied layouts if all slides have same layout
  const layouts = pptData.slides.map(s => s.layout);
  const uniqueLayouts = new Set(layouts);

  pptData.slides.forEach((slideData, index) => {
    const slide = pres.addSlide();

    // Auto-vary layouts if only 1-2 unique layouts exist
    let layout = slideData.layout || 'content_slide';
    if (uniqueLayouts.size <= 2 && index > 0 && index < pptData.slides.length - 1) {
      // Cycle through different visual styles for middle slides
      const styleIndex = index % 4;
      if (styleIndex === 0) layout = 'big-number';
      else if (styleIndex === 1) layout = 'two-column';
      else if (styleIndex === 2) layout = 'data_visualization';
      else layout = 'content_slide';
    }

    // First slide always title, last always conclusion
    if (index === 0) layout = 'title_slide';
    if (index === pptData.slides.length - 1) layout = 'conclusion';

    // Use consistent theme colors across all slides (no alternating)

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
      // SECTION HEADER - Bold statement slide with consistent theme
      slide.background = { color: theme.primary };

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
      // BIG NUMBER/STAT SLIDE with consistent theme
      slide.background = { color: theme.primary };

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
      // TWO COLUMN LAYOUT with consistent theme
      slide.background = { color: theme.primary };

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
      // CONCLUSION SLIDE with consistent theme
      slide.background = { color: theme.primary };

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
      // PREMIUM CONTENT SLIDE with consistent design
      slide.background = { color: theme.primary };

      // Full background with color
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
      // DATA VISUALIZATION SLIDE - Charts and metrics with consistent theme
      slide.background = { color: theme.primary };

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
      // COMPARISON MATRIX SLIDE with consistent theme
      slide.background = { color: theme.primary };

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
      // TIMELINE FLOW SLIDE with consistent theme
      slide.background = { color: theme.primary };

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
      // MARKET ANALYSIS SLIDE with consistent theme
      slide.background = { color: theme.primary };

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
      // COMPETITIVE LANDSCAPE SLIDE with consistent theme
      slide.background = { color: theme.primary };

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
      // FINANCIAL PROJECTION SLIDE with consistent theme
      slide.background = { color: theme.primary };

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

    } else if (layout === 'conclusion_call_to_action' || layout === 'conclusion') {
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
  // Ensure proper MIME type for PPTX
  const pptxBlob = new Blob([blob], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  });

  // Clean filename: remove special characters, ensure no double extensions
  let cleanFilename = filename
    .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters
    .replace(/\s+/g, '_')              // Replace spaces with underscores
    .replace(/_+/g, '_')               // Remove multiple underscores
    .trim();

  // Ensure filename is not empty
  if (!cleanFilename) {
    cleanFilename = 'presentation';
  }

  // Add timestamp to make filename unique
  const timestamp = new Date().toISOString().slice(0, 10);
  const finalFilename = `${cleanFilename}_${timestamp}.pptx`;

  const url = URL.createObjectURL(pptxBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);

  console.log('✅ Download triggered:', finalFilename);
}
