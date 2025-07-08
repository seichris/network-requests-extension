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
                        
                        // Optionally show raw data
                        const showRawButton = document.createElement('button');
                        showRawButton.textContent = 'Show Raw Network Data';
                        showRawButton.style.cssText = 'margin-top: 15px; padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;';
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
                        resultsDiv.appendChild(showRawButton);
                        
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

}); 