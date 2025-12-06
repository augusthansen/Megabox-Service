"use client";

import { useState, useEffect, useRef } from "react";

interface Document {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  documentType: string;
  manufacturer: string | null;
  machineModel: string | null;
  machineModels: string[];
  category: string | null;
  tags: string[];
  description: string | null;
  status: string;
  pageCount: number | null;
  totalChunks: number | null;
  processedChunks: number | null;
  viewCount: number;
  downloadCount: number;
  uploadedByName: string;
  createdAt: string;
  processedAt: string | null;
  _count?: { chunks: number };
}

interface DocumentBrowserProps {
  userId: string;
  userName: string;
  canUpload?: boolean;
  canDelete?: boolean;
  onSelectDocument?: (doc: Document) => void;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  service_manual: "Service Manual",
  parts_manual: "Parts Manual",
  procedures: "Procedures",
  tsb: "Technical Service Bulletin",
  quick_reference: "Quick Reference",
  troubleshooting: "Troubleshooting Guide",
  installation: "Installation Guide",
  maintenance: "Maintenance Guide",
  wiring_diagram: "Wiring Diagram",
  other: "Other",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function DocumentBrowser({
  userId,
  userName,
  canUpload = true,
  canDelete = true,
  onSelectDocument,
}: DocumentBrowserProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState("other");
  const [uploadManufacturer, setUploadManufacturer] = useState("");
  const [uploadMachineModel, setUploadMachineModel] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingOverModal, setIsDraggingOverModal] = useState(false);
  const dragCounterRef = useRef(0);
  const modalDragCounterRef = useRef(0);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("");
  const [editManufacturer, setEditManufacturer] = useState("");
  const [editMachineModel, setEditMachineModel] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [typeFilter, statusFilter, searchQuery]);

  // Poll for updates when any document is processing
  useEffect(() => {
    const hasProcessingDocs = documents.some(
      (doc) => doc.status === "processing" || doc.status === "pending"
    );

    if (hasProcessingDocs) {
      const interval = setInterval(() => {
        fetchDocuments();
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(interval);
    }
  }, [documents]);

  const fetchDocuments = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("documentType", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/knowledge-base/documents?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Only PDF files are allowed");
        return;
      }
      setUploadFile(file);
      setUploadTitle(file.name.replace(".pdf", ""));
    }
  };

  // Handle dropped file
  const handleFileDrop = (file: File) => {
    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed");
      return;
    }
    setUploadFile(file);
    setUploadTitle(file.name.replace(".pdf", ""));
    if (!showUploadModal) {
      setShowUploadModal(true);
    }
  };

  // Global drag handlers (for dropping anywhere on the document browser)
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileDrop(files[0]);
    }
  };

  // Modal-specific drag handlers
  const handleModalDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    modalDragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOverModal(true);
    }
  };

  const handleModalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    modalDragCounterRef.current--;
    if (modalDragCounterRef.current === 0) {
      setIsDraggingOverModal(false);
    }
  };

  const handleModalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleModalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverModal(false);
    modalDragCounterRef.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileDrop(files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadProgress("Uploading document...");

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle);
      formData.append("documentType", uploadType);
      formData.append("uploadedById", userId);
      formData.append("uploadedByName", userName);

      if (uploadManufacturer) {
        formData.append("manufacturer", uploadManufacturer);
      }
      if (uploadMachineModel) {
        formData.append("machineModel", uploadMachineModel);
      }
      if (uploadDescription) {
        formData.append("description", uploadDescription);
      }
      if (uploadTags.length > 0) {
        formData.append("tags", JSON.stringify(uploadTags));
      }

      const response = await fetch("/api/knowledge-base/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadProgress("Processing document...");

        // Reset form
        setUploadFile(null);
        setUploadTitle("");
        setUploadType("other");
        setUploadManufacturer("");
        setUploadMachineModel("");
        setUploadDescription("");
        setUploadTags([]);
        setTagInput("");
        setShowUploadModal(false);

        // Refresh documents
        fetchDocuments();

        alert("Document uploaded successfully! Processing will complete in the background.");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to upload document");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge-base/documents/${doc.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchDocuments();
      } else {
        alert("Failed to delete document");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete document");
    }
  };

  const handleReprocess = async (doc: Document) => {
    try {
      const response = await fetch(`/api/knowledge-base/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reprocess: true }),
      });

      if (response.ok) {
        fetchDocuments();
        alert("Document queued for reprocessing");
      }
    } catch (error) {
      console.error("Error reprocessing document:", error);
    }
  };

  const openEditModal = (doc: Document) => {
    setEditingDocument(doc);
    setEditTitle(doc.title);
    setEditType(doc.documentType);
    setEditManufacturer(doc.manufacturer || "");
    setEditMachineModel(doc.machineModel || "");
    setEditDescription(doc.description || "");
    setEditTags(doc.tags || []);
    setEditTagInput("");
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDocument) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/knowledge-base/documents/${editingDocument.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          documentType: editType,
          manufacturer: editManufacturer || null,
          machineModel: editMachineModel || null,
          description: editDescription || null,
          tags: editTags,
        }),
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingDocument(null);
        fetchDocuments();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save changes");
      }
    } catch (error) {
      console.error("Error saving document:", error);
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-slate-400">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-lg shadow relative"
      onDragEnter={canUpload ? handleDragEnter : undefined}
      onDragLeave={canUpload ? handleDragLeave : undefined}
      onDragOver={canUpload ? handleDragOver : undefined}
      onDrop={canUpload ? handleDrop : undefined}
    >
      {/* Drag overlay */}
      {isDragging && canUpload && (
        <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-400/20 border-2 border-dashed border-blue-500 dark:border-blue-400 rounded-lg z-10 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg text-center">
            <svg
              className="w-12 h-12 mx-auto text-blue-500 dark:text-blue-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">Drop PDF here to upload</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Release to open upload dialog</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Knowledge Base Documents</h2>
          {canUpload && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Upload Document
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Document List */}
      <div className="divide-y dark:divide-slate-700">
        {documents.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-slate-400">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>No documents found</p>
            {canUpload && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 text-blue-600 hover:text-blue-700"
              >
                Upload your first document
              </button>
            )}
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              onClick={() => onSelectDocument?.(doc)}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">{doc.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400 truncate">{doc.fileName}</p>
                    </div>
                    <span
                      className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full ${
                        STATUS_COLORS[doc.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {doc.status === "processing" && doc.totalChunks && doc.processedChunks !== null
                        ? `${doc.processedChunks}/${doc.totalChunks}`
                        : doc.status}
                    </span>
                  </div>

                  {/* Progress bar for processing documents */}
                  {doc.status === "processing" && doc.totalChunks && doc.processedChunks !== null && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 mb-1">
                        <span>Processing chunks...</span>
                        <span>{Math.round((doc.processedChunks / doc.totalChunks) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(doc.processedChunks / doc.totalChunks) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      {formatFileSize(doc.fileSize)}
                    </span>
                    {doc.pageCount && (
                      <span>{doc.pageCount} pages</span>
                    )}
                    {doc._count?.chunks && (
                      <span>{doc._count.chunks} chunks</span>
                    )}
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-xs">
                      {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
                    </span>
                    {doc.manufacturer && (
                      <span>{doc.manufacturer}</span>
                    )}
                    {doc.machineModel && (
                      <span>{doc.machineModel}</span>
                    )}
                  </div>

                  {/* Tags */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {doc.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-400 dark:text-slate-500">
                    <span>Uploaded {formatDate(doc.createdAt)} by {doc.uploadedByName}</span>
                    <span>{doc.viewCount} views</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="View PDF"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </a>
                  {canUpload && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(doc);
                      }}
                      className="p-2 text-gray-400 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      title="Edit details"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  )}
                  {doc.status === "failed" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReprocess(doc);
                      }}
                      className="p-2 text-gray-400 dark:text-slate-500 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
                      title="Retry processing"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc);
                      }}
                      className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
              <h3 className="text-lg font-semibold dark:text-white">Upload Document</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-4 space-y-4">
              {/* File input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  PDF File *
                </label>
                {!uploadFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={handleModalDragEnter}
                    onDragLeave={handleModalDragLeave}
                    onDragOver={handleModalDragOver}
                    onDrop={handleModalDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDraggingOverModal
                        ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400"
                    }`}
                  >
                    <svg
                      className={`w-10 h-10 mx-auto mb-2 ${
                        isDraggingOverModal
                          ? "text-blue-500 dark:text-blue-400"
                          : "text-gray-400 dark:text-slate-500"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className={isDraggingOverModal ? "text-blue-600 dark:text-blue-400 font-medium" : "text-gray-600 dark:text-slate-400"}>
                      {isDraggingOverModal ? "Drop PDF here" : "Drag & drop a PDF or click to select"}
                    </p>
                    <p className="text-sm text-gray-400 dark:text-slate-500">Max 100MB</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-red-600 dark:text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate dark:text-white">{uploadFile.name}</p>
                      <p className="text-sm text-gray-500 dark:text-slate-400">{formatFileSize(uploadFile.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadFile(null)}
                      className="p-1 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Document Type *
                </label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Manufacturer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Manufacturer
                </label>
                <select
                  value={uploadManufacturer}
                  onChange={(e) => setUploadManufacturer(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Manufacturer</option>
                  <option value="Bluecrest">Bluecrest</option>
                </select>
              </div>

              {/* Machine Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Machine Model
                </label>
                <select
                  value={uploadMachineModel}
                  onChange={(e) => setUploadMachineModel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Machine/Software/Module</option>
                  <optgroup label="Machines">
                    <option value="Epic">Epic</option>
                    <option value="MPS">MPS</option>
                    <option value="APS">APS</option>
                    <option value="FPS">FPS</option>
                    <option value="Flowmaster">Flowmaster</option>
                    <option value="FPS-SD">FPS-SD</option>
                    <option value="MSE">MSE</option>
                    <option value="Rival">Rival</option>
                    <option value="DI2000">DI2000</option>
                  </optgroup>
                  <optgroup label="Software">
                    <option value="DC & RTP">DC & RTP</option>
                    <option value="Scanning">Scanning Software</option>
                  </optgroup>
                  <optgroup label="Modules">
                    <option value="Feeder Module">Feeder Module</option>
                    <option value="Input Module">Input Module</option>
                    <option value="Stacker Module">Stacker Module</option>
                    <option value="Envelope Module">Envelope Module</option>
                    <option value="Metering Module">Metering Module</option>
                    <option value="Buckle Chute Module">Buckle Chute Module</option>
                  </optgroup>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={3}
                  placeholder="Brief description of this document..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {uploadTags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-sm rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setUploadTags(uploadTags.filter((_, i) => i !== index))}
                        className="hover:text-blue-600 dark:hover:text-blue-300"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && tagInput.trim()) {
                        e.preventDefault();
                        if (!uploadTags.includes(tagInput.trim())) {
                          setUploadTags([...uploadTags, tagInput.trim()]);
                        }
                        setTagInput("");
                      }
                    }}
                    placeholder="Type a tag and press Enter"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tagInput.trim() && !uploadTags.includes(tagInput.trim())) {
                        setUploadTags([...uploadTags, tagInput.trim()]);
                        setTagInput("");
                      }
                    }}
                    className="px-3 py-2 bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-500 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Add tags to help organize and find documents (e.g., "error codes", "maintenance", "calibration")
                </p>
              </div>

              {/* Upload progress */}
              {uploadProgress && (
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {uploadProgress}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || !uploadTitle || uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
              <h3 className="text-lg font-semibold dark:text-white">Edit Document Details</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDocument(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-4 space-y-4">
              {/* File info (read-only) */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate dark:text-white">{editingDocument.fileName}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {formatFileSize(editingDocument.fileSize)} • {editingDocument.pageCount || "?"} pages
                  </p>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Document Type *
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Manufacturer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Manufacturer
                </label>
                <select
                  value={editManufacturer}
                  onChange={(e) => setEditManufacturer(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Manufacturer</option>
                  <option value="Bluecrest">Bluecrest</option>
                </select>
              </div>

              {/* Machine Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Machine Model
                </label>
                <select
                  value={editMachineModel}
                  onChange={(e) => setEditMachineModel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Machine/Software/Module</option>
                  <optgroup label="Machines">
                    <option value="Epic">Epic</option>
                    <option value="MPS">MPS</option>
                    <option value="APS">APS</option>
                    <option value="FPS">FPS</option>
                    <option value="Flowmaster">Flowmaster</option>
                    <option value="FPS-SD">FPS-SD</option>
                    <option value="MSE">MSE</option>
                    <option value="Rival">Rival</option>
                    <option value="DI2000">DI2000</option>
                  </optgroup>
                  <optgroup label="Software">
                    <option value="DC & RTP">DC & RTP</option>
                    <option value="Scanning">Scanning Software</option>
                  </optgroup>
                  <optgroup label="Modules">
                    <option value="Feeder Module">Feeder Module</option>
                    <option value="Input Module">Input Module</option>
                    <option value="Stacker Module">Stacker Module</option>
                    <option value="Envelope Module">Envelope Module</option>
                    <option value="Metering Module">Metering Module</option>
                    <option value="Buckle Chute Module">Buckle Chute Module</option>
                  </optgroup>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  placeholder="Brief description of this document..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editTags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-sm rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setEditTags(editTags.filter((_, i) => i !== index))}
                        className="hover:text-blue-600 dark:hover:text-blue-300"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editTagInput}
                    onChange={(e) => setEditTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && editTagInput.trim()) {
                        e.preventDefault();
                        if (!editTags.includes(editTagInput.trim())) {
                          setEditTags([...editTags, editTagInput.trim()]);
                        }
                        setEditTagInput("");
                      }
                    }}
                    placeholder="Type a tag and press Enter"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editTagInput.trim() && !editTags.includes(editTagInput.trim())) {
                        setEditTags([...editTags, editTagInput.trim()]);
                        setEditTagInput("");
                      }
                    }}
                    className="px-3 py-2 bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-500 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingDocument(null);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editTitle || saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
