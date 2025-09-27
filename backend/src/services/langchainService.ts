// Example LangChain integration for your system
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser, JsonOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

export class LangChainAIService {
  private useFakeAI: boolean;

  constructor() {
    const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
    this.useFakeAI = process.env.NODE_ENV === 'test' || process.env.USE_FAKE_AI === 'true' || !apiKey;
  }

  private getLLM(provider?: string): ChatOpenAI | ChatAnthropic {
    const selectedProvider = provider || process.env.AI_PROVIDER || 'openai';
    const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;

    if (selectedProvider === 'anthropic') {
      return new ChatAnthropic({
        apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
        modelName: 'claude-3-haiku-20240307',
      });
    } else {
      return new ChatOpenAI({
        openAIApiKey: apiKey || process.env.OPENAI_API_KEY,
        modelName: 'gpt-4',
      });
    }
  }


  // 🎯 Individual operations (backward compatible)
  async generateContent(content: string, contentType: string, customPrompt?: string, provider?: string) {
    if (this.useFakeAI) {
      const promptText = customPrompt || 'Improve this content to be more engaging:';
      return `LangChain Generated: ${content} — Enhanced with ${promptText} for ${contentType} content!`;
    }

    const promptText = customPrompt || 'Improve this content to be more engaging:';
    const llm = this.getLLM(provider);
    
    const template = PromptTemplate.fromTemplate(`
      You are a {contentType} copywriter. 
      {promptText}
      
      Content: {content}
    `);

    const chain = template.pipe(llm).pipe(new StringOutputParser());
    
    return await chain.invoke({
      content,
      contentType,
      promptText,
    });
  }

  async analyzeContent(content: string, provider?: string) {
    if (this.useFakeAI) {
      const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const keywords = words.slice(0, 3).map(word => word.replace(/[^a-zA-Z0-9]/g, ''));
      
      return {
        keywords: keywords.length > 0 ? keywords : ['analysis', 'content', 'text'],
        tone: 'professional',
        sentiment: { label: 'positive', score: 0.85 },
        confidence: 0.90,
      };
    }

    const llm = this.getLLM(provider);
    const template = PromptTemplate.fromTemplate(`
      Analyze this content and extract structured data in valid JSON format:
      
      Content: {content}
      
      Return exactly this format:
      {{"keywords": ["keyword1", "keyword2", "keyword3"], "tone": "professional|casual|enthusiastic|neutral", "sentiment": {{"label": "positive|neutral|negative", "score": 0.85}}, "confidence": 0.90}}
    `);

    const chain = template.pipe(llm).pipe(new JsonOutputParser());
    
    try {
      return await chain.invoke({ content });
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        keywords: ['analysis', 'content', 'text'],
        tone: 'neutral',
        sentiment: { label: 'neutral', score: 0.5 },
        confidence: 0.7,
      };
    }
  }

  async translateContent(content: string, targetLanguage: string, provider?: string) {
    if (this.useFakeAI) {
      return `[${targetLanguage.toUpperCase()} Translation]: ${content}`;
    }

    const llm = this.getLLM(provider);
    const template = PromptTemplate.fromTemplate(`
      Translate this content to {targetLanguage}. Only return the translation:
      
      {content}
    `);

    const chain = template.pipe(llm).pipe(new StringOutputParser());
    
    return await chain.invoke({
      content,
      targetLanguage,
    });
  }
}

export const langchainAI = new LangChainAIService();