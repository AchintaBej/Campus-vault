import React, { useState, useEffect, useMemo, useRef } from "react";

// API Endpoint
const API = "/api/files";

// Helpers
function formatSize(bytes) {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getFileMeta(fileName = "") {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") {
    return {
      type: "pdf",
      label: "PDF",
      badgeClass: "badge-pdf",
      color: "#f87171",
      iconType: "pdf",
    };
  }
  if (["doc", "docx"].includes(ext)) {
    return {
      type: "docs",
      label: "WORD",
      badgeClass: "badge-doc",
      color: "#60a5fa",
      iconType: "doc",
    };
  }
  if (["ppt", "pptx"].includes(ext)) {
    return {
      type: "slides",
      label: "SLIDES",
      badgeClass: "badge-ppt",
      color: "#fb923c",
      iconType: "ppt",
    };
  }
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
    return {
      type: "images",
      label: "IMAGE",
      badgeClass: "badge-img",
      color: "#34d399",
      iconType: "img",
    };
  }
  return {
    type: "other",
    label: ext.toUpperCase() || "FILE",
    badgeClass: "badge-other",
    color: "#a78bfa",
    iconType: "file",
  };
}

// Icons
const Icons = {
  Vault: () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  ),
  UploadCloud: () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
      <path d="M12 12v9"></path>
      <path d="m16 16-4-4-4 4"></path>
    </svg>
  ),
  Search: () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Download: () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  ),
  Trash: () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
  Copy: () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  ),
  Check: () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  Refresh: ({ spinning }) => (
    <svg className={`icon ${spinning ? "spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v6h6"></path>
      <path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path>
      <path d="M21 22v-6h-6"></path>
      <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path>
    </svg>
  ),
  Lock: () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  ),
  Unlock: () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
    </svg>
  ),
  Close: () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  FilePDF: () => (
    <svg className="file-svg" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="9" y1="15" x2="15" y2="15"></line>
    </svg>
  ),
  FileWord: () => (
    <svg className="file-svg" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>
  ),
  FileSlide: () => (
    <svg className="file-svg" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
      <line x1="8" y1="21" x2="16" y2="21"></line>
      <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>
  ),
  FileImage: () => (
    <svg className="file-svg" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
  ),
  FileGeneric: () => (
    <svg className="file-svg" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
      <polyline points="13 2 13 9 20 9"></polyline>
    </svg>
  ),
};

function RenderFileIcon({ meta }) {
  if (meta.iconType === "pdf") return <Icons.FilePDF />;
  if (meta.iconType === "doc") return <Icons.FileWord />;
  if (meta.iconType === "ppt") return <Icons.FileSlide />;
  if (meta.iconType === "img") return <Icons.FileImage />;
  return <Icons.FileGeneric />;
}

export default function App() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // File Upload State
  const [chosenFile, setChosenFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Filtering & Search
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Admin PIN & Security
  const [adminPin, setAdminPin] = useState(() => localStorage.getItem("campusvault_pin") || "");
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [showPinText, setShowPinText] = useState(false);

  // Delete Action Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePin, setDeletePin] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification Toasts
  const [toasts, setToasts] = useState([]);
  const [copiedKey, setCopiedKey] = useState(null);

  const fileInputRef = useRef(null);

  const addToast = (type, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Load files from S3
  const loadFiles = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await fetch(API);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load files");
      setFiles(data.files || []);
      if (isManualRefresh) addToast("success", "File list refreshed!");
    } catch (err) {
      console.error(err);
      addToast("error", err.message || "Could not connect to S3 API");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  // Total Storage Size
  const totalStorage = useMemo(() => {
    return files.reduce((acc, curr) => acc + (curr.size || 0), 0);
  }, [files]);

  // Filtered & Sorted Files
  const filteredFiles = useMemo(() => {
    let result = files.filter((f) => {
      const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      if (selectedCategory === "all") return true;
      const meta = getFileMeta(f.name);
      return meta.type === selectedCategory;
    });

    result.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.uploadedAt) - new Date(a.uploadedAt);
      if (sortBy === "oldest") return new Date(a.uploadedAt) - new Date(b.uploadedAt);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "size") return (b.size || 0) - (a.size || 0);
      return 0;
    });

    return result;
  }, [files, search, selectedCategory, sortBy]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { all: files.length, pdf: 0, docs: 0, slides: 0, images: 0, other: 0 };
    files.forEach((f) => {
      const meta = getFileMeta(f.name);
      if (counts[meta.type] !== undefined) {
        counts[meta.type]++;
      } else {
        counts.other++;
      }
    });
    return counts;
  }, [files]);

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    const maxMb = 10;
    if (file.size > maxMb * 1024 * 1024) {
      addToast("error", `File is too large (${formatSize(file.size)}). Maximum allowed is 10 MB.`);
      return;
    }
    setChosenFile(file);
    addToast("info", `Selected: ${file.name}`);
  };

  // Upload handler
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!chosenFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", chosenFile);

    try {
      const res = await fetch(`${API}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      addToast("success", "Uploaded to AWS S3 successfully! 🚀");
      setChosenFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadFiles();
    } catch (err) {
      addToast("error", err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  // Save Admin PIN
  const handleSavePin = (e) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      localStorage.removeItem("campusvault_pin");
      setAdminPin("");
      addToast("info", "Admin PIN cleared.");
    } else {
      localStorage.setItem("campusvault_pin", pinInput.trim());
      setAdminPin(pinInput.trim());
      addToast("success", "Admin PIN saved in browser!");
    }
    setPinModalOpen(false);
    setPinInput("");
  };

  // Copy Link
  const handleCopyLink = async (downloadUrl, fileKey) => {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopiedKey(fileKey);
      addToast("success", "Temporary S3 download link copied to clipboard!");
      setTimeout(() => setCopiedKey(null), 2500);
    } catch (err) {
      addToast("error", "Failed to copy link");
    }
  };

  // Trigger Delete confirmation modal
  const openDeleteModal = (file) => {
    setDeleteTarget(file);
    setDeletePin(adminPin); // autofill if already stored
  };

  // Confirm Delete
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const pinToUse = deletePin || adminPin;

    if (!pinToUse) {
      addToast("error", "Admin PIN is required to delete resources.");
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`${API}/${encodeURIComponent(deleteTarget.key)}`, {
        method: "DELETE",
        headers: { "x-admin-pin": pinToUse },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");

      // Save valid pin if it wasn't saved before
      if (!adminPin && deletePin) {
        setAdminPin(deletePin);
        localStorage.setItem("campusvault_pin", deletePin);
      }

      addToast("success", "File permanently deleted from S3.");
      setDeleteTarget(null);
      await loadFiles();
    } catch (err) {
      addToast("error", err.message || "Deletion failed. Check PIN.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="app-container">
      {/* Background glow effects */}
      <div className="glow-sphere glow-sphere-1" />
      <div className="glow-sphere glow-sphere-2" />

      {/* Floating Toast Notification Stack */}
      <div className="toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card toast-${toast.type}`}>
            <span className="toast-dot"></span>
            <span className="toast-message">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Modern Header */}
      <header className="navbar">
        <div className="nav-brand">
          <div className="brand-icon">
            <Icons.Vault />
          </div>
          <div>
            <div className="brand-title">
              Campus<span>Vault</span>
            </div>
            <div className="brand-badge">AWS S3 Cloud Hub</div>
          </div>
        </div>

        <div className="nav-actions">
          <div className="cloud-pill">
            <span className="pulse-dot"></span>
            <span className="cloud-text">AWS S3 Connected</span>
          </div>

          <button
            type="button"
            className={`admin-toggle-btn ${adminPin ? "is-unlocked" : ""}`}
            onClick={() => {
              setPinInput(adminPin);
              setPinModalOpen(true);
            }}
            title={adminPin ? "Admin PIN Configured" : "Configure Admin PIN"}
          >
            {adminPin ? <Icons.Unlock /> : <Icons.Lock />}
            <span className="admin-btn-text">
              {adminPin ? "Admin Mode" : "Admin Lock"}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Wrap */}
      <main className="content-wrap">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-tag">
            <span>⚡ AWS EC2 + S3 ARCHITECTURE</span>
          </div>
          <h1 className="hero-title">
            College Knowledge Vault. <br />
            <span className="gradient-text">Zero Storage Worries.</span>
          </h1>
          <p className="hero-subtitle">
            Instantly upload, organize, and download lecture notes, previous year question papers,
            lab assignments, and study materials with secure presigned AWS S3 links.
          </p>

          <div className="quick-stats-row">
            <div className="stat-pill">
              <span className="stat-label">Total Resources</span>
              <span className="stat-val">{files.length} Files</span>
            </div>
            <div className="stat-pill">
              <span className="stat-label">Storage Consumed</span>
              <span className="stat-val">{formatSize(totalStorage)}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-label">File Limit</span>
              <span className="stat-val">Up to 10 MB</span>
            </div>
          </div>
        </section>

        {/* Upload Card */}
        <section className="glass-card upload-section">
          <div className="card-header">
            <div>
              <h2 className="card-title">Upload Resource</h2>
              <p className="card-desc">Supported files: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG (Max 10 MB)</p>
            </div>
          </div>

          <form onSubmit={handleUpload}>
            <div
              className={`dropzone ${isDragging ? "dropzone-active" : ""} ${chosenFile ? "dropzone-has-file" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="file-input"
                className="hidden-input"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.ppt,.pptx"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    validateAndSetFile(e.target.files[0]);
                  }
                }}
              />

              {!chosenFile ? (
                <div className="dropzone-empty">
                  <div className="upload-icon-circle">
                    <Icons.UploadCloud />
                  </div>
                  <div className="dropzone-text">
                    <strong>Click to browse</strong> or drag and drop your file here
                  </div>
                  <div className="format-tags">
                    <span className="tag">PDF</span>
                    <span className="tag">DOCX</span>
                    <span className="tag">PPTX</span>
                    <span className="tag">IMAGES</span>
                  </div>
                </div>
              ) : (
                <div
                  className="dropzone-file-preview"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="preview-icon">
                    <RenderFileIcon meta={getFileMeta(chosenFile.name)} />
                  </div>
                  <div className="preview-details">
                    <div className="preview-filename">{chosenFile.name}</div>
                    <div className="preview-size">
                      {formatSize(chosenFile.size)} · Ready to upload
                    </div>
                  </div>
                  <button
                    type="button"
                    className="remove-file-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setChosenFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    title="Remove selected file"
                  >
                    <Icons.Close />
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="primary-btn upload-submit-btn"
              disabled={!chosenFile || uploading}
            >
              {uploading ? (
                <>
                  <Icons.Refresh spinning={true} />
                  <span>Uploading to AWS S3...</span>
                </>
              ) : (
                <>
                  <Icons.UploadCloud />
                  <span>Upload Resource to S3</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* Resources Library Explorer */}
        <section className="glass-card library-section">
          <div className="library-top-bar">
            <div>
              <div className="badge-row">
                <span className="section-badge">CAMPUS REPOSITORY</span>
              </div>
              <h2 className="card-title">
                Shared Files <span className="counter-bubble">{filteredFiles.length}</span>
              </h2>
            </div>

            <button
              type="button"
              className="action-icon-btn refresh-btn"
              onClick={() => loadFiles(true)}
              disabled={refreshing}
              title="Refresh list from AWS S3"
            >
              <Icons.Refresh spinning={refreshing} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Search and Filters Bar */}
          <div className="controls-bar">
            <div className="search-box">
              <span className="search-icon">
                <Icons.Search />
              </span>
              <input
                type="text"
                placeholder="Search notes, assignments, subjects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearch("")}
                >
                  <Icons.Close />
                </button>
              )}
            </div>

            <div className="sort-box">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Latest Uploaded</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
                <option value="size">File Size</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="category-tabs">
            <button
              className={`cat-tab ${selectedCategory === "all" ? "cat-active" : ""}`}
              onClick={() => setSelectedCategory("all")}
            >
              All Files <span className="tab-badge">{categoryCounts.all}</span>
            </button>
            <button
              className={`cat-tab ${selectedCategory === "pdf" ? "cat-active" : ""}`}
              onClick={() => setSelectedCategory("pdf")}
            >
              PDFs <span className="tab-badge">{categoryCounts.pdf}</span>
            </button>
            <button
              className={`cat-tab ${selectedCategory === "docs" ? "cat-active" : ""}`}
              onClick={() => setSelectedCategory("docs")}
            >
              Docs <span className="tab-badge">{categoryCounts.docs}</span>
            </button>
            <button
              className={`cat-tab ${selectedCategory === "slides" ? "cat-active" : ""}`}
              onClick={() => setSelectedCategory("slides")}
            >
              Slides <span className="tab-badge">{categoryCounts.slides}</span>
            </button>
            <button
              className={`cat-tab ${selectedCategory === "images" ? "cat-active" : ""}`}
              onClick={() => setSelectedCategory("images")}
            >
              Images <span className="tab-badge">{categoryCounts.images}</span>
            </button>
          </div>

          {/* Files List / Grid */}
          <div className="files-list-container">
            {loading ? (
              <div className="empty-state">
                <div className="loading-spinner"></div>
                <p>Connecting to AWS S3 bucket and fetching files...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon-wrap">
                  <Icons.Vault />
                </div>
                <h3>No resources found</h3>
                <p>
                  {search || selectedCategory !== "all"
                    ? "Try adjusting your search terms or category filter."
                    : "Be the first to upload college notes or study files!"}
                </p>
              </div>
            ) : (
              <div className="files-grid">
                {filteredFiles.map((file) => {
                  const meta = getFileMeta(file.name);
                  const isCopied = copiedKey === file.key;

                  return (
                    <div key={file.key} className="file-item-card">
                      <div className="file-item-top">
                        <div className="file-item-icon-box">
                          <RenderFileIcon meta={meta} />
                        </div>
                        <span className={`file-badge ${meta.badgeClass}`}>{meta.label}</span>
                      </div>

                      <div className="file-item-info">
                        <h4 className="file-item-title" title={file.name}>
                          {file.name}
                        </h4>
                        <div className="file-item-meta">
                          <span>{formatSize(file.size)}</span>
                          <span className="dot-sep">•</span>
                          <span>{formatDate(file.uploadedAt)}</span>
                        </div>
                      </div>

                      <div className="file-item-actions">
                        <a
                          href={file.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="file-action-btn btn-download"
                          title="Download resource"
                        >
                          <Icons.Download />
                          <span>Download</span>
                        </a>

                        <button
                          type="button"
                          className={`file-action-btn btn-secondary ${isCopied ? "btn-copied" : ""}`}
                          onClick={() => handleCopyLink(file.downloadUrl, file.key)}
                          title="Copy temporary S3 link"
                        >
                          {isCopied ? <Icons.Check /> : <Icons.Copy />}
                        </button>

                        <button
                          type="button"
                          className="file-action-btn btn-delete"
                          onClick={() => openDeleteModal(file)}
                          title="Delete from S3 (Admin)"
                        >
                          <Icons.Trash />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <Icons.Vault />
            <span>CampusVault Architecture</span>
          </div>
          <p className="footer-credits">
            Backend hosted on <strong>AWS EC2</strong> · Files stored privately in <strong>AWS S3</strong> · Built with React + Node.js
          </p>
        </div>
      </footer>

      {/* Admin Settings PIN Modal */}
      {pinModalOpen && (
        <div className="modal-backdrop" onClick={() => setPinModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-badge">
                  <Icons.Lock />
                </div>
                <div>
                  <h3 className="modal-title">Admin PIN Configuration</h3>
                  <p className="modal-subtitle">Configure your moderation PIN to manage & delete resources</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setPinModalOpen(false)}
              >
                <Icons.Close />
              </button>
            </div>

            <form onSubmit={handleSavePin}>
              <div className="modal-body">
                <div className="input-group">
                  <label htmlFor="admin-pin-field">Enter Admin PIN</label>
                  <div className="pin-input-container">
                    <input
                      id="admin-pin-field"
                      type={showPinText ? "text" : "password"}
                      placeholder="e.g. Admin@1234"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="toggle-pin-btn"
                      onClick={() => setShowPinText(!showPinText)}
                    >
                      {showPinText ? "Hide" : "Show"}
                    </button>
                  </div>
                  <span className="input-hint">
                    This PIN is matched with the <code>ADMIN_PIN</code> setting in your EC2 backend <code>.env</code>.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setPinModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn btn-modal-confirm">
                  Save Admin PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => !isDeleting && setDeleteTarget(null)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-badge badge-danger">
                  <Icons.Trash />
                </div>
                <div>
                  <h3 className="modal-title">Delete Resource</h3>
                  <p className="modal-subtitle">Permanent deletion from AWS S3 Bucket</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
              >
                <Icons.Close />
              </button>
            </div>

            <div className="modal-body">
              <p className="delete-warning-text">
                Are you sure you want to delete this resource? This will permanently delete the file from your AWS S3 bucket:
              </p>
              <div className="delete-target-preview">
                <span className="file-name-bold">{deleteTarget.name}</span>
                <span className="file-size-pill">{formatSize(deleteTarget.size)}</span>
              </div>

              <div className="input-group" style={{ marginTop: "18px" }}>
                <label htmlFor="confirm-del-pin">Admin PIN Authentication</label>
                <input
                  id="confirm-del-pin"
                  type="password"
                  placeholder="Enter Admin PIN to confirm"
                  value={deletePin}
                  onChange={(e) => setDeletePin(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger-confirm"
                disabled={isDeleting || !deletePin}
                onClick={confirmDelete}
              >
                {isDeleting ? "Deleting from S3..." : "Confirm & Delete from S3"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
