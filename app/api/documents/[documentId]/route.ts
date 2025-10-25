import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import {
  getDocumentById,
  deleteDocument as deleteDocumentFromDb,
  checkUserAccessToOrganization,
} from "@/lib/db/queries";
import { getDownloadUrl, deleteFromR2 } from "@/lib/r2";

/**
 * GET /api/documents/[documentId]
 * Get a presigned download URL for a document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId } = await params;

    // Get document from database
    const document = await getDocumentById(documentId);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check if user has access to the document's organization
    const hasAccess = await checkUserAccessToOrganization(
      user.id,
      document.organizationId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this document" },
        { status: 403 }
      );
    }

    // Generate presigned download URL
    const downloadUrl = await getDownloadUrl(document.r2Key);

    return NextResponse.json({
      url: downloadUrl,
      filename: document.filename,
      fileType: document.fileType,
      fileSize: document.fileSize,
    });
  } catch (error) {
    console.error("Get document error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/[documentId]
 * Delete a document from R2 and database
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId } = await params;

    // Get document from database
    const document = await getDocumentById(documentId);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check if user has access to the document's organization
    const hasAccess = await checkUserAccessToOrganization(
      user.id,
      document.organizationId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this document" },
        { status: 403 }
      );
    }

    // Delete from R2
    try {
      await deleteFromR2(document.r2Key);
    } catch (error) {
      console.error("Error deleting from R2:", error);
      // Continue with database deletion even if R2 deletion fails
    }

    // Delete from database
    await deleteDocumentFromDb(documentId);

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
