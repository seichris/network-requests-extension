# Network Request Analyzer Extension

A Chrome extension that helps you find which network request contains the specific information you're looking for. Instead of manually inspecting hundreds of network calls, simply describe what you need and let the extension pinpoint the exact request with that data.

## Why This Matters for zkTLS

One of the main features of zkTLS is that it scales to any webservice, where traditional APIs only work for services that host them. This extension aims to make creating and maintaining zkTLS templates easier, and thus allowing more people to create and maintain those APIs.

## Features

### 🔍 Keyword Search
- Capture all network requests from any website
- Search for specific keywords in:
  - Request/Response headers
  - Request payloads
  - Response bodies
- Customizable search scope with checkboxes
- Detailed view of all captured requests

### 🤖 AI-Powered Search (Gemini 2.5 Flash)
- Ask natural language questions about network traffic
- Examples:
  - "What is my YouTube username?"
  - "Which request gives the QR code to login?"
  - "Find any authentication tokens"
  - "Show me API endpoints related to user data"
  - "Where is my account balance information?"
  - "Which request contains my profile picture URL?"
- Smart analysis of all captured network data
- Contextual answers with specific request details

## Roadmap

- Turn request into reclaim / primus / pluto / opacity templates
- Add sidebar showing every past search

## Code Organization

The codebase uses a centralized configuration approach for better maintainability:

### `config.js` - Centralized Configuration
Contains all hardcoded values that were previously scattered throughout the code:

- **API Configuration**: Gemini endpoints, model settings, and temperature values
- **Storage Keys**: LocalStorage key names for consistent data access  
- **Network Configuration**: Analysis timeouts, token limits, and debugger settings
- **AI Prompts**: All AI prompt templates for URL suggestions, keyword generation, and request analysis

This makes it easy to:
- Update API endpoints or model parameters in one place
- Modify analysis timeouts and limits
- Adjust AI prompt templates
- Maintain consistent configuration across all files

### File Structure
- `config.js` - Centralized configuration and prompts
- `background.js` - Service worker for tab management and network capture
- `options.js` - Main UI logic and AI processing
- `options.html` - User interface
- `manifest.json` - Extension permissions and metadata

## How to Use

1. **Install the Extension**
   - Load the extension in Chrome Developer Mode
   - Click on the extension icon to open the analyzer

2. **Choose Your Search Mode**
   - **Keyword Search**: Traditional text-based search
   - **AI Search**: Natural language queries powered by Gemini

3. **For AI Search**
   - Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Enter your API key (stored locally in your browser)
   - Ask your question in natural language

4. **Analyze Network Requests**
   - Enter the website URL you want to analyze
   - Choose your search method and enter your query
   - Click "Analyze" to capture and process network requests

## Setup for AI Features

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a free API key for Gemini
3. Enter the API key in the extension (stored locally)
4. Start asking questions about network traffic!

## Privacy & Security

- **API Key**: Stored locally in your browser, never sent to our servers
- **Network Data**: Processed locally and only sent to Google's Gemini API for analysis
- **No Data Storage**: We don't store any of your browsing data or network requests

## Technical Details

- **Manifest Version**: 3
- **Permissions**: activeTab, tabs, debugger, storage
- **AI Model**: Gemini 2.5 Flash
- **Supported URLs**: All websites with HTTPS/HTTP protocols

## Use Cases

- **Security Analysis**: Find authentication tokens, API keys, or sensitive data
- **API Discovery**: Understand how web applications communicate with backends
- **Debugging**: Quickly locate specific network calls or error responses
- **Research**: Analyze traffic patterns of web applications
- **User Data**: Find personal information like usernames, IDs, or profile data
