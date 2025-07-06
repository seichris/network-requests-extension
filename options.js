import { API_CONFIG, STORAGE_KEYS, NETWORK_CONFIG, AI_PROMPTS, AI_PROVIDERS } from './config.js';

// Using Gemini REST API directly (no external SDK needed)

document.addEventListener('DOMContentLoaded', function() {
    console.log('Options page loaded');
    console.log('✅ Using Gemini REST API directly - AI-first interface');
    
    const urlInput = document.getElementById('url');
    const searchButton = document.getElementById('search');
    const resultsDiv = document.getElementById('results');
    const apiKeyInput = document.getElementById('apiKey');
    const aiQueryInput = document.getElementById('aiQuery');
    const aiProviderSelect = document.getElementById('aiProvider');
    const geminiApiKeyGroup = document.getElementById('geminiApiKeyGroup');
    const openaiApiKeyGroup = document.getElementById('openaiApiKeyGroup');
    const claudeApiKeyGroup = document.getElementById('claudeApiKeyGroup');
    const openaiModelGroup = document.getElementById('openaiModelGroup');
    const openaiModelSelect = document.getElementById('openaiModel');
    
    // Debug: Check if all elements are found
    console.log('Elements found:', {
        urlInput: !!urlInput,
        searchButton: !!searchButton,
        apiKeyInput: !!apiKeyInput,
        aiQueryInput: !!aiQueryInput,
        aiProviderSelect: !!aiProviderSelect,
        geminiApiKeyGroup: !!geminiApiKeyGroup,
        openaiApiKeyGroup: !!openaiApiKeyGroup,
        openaiModelGroup: !!openaiModelGroup,
        openaiModelSelect: !!openaiModelSelect
    });

    // Add event listeners for Enter key
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    });

    // Set focus to AI query input on load (since it's the primary field)
    aiQueryInput.focus();

    // Function to safely escape HTML to prevent XSS
    const escapeHTML = (str) => {
        const p = document.createElement('p');
        p.appendChild(document.createTextNode(str));
        return p.innerHTML;
    };

    // Function to format headers object
    const formatHeaders = (headers) => {
        if (!headers) return 'None';
        return Object.entries(headers)
            .map(([key, value]) => `  ${key}: ${value}`)
            .join('\n');
    };

    // Function to create status message
    const createStatusMessage = (type, message) => {
        const statusDiv = document.createElement('div');
        statusDiv.className = `status ${type}`;
        statusDiv.innerHTML = message;
        return statusDiv;
    };

    // API Key management functions
    const saveApiKey = (apiKey) => {
        localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
    };

    const loadApiKey = () => {
        return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
    };

    // Load saved API key on page load
    const savedApiKey = loadApiKey();
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
        console.log('Loaded saved API key');
    }

    // API key highlighting functions
    const checkApiKeyHighlight = () => {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            apiKeyInput.classList.add('highlight-required');
        } else {
            apiKeyInput.classList.remove('highlight-required');
        }
    };

    // URL suggestion function
    const suggestUrlForQuery = async (apiKey, query) => {
        const prompt = AI_PROMPTS.URL_SUGGESTION(query);

        try {
            const apiUrl = `${API_CONFIG.GEMINI_API_ENDPOINT}?key=${apiKey}`;
            
            const requestBody = {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: API_CONFIG.DEFAULT_TEMPERATURE,
                    maxOutputTokens: API_CONFIG.MAX_OUTPUT_TOKENS.DEFAULT,
                }
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                const data = await response.json();
                console.log('URL suggestion response:', data);
                
                // Log token usage
                if (data.usageMetadata) {
                    console.log('📊 Token usage for URL suggestion:', {
                        prompt: data.usageMetadata.promptTokenCount,
                        response: data.usageMetadata.candidatesTokenCount,
                        total: data.usageMetadata.totalTokenCount
                    });
                }
                
                if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    const suggestedUrl = data.candidates[0].content.parts[0].text.trim();
                    console.log('AI suggested URL:', suggestedUrl);
                    return suggestedUrl;
                }
                
                console.warn('Invalid response format from Gemini API:', data);
            }
        } catch (error) {
            console.warn('URL suggestion failed:', error);
        }
        
        // // Fallback suggestions based on keywords
        // const queryLower = query.toLowerCase();
        // if (queryLower.includes('youtube')) return 'youtube.com';
        // if (queryLower.includes('instagram')) return 'instagram.com';
        // if (queryLower.includes('twitter') || queryLower.includes('x.com')) return 'x.com';
        // if (queryLower.includes('facebook')) return 'facebook.com';
        // if (queryLower.includes('linkedin')) return 'linkedin.com';
        // if (queryLower.includes('tiktok')) return 'tiktok.com';
        // if (queryLower.includes('github')) return 'github.com';
        
        return null;
    };

    // Token estimation function (rough calculation: 1 token ≈ 4 characters)
    const estimateTokens = (text) => {
        return Math.ceil(text.length / NETWORK_CONFIG.TOKEN_CHAR_RATIO);
    };

    // Function to truncate text to fit within token limits
    const truncateToTokens = (text, maxTokens) => {
        const maxChars = maxTokens * NETWORK_CONFIG.TOKEN_CHAR_RATIO; // Rough conversion
        if (text.length <= maxChars) return text;
        return text.substring(0, maxChars) + '... [truncated]';
    };

    // Stage 1: Generate search keywords from user query
    const generateSearchKeywords = async (apiKey, query) => {
        const prompt = AI_PROMPTS.SEARCH_KEYWORDS(query);

        try {
            const apiUrl = `${API_CONFIG.GEMINI_API_ENDPOINT}?key=${apiKey}`;
            
            const requestBody = {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: API_CONFIG.DEFAULT_TEMPERATURE,
                    maxOutputTokens: API_CONFIG.MAX_OUTPUT_TOKENS.KEYWORDS,
                }
            };

            console.log('Stage 1: Generating search keywords...');
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Keywords generation response:', data);
            
            // Log token usage
            if (data.usageMetadata) {
                console.log('📊 Token usage for keywords generation:', {
                    prompt: data.usageMetadata.promptTokenCount,
                    response: data.usageMetadata.candidatesTokenCount,
                    total: data.usageMetadata.totalTokenCount
                });
            }
            
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                let text = data.candidates[0].content.parts[0].text.trim();
                console.log('Generated keywords response:', text);
                
                // Remove markdown code blocks if present
                text = text.replace(/^```json\n|\n```$/g, '');
                
                // Try to parse JSON from the response
                try {
                    const keywords = JSON.parse(text);
                    if (Array.isArray(keywords)) {
                        console.log('Extracted keywords:', keywords);
                        return keywords;
                    }
                } catch (e) {
                    console.warn('Failed to parse keywords as JSON:', e);
                    console.log('Cleaned text was:', text);
                }
                
                // Fallback: extract words from the response
                const words = text.match(/["']([^"']+)["']/g);
                if (words && words.length > 0) {
                    const extracted = words.map(w => w.replace(/["']/g, '')).slice(0, 20);
                    console.log('Extracted words from quotes:', extracted);
                    return extracted;
                }
                
                // Last fallback: split by common delimiters
                const split = text.split(/[,\n\r\t]+/)
                    .map(w => w.trim().replace(/["'\[\]]/g, ''))
                    .filter(w => w.length > 0)
                    .slice(0, 20);
                console.log('Split text into words:', split);
                return split;
            }
            
            console.warn('Invalid response format from Gemini API:', data);
            throw new Error('No keywords generated');
        } catch (error) {
            console.error('Error generating keywords:', error);
            // Fallback to basic keywords extracted from the query
            const basicKeywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
            console.log('Using fallback keywords:', basicKeywords);
            return basicKeywords;
        }
    };

    // Stage 2: Search network data locally and prepare relevant snippets
    const searchNetworkData = (networkData, keywords) => {
        const relevantData = [];
        const contextLength = NETWORK_CONFIG.CONTEXT_LENGTH; // Characters of context around matches
        
        console.log(`🔍 Searching ${networkData.length} requests for keywords:`, keywords);
        
        networkData.forEach((request, index) => {
            const searchableText = JSON.stringify(request).toLowerCase();
            const foundMatches = [];
            
            keywords.forEach(keyword => {
                const keywordLower = keyword.toLowerCase();
                const regex = new RegExp(keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                const matches = [...searchableText.matchAll(regex)];
                
                matches.forEach(match => {
                    const start = Math.max(0, match.index - contextLength);
                    const end = Math.min(searchableText.length, match.index + keyword.length + contextLength);
                    const context = searchableText.substring(start, end);
                    
                    foundMatches.push({
                        keyword: keyword,
                        context: context,
                        position: match.index
                    });
                });
            });
            
            if (foundMatches.length > 0) {
                relevantData.push({
                    requestIndex: index,
                    url: request.url,
                    method: request.method,
                    status: request.status,
                    matches: foundMatches,
                    // Include key parts of the request
                    headers: request.requestHeaders || {},
                    responseHeaders: request.responseHeaders || {},
                    requestBody: request.requestBody ? request.requestBody.substring(0, 1000) : null,
                    responseBody: request.responseBody ? request.responseBody.substring(0, 1000) : null
                });
            }
        });
        
        console.log(`Found ${relevantData.length} relevant requests out of ${networkData.length} total`);
        return relevantData;
    };

    // Main Gemini AI request function using two-stage approach
    const makeGeminiRequest = async (apiKey, networkData, query) => {
        try {
            // Stage 1: Generate search keywords
            console.log('🔍 Stage 1: Generating search keywords for:', query);
            const keywords = await generateSearchKeywords(apiKey, query);
            
            // Stage 2: Search network data locally
            console.log('📊 Stage 2: Filtering network data with keywords');
            const relevantData = searchNetworkData(networkData, keywords);
            
            if (relevantData.length === 0) {
                return `No relevant network requests found for query: "${query}"\n\nTried searching for keywords: ${keywords.join(', ')}\n\nSuggestions:\n- Try a different search query\n- Check if the website actually makes requests related to your query\n- Look at the raw network data to see what information is available`;
            }
            
            // Stage 3: Prepare focused data for final analysis
            const focusedData = relevantData.slice(0, NETWORK_CONFIG.MAX_RELEVANT_REQUESTS); // Limit to max matches
            const dataString = JSON.stringify(focusedData, null, 2);
            const estimatedTokens = estimateTokens(dataString);
            
            console.log(`📤 Stage 3: Sending ${focusedData.length} relevant requests to Gemini (estimated ${estimatedTokens} tokens)`);
            
            // Truncate if still too large (keep under max tokens for safety)
            const finalData = estimatedTokens > NETWORK_CONFIG.MAX_TOKENS ? 
                truncateToTokens(dataString, NETWORK_CONFIG.MAX_TOKENS) : dataString;
            
            const prompt = AI_PROMPTS.ANALYZE_REQUESTS(query, keywords, finalData, focusedData, networkData);

            const apiUrl = `${API_CONFIG.GEMINI_API_ENDPOINT}?key=${apiKey}`;
            
            const requestBody = {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: API_CONFIG.DEFAULT_TEMPERATURE,
                    maxOutputTokens: API_CONFIG.MAX_OUTPUT_TOKENS.DEFAULT,
                }
            };

            console.log('📤 Sending final request to Gemini...');
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Final analysis response:', data);
            
            // Log total token usage
            if (data.usageMetadata) {
                console.log('📊 Token usage for final analysis:', {
                    prompt: data.usageMetadata.promptTokenCount,
                    response: data.usageMetadata.candidatesTokenCount,
                    total: data.usageMetadata.totalTokenCount
                });
            }
            
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                return data.candidates[0].content.parts[0].text;
            }
            
            throw new Error('No response from AI');
        } catch (error) {
            console.error('Error in makeGeminiRequest:', error);
            throw error;
        }
    };

    // Function to format request/response data
    const formatNetworkData = (data, keyword, searchOptions) => {
        if (!data || data.length === 0) {
            return 'No network requests captured.';
        }

        let html = '';
        data.forEach((request, index) => {
            // Build sections separately so we can apply selective highlighting
            const url = `URL: ${request.url}`;
            const method = `Method: ${request.method}`;
            const status = `Status: ${request.status || 'N/A'} ${request.statusText || ''}`;
            const mimeType = `MIME Type: ${request.mimeType || 'N/A'}`;
            
            const requestHeaders = `REQUEST HEADERS:\n${formatHeaders(request.requestHeaders)}`;
            const requestBody = `REQUEST BODY:\n${request.requestBody || '(No request body)'}`;
            const responseHeaders = `RESPONSE HEADERS:\n${formatHeaders(request.responseHeaders)}`;
            const responseBody = `RESPONSE BODY:\n${request.responseBody || '(No response body)'}`;

            // Apply keyword highlighting if provided and checkboxes are selected
            let finalRequestHeaders = requestHeaders;
            let finalRequestBody = requestBody;
            let finalResponseHeaders = responseHeaders;
            let finalResponseBody = responseBody;

            if (keyword && keyword.trim()) {
                const escapedKeyword = keyword.replace(/[.*+?^${}()|\[\]\\]/g, '\\$&');
                const regex = new RegExp(`(${escapedKeyword})`, 'gi');
                
                // Only highlight in selected sections
                if (searchOptions.headers) {
                    finalRequestHeaders = escapeHTML(requestHeaders).replace(regex, '<span class="highlight">$1</span>');
                    finalResponseHeaders = escapeHTML(responseHeaders).replace(regex, '<span class="highlight">$1</span>');
                } else {
                    finalRequestHeaders = escapeHTML(requestHeaders);
                    finalResponseHeaders = escapeHTML(responseHeaders);
                }
                
                if (searchOptions.payloads) {
                    finalRequestBody = escapeHTML(requestBody).replace(regex, '<span class="highlight">$1</span>');
                } else {
                    finalRequestBody = escapeHTML(requestBody);
                }
                
                if (searchOptions.responses) {
                    finalResponseBody = escapeHTML(responseBody).replace(regex, '<span class="highlight">$1</span>');
                } else {
                    finalResponseBody = escapeHTML(responseBody);
                }
            } else {
                // No keyword search, just escape HTML
                finalRequestHeaders = escapeHTML(requestHeaders);
                finalRequestBody = escapeHTML(requestBody);
                finalResponseHeaders = escapeHTML(responseHeaders);
                finalResponseBody = escapeHTML(responseBody);
            }

            const requestSection = `
REQUEST #${index + 1}
================
${escapeHTML(url)}
${escapeHTML(method)}
${escapeHTML(status)}
${escapeHTML(mimeType)}

${finalRequestHeaders}

${finalRequestBody}

${finalResponseHeaders}

${finalResponseBody}

${'='.repeat(80)}

`;

            html += requestSection;
        });

        return html;
    };

    // Function to update status with countdown
    const updateAnalysisStatus = (message, showCountdown = false) => {
        resultsDiv.innerHTML = '';
        
        const statusDiv = createStatusMessage('warning', message);
        resultsDiv.appendChild(statusDiv);
        
        if (showCountdown) {
            let countdown = 5;
            const countdownDiv = document.createElement('div');
            countdownDiv.style.cssText = 'margin-top: 10px; font-size: 14px; color: #856404;';
            resultsDiv.appendChild(countdownDiv);
            
            const updateCountdown = () => {
                countdownDiv.innerHTML = `⏰ Analysis will complete in <strong>${countdown}</strong> seconds...<br><small>Check the browser console (F12) for detailed logs</small>`;
                countdown--;
                if (countdown >= 0) {
                    setTimeout(updateCountdown, 1000);
                }
            };
            updateCountdown();
        }
    };

    // --- Multi-AI Support ---
    // Save/load API keys for each provider
    function saveProviderApiKey(provider, apiKey) {
        localStorage.setItem(`ai_api_key_${provider}`, apiKey);
    }
    function loadProviderApiKey(provider) {
        return localStorage.getItem(`ai_api_key_${provider}`) || '';
    }

    // Store/load OpenAI model selection
    function saveOpenAIModel(model) {
        localStorage.setItem('openai_model', model);
    }
    function loadOpenAIModel() {
        return localStorage.getItem('openai_model') || 'gpt-4o';
    }

    // Unified analyzeWithAI function
    async function analyzeWithAI(provider, apiKey, networkData, query) {
        if (!apiKey) throw new Error(`Missing API key for ${AI_PROVIDERS[provider].name}`);
        switch (provider) {
            case 'gemini':
                return await analyzeWithGemini(apiKey, networkData, query);
            case 'openai':
                return await analyzeWithOpenAI(apiKey, networkData, query);
            case 'claude':
                return await analyzeWithClaude(apiKey, networkData, query);
            default:
                throw new Error('Unknown AI provider');
        }
    }

    // Handler for Gemini (existing logic)
    async function analyzeWithGemini(apiKey, networkData, query) {
        return await makeGeminiRequest(apiKey, networkData, query);
    }
    // Handler for OpenAI (full implementation)
    async function analyzeWithOpenAI(apiKey, networkData, query) {
        const model = openaiModelSelect.value || 'gpt-4o';
        // Prepare prompt (same as Gemini)
        const keywords = await generateSearchKeywords(apiKey, query); // Optionally reuse Gemini's logic
        const relevantData = searchNetworkData(networkData, keywords);
        if (relevantData.length === 0) {
            return `No relevant network requests found for query: "${query}"
\nTried searching for keywords: ${keywords.join(', ')}\n\nSuggestions:\n- Try a different search query\n- Check if the website actually makes requests related to your query\n- Look at the raw network data to see what information is available`;
        }
        const focusedData = relevantData.slice(0, NETWORK_CONFIG.MAX_RELEVANT_REQUESTS);
        const dataString = JSON.stringify(focusedData, null, 2);
        const estimatedTokens = estimateTokens(dataString);
        const finalData = estimatedTokens > NETWORK_CONFIG.MAX_TOKENS ? truncateToTokens(dataString, NETWORK_CONFIG.MAX_TOKENS) : dataString;
        const prompt = AI_PROMPTS.ANALYZE_REQUESTS(query, keywords, finalData, focusedData, networkData);
        // OpenAI API call
        const apiUrl = 'https://api.openai.com/v1/chat/completions';
        const requestBody = {
            model: model,
            messages: [
                { role: 'system', content: 'You are a helpful assistant that analyzes network request data.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 1024,
            temperature: 0.2
        };
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}\n${err}`);
        }
        const data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            return data.choices[0].message.content.trim();
        }
        throw new Error('No response from OpenAI');
    }
    // Handler for Claude (full implementation)
    async function analyzeWithClaude(apiKey, networkData, query) {
        // Prepare prompt (same as Gemini)
        const keywords = await generateSearchKeywords(apiKey, query); // Optionally reuse Gemini's logic
        const relevantData = searchNetworkData(networkData, keywords);
        if (relevantData.length === 0) {
            return `No relevant network requests found for query: "${query}"
\nTried searching for keywords: ${keywords.join(', ')}\n\nSuggestions:\n- Try a different search query\n- Check if the website actually makes requests related to your query\n- Look at the raw network data to see what information is available`;
        }
        const focusedData = relevantData.slice(0, NETWORK_CONFIG.MAX_RELEVANT_REQUESTS);
        const dataString = JSON.stringify(focusedData, null, 2);
        const estimatedTokens = estimateTokens(dataString);
        const finalData = estimatedTokens > NETWORK_CONFIG.MAX_TOKENS ? truncateToTokens(dataString, NETWORK_CONFIG.MAX_TOKENS) : dataString;
        const prompt = AI_PROMPTS.ANALYZE_REQUESTS(query, keywords, finalData, focusedData, networkData);
        // Claude API call
        const apiUrl = 'https://api.anthropic.com/v1/messages';
        const requestBody = {
            model: 'claude-3-opus-20240229',
            max_tokens: 1024,
            temperature: 0.2,
            messages: [
                { role: 'user', content: prompt }
            ]
        };
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Claude API error: ${response.status} ${response.statusText}\n${err}`);
        }
        const data = await response.json();
        if (data.content && Array.isArray(data.content) && data.content[0] && data.content[0].text) {
            return data.content[0].text.trim();
        }
        throw new Error('No response from Claude');
    }

    // --- Update API key input logic ---
    // On provider change, load saved API key for that provider
    aiProviderSelect.addEventListener('change', () => {
        updateApiKeyVisibility();
        const provider = aiProviderSelect.value;
        let input;
        if (provider === 'gemini') input = apiKeyInput;
        if (provider === 'openai') input = document.getElementById('openaiApiKey');
        if (provider === 'claude') input = document.getElementById('claudeApiKey');
        if (input) input.value = loadProviderApiKey(provider);
    });
    // On API key input, save for the selected provider
    [apiKeyInput, document.getElementById('openaiApiKey'), document.getElementById('claudeApiKey')].forEach((input, idx) => {
        if (!input) return;
        input.addEventListener('input', (e) => {
            const provider = ['gemini', 'openai', 'claude'][idx];
            saveProviderApiKey(provider, e.target.value.trim());
        });
        input.addEventListener('blur', (e) => {
            const provider = ['gemini', 'openai', 'claude'][idx];
            saveProviderApiKey(provider, e.target.value.trim());
        });
    });
    // On page load, set API key input to saved value for default provider
    aiProviderSelect.dispatchEvent(new Event('change'));

    // --- Main analysis flow update ---
    searchButton.addEventListener('click', async () => {
        let url = urlInput.value.trim();
        const provider = aiProviderSelect.value;
        let apiKey = '';
        if (provider === 'gemini') apiKey = apiKeyInput.value.trim();
        if (provider === 'openai') apiKey = document.getElementById('openaiApiKey').value.trim();
        if (provider === 'claude') apiKey = document.getElementById('claudeApiKey').value.trim();
        const aiQuery = aiQueryInput.value.trim();
        
        console.log('AI Search button clicked', { url, hasApiKey: !!apiKey, aiQuery });

        // Validate required fields
        if (!apiKey) {
            checkApiKeyHighlight();
            resultsDiv.innerHTML = '';
            resultsDiv.appendChild(createStatusMessage('error', `❌ Please enter your ${AI_PROVIDERS[provider].apiKeyLabel}.`));
            return;
        }
        
        if (!aiQuery) {
            resultsDiv.innerHTML = '';
            resultsDiv.appendChild(createStatusMessage('error', '❌ Please tell me what you\'re looking for.'));
            return;
        }
        
        // Save API key for future use
        saveProviderApiKey(provider, apiKey);
        checkApiKeyHighlight(); // Remove highlight if key is valid

        // If no URL provided, try to suggest one
        if (!url) {
            console.log('No URL provided, asking AI for suggestion...');
            const queryValidation = document.getElementById('queryValidation');
            
            try {
                const suggestedUrl = await suggestUrlForQuery(apiKey, aiQuery);
                if (suggestedUrl) {
                    queryValidation.style.display = 'none';
                    url = suggestedUrl;
                    urlInput.value = url; // Update the input field
                    console.log(`AI suggested URL: ${url}`);
                    updateAnalysisStatus(`🤔 Found the right website for your query: "${escapeHTML(aiQuery)}"<br>Using: ${escapeHTML(url)}`);
                } else {
                    queryValidation.style.display = 'block';
                    resultsDiv.innerHTML = '';
                    resultsDiv.appendChild(createStatusMessage('error', '❌ Please specify a service name (e.g., "WhatsApp QR code" instead of just "QR code") or provide a specific website URL.'));
                    return;
                }
            } catch (error) {
                console.error('URL suggestion failed:', error);
                resultsDiv.innerHTML = '';
                resultsDiv.appendChild(createStatusMessage('error', '❌ Could not suggest a URL. Please specify a website to analyze.'));
                return;
            }
        }

        // Add protocol if missing
        const finalUrl = url.startsWith('http://') || url.startsWith('https://') ? 
                        url : `https://${url}`;

        console.log('Starting analysis for:', finalUrl);

        searchButton.disabled = true;
        const originalButtonText = searchButton.textContent;
        searchButton.textContent = '⏳ Analyzing...';
        
        updateAnalysisStatus(`🚀 Opening tab for: ${escapeHTML(finalUrl)}<br>📡 Capturing network requests for AI analysis...`);

        // Start monitoring for page load (this is a rough estimate)
        setTimeout(() => {
            updateAnalysisStatus(`📄 Page loaded! Capturing network requests for AI analysis...`, true);
        }, 2000);

        // Send message to background script
        chrome.runtime.sendMessage({ type: 'startAnalysis', url: finalUrl }, async (response) => {
            console.log('Received response from background:', response);
            
            searchButton.disabled = false;
            searchButton.textContent = originalButtonText;

            // Clear previous results
            resultsDiv.innerHTML = '';

            if (chrome.runtime.lastError) {
                console.error('Runtime error:', chrome.runtime.lastError);
                resultsDiv.appendChild(createStatusMessage('error', `❌ Runtime Error: ${escapeHTML(chrome.runtime.lastError.message)}`));
                return;
            }

            if (response && response.error) {
                console.error('Analysis error:', response.error);
                resultsDiv.appendChild(createStatusMessage('error', `❌ Analysis Error: ${escapeHTML(response.error)}`));
                return;
            }

            if (response && response.data) {
                console.log('Analysis complete:', response.data);
                
                // Log DOM content if available
                if (response.domContent) {
                    console.log('DOM content also captured:', {
                        url: response.domContent.url,
                        title: response.domContent.title,
                        textLength: response.domContent.textContent?.length || 0,
                        htmlLength: response.domContent.html?.length || 0
                    });
                }

                // AI Mode Processing (always AI mode now)
                try {
                    const totalRequests = response.data.length;
                    const hasFailedRequests = response.data.some(req => 
                        req.responseBody && req.responseBody.includes('Response body not available')
                    );
                    
                    let statusMessage = `🤖 Processing ${totalRequests} requests with AI...<br><small>Stage 1: Generating search keywords...</small>`;
                    if (hasFailedRequests && response.domContent) {
                        statusMessage += `<br><small>📄 Also using captured page content as fallback for failed network requests</small>`;
                    }
                    
                    updateAnalysisStatus(statusMessage);
                    
                    const aiResult = await analyzeWithAI(provider, apiKey, response.data, aiQuery);
                    
                    // Show AI analysis result
                    const usedDomFallback = hasFailedRequests && response.domContent;
                    
                    let successMessage = `✅ AI Analysis Complete! Processed <strong>${response.data.length}</strong> network request(s)<br>
                        <strong>Query:</strong> "${escapeHTML(aiQuery)}"<br>
                        <strong>Website:</strong> ${escapeHTML(finalUrl)}<br>
                        <small>Used smart filtering to minimize token usage. Analysis tab closed automatically.</small>`;
                    
                    if (usedDomFallback) {
                        successMessage += `<br><small>📄 Used page content as fallback for requests that couldn't be captured via network monitoring.</small>`;
                    }
                    
                    const summaryDiv = createStatusMessage('success', successMessage);
                    resultsDiv.appendChild(summaryDiv);
                    
                    // Show AI response
                    const aiResponseDiv = document.createElement('div');
                    aiResponseDiv.style.cssText = 'background: white; padding: 20px; border-radius: 6px; border: 1px solid #ddd; margin-top: 15px; white-space: pre-wrap; font-family: system-ui; line-height: 1.6;';
                    aiResponseDiv.innerHTML = escapeHTML(aiResult).replace(/\n/g, '<br>');
                    resultsDiv.appendChild(aiResponseDiv);
                    
                    // Optionally show raw data
                    const showRawButton = document.createElement('button');
                    showRawButton.textContent = 'Show Raw Network Data';
                    showRawButton.style.cssText = 'margin-top: 0; padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;';
                    
                    // Download Raw Data button
                    const downloadRawButton = document.createElement('button');
                    downloadRawButton.textContent = 'Download Raw Data';
                    downloadRawButton.style.cssText = 'margin-top: 15px; margin-bottom: 10px; padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;';
                    downloadRawButton.onclick = () => {
                        const rawText = formatNetworkData(response.data, '', {});
                        const blob = new Blob([rawText], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'network-raw-data.txt';
                        document.body.appendChild(a);
                        a.click();
                        setTimeout(() => {
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        }, 100);
                    };
                    
                    // Show/Hide Raw Network Data button
                    showRawButton.textContent = 'Show Raw Network Data';
                    showRawButton.style.cssText = 'margin-top: 0; padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;';
                    showRawButton.onclick = () => {
                        const formattedData = formatNetworkData(response.data, '', {});
                        const preElement = document.createElement('pre');
                        preElement.style.cssText = 'white-space: pre-wrap; font-family: monospace; font-size: 13px; margin-top: 15px; background: white; padding: 15px; border-radius: 6px; border: 1px solid #ddd; max-height: 400px; overflow-y: auto;';
                        preElement.innerHTML = formattedData;
                        // Replace or add the raw data
                        const existingPre = resultsDiv.querySelector('pre');
                        if (existingPre) {
                            existingPre.replaceWith(preElement);
                        } else {
                            resultsDiv.appendChild(preElement);
                        }
                        showRawButton.textContent = 'Hide Raw Network Data';
                        showRawButton.onclick = () => {
                            preElement.remove();
                            showRawButton.textContent = 'Show Raw Network Data';
                            showRawButton.onclick = arguments.callee.bind(this);
                        };
                    };
                    resultsDiv.appendChild(downloadRawButton);
                    resultsDiv.appendChild(showRawButton);
                    
                } catch (error) {
                    console.error('AI processing error:', error);
                    resultsDiv.appendChild(createStatusMessage('error', `❌ AI Analysis Error: ${escapeHTML(error.message)}<br><small>Please check your API key and try again.</small>`));
                }
            } else {
                console.warn('No data received in response:', response);
                resultsDiv.appendChild(createStatusMessage('warning', `
                    ⚠️ No network data was captured.<br><br>
                    <strong>Possible reasons:</strong><br>
                    • The page didn't make any network requests<br>
                    • The debugger couldn't attach (try refreshing the extension)<br>
                    • The page loaded too quickly<br>
                    • Network domain wasn't enabled properly<br><br>
                    <strong>Try:</strong><br>
                    • A website with API calls (e.g., jsonplaceholder.typicode.com/posts)<br>
                    • Check the browser console for error messages<br>
                    • Disable other extensions that might interfere
                `));
            }
        });
    });

    // Hide validation message when URL is entered
    urlInput.addEventListener('input', () => {
        const queryValidation = document.getElementById('queryValidation');
        if (urlInput.value.trim()) {
            queryValidation.style.display = 'none';
        }
    });

    // Load saved API key and check highlighting
    apiKeyInput.value = loadApiKey();
    checkApiKeyHighlight(); // Initial highlight check

    // Function to show/hide API key groups based on provider
    function updateApiKeyVisibility() {
        const provider = aiProviderSelect.value;
        geminiApiKeyGroup.style.display = provider === 'gemini' ? '' : 'none';
        openaiApiKeyGroup.style.display = provider === 'openai' ? '' : 'none';
        openaiModelGroup.style.display = provider === 'openai' ? '' : 'none';
    }

    // Run on page load
    updateApiKeyVisibility();
    // Run on provider change
    aiProviderSelect.addEventListener('change', updateApiKeyVisibility);

    // On page load, set OpenAI model
    openaiModelSelect.value = loadOpenAIModel();
    // On model change, save
    openaiModelSelect.addEventListener('change', (e) => {
        saveOpenAIModel(e.target.value);
    });

}); 