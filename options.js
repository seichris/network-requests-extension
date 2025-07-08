import { API_CONFIG, STORAGE_KEYS, NETWORK_CONFIG, AI_PROMPTS } from './config.js';

// Using Gemini REST API directly (no external SDK needed)

document.addEventListener('DOMContentLoaded', function() {
    console.log('Options page loaded');
    console.log('✅ Using Gemini REST API directly - AI-first interface');
    
    const urlInput = document.getElementById('url');
    const searchButton = document.getElementById('search');
    const resultsDiv = document.getElementById('results');
    const apiKeyInput = document.getElementById('apiKey');
    const aiQueryInput = document.getElementById('aiQuery');
    
    // Debug: Check if all elements are found
    console.log('Elements found:', {
        urlInput: !!urlInput,
        searchButton: !!searchButton,
        apiKeyInput: !!apiKeyInput,
        aiQueryInput: !!aiQueryInput
    });

    // Add event listeners for Enter key
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    });

    // Set focus to AI query input on load (since it's the primary field)
    aiQueryInput.focus();

    // Network URL management functions
    let networkUrlIndex = 0;
    
    // Function to add a new network URL field
    const addNetworkUrlField = () => {
        networkUrlIndex++;
        const container = document.getElementById('networkUrlsContainer');
        const newRow = document.createElement('div');
        newRow.className = 'network-url-row';
        newRow.innerHTML = `
            <input type="text" class="network-url-input" placeholder="e.g., api.example.com/user, graph.facebook.com/me" data-index="${networkUrlIndex}">
            <button type="button" class="remove-url-btn">−</button>
        `;
        container.appendChild(newRow);
    };
    
    // Function to remove a network URL field
    const removeNetworkUrlField = (button) => {
        const row = button.closest('.network-url-row');
        if (row) {
            row.remove();
        }
    };
    
    // Function to toggle advanced section
    const toggleAdvanced = () => {
        const content = document.getElementById('advancedContent');
        const chevron = document.querySelector('.chevron');
        
        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            chevron.classList.remove('rotated');
        } else {
            content.classList.add('expanded');
            chevron.classList.add('rotated');
        }
    };

    // Function to toggle API key section
    const toggleApiKey = () => {
        const content = document.getElementById('apiKeyContent');
        const toggle = document.getElementById('apiKeyToggle');
        const chevron = document.querySelector('.api-key-chevron');
        
        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            toggle.classList.remove('collapsed');
            chevron.textContent = '▼';
        } else {
            content.classList.add('collapsed');
            toggle.classList.add('collapsed');
            chevron.textContent = '▶';
        }
        updateApiKeyToggleText();
    };

    // Function to update API key toggle text
    const updateApiKeyToggleText = () => {
        const content = document.getElementById('apiKeyContent');
        const toggleText = document.getElementById('apiKeyToggleText');
        const apiKey = apiKeyInput.value.trim();
        
        if (content.classList.contains('collapsed') && apiKey) {
            toggleText.textContent = 'Gemini API Key ✓';
        } else {
            toggleText.textContent = 'Gemini API Key:';
        }
    };

    // Function to check and auto-collapse API key section
    const checkApiKeyCollapse = () => {
        const content = document.getElementById('apiKeyContent');
        const toggle = document.getElementById('apiKeyToggle');
        const chevron = document.querySelector('.api-key-chevron');
        const apiKey = apiKeyInput.value.trim();
        
        if (apiKey && !content.classList.contains('collapsed')) {
            // Auto-collapse when API key is filled
            content.classList.add('collapsed');
            toggle.classList.add('collapsed');
            chevron.textContent = '▶';
        } else if (!apiKey && content.classList.contains('collapsed')) {
            // Auto-expand when API key is empty
            content.classList.remove('collapsed');
            toggle.classList.remove('collapsed');
            chevron.textContent = '▼';
        }
        updateApiKeyToggleText();
    };

    // Function to force expand API key section (for errors)
    const expandApiKeySection = () => {
        const content = document.getElementById('apiKeyContent');
        const toggle = document.getElementById('apiKeyToggle');
        const chevron = document.querySelector('.api-key-chevron');
        
        content.classList.remove('collapsed');
        toggle.classList.remove('collapsed');
        chevron.textContent = '▼';
        updateApiKeyToggleText();
    };
    
    // Function to get all network URLs
    const getNetworkUrls = () => {
        const inputs = document.querySelectorAll('.network-url-input');
        const urls = [];
        inputs.forEach(input => {
            const url = input.value.trim();
            if (url) {
                urls.push(url);
            }
        });
        return urls;
    };
    
    // Function to check if any network URLs are provided
    const hasNetworkUrls = () => {
        return getNetworkUrls().length > 0;
    };
    
    // Function to highlight website URL field when required
    const checkWebsiteUrlHighlight = () => {
        const websiteUrl = urlInput.value.trim();
        const networkUrls = hasNetworkUrls();
        
        if (networkUrls && !websiteUrl) {
            urlInput.classList.add('highlight-required');
        } else {
            urlInput.classList.remove('highlight-required');
        }
    };

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

    // Function to show/hide API key error message
    const showApiKeyError = (show = true) => {
        const apiKeyContainer = document.querySelector('.input-group:has(#apiKey)');
        let errorDiv = apiKeyContainer.querySelector('.api-key-error');
        
        if (show) {
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.className = 'api-key-error';
                errorDiv.style.cssText = 'font-size: 13px; color: #e74c3c; margin-top: 8px; display: flex; align-items: center; gap: 4px;';
                errorDiv.innerHTML = `
                    <span>❌ Check your API key.</span>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: #3498db; text-decoration: none;">Get API key</a>
                `;
                
                // Insert after the existing description div
                const descriptionDiv = apiKeyContainer.querySelector('div[style*="font-size: 12px"]');
                if (descriptionDiv) {
                    descriptionDiv.insertAdjacentElement('afterend', errorDiv);
                } else {
                    apiKeyContainer.appendChild(errorDiv);
                }
            }
            errorDiv.style.display = 'flex';
        } else {
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        }
    };

    // Function to highlight API key input for errors
    const highlightApiKeyError = (highlight = true) => {
        if (highlight) {
            apiKeyInput.classList.add('highlight-required');
            showApiKeyError(true);
            expandApiKeySection(); // Auto-expand on error
        } else {
            apiKeyInput.classList.remove('highlight-required');
            showApiKeyError(false);
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
            } else {
                // Throw error for 400 status codes (API key issues)
                if (response.status === 400) {
                    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
                }
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

    searchButton.addEventListener('click', async () => {
        let url = urlInput.value.trim();
        const apiKey = apiKeyInput.value.trim();
        const aiQuery = aiQueryInput.value.trim();
        const networkUrls = getNetworkUrls();
        
        console.log('AI Search button clicked', { url, hasApiKey: !!apiKey, aiQuery, networkUrls });

        // Check if we're in raw data mode (no AI query but have website URL and network URLs)
        const isRawDataMode = !aiQuery && url && networkUrls.length > 0;
        
        // Validate required fields
        if (!apiKey && !isRawDataMode) {
            checkApiKeyHighlight();
            resultsDiv.innerHTML = '';
            resultsDiv.appendChild(createStatusMessage('error', '❌ Please enter your Gemini API key first, or provide both Website URL and Network Request URLs for raw data mode.'));
            return;
        }
        
        if (!aiQuery && !isRawDataMode) {
            resultsDiv.innerHTML = '';
            resultsDiv.appendChild(createStatusMessage('error', '❌ Please tell me what you\'re looking for, or provide both Website URL and Network Request URLs to get raw data only.'));
            return;
        }
        
        // Check if network URLs are provided but website URL is not
        if (networkUrls.length > 0 && !url) {
            checkWebsiteUrlHighlight();
            resultsDiv.innerHTML = '';
            resultsDiv.appendChild(createStatusMessage('error', '❌ Website URL is required when Network Request URLs are provided.'));
            return;
        }
        
        // Save API key for future use (only if provided)
        if (apiKey) {
            saveApiKey(apiKey);
            checkApiKeyHighlight(); // Remove highlight if key is valid
        }
        checkWebsiteUrlHighlight(); // Remove highlight if validation passes

        // If no URL provided, try to suggest one (only if not in raw data mode)
        if (!url && !isRawDataMode) {
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
                
                // Check if it's a 400 error (likely API key issue)
                if (error.message && error.message.includes('400')) {
                    highlightApiKeyError(true);
                    resultsDiv.appendChild(createStatusMessage('error', `❌ API Key Error: ${escapeHTML(error.message)}<br><small>Please check your API key above.</small>`));
                } else {
                    resultsDiv.appendChild(createStatusMessage('error', '❌ Could not suggest a URL. Please specify a website to analyze.'));
                }
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
        
        let statusMsg = `🚀 Opening tab for: ${escapeHTML(finalUrl)}<br>📡 Capturing network requests`;
        if (isRawDataMode) {
            statusMsg += ` for raw data extraction...`;
        } else {
            statusMsg += ` for AI analysis...`;
        }
        if (networkUrls.length > 0) {
            statusMsg += `<br>🎯 Filtering by ${networkUrls.length} specific network URL(s)`;
        }
        updateAnalysisStatus(statusMsg);

        // Start monitoring for page load (this is a rough estimate)
        setTimeout(() => {
            updateAnalysisStatus(`📄 Page loaded! Capturing network requests for AI analysis...`, true);
        }, 2000);

        // Send message to background script
        chrome.runtime.sendMessage({ type: 'startAnalysis', url: finalUrl, networkUrls: networkUrls }, async (response) => {
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

                // Check if we're in raw data mode or AI mode
                if (isRawDataMode) {
                    // Raw data mode - show data directly without AI analysis
                    const totalRequests = response.data.length;
                    
                    let successMessage = `✅ Raw Data Captured! Retrieved <strong>${totalRequests}</strong> network request(s)<br>
                        <strong>Website:</strong> ${escapeHTML(finalUrl)}<br>
                        <strong>Filtered by:</strong> ${networkUrls.length} specific network URL(s)<br>
                        <small>Analysis tab closed automatically.</small>`;
                    
                    const summaryDiv = createStatusMessage('success', successMessage);
                    resultsDiv.appendChild(summaryDiv);
                    
                    // Show raw data directly
                    const formattedData = formatNetworkData(response.data, '', {});
                    const preElement = document.createElement('pre');
                    preElement.style.cssText = 'white-space: pre-wrap; font-family: monospace; font-size: 13px; margin-top: 15px; background: white; padding: 15px; border-radius: 6px; border: 1px solid #ddd; max-height: 600px; overflow-y: auto;';
                    preElement.innerHTML = formattedData;
                    resultsDiv.appendChild(preElement);
                    
                } else {
                    // AI Mode Processing
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
                        
                        const aiResult = await makeGeminiRequest(apiKey, response.data, aiQuery);
                        
                        // Show AI analysis result
                        const usedDomFallback = hasFailedRequests && response.domContent;
                        
                        let successMessage = `✅ AI Analysis Complete! Processed <strong>${response.data.length}</strong> network request(s)<br>
                            <strong>Query:</strong> "${escapeHTML(aiQuery)}"<br>
                            <strong>Website:</strong> ${escapeHTML(finalUrl)}<br>`;
                        
                        if (networkUrls.length > 0) {
                            successMessage += `<strong>Filtered by:</strong> ${networkUrls.length} specific network URL(s)<br>`;
                        }
                        
                        successMessage += `<small>Used smart filtering to minimize token usage. Analysis tab closed automatically.</small>`;
                        
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
                        
                        // Auto-generate template if this was triggered by a template button
                        if (window.currentAutoProcessTemplate) {
                            console.log('🤖 Auto-generating template for:', window.currentAutoProcessTemplate);
                            setTimeout(() => {
                                autoGenerateTemplate(window.currentAutoProcessTemplate, response.data, aiQuery);
                                window.currentAutoProcessTemplate = null; // Clear the flag
                            }, 1000);
                        }
                        
                    } catch (error) {
                        console.error('AI processing error:', error);
                        
                        // Check if it's a 400 error (likely API key issue)
                        if (error.message && error.message.includes('400')) {
                            highlightApiKeyError(true);
                            resultsDiv.appendChild(createStatusMessage('error', `❌ API Key Error: ${escapeHTML(error.message)}<br><small>Please check your API key above.</small>`));
                        } else {
                            resultsDiv.appendChild(createStatusMessage('error', `❌ AI Analysis Error: ${escapeHTML(error.message)}<br><small>Please check your API key and try again.</small>`));
                        }
                    }
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

    // Add event listeners for API key input
    apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    });
    
    // Save API key immediately when user types it
    apiKeyInput.addEventListener('input', (e) => {
        const apiKey = e.target.value.trim();
        if (apiKey) {
            saveApiKey(apiKey);
            console.log('API key saved automatically');
        }
        checkApiKeyHighlight(); // Update highlighting
        highlightApiKeyError(false); // Clear error state when typing
        checkApiKeyCollapse(); // Check if should auto-collapse
    });
    
    // Also save when the field loses focus
    apiKeyInput.addEventListener('blur', (e) => {
        const apiKey = e.target.value.trim();
        if (apiKey) {
            saveApiKey(apiKey);
            console.log('API key saved on blur');
        }
        checkApiKeyHighlight(); // Update highlighting
        highlightApiKeyError(false); // Clear error state when field loses focus
        checkApiKeyCollapse(); // Check if should auto-collapse
    });

    // Add event listener for AI query input
    aiQueryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    });

    // Hide validation message when URL is entered
    urlInput.addEventListener('input', () => {
        const queryValidation = document.getElementById('queryValidation');
        if (urlInput.value.trim()) {
            queryValidation.style.display = 'none';
        }
        checkWebsiteUrlHighlight(); // Check highlighting when URL changes
    });

    // Add event listeners for network URL fields (using event delegation)
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('network-url-input')) {
            checkWebsiteUrlHighlight(); // Check highlighting when network URLs change
        }
    });

    // Load saved API key and check highlighting
    apiKeyInput.value = loadApiKey();
    checkApiKeyHighlight(); // Initial highlight check

    // Add event listener for advanced toggle
    const advancedToggle = document.getElementById('advancedToggle');
    if (advancedToggle) {
        advancedToggle.addEventListener('click', toggleAdvanced);
    }

    // Add event listener for API key toggle
    const apiKeyToggle = document.getElementById('apiKeyToggle');
    if (apiKeyToggle) {
        apiKeyToggle.addEventListener('click', toggleApiKey);
    }

    // Add event delegation for network URL buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-url-btn')) {
            addNetworkUrlField();
        } else if (e.target.classList.contains('remove-url-btn')) {
            removeNetworkUrlField(e.target);
        }
    });

    // Initialize API key section state
    checkApiKeyCollapse();

    // Template button functionality
    const templateInput = document.getElementById('templateInput');
    const templateDescription = document.getElementById('templateDescription');
    const generateTemplateButton = document.getElementById('generateTemplate');
    
    // Debug: Check if all template elements are found
    console.log('Template elements found:', {
        templateInput: !!templateInput,
        templateDescription: !!templateDescription,
        generateTemplateButton: !!generateTemplateButton
    });
    
    // Pluto template content
    const plutoTemplate = `import { createSession } from '@plutoxyz/automation';
import { chromium } from 'playwright-core';

const PROVIDERS = [
  { id: 'credentials', label: 'Email / Username' },
  { id: 'google', label: 'Google' },
];
const LOGIN_URL = 'https://www.reddit.com/login/';

/**
 * Detect if we run into a 2FA page and handle it
 * return Promise<void>
 */
const handleSecurityDetection = async () => {
  const security = !!(
    await page
      .getByRole('textbox', { name: 'Verification code' })
      .elementHandles()
  ).length;

  if (security) {
    console.log('Reddit 2FA detected, prompting for security code');

    const otp = await session.prompt({
      title: 'Enter one time code',
      description: 'Enter the one time code sent to your phone',
      prompts: [
        {
          label: 'Code',
          type: 'text',
          attributes: {},
        },
      ],
    });

    console.log('Filling security code');
    await page.getByRole('textbox', { name: 'Verification code' }).fill(otp[0]);
    console.log('Security code filled');
    await page.getByRole('button', { name: 'Check code' }).click();
    await page.waitForLoadState('domcontentloaded');
  } else {
    console.log('No security code detected, continuing');
  }
};

const promptAuthType = async () =>
  await session.prompt({
    title: 'Log in to Reddit',
    description: 'Enter your credentials to Log in',
    icon: 'reddit.com',
    prompts: [
      {
        label: 'Login method',
        type: 'login',
        attributes: { providers: PROVIDERS },
      },
    ],
  });

/** Initialize session and initial prompt */
const session = await createSession();

/** Browser Setup */
const cdp = await session.cdp();
const browser = await chromium.connectOverCDP(cdp);
const context = browser.contexts()[0];
const page = context.pages()[0];

const BLOCK_PATTERNS = ['**/home-feed/**', '**/analytics.js'];

for (const pattern of BLOCK_PATTERNS) {
  await context.route(pattern, (route) => {
    console.log('❌ blocked', route.request().url());
    route.abort();
  });
}

console.log('Prompting for auth type');
const [choice] = await promptAuthType();
console.log('Login choice →', choice);

/**
 * Generic "ask again" prompt.  We fall back to this when the
 * login-type=login prompt returns an "Invalid username or password"
 * error that Reddit does not differentiate.
 */
const promptForCredentials = async (usernameError, passwordError) =>
  session.prompt({
    title: 'Login to Reddit',
    description: 'Enter your Reddit credentials to prove your data',
    prompts: [
      {
        label: 'Email or username',
        type: 'text',
        attributes: { min_length: 3, placeholder: 'Email or username' },
        error: usernameError,
      },
      {
        label: 'Password',
        type: 'password',
        attributes: { placeholder: 'Password' },
        error: passwordError,
      },
    ],
  });

/**
 * Fills the username and password fields on the Reddit login page.
 * This function no longer prompts the user for credentials.
 */
const authUsernamePass = async (username, password) => {
  console.log('Filling username');
  await Promise.all([
    page.getByRole('textbox', { name: /Email or username/i }).waitFor(),
    page.getByRole('textbox', { name: /Password/i }).waitFor(),
  ]);

  await page
    .getByRole('textbox', { name: /Email or username/i })
    .fill(username);
  await page.getByRole('textbox', { name: /Password/i }).fill(password);
  await page.getByRole('button', { name: /Log In/i }).click();

  const errorText = page.getByText(/invalid username|something went wrong/i);
  const mfa = page.getByRole('textbox', { name: 'Verification code' });
  const createButton = page.getByRole('link', { name: 'Create post' });

  await Promise.race([
    mfa.waitFor({ state: 'visible', timeout: 20000 }),
    createButton.waitFor({ state: 'visible', timeout: 20000 }),
    errorText.waitFor({ state: 'visible', timeout: 20000 }),
  ]);

  try {
    const isCreateButtonVisible = await createButton.isVisible({
      timeout: 2500,
    });
    if (isCreateButtonVisible) {
      return;
    }
  } catch (e) {}

  /* ── Invalid credentials handling ───────────────────────────── */
  // Multiple types of error UIs surfacing: Either traditional helper-text or the newer banner variant
  const sawError = await errorText
    .isVisible({ timeout: 2500 })
    .catch(() => false);

  console.log('sawError', sawError);

  if (sawError) {
    console.log('Invalid username or password - re-prompting user');

    const [newUsername, newPassword] = await promptForCredentials(
      'Invalid username or password.',
      'Invalid username or password.'
    );

    return authUsernamePass(newUsername, newPassword);
  }

  const has2FA = await page
    .getByRole('textbox', { name: 'Verification code' })
    .isVisible();

  if (has2FA) {
    console.log('Detected 2-Step Verification');
    const [code] = await session.prompt({
      title: 'Enter one time code',
      description: 'Enter the one time code from your authenticator app',
      prompts: [
        {
          label: 'Code',
          type: 'text',
          attributes: {},
        },
      ],
    });

    await page.getByRole('textbox', { name: 'Verification code' }).fill(code);
    await page.getByRole('button', { name: 'Check code' }).click();
  } else {
    console.log('No 2-Step Verification detected, continuing');
  }
};

const authGoogle = async (usernameError, passwordError) => {
  // The Google button lives inside a GIS iframe.  Grab that frame first.
  const gisFrame = page.frameLocator(
    'iframe[src*="accounts.google.com/gsi/"][src*="button"]'
  );

  // Locator *inside* the frame; keeps re-evaluating if GIS re-renders it.
  const googleBtn = gisFrame
    .locator('div[role="button"]')
    .filter({ hasText: /continue with google/i });

  console.log('Clicking "Continue with Google" (inside GIS iframe)…');

  const [googlePage] = await Promise.all([
    page.waitForEvent('popup'), // capture the FedCM popup
    googleBtn.click(), // trigger the click
  ]);

  console.log('Google popup captured');

  console.log('Prompting user for credentials');
  const [username, password] = await session.prompt({
    title: 'Google Email or Phone',
    description: 'Enter your Google credentials to login',
    icon: 'google.com',
    prompts: [
      {
        label: 'Email or phone',
        type: 'text',
        attributes: {
          min_length: 3,
          max_length: 3,
          placeholder: 'Email or phone',
        },
        error: usernameError,
      },
      {
        label: 'Password',
        type: 'password',
        attributes: { placeholder: 'Password' },
        error: passwordError,
      },
    ],
  });

  console.log('Filling Email');
  await googlePage.waitForLoadState('domcontentloaded');
  await googlePage
    .getByRole('textbox', { name: 'Email or phone' })
    .fill(username, { timeout: 5000 });
  console.log('Email filled');
  await googlePage.getByText('Next').click();
  // After the email step Google may either:
  //  • navigate straight to the password page, OR
  //  • show an extra screen with a "Try another way" button.
  //
  // We race those two possibilities.

  // Helper: waits *up to* 4 s for the optional "Try another way" screen.
  const handleOptionalTryAnother = async (_page) => {
    const tryAnotherBtn = _page.getByRole('button', {
      name: /try another way/i,
    });

    const appeared = await tryAnotherBtn
      .waitFor({ state: 'visible', timeout: 4000 })
      .then(() => true)
      .catch(() => false); // → timed-out, button never showed

    if (!appeared) {
      console.log('No optional screen — continuing normally');
      return;
    }

    console.log('Optional "Try another way" screen detected → clicking');
    await Promise.all([
      _page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      tryAnotherBtn.click(),
    ]);
    console.log('"Try another way" handled');
  };

  // Race: either we arrive at the password URL, or we detect & handle the
  // optional screen.  Whichever finishes first unblocks the flow.
  await Promise.race([
    googlePage.waitForURL(/\/signin\/v2\/sl\/pwd/, { timeout: 20000 }),
    handleOptionalTryAnother(googlePage),
  ]);

  // ── Optional "Choose how you'll sign in" screen ──────────────────────────
  const handleOptionalEnterPassword = async (_page) => {
    const enterPwdBtn = _page.getByRole('link', {
      name: /enter your password/i,
    });

    const appeared = await enterPwdBtn
      .waitFor({ state: 'visible', timeout: 4000 })
      .then(() => true)
      .catch(() => false); // timed out → screen never appeared

    if (!appeared) {
      console.log('No "Enter your password" screen—continuing');
      return;
    }

    console.log('Optional screen detected → clicking "Enter your password"');
    await Promise.all([
      _page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      enterPwdBtn.click(),
    ]);
    console.log('"Enter your password" clicked, navigated to password page');
  };

  // Give that screen up to 4 s to show.  If we're *already* on the
  // password page nothing happens because the button isn't present.

  await Promise.race([
    googlePage.waitForURL(/\/signin\/v2\/sl\/pwd/, { timeout: 20000 }),
    await handleOptionalEnterPassword(googlePage),
  ]);

  const pwdBox = googlePage.getByRole('textbox', {
    name: 'Enter your password',
  });
  await pwdBox.waitFor({ state: 'visible' });
  await pwdBox.fill(password, { timeout: 5000 });
  console.log('Password filled');
  await googlePage.getByText('Next').click();

  const navOrClose = Promise.race([
    googlePage.waitForEvent('close').then(() => 'closed'),
    googlePage
      .waitForNavigation({ waitUntil: 'networkidle' })
      .then(() => 'navigated'),
  ]);

  const result = await navOrClose;
  if (result === 'closed') {
    console.log('Google popup closed – login finished without 2-FA');
    return;
  }

  await googlePage.waitForTimeout(2000);

  const tryAnother = googlePage.getByRole('button', {
    name: 'Try another way',
  });
  if ((await tryAnother.elementHandles()).length) {
    console.log("Clicking 'Try another way'");
    await tryAnother.click();
    await googlePage.waitForTimeout(3000);
  } else {
    console.log("'Try another way' not present - continuing");
  }

  const has2FA = !!(
    await googlePage.getByText('2-Step Verification').elementHandles()
  ).length;

  if (has2FA) {
    console.log('Detected 2-Step Verification');

    const hasOptionalScreen = googlePage.getByText(
      'fingerprint, face, or screen lock'
    );
    if (!!(await hasOptionalScreen.elementHandles()).length) {
      console.log('Detected extra 2fa screen, continuing');
      await googlePage.getByRole('button', { name: 'Try another way' }).click();
      await googlePage.waitForTimeout(1000);
    }

    const tabletOption = {
      label: 'Tap Yes on your phone or tablet',
      locator: googlePage.getByRole('link', {
        name: ' on your phone or tablet',
      }),
      followup: async (_page, _code) => {},
      prompt: async () => ({
        title: 'Confirm Access',
        description: 'Confirm you allowed access in your Google App',
        prompts: [
          {
            label: 'Confirm to continue',
            type: 'checkbox',
            attributes: { required: true, options: ['Confirm'] },
          },
        ],
      }),
    };
    const authenticator = {
      label: 'Get a verification code from the Google Authenticator app',
      locator: googlePage.getByRole('link', {
        name: 'Get a verification code from',
      }),
      followup: async (_page, _code) => {
        await _page.getByRole('textbox', { name: 'Enter code' }).fill(_code);
        await _page.getByText('Next').click();
      },
      prompt: () => ({
        title: 'Enter one time code',
        description: 'Enter the one time code sent to your phone',
        prompts: [
          {
            label: 'Code',
            type: 'text',
            attributes: {},
          },
        ],
      }),
    };
    const smsCode = {
      label: 'Get a verification code sent to your phone',
      locator: googlePage.getByRole('link', {
        name: 'Get a verification code at',
      }),
      followup: async (_page, _code) => {
        await _page
          .getByRole('textbox', { name: 'Enter the code' })
          .fill(_code);
        await _page.getByText('Next').click();
      },
      prompt: () => ({
        title: 'Enter one time code',
        description: 'Enter the one time code sent to your phone',
        prompts: [
          {
            label: 'Code',
            type: 'text',
            attributes: {},
          },
        ],
      }),
    };

    const allOptions = [tabletOption, authenticator, smsCode];
    const checkPromises = allOptions.map(async (option) => {
      try {
        if (!(await option.locator.elementHandles()).length) {
          console.warn(\`Option '\${option.label}' locator not visible.\`);
          return null;
        }

        const isEnabled = !(await option.locator.isDisabled());
        if (!isEnabled) {
          console.warn(
            \`Found disabled option: \${await option.locator.innerText()}\`
          );
        } else {
          console.log(
            \`Found enabled option \${await option.locator.innerText()}\`
          );
        }

        return isEnabled ? option : null;
      } catch (error) {
        console.error(\`Error checking option '\${option.label}':\`, error);
        return null;
      }
    });

    const checkedOptions = await Promise.all(checkPromises);
    const enabledOptions = checkedOptions.filter((o) => !!o);
    if (enabledOptions.length > 0) {
      if (enabledOptions.length > 1) {
        console.log(
          \`Prompting user with enabled 2-Factor options.\${(
            await Promise.all(
              enabledOptions.map(
                async (e, i) => \`\${i + 1}) \${await e.locator.innerText()}\`
              )
            )
          ).join('\\n')}\`
        );

        const [choice] = await session.prompt({
          title: 'Two Factor Authentication',
          description: "Choose how you'd like to 2FA",
          prompts: [
            {
              label: 'Two Factor Method',
              type: 'checkbox',
              attributes: {
                multiple: false,
                options: enabledOptions.map((o) => o.label),
              },
            },
          ],
        });

        console.log('Selecting 2FA method');
        const match = enabledOptions.findIndex((i) => i.label === choice[0]);
        await enabledOptions[match].locator.click();
        console.log('Prompting user for 2FA');
        const [code] = await session.prompt(
          await enabledOptions[match].prompt()
        );

        if (enabledOptions[match].followup) {
          console.log('Entering 2FA Code');
          await enabledOptions[match].followup(googlePage, code);
          console.log('2FA code entered');
        }
      } else {
        console.log(
          \`Found a single enabled option: \${await enabledOptions[0].locator.innerText()}\`
        );

        await enabledOptions[0].locator.click();
        console.log('Prompting user for 2FA');
        const [code] = await session.prompt(await enabledOptions[0].prompt());
        if (enabledOptions[0].followup) {
          console.log('Entering 2FA Code');
          await enabledOptions[0].followup(googlePage, code);
          console.log('2FA code entered');
        }
      }
    } else {
      console.log('No enabled options found.');
    }
  }
};

console.log(\`Navigating to \${LOGIN_URL}\`);
await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
console.log(\`\${LOGIN_URL} loaded\`);

await handleSecurityDetection();

switch (choice.id) {
  case 'google':
    console.log('Authing Google');
    await authGoogle(undefined, undefined);
    await page.waitForLoadState('domcontentloaded');
    await handleSecurityDetection();
    break;
  case 'credentials':
    console.log('Email →', choice.email);
    console.log('Password →', choice.password);
    await authUsernamePass(choice.email, choice.password);
    break;
}

/**
 * Navigate to User Profile
 */
console.log('User Logged In');
await page.waitForLoadState('domcontentloaded');
console.log('Navigating to User Profile');
const userMenuBtn = page.getByRole('button', { name: /expand user menu$/i });
await userMenuBtn.waitFor({ state: 'visible', timeout: 30000 });
await userMenuBtn.click();
await page.getByText('View Profile').click();

/**
 * Scrape Username
 */
await page.waitForLoadState('domcontentloaded');

console.log('User Profile Loaded');
console.log('Scraping Username');
const handle = await page
  .getByLabel('Profile information')
  .getByRole('heading', {
    name: /^(?!\\s*(?:Settings|Social\\s+Links|Trophy\\s+Case)\\s*$).+/i,
  })
  .innerText();
console.log('Username Scraped');

const [postKarma, commentKarma] = await page
  .getByTestId('karma-number')
  .allInnerTexts();

/**
 * Generate proof and cleanup
 */
console.log(\`Generating proof of username \${handle}\`);
await session.prove('reddit-data', [
  { redditUsername: handle },
  {
    totalKarma: (
      Number.parseInt(postKarma.replace(',', ''), 10) +
      Number.parseInt(commentKarma.replace(',', ''), 10)
    ).toLocaleString('en-US'),
  },
  { postKarma },
  { commentKarma },
]);
console.log('Proof generated');

console.log('Performing cleanup');
await page.close();
await browser.close();
await session.close();`;

    // Template button event listeners
    const plutoButton = document.getElementById('plutoTemplate');
    const reclaimButton = document.getElementById('reclaimTemplate');
    const primusButton = document.getElementById('primusTemplate');
    const zkp2pButton = document.getElementById('zkp2pTemplate');
    const opacityButton = document.getElementById('opacityTemplate');
    

    // Function to enable/disable generate button based on template content
    const updateGenerateButton = () => {
        if (templateInput && generateTemplateButton) {
            generateTemplateButton.disabled = !templateInput.value.trim();
        }
    };

    // Pluto button functionality
    if (plutoButton && templateInput && templateDescription) {
        plutoButton.addEventListener('click', () => {
            templateInput.value = plutoTemplate;
            templateDescription.innerHTML = 'See this example on verifying Reddit Karma at <a href="https://playground.pluto.xyz/" target="_blank" style="color: #3498db;">https://playground.pluto.xyz/</a>';
            updateGenerateButton();
        });
    }

    // Placeholder functionality for other template buttons
    if (reclaimButton) {
        reclaimButton.addEventListener('click', () => {
            templateInput.value = `Data source URL
https://www.github.com
Request URL
https://www.github.com/graphql
Data items  
(jsonPath)
username
$.data.user.login`;
            templateDescription.innerHTML = 'See this example on verifying XHS at <a href="https://dev.reclaimprotocol.org/explore" target="_blank" style="color: #3498db;">https://dev.reclaimprotocol.org/explore</a>';
            updateGenerateButton();
        });
    }

    if (opacityButton) {
        opacityButton.addEventListener('click', () => {
            templateInput.value = `Data source URL
https://www.github.com
Request URL
https://www.github.com/graphql
Data items  
(jsonPath)
username
$.data.user.login`;
            templateDescription.innerHTML = 'See this example on verifying XHS at <a href="https://app.opacity.network/dashboard" target="_blank" style="color: #3498db;">https://app.opacity.network/dashboard</a>';
            updateGenerateButton();
        });
    }

    if (primusButton) {
        primusButton.addEventListener('click', () => {
            templateInput.value = `Data source URL
https://www.xiaohongshu.com/explore
Request URL
https://edith.xiaohongshu.com/api/sns/web/v2/user/me
Data items  
(jsonPath)
red_id
$.data.red_id`;
            templateDescription.innerHTML = 'See this example on verifying XHS at <a href="https://dev.primuslabs.xyz/" target="_blank" style="color: #3498db;">https://dev.primuslabs.xyz/</a>';
            updateGenerateButton();
        });
    }

    if (zkp2pButton) {
        zkp2pButton.addEventListener('click', () => {
            templateInput.value = `{
  "actionType": "transfer_venmo",
  "authLink": "https://account.venmo.com/?feed=mine",
  "url": "https://account.venmo.com/api/stories?feedType=me&externalId={{SENDER_ID}}",
  "method": "GET",
  "body": "",
  "metadata": {
    "platform": "venmo",
    "urlRegex": "https://account.venmo.com/api/stories\\\\?feedType=me&externalId=\\\\S+",
    "method": "GET",
    "fallbackUrlRegex": "",
    "fallbackMethod": "",
    "preprocessRegex": "",
    "transactionsExtraction": {
      "transactionJsonPathListSelector": "$.stories",
      "transactionJsonPathSelectors": {
        "recipient": "$.title.receiver.username",
        "amount": "$.amount",
        "date": "$.date",
        "paymentId": "$.paymentId",
        "currency": "$.currency"
      }
    },
    "proofMetadataSelectors": [
      {
        "type": "jsonPath",
        "value": "$.stories[{{INDEX}}].amount"
      },
      {
        "type": "jsonPath",
        "value": "$.stories[{{INDEX}}].paymentId"
      },
      {
        "type": "jsonPath",
        "value": "$.stories[{{INDEX}}].title.receiver.username"
      }
    ]
  },
  "paramNames": [
    "SENDER_ID"
  ],
  "paramSelectors": [
    {
      "type": "jsonPath",
      "value": "$.stories[{{INDEX}}].title.sender.id"
    }
  ],
  "skipRequestHeaders": [],
  "secretHeaders": [
    "Cookie"
  ],
  "responseMatches": [
    {
      "type": "regex",
      "value": "\\"amount\\":\\"- \\\\$(?<amount>[^\\"]+)\\""
    },
    {
      "type": "regex",
      "value": "\\"date\\":\\"(?<date>[^\\"]+)\\""
    },
    {
      "type": "regex",
      "value": "\\"paymentId\\":\\"(?<paymentId>[^\\"]+)\\""
    },
    {
      "type": "regex",
      "value": "\\"id\\":\\"(?<receiverId>[^\\"]+)\\"",
      "hash": true
    },
    {
      "type": "regex",
      "value": "\\"subType\\":\\"none\\""
    }
  ],
  "responseRedactions": [
    {
      "jsonPath": "$.stories[{{INDEX}}].amount",
      "xPath": ""
    },
    {
      "jsonPath": "$.stories[{{INDEX}}].date",
      "xPath": ""
    },
    {
      "jsonPath": "$.stories[{{INDEX}}].paymentId",
      "xPath": ""
    },
    {
      "jsonPath": "$.stories[{{INDEX}}].title.receiver.id",
      "xPath": ""
    },
    {
      "jsonPath": "$.stories[{{INDEX}}].subType",
      "xPath": ""
    }
  ],
  "mobile": {
    "includeAdditionalCookieDomains": [],
    "actionLink": "venmo://paycharge?txn=pay&recipients={{RECEIVER_ID}}&note=cash&amount={{AMOUNT}}",
    "isExternalLink": true,
    "appStoreLink": "https://apps.apple.com/us/app/venmo/id351727428",
    "playStoreLink": "https://play.google.com/store/apps/details?id=com.venmo"
  }
}`;
            templateDescription.innerHTML = 'See this example on verifying Venmo at <a href="https://github.com/zkp2p/providers" target="_blank" style="color: #3498db;">https://github.com/zkp2p/providers</a>';
            updateGenerateButton();
        });
    }

    // Update generate button when template input changes
    if (templateInput) {
        templateInput.addEventListener('input', updateGenerateButton);
        updateGenerateButton(); // Initial check
    }

    // Generate from Template button functionality
    if (generateTemplateButton) {
        console.log('✅ Adding event listener to generateTemplate button');
        generateTemplateButton.addEventListener('click', async () => {
            console.log('🤖 Generate from Template button clicked!');
            const templateContent = templateInput.value.trim();
            const currentQuery = aiQueryInput.value.trim();
            console.log('Template content:', templateContent.substring(0, 100) + '...');
            console.log('Current AI query:', currentQuery);
            
            if (!templateContent) {
                alert('Please select a template first.');
                return;
            }

            // Check if we have captured network data
            const hasNetworkData = resultsDiv.innerHTML.includes('network request') || resultsDiv.innerHTML.includes('Request');
            console.log('Has network data:', hasNetworkData);

            try {
                // Check if API key is available for AI-powered template generation
                const apiKey = apiKeyInput.value.trim();
                
                if (templateContent.includes('import') && templateContent.includes('createSession') && apiKey && hasNetworkData && currentQuery) {
                    // Smart Playwright template generation using AI
                    console.log('🧠 Generating intelligent Playwright template with AI');
                    
                    // Get the current results text for context
                    const networkDataText = resultsDiv.textContent || '';
                    
                    // Create AI prompt for template generation
                    const templatePrompt = `You are a code generator. Based on this user query: "${currentQuery}"

And this captured network data from their browsing session:
${networkDataText.substring(0, 5000)}

Modify this Playwright template to extract the data the user is looking for:
${templateContent}

Requirements:
1. Keep the same basic structure and authentication flow
2. Modify the data extraction part to get: ${currentQuery}
3. Update variable names and extraction logic to match the query
4. Update the final session.prove() call to include the relevant data
5. Keep the same imports and general flow
6. Make sure the code extracts data relevant to: ${currentQuery}

Return only the modified Playwright script, no explanations.`;

                    // Show processing status
                    const statusMessage = createStatusMessage('info', '🧠 AI is generating custom template based on your query and captured data...');
                    const templateOutput = document.getElementById('templateOutput');
                    if (templateOutput) {
                        templateOutput.textContent = 'Generating intelligent template...';
                    }
                    
                    try {
                        // Make AI request to generate custom template
                        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: templatePrompt }] }],
                                generationConfig: {
                                    temperature: 0.3,
                                    maxOutputTokens: 4000
                                }
                            })
                        });

                        const data = await response.json();
                        
                        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                            const generatedTemplate = data.candidates[0].content.parts[0].text
                                .replace(/```javascript/g, '')
                                .replace(/```js/g, '')
                                .replace(/```/g, '')
                                .trim();
                            
                            // Display the generated template
                            if (templateOutput) {
                                templateOutput.textContent = generatedTemplate;
                            }
                            
                            // Show success message
                            resultsDiv.innerHTML = '';
                            const successMessage = createStatusMessage('success', `✅ Smart template generated! AI adapted the Playwright script for: "${currentQuery}"`);
                            resultsDiv.appendChild(successMessage);
                            
                            console.log('✅ Generated custom template successfully');
                        } else {
                            throw new Error('Invalid AI response');
                        }
                        
                    } catch (aiError) {
                        console.error('AI template generation error:', aiError);
                        // Fall back to basic template parsing
                        basicTemplateHandling();
                    }
                    
                } else {
                    // Basic template handling for non-AI cases
                    basicTemplateHandling();
                }
                
                // Basic template handling function
                function basicTemplateHandling() {
                    if (templateContent.startsWith('{')) {
                        // JSON format (like zkp2p template)
                        console.log('Parsing as JSON template');
                        const template = JSON.parse(templateContent);
                        if (template.url) {
                            urlInput.value = template.url;
                            aiQueryInput.focus();
                            aiQueryInput.value = 'Analyze this API endpoint for data extraction patterns';
                        }
                    } else if (templateContent.includes('import') && templateContent.includes('createSession')) {
                        // Playwright script format (like Pluto template)
                        console.log('Parsing as Playwright script template');
                        
                        const urlMatches = templateContent.match(/https?:\/\/[^\s'"]+/g);
                        if (urlMatches && urlMatches.length > 0) {
                            const loginUrl = urlMatches.find(url => url.includes('login')) || urlMatches[0];
                            urlInput.value = loginUrl;
                            console.log('Extracted URL from Playwright script:', loginUrl);
                            
                            aiQueryInput.focus();
                            aiQueryInput.value = 'Extract user profile data and account information';
                        } else {
                            urlInput.value = 'https://www.reddit.com';
                            aiQueryInput.focus();
                            aiQueryInput.value = 'Extract my Reddit karma and username';
                        }
                    } else {
                        // Simple format (like Primus/Reclaim template)
                        console.log('Parsing as simple template');
                        const lines = templateContent.split('\n');
                        let requestUrl = '';
                        
                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i].trim();
                            if (line === 'Request URL' && i + 1 < lines.length) {
                                requestUrl = lines[i + 1].trim();
                                break;
                            }
                        }
                        
                        console.log('Extracted Request URL:', requestUrl);
                        
                        if (requestUrl) {
                            urlInput.value = requestUrl;
                            aiQueryInput.focus();
                            aiQueryInput.value = 'Analyze this API endpoint for data extraction patterns';
                        }
                    }
                    
                    // Update highlights and show basic success message
                    checkWebsiteUrlHighlight();
                    const statusMessage = createStatusMessage('success', '✅ Template processed! URL has been set.');
                    resultsDiv.innerHTML = '';
                    resultsDiv.appendChild(statusMessage);
                }
                
            } catch (error) {
                console.error('Error processing template:', error);
                alert('Error processing template. Please check the template format.');
            }
        });
    } else {
        console.log('❌ generateTemplate button not found!');
    }

    // Auto-process template buttons (the ones above "Analyze Requests" button)
    // These should automatically trigger the full analysis process
    const autoProcessTemplateButtons = () => {
        // Find all template buttons in the first section (above Analyze Requests)
        const topPlutoButton = document.querySelector('#search').parentElement.querySelector('#plutoTemplate');
        const topReclaimButton = document.querySelector('#search').parentElement.querySelector('#reclaimTemplate');
        const topPrimusButton = document.querySelector('#search').parentElement.querySelector('#primusTemplate');
        const topZkp2pButton = document.querySelector('#search').parentElement.querySelector('#zkp2pTemplate');
        const topOpacityButton = document.querySelector('#search').parentElement.querySelector('#opacityTemplate');

        console.log('Auto-process template buttons found:', {
            topPlutoButton: !!topPlutoButton,
            topReclaimButton: !!topReclaimButton,
            topPrimusButton: !!topPrimusButton,
            topZkp2pButton: !!topZkp2pButton,
            topOpacityButton: !!topOpacityButton
        });

        // Auto-process function that runs the full analysis
        const runAutoProcess = async (templateType, templateData, queryText, targetUrl) => {
            console.log(`🚀 Auto-processing ${templateType} template`);
            
            // Set the form values
            urlInput.value = targetUrl;
            aiQueryInput.value = queryText;
            
            // Update highlights
            checkWebsiteUrlHighlight();
            checkApiKeyHighlight();
            
            // Check if API key is available
            const apiKey = apiKeyInput.value.trim();
            if (!apiKey) {
                highlightApiKeyError(true);
                expandApiKeySection();
                alert('Please enter your Gemini API key first.');
                return;
            }
            
            // Show status message
            const statusMessage = createStatusMessage('info', `🤖 Auto-processing ${templateType} template...`);
            resultsDiv.innerHTML = '';
            resultsDiv.appendChild(statusMessage);
            
            // Store the template type for later use
            window.currentAutoProcessTemplate = templateType;
            
            // Trigger the analysis
            setTimeout(() => {
                searchButton.click();
            }, 1000);
        };

        // Add event listeners for auto-process buttons
        if (topReclaimButton) {
            topReclaimButton.addEventListener('click', () => {
                runAutoProcess('Reclaim', 'github', 'Extract my GitHub username', 'https://www.github.com/graphql');
            });
        }

        if (topPrimusButton) {
            topPrimusButton.addEventListener('click', () => {
                runAutoProcess('Primus', 'xiaohongshu', 'Extract my XHS red_id', 'https://edith.xiaohongshu.com/api/sns/web/v2/user/me');
            });
        }

        if (topZkp2pButton) {
            topZkp2pButton.addEventListener('click', () => {
                runAutoProcess('zkP2P', 'venmo', 'Extract Venmo transaction data', 'https://account.venmo.com/api/stories');
            });
        }

        if (topPlutoButton) {
            topPlutoButton.addEventListener('click', () => {
                // Use the current AI query instead of hard-coded Reddit analysis
                const currentQuery = aiQueryInput.value.trim() || 'Extract user data';
                runAutoProcess('Pluto', 'dynamic', currentQuery, '');
            });
        }

        if (topOpacityButton) {
            topOpacityButton.addEventListener('click', () => {
                runAutoProcess('Opacity', 'generic', 'Extract user data', 'https://example.com');
            });
        }
    };

    // Initialize auto-process buttons
    autoProcessTemplateButtons();

    // Auto-generate template function
    const autoGenerateTemplate = async (templateType, networkData, query) => {
        console.log(`🤖 Auto-generating ${templateType} template with captured data`);
        
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            console.log('❌ No API key available for auto-template generation');
            return;
        }
        
        // Get the appropriate template based on type
        let baseTemplate = '';
        switch (templateType) {
            case 'Pluto':
                baseTemplate = plutoTemplate;
                break;
            case 'Reclaim':
                baseTemplate = `Data source URL
https://www.github.com
Request URL
https://www.github.com/graphql
Data items  
(jsonPath)
username
$.data.user.login`;
                break;
            case 'Primus':
                baseTemplate = `Data source URL
https://www.xiaohongshu.com/explore
Request URL
https://edith.xiaohongshu.com/api/sns/web/v2/user/me
Data items  
(jsonPath)
red_id
$.data.red_id`;
                break;
            case 'zkP2P':
                baseTemplate = `{
  "actionType": "transfer_venmo",
  "authLink": "https://account.venmo.com/?feed=mine",
  "url": "https://account.venmo.com/api/stories?feedType=me&externalId={{SENDER_ID}}",
  "method": "GET"
}`;
                break;
            default:
                console.log('❌ Unknown template type:', templateType);
                return;
        }
        
        // Show status in the template output area
        const templateOutput = document.getElementById('templateOutput');
        if (templateOutput) {
            templateOutput.textContent = `🤖 Auto-generating ${templateType} template for: "${query}"\n\nAnalyzing captured network data and adapting template...`;
        }
        
        // Prepare network data as text
        const networkDataText = JSON.stringify(networkData, null, 2);
        
        // Create AI prompt for auto-template generation
        const autoTemplatePrompt = `You are a code generator. Based on this user query: "${query}"

And this captured network data from their browsing session:
${networkDataText.substring(0, 8000)}

Adapt this ${templateType} template to extract the data the user is looking for:
${baseTemplate}

Requirements:
1. Keep the same basic structure and format as the original template
2. Modify the data extraction to match the user's query: "${query}"
3. Use the captured network data to find the most relevant API endpoints
4. Update URLs, paths, and extraction logic to match what was actually captured
5. For Playwright scripts: Keep authentication flow but change data extraction
6. For JSON templates: Update URLs and jsonPath selectors based on captured data
7. For simple templates: Update Request URLs and data extraction paths

Return only the modified template code, no explanations.`;

        try {
            // Make AI request to generate auto-template
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: autoTemplatePrompt }] }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 4000
                    }
                })
            });

            const data = await response.json();
            
            if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                const generatedTemplate = data.candidates[0].content.parts[0].text
                    .replace(/```javascript/g, '')
                    .replace(/```js/g, '')
                    .replace(/```json/g, '')
                    .replace(/```/g, '')
                    .trim();
                
                // Display the generated template
                if (templateOutput) {
                    templateOutput.textContent = generatedTemplate;
                }
                
                // Show success message in main results area
                const autoSuccessDiv = document.createElement('div');
                autoSuccessDiv.style.cssText = 'background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 6px; margin-top: 15px;';
                autoSuccessDiv.innerHTML = `✅ <strong>Auto-Template Generated!</strong><br>AI created a custom ${templateType} template for: "${escapeHTML(query)}"<br><small>Check the "Generated Output" section below for the code.</small>`;
                resultsDiv.appendChild(autoSuccessDiv);
                
                console.log('✅ Auto-generated template successfully');
            } else {
                throw new Error('Invalid AI response for auto-template generation');
            }
            
        } catch (error) {
            console.error('Auto-template generation error:', error);
            if (templateOutput) {
                templateOutput.textContent = `❌ Auto-template generation failed: ${error.message}\n\nPlease try the manual "🤖 Generate from Template" button instead.`;
            }
        }
    };

}); 