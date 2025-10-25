/**
 * Cloudflare AI Search AutoRAG Client
 *
 * This module handles interactions with Cloudflare's AI Search AutoRAG REST API
 * for document embedding and retrieval-augmented generation.
 *
 * Environment Variables Required:
 * - CLOUDFLARE_ACCOUNT_ID: Your Cloudflare account ID
 * - CLOUDFLARE_API_TOKEN: API token with AI Search permissions
 */

export interface CloudflareAIConfig {
  accountId: string;
  apiToken: string;
}

export interface SearchResult {
  id: string;
  score: number;
  metadata: Record<string, unknown>;
  content: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  indexId: string;
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class CloudflareAIClient {
  private accountId: string;
  private apiToken: string;
  private baseUrl: string;

  constructor(config: CloudflareAIConfig) {
    this.accountId = config.accountId;
    this.apiToken = config.apiToken;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}`;
  }

  /**
   * Send a chat completion request with RAG
   */
  async chatCompletion(request: ChatCompletionRequest): Promise<Response> {
    const url = `${this.baseUrl}/ai/search/chat`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: request.messages,
        index_id: request.indexId,
        stream: request.stream ?? false,
        max_tokens: request.maxTokens ?? 1024,
        temperature: request.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloudflare AI Search API error: ${response.status} ${error}`);
    }

    return response;
  }

  /**
   * Stream chat completion with RAG
   */
  async *streamChatCompletion(
    request: ChatCompletionRequest
  ): AsyncGenerator<string, void, unknown> {
    const response = await this.chatCompletion({
      ...request,
      stream: true,
    });

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip invalid JSON lines
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Search documents in an index
   */
  async search(indexId: string, query: string, limit = 10): Promise<SearchResult[]> {
    const url = `${this.baseUrl}/ai/search/indexes/${indexId}/search`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloudflare AI Search API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  /**
   * Upload a document to an index
   */
  async uploadDocument(
    indexId: string,
    documentId: string,
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const url = `${this.baseUrl}/ai/search/indexes/${indexId}/documents`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: documentId,
        content,
        metadata: metadata || {},
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload document: ${response.status} ${error}`);
    }
  }

  /**
   * Delete a document from an index
   */
  async deleteDocument(indexId: string, documentId: string): Promise<void> {
    const url = `${this.baseUrl}/ai/search/indexes/${indexId}/documents/${documentId}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${this.apiToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to delete document: ${response.status} ${error}`);
    }
  }
}

// Singleton instance
let aiClient: CloudflareAIClient | null = null;

export function getCloudflareAIClient(): CloudflareAIClient {
  if (!aiClient) {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      throw new Error(
        "CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables must be set"
      );
    }

    aiClient = new CloudflareAIClient({ accountId, apiToken });
  }

  return aiClient;
}
