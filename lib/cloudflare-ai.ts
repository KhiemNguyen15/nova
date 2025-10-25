/**
 * Cloudflare AI Search AutoRAG Client
 *
 * This module handles interactions with Cloudflare's AI Search AutoRAG REST API
 * for document embedding and retrieval-augmented generation.
 *
 * API Documentation: https://developers.cloudflare.com/autorag/
 *
 * Environment Variables Required:
 * - CLOUDFLARE_ACCOUNT_ID: Your Cloudflare account ID
 * - CLOUDFLARE_API_KEY: API key with AutoRAG permissions
 */

export interface CloudflareAIConfig {
  accountId: string;
  apiKey: string;
}

export interface AutoRAGSearchResult {
  object: string;
  search_query: string;
  response: string;
  data: Array<{
    id?: string;
    score?: number;
    metadata?: Record<string, unknown>;
    text?: string;
  }>;
  has_more: boolean;
  next_page: string | null;
}

export interface AutoRAGResponse {
  success: boolean;
  result: AutoRAGSearchResult;
  errors?: Array<{ code: number; message: string }>;
  messages?: Array<{ code: number; message: string }>;
}

export class CloudflareAIClient {
  private accountId: string;
  private apiKey: string;
  private baseUrl: string;

  constructor(config: CloudflareAIConfig) {
    this.accountId = config.accountId;
    this.apiKey = config.apiKey;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}`;
  }

  /**
   * Query AutoRAG with a simple text query
   * This returns the AI-generated response with retrieved document context
   */
  async query(ragId: string, query: string): Promise<AutoRAGResponse> {
    const url = `${this.baseUrl}/autorag/rags/${ragId}/ai-search`;

    console.log(`[Cloudflare AutoRAG] Making request to: ${url}`);
    console.log(`[Cloudflare AutoRAG] Query: ${query.substring(0, 100)}...`);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      console.log(`[Cloudflare AutoRAG] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Cloudflare AutoRAG] Error response: ${errorText}`);

        // Try to parse as JSON for better error messages
        try {
          const errorJson = JSON.parse(errorText);
          const errorMessages = errorJson.errors?.map((e: any) => e.message).join(", ");
          throw new Error(`Cloudflare AutoRAG API error (${response.status}): ${errorMessages || errorText}`);
        } catch {
          throw new Error(`Cloudflare AutoRAG API error (${response.status}): ${errorText}`);
        }
      }

      const data: AutoRAGResponse = await response.json();
      console.log(`[Cloudflare AutoRAG] Success: ${data.success}`);
      console.log(`[Cloudflare AutoRAG] Response length: ${data.result?.response?.length || 0} chars`);

      if (!data.success) {
        const errorMsg = data.errors?.map(e => e.message).join(", ") || "Unknown error";
        throw new Error(`AutoRAG request failed: ${errorMsg}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`[Cloudflare AutoRAG] Request failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Stream AutoRAG response word by word
   * Note: Cloudflare AutoRAG may not support streaming - this simulates it by chunking the response
   */
  async *streamQuery(ragId: string, query: string): AsyncGenerator<string, void, unknown> {
    const response = await this.query(ragId, query);
    const fullResponse = response.result.response;

    // Simulate streaming by yielding words with small delays
    // If Cloudflare adds true streaming support, update this method
    const words = fullResponse.split(" ");
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      yield i === words.length - 1 ? word : word + " ";

      // Small delay to simulate streaming (reduced from 30ms to 10ms for faster display)
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Get retrieved documents without the AI response
   * Useful for debugging or showing sources
   */
  async getRetrievedDocuments(ragId: string, query: string) {
    const response = await this.query(ragId, query);
    return response.result.data;
  }
}

// Singleton instance
let aiClient: CloudflareAIClient | null = null;

export function getCloudflareAIClient(): CloudflareAIClient {
  if (!aiClient) {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiKey = process.env.CLOUDFLARE_AI_SEARCH_API_KEY;

    if (!accountId || !apiKey) {
      throw new Error(
        "CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_AI_SEARCH_API_KEY environment variables must be set"
      );
    }

    aiClient = new CloudflareAIClient({ accountId, apiKey });
  }

  return aiClient;
}
