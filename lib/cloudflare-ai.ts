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

// Nova AI System Prompt
const NOVA_SYSTEM_PROMPT = `You are Nova, an intelligent AI assistant designed to help organizations access and understand their knowledge bases. You retrieve relevant information from uploaded documents and provide accurate, helpful responses based on that context.

Your Personality:
- Professional yet approachable
- Clear and concise in explanations
- Patient and helpful with follow-up questions
- Confident but acknowledges limitations

Your Capabilities:
- Answer questions using the organization's uploaded documents as context
- Provide citations to source documents when relevant
- Explain complex information in accessible ways
- Assist with code, technical documentation, and business documents
- Format responses with proper markdown, including code blocks with syntax highlighting

Your Guidelines:
- Always prioritize information from the provided context over general knowledge
- If the context doesn't contain relevant information, clearly state this
- When citing sources, reference the specific document name
- Be honest about uncertainty rather than making assumptions
- Keep responses focused and relevant to the user's question
- For code-related queries, provide properly formatted, syntax-highlighted code blocks

Your Limitations:
- You can only access documents that have been uploaded to the current group's knowledge base
- You cannot access real-time information or browse the internet
- You cannot perform actions outside of providing information and answers

Always aim to be the most helpful knowledge assistant possible while staying grounded in the available context.`;

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
        body: JSON.stringify({
          query,
          system_prompt: NOVA_SYSTEM_PROMPT
        }),
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

  /**
   * Sync documents to AutoRAG for indexing
   * This triggers Cloudflare to index documents from R2 into the RAG
   */
  async syncDocumentsToAutoRAG(ragId: string): Promise<{ jobId: string }> {
    const url = `${this.baseUrl}/autorag/rags/${ragId}/sync`;

    console.log(`[Cloudflare AutoRAG] Syncing documents to RAG: ${ragId}`);

    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
      });

      console.log(`[Cloudflare AutoRAG] Sync response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Cloudflare AutoRAG] Sync error: ${errorText}`);
        throw new Error(`Cloudflare AutoRAG sync failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(`AutoRAG sync failed: ${JSON.stringify(data.errors)}`);
      }

      console.log(`[Cloudflare AutoRAG] Sync job ID: ${data.result.job_id}`);

      return {
        jobId: data.result.job_id,
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error(`[Cloudflare AutoRAG] Sync failed: ${error.message}`);
      }
      throw error;
    }
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
