// index.js

// Assume you've stored your Claude API key as a secret environment variable named ANTHROPIC_API_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"; // Or the correct endpoint for the model you're using

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // --- Step 1: Check if the request method is POST ---
  if (request.method !== 'POST') {
    return new Response('Only POST requests are accepted.', { status: 405 });
  }

  // --- Step 2: Parse the request body (expecting a JSON with a 'prompt' field) ---
  let requestBody;
  try {
    requestBody = await request.json();
  } catch (e) {
    return new Response('Invalid JSON body.', { status: 400 });
  }

  const userPrompt = requestBody.prompt;
  if (!userPrompt) {
    return new Response('Missing "prompt" in request body.', { status: 400 });
  }

  // --- Step 3: Construct the prompt for Claude ---
  // You can customize this to include system messages, context, etc.
  const messages = [
    { role: "user", content: userPrompt }
  ];

  // --- Step 4: Make the API call to Claude ---
  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY, // Authentication
        'anthropic-version': '2023-06-01', // Specify API version (check Anthropic docs for latest)
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229", // Or your preferred Claude model (e.g., "claude-3-sonnet-20240229")
        max_tokens: 1024, // Adjust as needed
        messages: messages,
        // Add other parameters as required by the Claude API (temperature, stop_sequences, etc.)
      }),
    });

    // --- Step 5: Handle the response from Claude ---
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Claude API error: ${response.status} - ${errorText}`);
      return new Response(`Error from Claude API: ${response.status}`, { status: response.status });
    }

    const claudeResponse = await response.json();

    // --- Step 6: Return Claude's response ---
    // You might want to extract the content more specifically from the JSON
    const content = claudeResponse.content.map(block => block.text).join('');

    return new Response(JSON.stringify({
      response: content
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Worker fetch error:', error);
    return new Response(`An internal server error occurred: ${error.message}`, { status: 500 });
  }
}