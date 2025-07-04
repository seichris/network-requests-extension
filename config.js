// API Configuration
export const API_CONFIG = {
    GEMINI_API_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    GEMINI_MODEL: 'gemini-2.5-flash',
    DEFAULT_TEMPERATURE: 0.3,
    MAX_OUTPUT_TOKENS: {
        DEFAULT: 50000,
        KEYWORDS: 1000
    }
};

// Storage Keys
export const STORAGE_KEYS = {
    API_KEY: 'geminiApiKey'
};

// Network Analysis Configuration
export const NETWORK_CONFIG = {
    ANALYSIS_TIMEOUT_MS: 5000,  // 5 seconds
    DEBUGGER_VERSION: '1.2',
    CONTEXT_LENGTH: 200,  // Characters of context around matches
    MAX_RELEVANT_REQUESTS: 10,  // Maximum number of relevant requests to analyze
    MAX_TOKENS: 500000,  // Maximum tokens for safety
    TOKEN_CHAR_RATIO: 4  // Rough calculation: 1 token ≈ 4 characters
};

// AI Prompts
export const AI_PROMPTS = {
    URL_SUGGESTION: (query) => `Given the user query "${query}", suggest the most specific website URL where the requested information would likely be found, such as account details, subscriptions, or membership tiers. Return ONLY the URL (e.g., "youtube.com/paid_memberships", "spotify.com/account", "netflix.com/youraccount") with no additional text.

Consider:
- For queries about subscription tiers, memberships, or account details (e.g., "my youtube subscription tier", "my spotify plan", "my netflix account"): direct to the platform's specific page for managing subscriptions, memberships, or account settings.
- For queries about usernames or profiles: direct to the platform's profile or account settings page.
- For queries about login or QR codes: direct to the platform's main login page.
- For other specific services: direct to the most relevant page on the platform for the query.
- Prefer URLs with paths (e.g., "youtube.com/paid_memberships") over root domains (e.g., "youtube.com") when a more specific page exists.
- Do not include "https://" or trailing slashes.`,

    SEARCH_KEYWORDS: (query) => `Given this user question about network requests: "${query}"

Generate a comprehensive list of keywords, phrases, and patterns that should be searched for in network traffic data. Include:

1. Direct keywords from the question
2. Related technical terms
3. Common API parameter names
4. Possible JSON field names
5. URL path segments
6. Header names

For example, if someone asks "my YouTube username", you might suggest:
- username
- user_name
- userName
- handle
- userHandle
- user_handle
- displayName
- channel
- channelName
- profile
- account
- user
- name

Return ONLY a JSON array of search terms (no other text):
["keyword1", "keyword2", "keyword3", ...]

Keep it concise but comprehensive (10-20 keywords max).`,

    ANALYZE_REQUESTS: (query, keywords, finalData, focusedData, networkData) => `You are analyzing filtered network requests that contain keywords related to this question: "${query}"

The data below has been pre-filtered to only include network requests that contain relevant keywords: ${keywords.join(', ')}

Filtered Network Data (${focusedData.length} relevant requests out of ${networkData.length} total):
${finalData}

Original Question: ${query}

Please provide:
1. A direct answer to the question if possible
2. Which specific request(s) contain the relevant information (reference by requestIndex)
3. The exact data found (URLs, values, etc.)
4. Key findings from the matches

Focus on the most relevant information and be specific about where you found it.`
}; 