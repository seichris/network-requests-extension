import { NETWORK_CONFIG } from './config.js';

let tabId = null;
let networkData = [];
let requestsMap = new Map(); // To match requests with responses
let analysisCallback = null;
let analysisTimer = null;
let domContent = null; // Store captured DOM content

console.log('Background script loaded');

// Handle extension icon click - open options page
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

// Centralized function to stop analysis and clean up
const stopAnalysis = () => {
    console.log('🛑 Stopping analysis...');
    if (analysisTimer) {
        clearTimeout(analysisTimer);
        analysisTimer = null;
        console.log('  ✅ Timer cleared');
    }

    if (tabId) {
        console.log(`  🔌 Detaching debugger from tab ${tabId}`);
        chrome.debugger.detach({ tabId: tabId }).catch((error) => {
            console.log('  ⚠️ Error detaching debugger (tab might be gone):', error);
        });

        if (analysisCallback) {
            // Convert map to array for sending
            const finalData = Array.from(requestsMap.values());
            console.log(`  📊 Sending results: ${finalData.length} requests captured`);
            finalData.forEach((req, i) => {
                console.log(`    Request ${i+1}: ${req.method} ${req.url} (Status: ${req.status || 'pending'})`);
            });
            
            // Include DOM content in results if available
            const results = { 
                data: finalData,
                domContent: domContent
            };
            
            if (domContent) {
                console.log(`  🌐 Including DOM content: ${domContent.textContent.length} chars of text from ${domContent.url}`);
            }
            
            analysisCallback(results);
            if (chrome.runtime.lastError) {
                console.log("  ⚠️ Popup closed before sending results:", chrome.runtime.lastError);
            }
        }

        // Close the analysis tab
        console.log(`  🗑️ Closing analysis tab ${tabId}`);
        chrome.tabs.remove(tabId).catch((error) => {
            console.log('  ⚠️ Error closing tab:', error);
        });
    }

    tabId = null;
    networkData = [];
    requestsMap.clear();
    analysisCallback = null;
    domContent = null; // Reset DOM content
    console.log('  ✅ Cleanup complete');
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Received message:', request);
  
  if (request.type === 'startAnalysis') {
    // If an analysis is already running, stop it first.
    if (tabId) {
        console.log('🔄 Analysis already running, stopping previous analysis');
        stopAnalysis();
    }

    const { url } = request;
    console.log(`🚀 Starting analysis for: ${url}`);
    networkData = [];
    requestsMap.clear();
    domContent = null; // Reset DOM content
    analysisCallback = sendResponse;

    chrome.tabs.create({ url: url }, (newTab) => {
      console.log(`📂 Created new tab: ${newTab.id} for ${url}`);
      tabId = newTab.id;
      
      chrome.debugger.attach({ tabId: tabId }, NETWORK_CONFIG.DEBUGGER_VERSION, () => {
        if (chrome.runtime.lastError) {
          console.error('❌ Failed to attach debugger:', chrome.runtime.lastError);
          if (analysisCallback) {
            analysisCallback({ error: chrome.runtime.lastError.message });
          }
          tabId = null;
          analysisCallback = null;
          return;
        }
        
        console.log('🔧 Debugger attached successfully');
        
        // Enable Network domain
        chrome.debugger.sendCommand({ tabId: tabId }, 'Network.enable', {}, () => {
          if (chrome.runtime.lastError) {
            console.error('❌ Failed to enable Network domain:', chrome.runtime.lastError);
          } else {
            console.log('🌐 Network domain enabled');
          }
        });
      });
    });

    return true; // Response will be sent asynchronously
  }
  
  else if (request.type === 'domContent') {
    console.log('🌐 Received DOM content from injected script');
    domContent = request.data;
    console.log(`  📄 Captured ${domContent.html.length} chars of HTML and ${domContent.textContent.length} chars of text`);
    
    // If we have requests that failed to get response bodies, try to match them with DOM content
    if (domContent.url.includes('paid_memberships') || domContent.url.includes('youtube.com')) {
      requestsMap.forEach((requestData, requestId) => {
        if (requestData.responseBody && requestData.responseBody.includes('Response body not available')) {
          console.log(`  🔄 Adding DOM content as fallback for failed request: ${requestData.url}`);
          requestData.responseBody = `(DOM Content Fallback)\n\nPage Title: ${domContent.title}\n\nPage Text Content:\n${domContent.textContent}\n\n--- Full HTML ---\n${domContent.html}`;
        }
      });
    }
  }
  
  return true; // Response will be sent asynchronously
});

