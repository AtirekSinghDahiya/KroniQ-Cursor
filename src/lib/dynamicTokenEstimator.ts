/**
 * Dynamic Token Estimator
 * Uses AI to intelligently estimate token costs based on prompt complexity
 */

export interface PromptComplexity {
  level: 'minimal' | 'small' | 'medium' | 'large' | 'huge';
  estimatedTokens: number;
  reasoning: string;
  features: string[];
}

export class DynamicTokenEstimator {
  /**
   * Analyze prompt complexity and estimate tokens
   */
  static analyzePromptComplexity(prompt: string, type: 'chat' | 'image' | 'video' | 'music' | 'voiceover' | 'ppt' = 'chat'): PromptComplexity {
    const wordCount = prompt.trim().split(/\s+/).length;
    const charCount = prompt.length;
    const hasCodeBlock = /```[\s\S]*```/.test(prompt);
    const hasMultipleQuestions = (prompt.match(/\?/g) || []).length > 1;
    const hasDetailedRequirements = /detail|specific|include|must|should|requirement/i.test(prompt);
    const hasComplexRequest = /analyze|compare|explain|create|build|design|develop/i.test(prompt);
    const lines = prompt.split('\n').length;

    let complexity: 'minimal' | 'small' | 'medium' | 'large' | 'huge';
    let baseTokens: number;
    let features: string[] = [];

    // Type-specific base costs
    const typeCosts = {
      chat: 1,
      image: 2,
      video: 5,
      music: 3,
      voiceover: 2,
      ppt: 3
    };

    const multiplier = typeCosts[type] || 1;

    // Analyze features
    if (hasCodeBlock) features.push('code_generation');
    if (hasMultipleQuestions) features.push('multi_part_query');
    if (hasDetailedRequirements) features.push('detailed_specs');
    if (hasComplexRequest) features.push('complex_task');
    if (lines > 5) features.push('multi_line_prompt');

    // Determine complexity based on characteristics
    if (wordCount < 10 && !hasCodeBlock && !hasDetailedRequirements) {
      complexity = 'minimal';
      baseTokens = 200 * multiplier;
    } else if (wordCount < 30 && features.length < 2) {
      complexity = 'small';
      baseTokens = 400 * multiplier;
    } else if (wordCount < 80 && features.length < 3) {
      complexity = 'medium';
      baseTokens = 800 * multiplier;
    } else if (wordCount < 200 || features.length < 4) {
      complexity = 'large';
      baseTokens = 1500 * multiplier;
    } else {
      complexity = 'huge';
      baseTokens = 3000 * multiplier;
    }

    // Add bonus tokens for specific features
    let featureBonus = 0;
    if (hasCodeBlock) featureBonus += 300 * multiplier;
    if (hasDetailedRequirements) featureBonus += 200 * multiplier;
    if (hasComplexRequest) featureBonus += 150 * multiplier;

    const estimatedTokens = Math.ceil(baseTokens + featureBonus);

    const reasoning = this.generateReasoning(complexity, wordCount, features, type);

    return {
      level: complexity,
      estimatedTokens,
      reasoning,
      features
    };
  }

  private static generateReasoning(
    complexity: string,
    wordCount: number,
    features: string[],
    type: string
  ): string {
    const typeNames = {
      chat: 'chat message',
      image: 'image generation',
      video: 'video generation',
      music: 'music generation',
      voiceover: 'voiceover generation',
      ppt: 'presentation generation'
    };

    let reason = `${complexity.toUpperCase()} complexity ${typeNames[type as keyof typeof typeNames] || 'request'} (${wordCount} words)`;

    if (features.length > 0) {
      reason += `. Features: ${features.join(', ')}`;
    }

    return reason;
  }

