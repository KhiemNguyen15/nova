"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, FileIcon, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DocumentUploadProps {
  organizationId: string;
  onUploadSuccess?: () => void;
}

interface Group {
  id: string;
  name: string;
}

interface UploadResult {
  successful: number;
  failed: number;
  errors: Array<{ filename: string; error: string }>;
}

const MAX_FILES = 50;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB total

export function DocumentUpload({
  organizationId,
  onUploadSuccess,
}: DocumentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [isOrgWide, setIsOrgWide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch groups for the organization
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoadingGroups(true);
        const response = await fetch(`/api/organizations/${organizationId}/groups`);
        if (response.ok) {
          const data = await response.json();
          setGroups(data.groups || []);
        }
      } catch (err) {
        console.error("Failed to fetch groups:", err);
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchGroups();
  }, [organizationId]);

  const handleFileSelect = (files: FileList | File[]) => {
    const filesArray = Array.from(files);

    // Check max files limit
    if (selectedFiles.length + filesArray.length > MAX_FILES) {
      setError(`Cannot upload more than ${MAX_FILES} files at once`);
      return;
    }

    // Validate individual file sizes
    const oversizedFiles = filesArray.filter(f => f.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setError(`${oversizedFiles.length} file(s) exceed 10MB limit: ${oversizedFiles.map(f => f.name).join(", ")}`);
      return;
    }

    // Check total size
    const totalSize = [...selectedFiles, ...filesArray].reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      setError(`Total file size exceeds 100MB limit`);
      return;
    }

    setSelectedFiles(prev => [...prev, ...filesArray]);
    setError(null);
    setUploadResult(null);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setError(null);
    setUploadResult(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    // Validation: Must select at least one group or org-wide
    if (!isOrgWide && selectedGroupIds.length === 0) {
      setError("Please select at least one group or mark as organization-wide");
      return;
    }

    setUploading(true);
    setError(null);
    setUploadResult(null);
    setUploadProgress({ current: 0, total: selectedFiles.length });

    try {
      const formData = new FormData();

      // Append all files
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      formData.append("organizationId", organizationId);
      formData.append("isOrgWide", String(isOrgWide));
      formData.append("groupIds", JSON.stringify(selectedGroupIds));

      const response = await fetch("/api/documents/bulk-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const result = await response.json();

      // Set upload result
      setUploadResult({
        successful: result.successful,
        failed: result.failed,
        errors: result.errors || [],
      });

      // Clear selections only if all uploads succeeded
      if (result.failed === 0) {
        setSelectedFiles([]);
        setSelectedGroupIds([]);
        setIsOrgWide(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }

      onUploadSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const getTotalSize = () => {
    return selectedFiles.reduce((sum, f) => sum + f.size, 0);
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          dragActive
            ? "border-primary bg-primary/10 scale-[1.02]"
            : "border-border/50 hover:border-primary/50 hover:bg-accent/5"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        <p className="text-sm text-foreground mb-2 font-medium">
          Drag and drop your files here
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          or click to browse • Maximum {MAX_FILES} files, 10MB per file, 100MB total
        </p>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
          disabled={uploading}
        >
          <Upload className="h-4 w-4" />
          Select Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          disabled={uploading}
        />
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Selected Files ({selectedFiles.length}/{MAX_FILES})
            </Label>
            <p className="text-xs text-muted-foreground">
              Total: {formatFileSize(getTotalSize())} / {formatFileSize(MAX_TOTAL_SIZE)}
            </p>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2 p-2 rounded-lg border border-border/50 bg-card/30">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-4 p-3 rounded-lg bg-accent/50 border border-border/50"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                    <FileIcon className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress && (
        <div className="text-sm text-primary bg-primary/10 border border-primary/20 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Uploading {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}...</span>
          </div>
        </div>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <div className={`text-sm p-3 rounded-lg border ${
          uploadResult.failed === 0
            ? "text-green-400 bg-green-500/10 border-green-500/20"
            : "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
        }`}>
          <p className="font-medium">
            {uploadResult.successful} of {uploadResult.successful + uploadResult.failed} file{uploadResult.successful + uploadResult.failed !== 1 ? 's' : ''} uploaded successfully
          </p>
          {uploadResult.errors.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-medium">Failed uploads:</p>
              {uploadResult.errors.map((err, idx) => (
                <p key={idx} className="text-xs">
                  • {err.filename}: {err.error}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-card/30">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Document Access</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="orgWide"
                checked={isOrgWide}
                onCheckedChange={(checked) => setIsOrgWide(checked as boolean)}
              />
              <label
                htmlFor="orgWide"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Organization-wide (all groups can access)
              </label>
            </div>
          </div>

          {!isOrgWide && (
            <div className="space-y-2">
              <Label htmlFor="groupSelect" className="text-sm font-medium">
                Select Groups
              </Label>
              {loadingGroups ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading groups...
                </div>
              ) : groups.length === 0 ? (
                <p className="text-sm text-muted-foreground">No groups available</p>
              ) : (
                <Select
                  value={selectedGroupIds[0] || ""}
                  onValueChange={(value) => setSelectedGroupIds([value])}
                >
                  <SelectTrigger id="groupSelect">
                    <SelectValue placeholder="Choose a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                Document will be accessible to selected group(s)
              </p>
            </div>
          )}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {selectedFiles.length} Document{selectedFiles.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedFiles([]);
              setUploadResult(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            disabled={uploading}
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}
