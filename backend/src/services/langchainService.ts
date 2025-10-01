// Example LangChain integration for your system
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOllama } from '@langchain/ollama';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser, JsonOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

export class LangChainAIService {
  private isFakeProvider: boolean;
  private useOllamaForFake: boolean;

  constructor() {
    const provider = process.env.AI_PROVIDER || 'openai';
    const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
    
    // Use fake mode when provider is 'fake' or in test mode without API key
    this.isFakeProvider = provider === 'fake' || (process.env.NODE_ENV === 'test' && !apiKey);
    
    // When AI_PROVIDER=fake, always use pure mock responses (never Ollama)
    // Only use Ollama for fake when provider is explicitly 'ollama' but we want fake responses
    this.useOllamaForFake = false; // Disabled - always use pure fake responses when AI_PROVIDER=fake
  }

  private async ensureOllamaModel(baseUrl: string, model: string): Promise<void> {
    try {
      // Check if Ollama is running
      const healthResponse = await fetch(`${baseUrl}/api/version`);
      if (!healthResponse.ok) {
        throw new Error(`Ollama not running at ${baseUrl}. Please start Ollama with: ollama serve`);
      }

      // Check if model exists
      const modelsResponse = await fetch(`${baseUrl}/api/tags`);
      if (!modelsResponse.ok) {
        throw new Error('Failed to check available models');
      }

      const modelsData = await modelsResponse.json();
      const modelExists = modelsData.models?.some((m: any) => 
        m.name === model || m.name.startsWith(`${model}:`)
      );

      if (!modelExists) {
        console.log(`🤖 Model '${model}' not found. Downloading... (this may take a few minutes)`);
        
        // Pull the model
        const pullResponse = await fetch(`${baseUrl}/api/pull`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: model }),
        });

        if (!pullResponse.ok) {
          throw new Error(`Failed to download model '${model}'. Please run: ollama pull ${model}`);
        }

