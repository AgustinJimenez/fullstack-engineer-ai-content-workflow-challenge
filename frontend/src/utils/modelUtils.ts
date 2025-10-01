// Utility function to convert technical model names to user-friendly names
export const getModelDisplayName = (modelVersion: string, aiModel: string): string => {
  // Handle different model version formats
  if (modelVersion.includes('langchain')) {
    if (aiModel === 'openai' || modelVersion.includes('openai')) {
      return 'OpenAI GPT-4';
    }
    if (aiModel === 'anthropic' || modelVersion.includes('anthropic')) {
      return 'Anthropic Claude';
    }
    if (aiModel === 'ollama' || modelVersion.includes('ollama')) {
      return 'Ollama';
    }
    return 'AI Assistant';
  }
  
  // Handle direct model names
  if (modelVersion.toLowerCase().includes('gpt')) return 'OpenAI GPT';
  if (modelVersion.toLowerCase().includes('claude')) return 'Anthropic Claude';
  if (modelVersion.toLowerCase().includes('ollama')) return 'Ollama';
  
  // Fallback to a clean version
  return 'AI Assistant';
};

// Utility function to convert language codes to readable names
export const getLanguageDisplayName = (languageCode: string): string => {
  const languageNames: { [key: string]: string } = {
    'en': 'English',
    'es': 'Spanish', 
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'pt-br': 'Portuguese (Brazil)',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'zh-tw': 'Chinese (Traditional)',
    'nl': 'Dutch',
    'ru': 'Russian',
    'ar': 'Arabic',
    'hi': 'Hindi'
  };
  
  return languageNames[languageCode.toLowerCase()] || languageCode.toUpperCase();
};