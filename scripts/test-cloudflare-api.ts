/**
 * Test script for Cloudflare AutoRAG API
 *
 * Usage:
 *   ts-node scripts/test-cloudflare-api.ts
 *   or
 *   pnpm tsx scripts/test-cloudflare-api.ts
 *
 * Make sure you have the following environment variables set:
 * - CLOUDFLARE_ACCOUNT_ID
 * - CLOUDFLARE_API_KEY
 * - CLOUDFLARE_DEFAULT_RAG_ID
 */

import { CloudflareAIClient } from "../lib/cloudflare-ai";

async function testCloudflareAPI() {
  console.log("🚀 Testing Cloudflare AutoRAG API...\n");

  // Get credentials from environment
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiKey = process.env.CLOUDFLARE_API_KEY;
  const ragId = process.env.CLOUDFLARE_DEFAULT_RAG_ID;

  if (!accountId || !apiKey || !ragId) {
    console.error("❌ Missing required environment variables:");
    console.error("   - CLOUDFLARE_ACCOUNT_ID:", accountId ? "✓" : "✗");
    console.error("   - CLOUDFLARE_API_KEY:", apiKey ? "✓" : "✗");
    console.error("   - CLOUDFLARE_DEFAULT_RAG_ID:", ragId ? "✓" : "✗");
    console.error("\nPlease set these in your .env.local file");
    process.exit(1);
  }

  console.log("✓ Environment variables loaded");
  console.log(`  Account ID: ${accountId}`);
  console.log(`  RAG ID: ${ragId}`);
  console.log(`  API Key: ${apiKey.substring(0, 10)}...`);
  console.log();

  // Create client
  const client = new CloudflareAIClient({ accountId, apiKey });

  // Test query
  const testQuery = "Hello! Can you help me?";
  console.log(`📤 Sending test query: "${testQuery}"`);
  console.log();

  try {
    // Test 1: Basic query
    console.log("Test 1: Basic Query");
    console.log("─".repeat(50));
    const response = await client.query(ragId, testQuery);

    if (response.success) {
      console.log("✅ Request successful!");
      console.log(`   Search Query: ${response.result.search_query}`);
      console.log(`   Response: ${response.result.response.substring(0, 200)}...`);
      console.log(`   Retrieved Docs: ${response.result.data.length} documents`);
      console.log(`   Has More: ${response.result.has_more}`);
    } else {
      console.log("❌ Request failed");
      console.log(`   Errors: ${JSON.stringify(response.errors, null, 2)}`);
    }
    console.log();

    // Test 2: Streaming
    console.log("Test 2: Streaming Query");
    console.log("─".repeat(50));
    console.log("📡 Streaming response:");
    console.log();

    let streamedContent = "";
    for await (const chunk of client.streamQuery(ragId, testQuery)) {
      process.stdout.write(chunk);
      streamedContent += chunk;
    }
    console.log("\n");
    console.log("✅ Streaming completed!");
    console.log(`   Total length: ${streamedContent.length} characters`);
    console.log();

    // Test 3: Get retrieved documents
    console.log("Test 3: Retrieved Documents");
    console.log("─".repeat(50));
    const docs = await client.getRetrievedDocuments(ragId, testQuery);
    console.log(`✅ Retrieved ${docs.length} documents:`);

    docs.forEach((doc, index) => {
      console.log(`\n   Document ${index + 1}:`);
      console.log(`     ID: ${doc.id || "N/A"}`);
      console.log(`     Score: ${doc.score || "N/A"}`);
      console.log(`     Text: ${doc.text?.substring(0, 100) || "N/A"}...`);
      if (doc.metadata) {
        console.log(`     Metadata: ${JSON.stringify(doc.metadata)}`);
      }
    });
    console.log();

    console.log("🎉 All tests passed!");
    console.log("\n✅ Cloudflare AutoRAG API is working correctly!");

  } catch (error) {
    console.error("❌ Test failed with error:");
    console.error();

    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);

      // Check for common errors
      if (error.message.includes("404")) {
        console.error("\n💡 Tip: The RAG ID might not exist. Check your Cloudflare dashboard.");
      } else if (error.message.includes("401") || error.message.includes("403")) {
        console.error("\n💡 Tip: Check your API key has the correct permissions.");
      } else if (error.message.includes("ENOTFOUND")) {
        console.error("\n💡 Tip: Check your internet connection.");
      }
    } else {
      console.error(error);
    }

    process.exit(1);
  }
}

// Run the test
testCloudflareAPI();
