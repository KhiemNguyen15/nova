import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import {
  createDocument,
  checkUserAccessToOrganization,
  assignDocumentToGroups,
  getGroupsByOrganization,
} from "@/lib/db/queries";
import { generateR2Key, uploadToR2 } from "@/lib/r2";
import { getCloudflareAIClient } from "@/lib/cloudflare-ai";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/documents/upload
 * Upload a document to R2 and create a database record
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
    const file = formData.get("file") as File;
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
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
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

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
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
    if (isOrgWide) {
      // Get all groups in the organization and assign to all
      const allGroups = await getGroupsByOrganization(organizationId);
      const allGroupIds = allGroups.map((g) => g.id);
      if (allGroupIds.length > 0) {
        await assignDocumentToGroups(document.id, allGroupIds);
      }
    } else {
      // Assign to selected groups only
      await assignDocumentToGroups(document.id, groupIds);
    }

    // Trigger Cloudflare AutoRAG sync
    let syncJobId: string | undefined;
    try {
      const aiClient = getCloudflareAIClient();
      const ragId = process.env.CLOUDFLARE_DEFAULT_RAG_ID;

      if (ragId) {
        const syncResult = await aiClient.syncDocumentsToAutoRAG(ragId);
        syncJobId = syncResult.jobId;
        console.log(`[Upload] AutoRAG sync triggered. Job ID: ${syncJobId}`);
      } else {
        console.warn('[Upload] CLOUDFLARE_DEFAULT_RAG_ID not set, skipping AutoRAG sync');
      }
    } catch (syncError) {
      console.error('[Upload] AutoRAG sync failed:', syncError);
      // Don't fail the upload if sync fails
    }

    return NextResponse.json({
      document: {
        id: document.id,
        filename: document.filename,
        fileType: document.fileType,
        fileSize: document.fileSize,
        uploadedAt: document.uploadedAt,
        embeddingStatus: document.embeddingStatus,
      },
      syncJobId,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