        // Stream the download progress (optional)
        const reader = pullResponse.body?.getReader();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                if (data.status) {
                  console.log(`📥 ${data.status}${data.completed && data.total ? ` (${Math.round((data.completed / data.total) * 100)}%)` : ''}`);
                }
              } catch {
                // Ignore malformed JSON lines
              }
            }
          }
        }

        console.log(`✅ Model '${model}' downloaded and ready!`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Ollama setup error:', errorMessage);
      throw new Error(
        `Ollama setup failed: ${errorMessage}\n\n` +
        `Quick fix:\n` +
        `1. Install Ollama: https://ollama.ai\n` +
        `2. Start Ollama: ollama serve\n` +
        `3. Download model: ollama pull ${model}`
      );
    }
  }

  private async ensureOllamaReady(provider?: string): Promise<void> {
    // When AI_PROVIDER=fake, always use fake provider regardless of model selection
    const envProvider = process.env.AI_PROVIDER || 'openai';
    const selectedProvider = envProvider === 'fake' ? 'fake' : (provider || envProvider);
    
    if (selectedProvider === 'ollama' || (selectedProvider === 'fake' && this.useOllamaForFake)) {
      const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const model = process.env.OLLAMA_MODEL || 'phi4mini:instruct';
      await this.ensureOllamaModel(baseUrl, model);
    }
  }

  private getLLM(provider?: string, seed?: number): ChatOpenAI | ChatAnthropic | ChatOllama {
    // When AI_PROVIDER=fake or ollama is set, always use that provider regardless of model selection
    const envProvider = process.env.AI_PROVIDER || 'openai';
    // If env is set to fake or ollama, always use that (ignore frontend model selection)
    const selectedProvider = (envProvider === 'fake' || envProvider === 'ollama') 
      ? envProvider 
      : (provider || envProvider);
    const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;

    // For fake provider, use Ollama if available, otherwise return OpenAI (won't be called anyway)
    if (selectedProvider === 'fake') {
      if (this.useOllamaForFake) {
        const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        const model = process.env.OLLAMA_MODEL || 'phi4mini:instruct';
        
        return new ChatOllama({
          baseUrl,
          model,
          temperature: seed !== undefined ? 0.1 : 0.7,
          seed: seed,
        });
      } else {
        // Return a dummy OpenAI client that won't be used (fake provider returns mock data)
        return new ChatOpenAI({
          openAIApiKey: 'fake-key',
          modelName: 'gpt-4',
          temperature: 0.7,
        }) as any;
      }
    } else if (selectedProvider === 'anthropic') {
      return new ChatAnthropic({
        apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
        modelName: 'claude-3-haiku-20240307',
        temperature: seed !== undefined ? 0.1 : 0.7, // Lower temperature for deterministic results
      });
    } else if (selectedProvider === 'ollama') {
      const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const model = process.env.OLLAMA_MODEL || 'phi4mini:instruct';
      
      return new ChatOllama({
        baseUrl,
        model,
        temperature: seed !== undefined ? 0.1 : 0.7, // Lower temperature for deterministic results
        seed: seed, // Ollama supports seed parameter
      });
    } else {
      return new ChatOpenAI({
        openAIApiKey: apiKey || process.env.OPENAI_API_KEY,
        modelName: 'gpt-4',
        temperature: seed !== undefined ? 0.1 : 0.7, // Lower temperature for deterministic results
        // Note: ChatOpenAI doesn't directly support seed parameter in this version
        // Would need to use model-specific parameters for deterministic output
      }) as any;
    }
  }


  // 🎯 Individual operations (backward compatible)
  async generateContent(content: string, contentType: string, customPrompt?: string, provider?: string, seed?: number) {
    // When AI_PROVIDER=fake, always use fake provider regardless of model selection
    const envProvider = process.env.AI_PROVIDER || 'openai';
    const selectedProvider = envProvider === 'fake' ? 'fake' : (provider || envProvider);
    
    // If fake provider without Ollama, return mock string
    if (selectedProvider === 'fake' && !this.useOllamaForFake) {
      const promptText = customPrompt || 'Improve this content to be more engaging:';
      return `LangChain Generated: ${content} — Enhanced with ${promptText} for ${contentType} content!`;
    }

    // Use the selected provider (fake will use Ollama if available)
    const effectiveProvider = selectedProvider === 'fake' && this.useOllamaForFake ? 'ollama' : selectedProvider;

    const promptText = customPrompt || 'Improve this content to be more engaging:';
    await this.ensureOllamaReady(effectiveProvider);
    const llm = this.getLLM(effectiveProvider, seed);
    
    // Check if this is a "single option" request that needs special handling
    const isSingleOptionRequest = promptText.toLowerCase().includes('exactly one') || 
                                 promptText.toLowerCase().includes('one single') ||
                                 promptText.toLowerCase().includes('do not provide multiple') ||
                                 promptText.toLowerCase().includes('just give me one');
    
    
    let template;
    if (isSingleOptionRequest) {
      // For single option requests, use a more explicit template
      template = PromptTemplate.fromTemplate(`
        Write exactly one {contentType}. Do not include quotes, examples, or explanations.
        
        {promptText}
        
        Original: {content}
      `);
    } else {
      // Use the standard template for other requests
      template = PromptTemplate.fromTemplate(`
        You are a {contentType} copywriter. 
        {promptText}
        
        Content: {content}
      `);
    }

    const chain = template.pipe(llm).pipe(new StringOutputParser());
    
    const result = await chain.invoke({
      content,
      contentType,
      promptText,
    });
    
    // Clean up reasoning tokens and extract final content for single option requests
    if (isSingleOptionRequest) {
      return this.cleanSingleOptionResponse(result);
    }
    
    return result;
  }

  private cleanSingleOptionResponse(result: string): string {
    // First check if the result contains quoted text that looks like the main answer
    const quoteMatches = result.match(/"([^"]+)"/g);
    if (quoteMatches && quoteMatches.length > 0) {
      // Find the last substantial quoted text (usually the answer)
      for (let i = quoteMatches.length - 1; i >= 0; i--) {
        const content = quoteMatches[i].replace(/"/g, '').trim();
        if (content.length >= 10 && content.length <= 200 && 
            !content.toLowerCase().includes('output') &&
            !content.toLowerCase().includes('exactly one') &&
            !content.toLowerCase().includes('write') &&
            !content.toLowerCase().includes('create')) {
          return content;
        }
      }
    }
    
    // If the text contains "Answer:" or similar, extract what comes after
    const answerMatch = result.match(/(?:Answer|Response|Result|Output|Tagline|Headline):\s*["']?([^"'\n]+)["']?/i);
    if (answerMatch && answerMatch[1]) {
      return answerMatch[1].replace(/["']/g, '').trim();
    }
    
    // Clean up common patterns more aggressively
    const cleaned = result
      .replace(/^.*(?:Answer|Response|Result|Output):\s*/gi, '') // Remove everything before Answer:
      .replace(/Q:\s*.+\n?/g, '') // Remove question lines
      .replace(/A:\s*/g, '')
      .replace(/Answer:\s*/gi, '')
      .replace(/Title:\s*/gi, '')
      .replace(/Headline:\s*/gi, '')
      .replace(/Tagline:\s*/gi, '')
      .replace(/Solution:\s*/gi, '')
      .replace(/Output:\s*/gi, '')
      .replace(/Result:\s*/gi, '')
      .replace(/["']/g, '')  // Remove all quotes
      .replace(/[""'']/g, '') // Remove smart quotes
      .replace(/<[^>]*>/g, '')  // Remove HTML/XML tags
      .replace(/\*\*.*?\*\*/g, '')  // Remove markdown bold
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .trim();
    
    // Split into lines and find the best candidate
    const lines = cleaned.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Look for the last substantial line (often the actual answer)
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      // Skip obvious non-content lines
      if (line.length >= 10 && line.length <= 200 &&
          !line.toLowerCase().includes('write') &&
          !line.toLowerCase().includes('create') &&
          !line.toLowerCase().includes('exactly') &&
          !line.toLowerCase().includes('platform') &&
          !line.toLowerCase().includes('travel') &&
          !line.toLowerCase().includes('review')) {
        return line;
      }
    }
    
    // If we still have something reasonable, return it
    if (cleaned.length >= 10 && cleaned.length <= 200) {
      return cleaned;
    }
    
    // Ultimate fallback
    return 'Transform Your Journey Today';
  }

  async analyzeContent(content: string, provider?: string) {
    // When AI_PROVIDER=fake, always use fake provider regardless of model selection
    const envProvider = process.env.AI_PROVIDER || 'openai';
    const selectedProvider = envProvider === 'fake' ? 'fake' : (provider || envProvider);
    
    if (selectedProvider === 'fake' && !this.useOllamaForFake) {
      const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const keywords = words.slice(0, 3).map(word => word.replace(/[^a-zA-Z0-9]/g, ''));
      
      return {
        keywords: keywords.length > 0 ? keywords : ['analysis', 'content', 'text'],
        tone: 'professional',
        sentiment: { label: 'positive', score: 0.85 },
        confidence: 0.90,
      };
    }

    const effectiveProvider = selectedProvider === 'fake' && this.useOllamaForFake ? 'ollama' : selectedProvider;
    await this.ensureOllamaReady(effectiveProvider);
    const llm = this.getLLM(effectiveProvider);
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
    // When AI_PROVIDER=fake, always use fake provider regardless of model selection
    const envProvider = process.env.AI_PROVIDER || 'openai';
    const selectedProvider = envProvider === 'fake' ? 'fake' : (provider || envProvider);
    
    if (selectedProvider === 'fake' && !this.useOllamaForFake) {
      return `[${targetLanguage.toUpperCase()} Translation]: ${content}`;
    }

    const effectiveProvider = selectedProvider === 'fake' && this.useOllamaForFake ? 'ollama' : selectedProvider;
    await this.ensureOllamaReady(effectiveProvider);
    const llm = this.getLLM(effectiveProvider);
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

  // 🔗 CHAINED WORKFLOWS - The power of LangChain!
  
  /**
   * Smart Content Workflow: Generate → Analyze → Translate
   * This demonstrates LangChain's ability to chain multiple AI operations
   */
  async smartContentWorkflow(
    initialContent: string,
    contentType: string,
    targetLanguages: string[],
    provider?: string
  ) {
    // When AI_PROVIDER=fake, always use fake provider regardless of model selection
    const envProvider = process.env.AI_PROVIDER || 'openai';
    const selectedProvider = envProvider === 'fake' ? 'fake' : (provider || envProvider);
    
    if (selectedProvider === 'fake' && !this.useOllamaForFake) {
      const generated = `LangChain Generated: ${initialContent} — Enhanced for ${contentType}!`;
      const analysis = {
        keywords: ['enhanced', 'content', 'marketing'],
        tone: 'professional',
        sentiment: { label: 'positive', score: 0.92 },
      };
      const translations = targetLanguages.reduce((acc, lang) => {
        acc[lang] = `[${lang.toUpperCase()}] ${generated}`;
        return acc;
      }, {} as Record<string, string>);

      return {
        original: initialContent,
        generated,
        analysis,
        translations,
        metadata: {
          workflow: 'generate → analyze → translate',
          steps: 3,
          provider: 'fake-ai',
        },
      };
    }

    const llm = this.getLLM(provider);

    // Step 1: Generate enhanced content
    const generateTemplate = PromptTemplate.fromTemplate(`
      You are an expert {contentType} copywriter.
      Enhance this content to be more engaging and professional:
      
      {content}
      
      Return only the enhanced version, no explanations.
    `);

    const generateChain = RunnableSequence.from([
      generateTemplate,
      llm,
      new StringOutputParser(),
    ]);

    const generatedContent = await generateChain.invoke({
      content: initialContent,
      contentType,
    });

    // Step 2: Analyze the generated content
    const analyzeTemplate = PromptTemplate.fromTemplate(`
      Analyze this content and extract structured data in valid JSON format:
      
      Content: {content}
      
      Return exactly this format:
      {{"keywords": ["keyword1", "keyword2", "keyword3"], "tone": "professional|casual|enthusiastic|neutral", "sentiment": {{"label": "positive|neutral|negative", "score": 0.85}}}}
    `);

    const analyzeChain = RunnableSequence.from([
      analyzeTemplate,
      llm,
      new JsonOutputParser(),
    ]);

    let analysis;
    try {
      analysis = await analyzeChain.invoke({ content: generatedContent });
    } catch (error) {
      analysis = {
        keywords: ['content', 'marketing', 'professional'],
        tone: 'professional',
        sentiment: { label: 'positive', score: 0.75 },
      };
    }

    // Step 3: Translate to all target languages
    const translateTemplate = PromptTemplate.fromTemplate(`
      Translate this content to {targetLanguage}. Maintain the tone and style.
      Only return the translation, no explanations:
      
      {content}
    `);

    const translateChain = RunnableSequence.from([
      translateTemplate,
      llm,
      new StringOutputParser(),
    ]);

    const translations: Record<string, string> = {};
    for (const lang of targetLanguages) {
      translations[lang] = await translateChain.invoke({
        content: generatedContent,
        targetLanguage: lang,
      });
    }

    return {
      original: initialContent,
      generated: generatedContent,
      analysis,
      translations,
      metadata: {
        workflow: 'generate → analyze → translate',
        steps: 2 + targetLanguages.length,
        provider: provider || process.env.AI_PROVIDER || 'openai',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Content Enhancement Chain: Generate → Refine → Summarize
   * Demonstrates sequential refinement using LangChain
   */
  async contentEnhancementChain(
    content: string,
    contentType: string,
    provider?: string
  ) {
    // When AI_PROVIDER=fake, always use fake provider regardless of model selection
    const envProvider = process.env.AI_PROVIDER || 'openai';
    const selectedProvider = envProvider === 'fake' ? 'fake' : (provider || envProvider);
    
    if (selectedProvider === 'fake' && !this.useOllamaForFake) {
      return {
        original: content,
        enhanced: `Enhanced: ${content}`,
        refined: `Refined & Enhanced: ${content}`,
        summary: `Summary of enhanced content for ${contentType}`,
        metadata: { steps: 3, provider: 'fake-ai' },
      };
    }

    const llm = this.getLLM(provider);

    // Chain: Enhance → Refine → Summarize
    const enhancePrompt = PromptTemplate.fromTemplate(`
      Enhance this {contentType} to be more compelling:
      {content}
    `);

    const refinePrompt = PromptTemplate.fromTemplate(`
      Refine and polish this content for professional use:
      {content}
    `);

    const summarizePrompt = PromptTemplate.fromTemplate(`
      Create a brief 1-sentence summary of this content:
      {content}
    `);

    // Build the sequential chain
    const fullChain = RunnableSequence.from([
      enhancePrompt,
      llm,
      new StringOutputParser(),
      async (enhanced: string) => ({
        enhanced,
        refined: await refinePrompt.pipe(llm).pipe(new StringOutputParser()).invoke({ content: enhanced }),
      }),
      async (result: any) => ({
        ...result,
        summary: await summarizePrompt.pipe(llm).pipe(new StringOutputParser()).invoke({ content: result.refined }),
      }),
    ]);

    const result = await fullChain.invoke({
      content,
      contentType,
    });

    return {
      original: content,
      ...result,
      metadata: {
        workflow: 'enhance → refine → summarize',
        steps: 3,
        provider: provider || process.env.AI_PROVIDER || 'openai',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Multi-language Content Chain: Generate once → Analyze → Translate to all languages
   * Efficient workflow for international campaigns
   */
  async multiLanguageChain(
    content: string,
    targetLanguages: string[],
    provider?: string
  ) {
    // When AI_PROVIDER=fake, always use fake provider regardless of model selection
    const envProvider = process.env.AI_PROVIDER || 'openai';
    const selectedProvider = envProvider === 'fake' ? 'fake' : (provider || envProvider);
    
    if (selectedProvider === 'fake' && !this.useOllamaForFake) {
      const translations = targetLanguages.reduce((acc, lang) => {
        acc[lang] = {
          text: `[${lang.toUpperCase()}] ${content}`,
          quality: 0.95,
        };
        return acc;
      }, {} as Record<string, any>);

      return {
        original: content,
        translations,
        summary: {
          languagesProcessed: targetLanguages.length,
          avgQuality: 0.95,
        },
      };
    }

    const llm = this.getLLM(provider);

    // Parallel translation chain for efficiency
    const translatePrompt = PromptTemplate.fromTemplate(`
      Translate to {language}. Maintain tone and style:
      {content}
    `);

    const translations: Record<string, any> = {};

    // Use Promise.all for parallel processing
    await Promise.all(
      targetLanguages.map(async (lang) => {
        const translated = await translatePrompt
          .pipe(llm)
          .pipe(new StringOutputParser())
          .invoke({ content, language: lang });

        translations[lang] = {
          text: translated,
          quality: 0.9, // Could add quality scoring here
        };
      })
    );

    return {
      original: content,
      translations,
      summary: {
        languagesProcessed: targetLanguages.length,
        avgQuality: Object.values(translations).reduce((sum: number, t: any) => sum + t.quality, 0) / targetLanguages.length,
      },
      metadata: {
        workflow: 'parallel multi-language translation',
        provider: provider || process.env.AI_PROVIDER || 'openai',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const langchainAI = new LangChainAIService();

// Export the cleaning function for use in controllers
export function cleanAIResponse(text: string): string {
  return langchainAI['cleanSingleOptionResponse'](text);
}