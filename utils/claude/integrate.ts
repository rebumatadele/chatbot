"use server"
import axios, { AxiosError } from 'axios';

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

    if (response.status >= 200 && response.status < 300) {
      if (response.data.content && Array.isArray(response.data.content)) {
        return response.data.content.map(item => item.text || '').join('');
      } else {
        console.error('No content field in the Anthropic API response:', response.data);
        return null;
      }
    } else {
      const errorMessage = `Anthropic API Error: ${response.status} - ${response.data.error?.message || 'Unknown error'}`;
      console.error(errorMessage);
      return null;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const errorMessage = `An error occurred while calling the Anthropic API: ${axiosError.message}`;
      console.error(errorMessage);
    } else {
      console.error('An unexpected error occurred:', error);
    }
    return null;
  }
}