  /**
   * Estimate cost for chat messages with context
   */
  static estimateChatCost(
    prompt: string,
    conversationHistory?: Array<{ role: string; content: string }>,
    hasSystemPrompt: boolean = false
  ): number {
    const promptAnalysis = this.analyzePromptComplexity(prompt, 'chat');
    let totalTokens = promptAnalysis.estimatedTokens;

    // Add context tokens
    if (conversationHistory && conversationHistory.length > 0) {
      const contextTokens = conversationHistory.reduce((sum, msg) => {
        return sum + this.analyzePromptComplexity(msg.content, 'chat').estimatedTokens;
      }, 0);

      // Only count last 10 messages for context (most models use windowing)
      totalTokens += Math.min(contextTokens, 5000);
    }

    if (hasSystemPrompt) {
      totalTokens += 150; // Average system prompt size
    }

    // Estimate response tokens (usually 1.5x to 2x the input)
    const estimatedResponseTokens = Math.min(totalTokens * 1.5, 4000);

    return Math.ceil(totalTokens + estimatedResponseTokens);
  }

  /**
   * Estimate cost for image generation
   */
  static estimateImageCost(prompt: string, aspectRatio?: string, quality?: string): number {
    const baseAnalysis = this.analyzePromptComplexity(prompt, 'image');
    let tokens = baseAnalysis.estimatedTokens;

    // Add quality modifiers
    if (quality === 'high' || quality === 'hd') {
      tokens *= 1.5;
    }

    // Add aspect ratio modifiers (wide/tall images may need more processing)
    if (aspectRatio && (aspectRatio.includes('16:9') || aspectRatio.includes('9:16'))) {
      tokens *= 1.2;
    }

    // Image generation base cost
    tokens += 1000;

    return Math.ceil(tokens);
  }

  /**
   * Estimate cost for video generation
   */
  static estimateVideoCost(prompt: string, duration: number = 5): number {
    const baseAnalysis = this.analyzePromptComplexity(prompt, 'video');
    let tokens = baseAnalysis.estimatedTokens;

    // Video generation is expensive - base cost
    tokens += 5000;

    // Duration multiplier (per second)
    tokens += duration * 200;

    return Math.ceil(tokens);
  }

  /**
   * Estimate cost for music generation
   */
  static estimateMusicCost(prompt: string, duration: number = 30): number {
    const baseAnalysis = this.analyzePromptComplexity(prompt, 'music');
    let tokens = baseAnalysis.estimatedTokens;

    // Music generation base cost
    tokens += 2000;

    // Duration multiplier (per second)
    tokens += duration * 50;

    return Math.ceil(tokens);
  }

  /**
   * Estimate cost for voiceover generation
   */
  static estimateVoiceoverCost(text: string, voiceId?: string): number {
    const wordCount = text.trim().split(/\s+/).length;

    // Base cost per word
    let tokens = wordCount * 10;

    // Minimum cost
    tokens = Math.max(tokens, 300);

    // Premium voice multiplier
    if (voiceId && voiceId.includes('premium')) {
      tokens *= 1.5;
    }

    return Math.ceil(tokens);
  }

  /**
   * Estimate cost for PPT generation
   */
  static estimatePPTCost(prompt: string, slideCount: number = 5): number {
    const baseAnalysis = this.analyzePromptComplexity(prompt, 'ppt');
    let tokens = baseAnalysis.estimatedTokens;

    // PPT generation base cost
    tokens += 1500;

    // Cost per slide
    tokens += slideCount * 300;

    return Math.ceil(tokens);
  }

  /**
   * Get human-readable cost estimate
   */
  static formatCostEstimate(tokens: number): string {
    const messages = Math.floor(tokens / 500);

    if (tokens < 500) {
      return `~${tokens} tokens (less than 1 message)`;
    } else if (messages < 5) {
      return `~${tokens} tokens (${messages} messages)`;
    } else {
      return `~${tokens} tokens (${messages} messages)`;
    }
  }

  /**
   * Get cost in USD
   */
  static tokensToUSD(tokens: number): number {
    // 1,000,000 tokens = $1 USD (our internal rate)
    return tokens / 1000000;
  }

  /**
   * Get color indicator for cost level
   */
  static getCostColorClass(tokens: number): string {
    if (tokens < 500) return 'text-green-500';
    if (tokens < 1500) return 'text-blue-500';
    if (tokens < 3000) return 'text-yellow-500';
    if (tokens < 6000) return 'text-orange-500';
    return 'text-red-500';
  }
}
