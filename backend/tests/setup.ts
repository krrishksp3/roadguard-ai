// Ensure integration tests use demo provider when no external API key is present
if (!process.env.GEMINI_API_KEY) {
  process.env.AI_PROVIDER = 'demo';
}
