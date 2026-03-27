import OpenAI from 'openai';
import type { ChatMessage, Memo } from '../types';
import { storageService } from './storage';

function getClient(): OpenAI | null {
  const config = storageService.getConfig();
  const apiKey = config['openai_api_key'];
  if (!apiKey) return null;

  return new OpenAI({
    apiKey,
    baseURL: config['openai_base_url'] || undefined,
    dangerouslyAllowBrowser: true,
  });
}

export const aiService = {
  async chat(
    messages: ChatMessage[],
    contextMemo?: Memo | null,
    onChunk?: (chunk: string) => void,
  ): Promise<string> {
    const client = getClient();
    if (!client) {
      throw new Error('OpenAI API key not configured. Please add your API key in Settings.');
    }

    const config = storageService.getConfig();
    const model = config['openai_model'] || 'gpt-4o';

    const systemPrompt = contextMemo
      ? `You are an intelligent note-taking assistant (like Copilot for IDEs). You are helping the user with their note titled "${contextMemo.title}". Here is the current note content:\n\n${contextMemo.rawContent}\n\nHelp the user understand, summarize, expand, or analyze this content.`
      : `You are an intelligent note-taking assistant for myNote – an AI-powered knowledge base app combining Notion and Obsidian features. Help the user organize, analyze, and expand their knowledge. You can help with summarizing notes, finding connections, answering questions, and generating content.`;

    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
    ];

    if (onChunk) {
      const stream = await client.chat.completions.create({
        model,
        messages: openaiMessages,
        stream: true,
      });

      let fullText = '';
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? '';
        if (text) {
          fullText += text;
          onChunk(text);
        }
      }
      return fullText;
    } else {
      const response = await client.chat.completions.create({
        model,
        messages: openaiMessages,
      });
      return response.choices[0]?.message?.content ?? '';
    }
  },

  async summarizeAllMemos(): Promise<string> {
    const client = getClient();
    if (!client) {
      throw new Error('OpenAI API key not configured.');
    }

    const config = storageService.getConfig();
    const model = config['openai_model'] || 'gpt-4o';

    const memos = storageService.getAllMemos();
    if (memos.length === 0) {
      return 'No memos found to summarize.';
    }

    const memosText = memos
      .slice(0, 20) // limit to 20 most recent
      .map((m, i) => `[${i + 1}] ${m.title}: ${m.rawContent.slice(0, 500)}`)
      .join('\n\n');

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a knowledge base analyst. Analyze the following notes and provide a comprehensive summary of the key themes, topics, and insights across all notes. Also identify connections between notes.',
        },
        {
          role: 'user',
          content: `Please analyze and summarize these ${memos.length} notes:\n\n${memosText}`,
        },
      ],
    });

    return response.choices[0]?.message?.content ?? '';
  },

  async generateTags(content: string): Promise<string[]> {
    const client = getClient();
    if (!client) return [];

    const config = storageService.getConfig();
    const model = config['openai_model'] || 'gpt-4o-mini';

    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'Extract 3-5 relevant tags from the given text. Return ONLY a JSON array of lowercase strings, e.g. ["tag1","tag2","tag3"]',
          },
          { role: 'user', content: content.slice(0, 1000) },
        ],
      });

      const raw = response.choices[0]?.message?.content ?? '[]';
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  async findRelatedMemos(memoId: string): Promise<string[]> {
    const client = getClient();
    if (!client) return [];

    const config = storageService.getConfig();
    const model = config['openai_model'] || 'gpt-4o-mini';

    const allMemos = storageService.getAllMemos();
    const targetMemo = allMemos.find((m) => m.id === memoId);
    if (!targetMemo || allMemos.length < 2) return [];

    const otherMemos = allMemos.filter((m) => m.id !== memoId);
    const prompt = `Target note: "${targetMemo.title}" - ${targetMemo.rawContent.slice(0, 300)}\n\nOther notes:\n${otherMemos.map((m, i) => `[${i}] ${m.title}: ${m.rawContent.slice(0, 150)}`).join('\n')}\n\nReturn a JSON array of indices (numbers) of the most related notes (max 5), e.g. [0,2,4]`;

    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'You are a knowledge graph builder. Find semantically related notes.' },
          { role: 'user', content: prompt },
        ],
      });

      const raw = response.choices[0]?.message?.content ?? '[]';
      const indices: number[] = JSON.parse(raw);
      return indices.map((i) => otherMemos[i]?.id).filter(Boolean);
    } catch {
      return [];
    }
  },
};
