const ANTHROPIC_API_KEY = "";

if (!ANTHROPIC_API_KEY) {
  throw new Error("Missing ANTHROPIC_API_KEY in environment variables");
}

interface AnthropicResponse {
  content: {
    text: string;
  }[];
}

export async function generateWithAnthropic(prompt: string): Promise<string | null> {
  const headers: HeadersInit = {
    'x-api-key': ANTHROPIC_API_KEY as string,
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
  };

  const data = {
    model: "claude-3-5-sonnet-20240620",  // Adjust model as needed
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1024,  // Adjust token limit as needed
  };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseData: AnthropicResponse = await response.json();

    // Extract and return the text content
    if (responseData && responseData.content && Array.isArray(responseData.content)) {
      return responseData.content.map(item => item.text).join('');
    } else {
      console.error("No content field in response");
      return null;
    }
  } catch (error) {
    console.error(`Anthropic Error: ${error}`);
    return null;
  }
}