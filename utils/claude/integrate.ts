"use server"
import axios from 'axios';

const apiKey = process.env.ANTHROPIC_API_KEY; // API key stored in environment variables

interface AnthropicResponse {
  content?: { text: string }[];
  error?: { message: string };
}

export async function generateWithAnthropic(prompt: string): Promise<string | null> {
  const headers = {
    'x-api-key': apiKey,
    'content-type': 'application/json',
    'anthropic-version': '2023-06-01',
  };

  const data = {
    model: 'claude-3-5-sonnet-20240620',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1024,
  };

  try {
    const response = await axios.post<AnthropicResponse>(
      'https://api.anthropic.com/v1/messages',
      data,
      { headers, timeout: 30000 }
    );

    if (response.status === 200) {
      const responseData = response.data;

      if (responseData.content && Array.isArray(responseData.content)) {
        return responseData.content.map(item => item.text || '').join('');
      } else {
        return 'No content field in response';
      }
    } else {
      const errorMessage = `Anthropic Error: ${response.status} - ${response.data.error?.message || 'Unknown error'}`;
      console.error(errorMessage);
      return null;
    }
  } catch (error) {
    const errorMessage = `An error occurred: ${(error as Error).message}`;
    console.error(errorMessage);
    return null;
  }
}