chrome.tabs.onUpdated.addListener((updatedTabId, changeInfo) => {
    if (updatedTabId === tabId && changeInfo.status === 'complete') {
        console.log(`📄 Page loaded completely in tab ${tabId}, starting ${NETWORK_CONFIG.ANALYSIS_TIMEOUT_MS/1000}-second timer`);
        
        // Inject content script to capture DOM content as fallback
        console.log(`💉 Injecting content script to capture DOM content`);
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            function: () => {
                // Wait a bit for dynamic content to load
                setTimeout(() => {
                    const pageData = {
                        url: window.location.href,
                        title: document.title,
                        html: document.documentElement.outerHTML,
                        textContent: document.body ? document.body.innerText : '',
                        timestamp: Date.now()
                    };
                    
                    // Send page data back to background script
                    chrome.runtime.sendMessage({
                        type: 'domContent',
                        data: pageData
                    });
                }, 2000); // Wait 2 seconds for dynamic content
            }
        }).catch((error) => {
            console.log(`⚠️ Could not inject content script: ${error}`);
        });
        
        // Page has loaded. Wait for a few seconds for async requests to finish.
        if (analysisTimer) clearTimeout(analysisTimer);
        analysisTimer = setTimeout(() => {
            console.log(`⏰ ${NETWORK_CONFIG.ANALYSIS_TIMEOUT_MS/1000}-second timer expired, stopping analysis`);
            stopAnalysis();
        }, NETWORK_CONFIG.ANALYSIS_TIMEOUT_MS);
    }
});

