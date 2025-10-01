export const PROMPT_TEMPLATES: { [key: string]: { [key: string]: string } } = {
  headline: {
    default: 'Create 3-5 compelling headline options that grab attention',
    single: 'Create exactly ONE headline. Do not provide multiple options, lists, or numbered variations. Just give me one single compelling headline without explanations',
    multiple: 'Create 10 different headline variations with diverse approaches',
    engaging: 'Write an engaging headline that drives action and curiosity',
    professional: 'Craft a professional headline for business audiences',
    emotional: 'Create an emotionally resonant headline that connects with readers',
  },
  description: {
    default: 'Write 2-3 persuasive product description options',
    single: 'Write exactly ONE product description. Do not provide multiple options, lists, or numbered variations. Just give me one single clear and persuasive description without explanations',
    multiple: 'Create 5 different description variations',
    detailed: 'Create a comprehensive description with key features and benefits',
    concise: 'Write a brief but impactful description',
  },
  // Add more templates as needed
};