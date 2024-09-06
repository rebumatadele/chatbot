"use server";

const apiKey = process.env.ANTHROPIC_API_KEY; // API key stored in environment variables

interface AnthropicResponse {
  content?: { text: string }[];
  error?: { message: string };
}

export async function generateWithAnthropic(prompt: string): Promise<string | null> {
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set in the environment variables.');
    return null;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
      }),
    });

    console.log("Response Status:", response.status);

    if (response.ok) { // Check if status is in the range 200-299
      const data: AnthropicResponse = await response.json();
      if (data.content && Array.isArray(data.content)) {
        return data.content.map(item => item.text || '').join('');
      } else {
        console.error('No content field in the Anthropic API response:', data);
        return null;
      }
    } else {
      const errorText = await response.text();
      const errorMessage = `Anthropic API Error: ${response.status} - ${errorText || 'Unknown error'}`;
      console.error(errorMessage);
      return null;
    }
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return null;
  }
}
