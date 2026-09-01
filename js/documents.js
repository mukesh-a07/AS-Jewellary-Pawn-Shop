/**
 * AS JEWELLAR PAWN SHOP - SECURE DOCUMENT MANAGEMENT SERVICE
 * Manages Google Drive metadata, HTML5 Camera Capture, File Validation,
 * Safe Filename Sanitization, Document Preview/Download & Soft Deletion.
 */

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
];

class DocumentManager {
  constructor() {
    this.storageKey = 'as_jewellar_documents_store';
    this.documents = this.loadInitialDocuments();
    this.cameraStream = null;
  }

  loadInitialDocuments() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load stored documents', e);
    }

    // Default Seed Documents Repository
    const seedDocs = [
      {
        docId: 'DOC-2026-000184-01',
        customerId: 'CUS-2026-000184',
        pledgeId: '',
        docType: 'ID_PROOF',
        docTitle: 'Aadhaar Card Front / Back',
        originalFilename: 'Aadhaar_Murugan_Scanned.pdf',
        storedFilename: 'DOC_CUS_000184_KYC_ID.pdf',
        driveFileId: '1DRIVE_DOC_FILE_AADHAAR_000184',
        driveFolder: 'AS Jewellar Pawn Shop/Customers/CUS-2026-000184/KYC/',
        fileSizeBytes: 1420500, // 1.42 MB
        fileSizeFormatted: '1.42 MB',
        mimeType: 'application/pdf',
        uploadedBy: 'ADMIN',
        uploadedAt: '2024-01-12T10:15:00.000Z',
        status: 'VERIFIED', // VERIFIED, ACTIVE, ARCHIVED, DELETED
        previewUrl: 'assets/logo/logo.svg' // Simulated preview fallback
      },
      {
        docId: 'DOC-2026-000184-02',
        customerId: 'CUS-2026-000184',
        pledgeId: '',
        docType: 'CUSTOMER_PHOTO',
        docTitle: 'Customer Passport Profile Photo',
        originalFilename: 'Murugan_Counter_Photo.jpg',
        storedFilename: 'DOC_CUS_000184_PROFILE_PHOTO.jpg',
        driveFileId: '1DRIVE_DOC_FILE_PHOTO_000184',
        driveFolder: 'AS Jewellar Pawn Shop/Customers/CUS-2026-000184/Profile/',
        fileSizeBytes: 485200, // 485 KB
        fileSizeFormatted: '485 KB',
        mimeType: 'image/jpeg',
        uploadedBy: 'ADMIN',
        uploadedAt: '2024-01-12T10:20:00.000Z',
        status: 'VERIFIED',
        previewUrl: 'assets/icons/icon-192.svg'
      },
      {
        docId: 'DOC-2026-000184-03',
        customerId: 'CUS-2026-000184',
        pledgeId: 'PLG-2026-002341',
        docType: 'PLEDGE_ITEM_PHOTO',
        docTitle: 'Gold Chain (22K 12.5g) Scale & Hallmark Photo',
        originalFilename: 'Gold_Chain_Hallmark_Scale.jpg',
        storedFilename: 'DOC_PLG_002341_ITEM_01.jpg',
        driveFileId: '1DRIVE_DOC_FILE_ITEM_002341',
        driveFolder: 'AS Jewellar Pawn Shop/Customers/CUS-2026-000184/Pledges/PLG-2026-002341/',
        fileSizeBytes: 890400, // 890 KB
        fileSizeFormatted: '890 KB',
        mimeType: 'image/jpeg',
        uploadedBy: 'ADMIN',
        uploadedAt: '2026-07-10T11:45:00.000Z',
        status: 'ACTIVE',
        previewUrl: 'assets/icons/favicon.svg'
      },
      {
        docId: 'DOC-2026-000184-04',
        customerId: 'CUS-2026-000184',
        pledgeId: 'PLG-2026-002341',
        docType: 'PAWN_TICKET_PDF',
        docTitle: 'Signed Pawn Ticket PDF &bull; PLG-2026-002341',
        originalFilename: 'Pawn_Ticket_PLG_2026_002341_Signed.pdf',
        storedFilename: 'DOC_PLG_002341_TICKET.pdf',
        driveFileId: '1DRIVE_DOC_FILE_TICKET_002341',
        driveFolder: 'AS Jewellar Pawn Shop/Customers/CUS-2026-000184/Pledges/PLG-2026-002341/',
        fileSizeBytes: 320100,
        fileSizeFormatted: '320 KB',
        mimeType: 'application/pdf',
        uploadedBy: 'ADMIN',
        uploadedAt: '2026-07-10T12:00:00.000Z',
        status: 'ACTIVE',
        previewUrl: 'assets/logo/logo.svg'
      },
      {
        docId: 'DOC-2026-000092-01',
        customerId: 'CUS-2026-000092',
        pledgeId: '',
        docType: 'ID_PROOF',
        docTitle: 'Voter ID Card Front / Back',
        originalFilename: 'Lakshmi_VoterID_Scan.jpg',
        storedFilename: 'DOC_CUS_000092_VOTER_ID.jpg',
        driveFileId: '1DRIVE_DOC_FILE_VOTER_000092',
        driveFolder: 'AS Jewellar Pawn Shop/Customers/CUS-2026-000092/KYC/',
        fileSizeBytes: 620400,
        fileSizeFormatted: '620 KB',
        mimeType: 'image/jpeg',
        uploadedBy: 'ADMIN',
        uploadedAt: '2025-08-28T09:20:00.000Z',
        status: 'VERIFIED',
        previewUrl: 'assets/icons/icon-192.svg'
      },
      {
        docId: 'DOC-2026-000210-01',
        customerId: 'CUS-2026-000210',
        pledgeId: '',
        docType: 'ID_PROOF',
        docTitle: 'Aadhaar Card Copy',
        originalFilename: 'Soundar_Aadhaar.pdf',
        storedFilename: 'DOC_CUS_000210_AADHAAR.pdf',
        driveFileId: '1DRIVE_DOC_FILE_AADHAAR_000210',
        driveFolder: 'AS Jewellar Pawn Shop/Customers/CUS-2026-000210/KYC/',
        fileSizeBytes: 1100000,
        fileSizeFormatted: '1.10 MB',
        mimeType: 'application/pdf',
        uploadedBy: 'ADMIN',
        uploadedAt: '2025-05-15T15:50:00.000Z',
        status: 'VERIFIED',
        previewUrl: 'assets/logo/logo.svg'
      }
    ];

    this.saveDocuments(seedDocs);
    return seedDocs;
  }

  saveDocuments(docsList) {
    this.documents = docsList;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(docsList));
    } catch (e) {
      console.warn('Failed to persist documents to localStorage', e);
    }
  }

  /**
   * Safe Filename Generator:
   * Strips unsafe characters and prevents embedding sensitive unmasked ID numbers.
   */
  generateSafeFilename(customerId, docType, originalFilename, pledgeId = '') {
    const ext = (originalFilename.split('.').pop() || 'jpg').toLowerCase();
    const typeTag = docType.replace(/[^A-Z0-9]/g, '_');
    const custTag = customerId.replace(/[^A-Z0-9]/g, '_');
    const pledgeTag = pledgeId ? `_${pledgeId.replace(/[^A-Z0-9]/g, '_')}` : '';
    const timestamp = Date.now().toString().slice(-6);

    return `DOC_${custTag}${pledgeTag}_${typeTag}_${timestamp}.${ext}`;
  }

  /**
   * Validate file size and MIME type
   */
  validateFile(file) {
    if (!file) {
      return { valid: false, message: 'No file provided' };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        message: window.t ? window.t('file_type_error') : 'Invalid file type. Allowed: JPG, PNG, WEBP, PDF'
      };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        message: window.t ? window.t('file_size_error') : 'File size exceeds 5MB limit.'
      };
    }

    return { valid: true };
  }

  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Client-Side HTML5 Canvas Image Compressor
   * Resizes large camera photos (5-10MB) to max 1200px and JPEG 0.75 (< 250KB)
   */
  async compressImage(fileOrDataUrl, maxWidth = 1200, maxHeight = 1200, quality = 0.75) {
    if (typeof Image === 'undefined' || typeof document === 'undefined') {
      return { dataUrl: fileOrDataUrl, sizeBytes: 150000, compressed: false };
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const approxBytes = Math.round((compressedDataUrl.length * 3) / 4);

        resolve({
          dataUrl: compressedDataUrl,
          sizeBytes: approxBytes,
          width,
          height,
          compressed: true
        });
      };

      img.onerror = () => {
        resolve({ dataUrl: fileOrDataUrl, sizeBytes: 150000, compressed: false });
      };

      if (typeof fileOrDataUrl === 'string') {
        img.src = fileOrDataUrl;
      } else if (fileOrDataUrl instanceof Blob) {
        const reader = new FileReader();
        reader.onload = (e) => { img.src = e.target.result; };
        reader.readAsDataURL(fileOrDataUrl);
      }
    });
  }


  /**
   * HTML5 Live Camera Controller
   */
  async startCamera(videoElement) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera access not supported on this device/browser');
    }

    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Rear camera on mobile, webcam on desktop
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (videoElement) {
        videoElement.srcObject = this.cameraStream;
        await videoElement.play();
      }
      return true;
    } catch (err) {
      console.error('Camera access error:', err);
      throw new Error('Camera permission denied or camera not available: ' + err.message);
    }
  }

  capturePhoto(videoElement, canvasElement) {
    if (!videoElement || !canvasElement) return null;

    const width = videoElement.videoWidth || 640;
    const height = videoElement.videoHeight || 480;

    canvasElement.width = width;
    canvasElement.height = height;

    const ctx = canvasElement.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, width, height);

    // Add security counter watermark
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.fillRect(0, height - 32, width, 32);
    ctx.fillStyle = '#FFFDF9';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`AS JEWELLAR PAWN SHOP &bull; ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 12, height - 12);

    return canvasElement.toDataURL('image/jpeg', 0.9);
  }

  stopCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
  }

  /**
   * Upload Document (File or Camera DataURL)
   */
  async uploadDocument({
    customerId,
    docType,
    docTitle,
    pledgeId = '',
    fileOrDataUrl,
    originalFilename = 'camera_capture.jpg',
    mimeType = 'image/jpeg',
    fileSizeBytes = 500000
  }) {
    const year = new Date().getFullYear();
    const seq = (this.documents.length + 1).toString().padStart(6, '0');
    const newDocId = `DOC-${year}-${seq}`;

    const safeFilename = this.generateSafeFilename(customerId, docType, originalFilename, pledgeId);
    let targetFolder = `AS Jewellar Pawn Shop/Customers/${customerId}/`;
    if (['CUSTOMER_PHOTO', 'SIGNATURE', 'THUMB'].includes(docType)) {
      targetFolder += 'Profile/';
    } else if (['ID_PROOF', 'ADDRESS_PROOF'].includes(docType)) {
      targetFolder += 'KYC/';
    } else if (pledgeId) {
      targetFolder += `Pledges/${pledgeId}/`;
    }

    const newDocRecord = {
      docId: newDocId,
      customerId,
      pledgeId: pledgeId || '',
      docType,
      docTitle: docTitle || safeFilename,
      originalFilename,
      storedFilename: safeFilename,
      driveFileId: `1DRIVE_${newDocId}`,
      driveFolder: targetFolder,
      fileSizeBytes,
      fileSizeFormatted: this.formatBytes(fileSizeBytes),
      mimeType,
      uploadedBy: (window.auth && window.auth.getUser()?.username) || 'ADMIN',
      uploadedAt: new Date().toISOString(),
      status: 'VERIFIED',
      previewUrl: (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) ? fileOrDataUrl : 'assets/logo/logo.svg'
    };

    this.documents.unshift(newDocRecord);
    this.saveDocuments(this.documents);

    // Sync to backend if configured
    if (window.api && typeof window.api.post === 'function') {
      window.api.post('uploadDocument', {
        customerId,
        docType,
        fileName: safeFilename,
        base64Data: 'SIMULATED_BASE64',
        mimeType
      }).catch(e => console.warn('Backend Drive sync notice', e));
    }

    return { success: true, document: newDocRecord };
  }

  /**
   * Rename Document Title
   */
  async renameDocument(docId, newTitle) {
    const doc = this.documents.find(d => d.docId === docId);
    if (!doc) return { success: false, message: 'Document not found' };

    doc.docTitle = newTitle.trim();
    this.saveDocuments(this.documents);
    return { success: true, document: doc };
  }

  /**
   * Replace Document Version
   */
  async replaceDocument(docId, newFileOrDataUrl, newOriginalName, newMimeType, newSizeBytes) {
    const doc = this.documents.find(d => d.docId === docId);
    if (!doc) return { success: false, message: 'Document not found' };

    doc.originalFilename = newOriginalName || doc.originalFilename;
    doc.mimeType = newMimeType || doc.mimeType;
    doc.fileSizeBytes = newSizeBytes || doc.fileSizeBytes;
    doc.fileSizeFormatted = this.formatBytes(doc.fileSizeBytes);
    doc.uploadedAt = new Date().toISOString();
    doc.uploadedBy = (window.auth && window.auth.getUser()?.username) || 'ADMIN';
    if (typeof newFileOrDataUrl === 'string' && newFileOrDataUrl.startsWith('data:')) {
      doc.previewUrl = newFileOrDataUrl;
    }

    this.saveDocuments(this.documents);
    return { success: true, document: doc };
  }

  /**
   * Soft Delete / Archive Document
   */
  async archiveDocument(docId) {
    const doc = this.documents.find(d => d.docId === docId);
    if (!doc) return { success: false, message: 'Document not found' };

    doc.status = (doc.status === 'ARCHIVED') ? 'ACTIVE' : 'ARCHIVED';
    doc.updatedAt = new Date().toISOString();
    this.saveDocuments(this.documents);
    return { success: true, document: doc };
  }

  /**
   * Filter and Search Documents
   */
  filterDocuments({ customerId = 'ALL', docCategory = 'ALL', status = 'ACTIVE', query = '' } = {}) {
    let list = [...this.documents];
    const q = String(query || '').toLowerCase().trim();

    // 1. Customer Filter
    if (customerId && customerId !== 'ALL') {
      list = list.filter(d => d.customerId === customerId);
    }

    // 2. Category Filter
    if (docCategory === 'KYC') {
      list = list.filter(d => ['ID_PROOF', 'ADDRESS_PROOF'].includes(d.docType));
    } else if (docCategory === 'PROFILE') {
      list = list.filter(d => ['CUSTOMER_PHOTO', 'SIGNATURE', 'THUMB'].includes(d.docType));
    } else if (docCategory === 'PLEDGES') {
      list = list.filter(d => ['PLEDGE_ITEM_PHOTO', 'PAWN_TICKET_PDF'].includes(d.docType));
    } else if (docCategory === 'RECEIPTS') {
      list = list.filter(d => ['PAYMENT_RECEIPT', 'REDEMPTION_RECEIPT', 'RENEWAL_RECEIPT'].includes(d.docType));
    }

    // 3. Status Filter
    if (status === 'ARCHIVED') {
      list = list.filter(d => d.status === 'ARCHIVED');
    } else if (status !== 'ALL') {
      list = list.filter(d => d.status !== 'ARCHIVED');
    }

    // 4. Keyword Search
    if (q) {
      list = list.filter(d => {
        return (
          d.docId.toLowerCase().includes(q) ||
          d.docTitle.toLowerCase().includes(q) ||
          d.customerId.toLowerCase().includes(q) ||
          (d.pledgeId && d.pledgeId.toLowerCase().includes(q)) ||
          d.originalFilename.toLowerCase().includes(q) ||
          d.storedFilename.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }
}

// Global DocumentManager Instance
window.documentManager = new DocumentManager();