chrome.debugger.onEvent.addListener((source, method, params) => {
  if (source.tabId && source.tabId === tabId) {
    
    if (method === 'Network.requestWillBeSent') {
      console.log(`📤 Request: ${params.request.method} ${params.request.url}`);
      // Capture request details
      const requestData = {
        requestId: params.requestId,
        url: params.request.url,
        method: params.request.method,
        requestHeaders: params.request.headers,
        requestBody: params.request.postData || null,
        timestamp: params.timestamp,
        responseReceived: false,
        responseHeaders: null,
        responseBody: null,
        status: null,
        mimeType: null
      };
      
      requestsMap.set(params.requestId, requestData);
    }
    
    else if (method === 'Network.responseReceived') {
      console.log(`📥 Response: ${params.response.status} for ${params.response.url}`);
      const requestData = requestsMap.get(params.requestId);
      if (requestData) {
        // Update with response details
        requestData.responseReceived = true;
        requestData.status = params.response.status;
        requestData.statusText = params.response.statusText;
        requestData.responseHeaders = params.response.headers;
        requestData.mimeType = params.response.mimeType;
        
        const contentLength = params.response.headers['Content-Length'] || params.response.headers['content-length'];
        
        // Don't try to get body for data URIs, redirects, empty responses, etc.
        if (params.response.url.startsWith('data:') || 
            params.response.status === 204 || 
            (params.response.status >= 300 && params.response.status < 400) || 
            contentLength === '0') {
          requestData.responseBody = `(No content: status ${params.response.status})`;
          console.log(`  ⏭️ Skipping body for ${params.response.url} (status ${params.response.status})`);
          return;
        }

        // Get response body immediately - don't wait
        console.log(`  📄 Getting response body for ${params.response.url}`);
        requestData.responseBody = '(Loading...)'; // Set temporary status
        
        // Try to get response body with retry logic
        const attemptGetResponseBody = (attempt = 1, maxAttempts = 3) => {
          chrome.debugger.sendCommand({ tabId: source.tabId }, 'Network.getResponseBody', { requestId: params.requestId }, (response) => {
            if (chrome.runtime.lastError) {
              const errorMsg = chrome.runtime.lastError.message;
              console.log(`  ⚠️ Attempt ${attempt} failed to get response body: ${errorMsg}`);
              
              // If it's a JSON error, try to parse it for more info
              let parsedError = errorMsg;
              try {
                if (errorMsg.includes('{') && errorMsg.includes('}')) {
                  const jsonMatch = errorMsg.match(/\{.*\}/);
                  if (jsonMatch) {
                    const errorObj = JSON.parse(jsonMatch[0]);
                    parsedError = errorObj.message || errorMsg;
                  }
                }
              } catch (e) {
                // Keep original error message if parsing fails
              }
              
              if (attempt < maxAttempts && !errorMsg.includes('No data found')) {
                // Retry for certain types of errors, but not for "No data found"
                console.log(`  🔄 Retrying in 100ms (attempt ${attempt + 1}/${maxAttempts})`);
                setTimeout(() => attemptGetResponseBody(attempt + 1, maxAttempts), 100);
                return;
              }
              
              // Final failure - set error message
              if (errorMsg.includes('No data found')) {
                requestData.responseBody = `(Response body not available - likely streamed or service worker handled)`;
              } else {
                requestData.responseBody = `(Could not get response body: ${parsedError})`;
              }
              return;
            }
            
            if (response) {
              if (response.base64Encoded) {
                // For base64 content, try to decode if it's text
                try {
                  const decoded = atob(response.body);
                  // Check if it looks like text (common for HTML/JSON/XML)
                  if (decoded.length < 1000000 && /^[\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]*$/.test(decoded.substring(0, 1000))) {
                    requestData.responseBody = decoded;
                    console.log(`  📄 Decoded base64 content captured (${decoded.length} chars)`);
                  } else {
                    requestData.responseBody = '[Binary content - base64 encoded]';
                    console.log(`  📦 Binary content captured`);
                  }
                } catch (e) {
                  requestData.responseBody = '[Binary content - base64 encoded]';
                  console.log(`  📦 Could not decode base64 content`);
                }
              } else {
                requestData.responseBody = response.body || '(empty body)';
                console.log(`  📄 Text content captured (${response.body ? response.body.length : 0} chars)`);
              }
            } else {
              requestData.responseBody = '(no response body data)';
              console.log(`  ❌ No response body available`);
            }
          });
        };
        
        // Start the attempt
        attemptGetResponseBody();
      }
    }
    
    // Also handle loading finished event for additional capture opportunities
    else if (method === 'Network.loadingFinished') {
      const requestData = requestsMap.get(params.requestId);
      if (requestData && requestData.responseBody === '(Loading...)') {
        console.log(`  🏁 Loading finished for ${requestData.url}, attempting final body capture`);
        // Try one more time to get the response body
        chrome.debugger.sendCommand({ tabId: source.tabId }, 'Network.getResponseBody', { requestId: params.requestId }, (response) => {
          if (!chrome.runtime.lastError && response) {
            if (response.base64Encoded) {
              try {
                const decoded = atob(response.body);
                if (decoded.length < 1000000 && /^[\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]*$/.test(decoded.substring(0, 1000))) {
                  requestData.responseBody = decoded;
                  console.log(`  📄 Final capture: Decoded base64 content (${decoded.length} chars)`);
                } else {
                  requestData.responseBody = '[Binary content - base64 encoded]';
                }
              } catch (e) {
                requestData.responseBody = '[Binary content - base64 encoded]';
              }
            } else {
              requestData.responseBody = response.body || '(empty body)';
              console.log(`  📄 Final capture: Text content (${response.body ? response.body.length : 0} chars)`);
            }
          } else if (requestData.responseBody === '(Loading...)') {
            requestData.responseBody = '(Response body not available - likely streamed or handled by service worker)';
          }
        });
      }
    }
  }
});

chrome.tabs.onRemoved.addListener((removedTabId) => {
  if (removedTabId === tabId) {
    console.log(`🗑️ Analysis tab ${removedTabId} was closed manually`);
    stopAnalysis();
  }
});