import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import {
  createDocument,
  checkUserAccessToOrganization,
  assignDocumentToGroups,
  getGroupsByOrganization,
  updateDocumentEmbeddingStatus,
} from "@/lib/db/queries";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateR2Key, uploadToR2 } from "@/lib/r2";
import { getCloudflareAIClient } from "@/lib/cloudflare-ai";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 50;

interface UploadError {
  filename: string;
  error: string;
}

/**
 * POST /api/documents/bulk-upload
 * Upload multiple documents to R2 and create database records
 * Only syncs with Cloudflare AutoRAG once after all uploads complete
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const organizationId = formData.get("organizationId") as string;
    const isOrgWide = formData.get("isOrgWide") === "true";
    const groupIdsStr = formData.get("groupIds") as string;

    let groupIds: string[] = [];
    if (groupIdsStr) {
      try {
        groupIds = JSON.parse(groupIdsStr);
      } catch {
        groupIds = [];
      }
    }

    // Validate inputs
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Cannot upload more than ${MAX_FILES} files at once` },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    if (!isOrgWide && groupIds.length === 0) {
      return NextResponse.json(
        { error: "At least one group must be selected or document must be org-wide" },
        { status: 400 }
      );
    }

    // Check if user has access to this organization
    const hasAccess = await checkUserAccessToOrganization(
      user.id,
      organizationId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this organization" },
        { status: 403 }
      );
    }

    // Get group IDs for org-wide uploads
    let targetGroupIds = groupIds;
    if (isOrgWide) {
      const allGroups = await getGroupsByOrganization(organizationId);
      targetGroupIds = allGroups.map((g) => g.id);
    }

    // Process each file
    const successfulUploads: string[] = [];
    const errors: UploadError[] = [];

    for (const file of files) {
      try {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          errors.push({
            filename: file.name,
            error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
          });
          continue;
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Generate R2 key
        const r2Key = generateR2Key(organizationId, file.name);

        // Upload to R2 with organization metadata
        await uploadToR2(r2Key, buffer, file.type, {
          organization_id: organizationId,
          uploaded_by: user.id,
          filename: file.name,
        });

        // Create database record
        const document = await createDocument({
          organizationId,
          uploadedBy: user.id,
          filename: file.name,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
          r2Key,
        });

        // Assign document to groups
        if (targetGroupIds.length > 0) {
          await assignDocumentToGroups(document.id, targetGroupIds);
        }

        successfulUploads.push(document.id);

        console.log(`[Bulk Upload] Successfully uploaded: ${file.name} (ID: ${document.id})`);
      } catch (error) {
        console.error(`[Bulk Upload] Failed to upload ${file.name}:`, error);
        errors.push({
          filename: file.name,
          error: error instanceof Error ? error.message : "Upload failed",
        });
      }
    }

    // Trigger Cloudflare AutoRAG sync only once after all uploads
    let syncJobId: string | undefined;
    if (successfulUploads.length > 0) {
      try {
        const aiClient = getCloudflareAIClient();
        const ragId = process.env.CLOUDFLARE_DEFAULT_RAG_ID;

        if (ragId) {
          const syncResult = await aiClient.syncDocumentsToAutoRAG(ragId);
          syncJobId = syncResult.jobId;
          console.log(
            `[Bulk Upload] AutoRAG sync triggered for ${successfulUploads.length} documents. Job ID: ${syncJobId}`
          );

          // Update all successful documents to completed status
          await Promise.all(
            successfulUploads.map((docId) =>
              updateDocumentEmbeddingStatus(docId, "completed")
            )
          );
          console.log(
            `[Bulk Upload] Marked ${successfulUploads.length} documents as completed`
          );
        } else {
          console.warn(
            "[Bulk Upload] CLOUDFLARE_DEFAULT_RAG_ID not set, skipping AutoRAG sync"
          );
          // Still mark as completed even without sync (documents are uploaded to R2)
          await Promise.all(
            successfulUploads.map((docId) =>
              updateDocumentEmbeddingStatus(docId, "completed")
            )
          );
        }
      } catch (syncError) {
        console.error("[Bulk Upload] AutoRAG sync failed:", syncError);
        // Mark all as failed if sync fails
        await Promise.all(
          successfulUploads.map((docId) =>
            updateDocumentEmbeddingStatus(docId, "failed")
          )
        );
        // Don't fail the entire upload if sync fails
      }
    }

    return NextResponse.json({
      successful: successfulUploads.length,
      failed: errors.length,
      errors,
      syncJobId,
    });
  } catch (error) {
    console.error("[Bulk Upload] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
