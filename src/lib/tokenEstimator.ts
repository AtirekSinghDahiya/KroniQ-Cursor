export class TokenEstimator {
  static estimateTokens(text: string): number {
    if (!text) return 0;

    const charCount = text.length;
    const wordCount = text.trim().split(/\s+/).length;

    const tokensFromChars = charCount / 4;
    const tokensFromWords = wordCount * 1.3;

    const estimatedTokens = Math.ceil((tokensFromChars + tokensFromWords) / 2);

    return Math.max(estimatedTokens, 1);
  }

  static estimateTokensForConversation(
    userMessage: string,
    systemPrompt?: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): { inputTokens: number; estimatedOutputTokens: number; totalTokens: number } {
    let inputTokens = this.estimateTokens(userMessage);

    if (systemPrompt) {
      inputTokens += this.estimateTokens(systemPrompt);
    }

    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        inputTokens += this.estimateTokens(msg.content);
      });
    }

    const estimatedOutputTokens = Math.min(
      Math.max(Math.ceil(inputTokens * 1.5), 100),
      4000
    );

    const totalTokens = inputTokens + estimatedOutputTokens;

    return {
      inputTokens,
      estimatedOutputTokens,
      totalTokens
    };
  }

  static calculateCostInCredits(tokens: number, costPer1MTokens: number = 1.10): number {
    const creditsUsed = (tokens / 1000000) * costPer1MTokens;

    return Math.max(Math.ceil(creditsUsed * 1000) / 1000, 0.001);
  }

  static estimateMessageCost(
    userMessage: string,
    systemPrompt?: string,
    conversationHistory?: Array<{ role: string; content: string }>,
    costPer1MTokens: number = 1.10
  ): { tokens: number; credits: number } {
    const { totalTokens } = this.estimateTokensForConversation(
      userMessage,
      systemPrompt,
      conversationHistory
    );

    const credits = this.calculateCostInCredits(totalTokens, costPer1MTokens);

    return {
      tokens: totalTokens,
      credits
    };
  }

  static formatCostDisplay(credits: number): string {
    if (credits < 0.01) {
      return '< $0.01';
    }
    return `$${credits.toFixed(2)}`;
  }

  static tokensToMessages(tokens: number, avgTokensPerMessage: number = 500): number {
    return Math.floor(tokens / avgTokensPerMessage);
  }

  static messagesToTokens(messages: number, avgTokensPerMessage: number = 500): number {
    return messages * avgTokensPerMessage;
  }
}
