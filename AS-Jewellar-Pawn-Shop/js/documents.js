/**
 * AS JEWELLAR PAWN SHOP - SECURE CUSTOMER DOCUMENT SCANNING & KYC SERVICE
 * Supports Mobile Camera, Desktop Scanner / Webcam devices, Scanner PDF/Image Uploads,
 * 90° Canvas Rotation, Customer 360 KYC Checklist Status, Document Version Replacement,
 * Soft-Delete Archiving, and Private Google Drive / Google Sheets Synchronization.
 */

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB (Supports multi-page scanner PDFs)
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
];

/**
 * Standard Customer & Transaction Document Registry
 */
const DOCUMENT_TYPES = {
  CUSTOMER_PHOTO: {
    code: 'CUSTOMER_PHOTO',
    labelEn: 'Customer Photograph',
    labelTa: 'வாடிக்கையாளர் புகைப்படம்',
    category: 'PROFILE',
    kycRequirement: 'PHOTO',
    icon: '👤',
    folderSubpath: 'Profile/'
  },
  AADHAAR_ID: {
    code: 'AADHAAR_ID',
    labelEn: 'Aadhaar Card (ID Proof)',
    labelTa: 'ஆதார் அட்டை',
    category: 'KYC',
    kycRequirement: 'ID_PROOF',
    icon: '🪪',
    folderSubpath: 'KYC/'
  },
  ADDRESS_PROOF: {
    code: 'ADDRESS_PROOF',
    labelEn: 'Address Proof (Ration / EB Bill)',
    labelTa: 'முகவரி சான்று (குடும்ப அட்டை / EB)',
    category: 'KYC',
    kycRequirement: 'ADDRESS_PROOF',
    icon: '🏠',
    folderSubpath: 'KYC/'
  },
  PAN_CARD: {
    code: 'PAN_CARD',
    labelEn: 'PAN Card',
    labelTa: 'பான் கார்டு (PAN)',
    category: 'KYC',
    kycRequirement: 'ID_PROOF',
    icon: '💳',
    folderSubpath: 'KYC/'
  },
  OTHER_ID: {
    code: 'OTHER_ID',
    labelEn: 'Other ID / Voter / Driving Licence',
    labelTa: 'இதர அடையாள சான்று / வாக்காளர் / ஓட்டுநர் உரிமம்',
    category: 'KYC',
    kycRequirement: 'ID_PROOF',
    icon: '📄',
    folderSubpath: 'KYC/'
  },
  SIGNATURE: {
    code: 'SIGNATURE',
    labelEn: 'Customer Signature Specimen',
    labelTa: 'வாடிக்கையாளர் கையொப்ப மாதிரி',
    category: 'PROFILE',
    kycRequirement: 'SIGNATURE',
    icon: '✍️',
    folderSubpath: 'Profile/'
  },
  THUMB_IMPRESSION: {
    code: 'THUMB_IMPRESSION',
    labelEn: 'Thumb Impression',
    labelTa: 'கைரேகை பதிவு',
    category: 'PROFILE',
    kycRequirement: 'SIGNATURE',
    icon: '👍',
    folderSubpath: 'Profile/'
  },
  PLEDGE_ITEM_PHOTO: {
    code: 'PLEDGE_ITEM_PHOTO',
    labelEn: 'Pledged Jewellery Article Photo',
    labelTa: 'நகை பொருள் புகைப்படம்',
    category: 'PLEDGES',
    kycRequirement: null,
    icon: '💍',
    folderSubpath: 'Pledges/'
  },
  PAWN_TICKET_PDF: {
    code: 'PAWN_TICKET_PDF',
    labelEn: 'Signed Pawn Ticket PDF',
    labelTa: 'கையொப்பமிட்ட அடகு சீட்டு (PDF)',
    category: 'PLEDGES',
    kycRequirement: null,
    icon: '📑',
    folderSubpath: 'Pledges/'
  },
  SUPPORTING_DOC: {
    code: 'SUPPORTING_DOC',
    labelEn: 'Supporting Document / Invoice',
    labelTa: 'துணை ஆவணம் / ரசீது',
    category: 'KYC',
    kycRequirement: null,
    icon: '📁',
    folderSubpath: 'KYC/'
  }
};

class DocumentManager {
  constructor() {
    this.storageKey = 'as_jewellar_documents_store';
    this.documents = this.loadInitialDocuments();
    this.cameraStream = null;
    this.currentFacingMode = 'user'; // 'user' (webcam/selfie) or 'environment' (rear/scanner)
    this.currentDeviceId = null;
  }

  loadInitialDocuments() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch (e) {
      console.warn('Failed to load stored documents', e);
    }
    this.saveDocuments([]);
    return [];
  }

  saveDocuments(docsList) {
    this.documents = docsList;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(docsList));
      }
    } catch (e) {
      console.warn('Failed to persist documents to localStorage', e);
    }
  }

  /**
   * Safe Filename Generator:
   * Strips unsafe characters and prevents embedding sensitive unmasked ID numbers.
   */
  generateSafeFilename(customerId, docType, originalFilename = '', pledgeId = '') {
    const rawExt = (originalFilename.split('.').pop() || 'jpg').toLowerCase();
    const ext = ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(rawExt) ? rawExt : 'jpg';
    const typeTag = String(docType || 'DOC').replace(/[^A-Z0-9]/g, '_');
    const custTag = String(customerId || 'CUS').replace(/[^A-Z0-9]/g, '_');
    const pledgeTag = pledgeId ? `_${String(pledgeId).replace(/[^A-Z0-9]/g, '_')}` : '';
    const timestamp = Date.now().toString().slice(-6);

    return `DOC_${custTag}${pledgeTag}_${typeTag}_${timestamp}.${ext}`;
  }

  /**
   * Validate file size and MIME type (Max 15MB, JPG/PNG/WEBP/PDF)
   */
  validateFile(file) {
    if (!file) {
      return { valid: false, message: 'No file provided' };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        message: (typeof window !== 'undefined' && window.t) ? window.t('file_type_error') : 'Invalid file type. Allowed: JPG, PNG, WEBP, PDF'
      };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        message: (typeof window !== 'undefined' && window.t) ? window.t('file_size_error') : 'File size exceeds allowed limit (Max 15MB).'
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
   * HTML5 Canvas Image Compressor
   * Optimizes scanned documents and photos, keeping text crisp while reducing payload.
   */
  async compressImage(fileOrDataUrl, maxWidth = 1200, maxHeight = 1600, quality = 0.85) {
    if (typeof Image === 'undefined' || typeof document === 'undefined') {
      const approxBytes = typeof fileOrDataUrl === 'string' ? Math.round((fileOrDataUrl.length * 3) / 4) : 80000;
      return { dataUrl: fileOrDataUrl, sizeBytes: approxBytes, width: 800, height: 600, compressed: false };
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
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
        resolve({ dataUrl: fileOrDataUrl, sizeBytes: 80000, width: 0, height: 0, compressed: false });
      };

      if (typeof fileOrDataUrl === 'string') {
        img.src = fileOrDataUrl;
      } else if (fileOrDataUrl instanceof Blob || (typeof File !== 'undefined' && fileOrDataUrl instanceof File)) {
        const reader = new FileReader();
        reader.onload = (e) => { img.src = e.target.result; };
        reader.readAsDataURL(fileOrDataUrl);
      }
    });
  }

  /**
   * 90° / 180° / 270° Canvas Image Rotation Tool
   * Essential for correcting orientation of mobile scans and desktop scanner feeds.
   */
  async rotateImage(dataUrl, angleDegrees = 90) {
    if (typeof Image === 'undefined' || typeof document === 'undefined') {
      return dataUrl;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const rad = (angleDegrees * Math.PI) / 180;

        // If rotating 90 or 270 degrees, swap canvas width & height
        if (Math.abs(angleDegrees % 180) === 90) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rad);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        const rotatedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(rotatedDataUrl);
      };

      img.onerror = () => {
        resolve(dataUrl);
      };

      img.src = dataUrl;
    });
  }

  /**
   * Enumerate available video input / scanner devices
   */
  async listVideoDevices() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(d => d.kind === 'videoinput').map((d, index) => ({
        deviceId: d.deviceId,
        label: d.label || `Camera / Scanner Device ${index + 1}`
      }));
    } catch (e) {
      console.warn('Could not enumerate video devices', e);
      return [];
    }
  }

  /**
   * HTML5 Live Camera & Document Scanner Video Stream
   * Supports deviceId selection and front/rear facingMode.
   */
  async startCamera(videoElement, deviceIdOrFacingMode = null) {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error((typeof window !== 'undefined' && window.t) ? window.t('no_camera_available') : 'Camera / Scanner access not supported on this device');
    }

    this.stopCamera();

    let constraints = { audio: false };

    if (deviceIdOrFacingMode && deviceIdOrFacingMode.length > 20) {
      this.currentDeviceId = deviceIdOrFacingMode;
      constraints.video = { deviceId: { exact: this.currentDeviceId } };
    } else {
      if (deviceIdOrFacingMode === 'user' || deviceIdOrFacingMode === 'environment') {
        this.currentFacingMode = deviceIdOrFacingMode;
      }
      constraints.video = {
        facingMode: { ideal: this.currentFacingMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      };
    }

    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (primaryErr) {
      console.warn('Primary camera constraints failed, attempting generic fallback:', primaryErr);
      try {
        this.cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      } catch (fallbackErr) {
        throw new Error(((typeof window !== 'undefined' && window.t) ? window.t('camera_permission_denied') : 'Camera permission denied or device not found: ') + fallbackErr.message);
      }
    }

    if (videoElement && this.cameraStream) {
      videoElement.srcObject = this.cameraStream;
      await videoElement.play();
    }
    return true;
  }

  /**
   * Switch between front (user) and rear (environment) camera
   */
  async switchCamera(videoElement) {
    this.currentFacingMode = (this.currentFacingMode === 'user') ? 'environment' : 'user';
    this.currentDeviceId = null;
    return await this.startCamera(videoElement, this.currentFacingMode);
  }

  /**
   * Capture Frame from Video with optional Center Crop and Security Watermark
   */
  capturePhoto(videoElement, canvasElement, options = {}) {
    if (!videoElement || !canvasElement) return null;

    const vWidth = videoElement.videoWidth || 640;
    const vHeight = videoElement.videoHeight || 480;

    const cropSquare = options.cropSquare === true;
    let sX = 0, sY = 0, sWidth = vWidth, sHeight = vHeight;
    let targetWidth = 800, targetHeight = 600;

    if (cropSquare) {
      const minDim = Math.min(vWidth, vHeight);
      sX = (vWidth - minDim) / 2;
      sY = (vHeight - minDim) / 2;
      sWidth = minDim;
      sHeight = minDim;
      targetWidth = 600;
      targetHeight = 600;
    } else {
      targetWidth = Math.min(1280, vWidth);
      targetHeight = Math.round((vHeight * targetWidth) / vWidth);
    }

    canvasElement.width = targetWidth;
    canvasElement.height = targetHeight;

    const ctx = canvasElement.getContext('2d');
    ctx.drawImage(videoElement, sX, sY, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

    // Add subtle security counter watermark at bottom
    if (options.watermark !== false) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(0, targetHeight - 26, targetWidth, 26);
      ctx.fillStyle = '#FFFDF9';
      ctx.font = 'bold 11px sans-serif';
      const timeStr = new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      ctx.fillText(`AS JEWELLAR PAWN SHOP • SECURE DOCUMENT SCAN • ${timeStr}`, 10, targetHeight - 9);
    }

    return canvasElement.toDataURL('image/jpeg', options.quality || 0.88);
  }

  stopCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      this.cameraStream = null;
    }
  }

  /**
   * Save or Update Customer Photograph
   */
  async saveCustomerPhoto({
    customerId,
    dataUrl,
    filename = 'customer_photo.jpg',
    uploadedBy = null
  }) {
    if (!customerId || !dataUrl) {
      return { success: false, message: 'Customer ID and photo data required' };
    }

    const compressed = await this.compressImage(dataUrl, 800, 800, 0.82);
    const safeFilename = this.generateSafeFilename(customerId, 'CUSTOMER_PHOTO', filename);
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    const year = new Date().getFullYear();
    const seq = (this.documents.length + 1).toString().padStart(6, '0');
    const newDocId = `DOC-${year}-${seq}`;

    const newDocRecord = {
      docId: newDocId,
      customerId,
      pledgeId: '',
      docType: 'CUSTOMER_PHOTO',
      docTitle: `Customer Photo - ${customerId}`,
      originalFilename: filename,
      storedFilename: safeFilename,
      driveFileId: isOffline ? `PENDING_DRIVE_${newDocId}` : `1DRIVE_${newDocId}`,
      driveFolder: `AS Jewellar Pawn Shop/Customers/${customerId}/Profile/`,
      fileSizeBytes: compressed.sizeBytes,
      fileSizeFormatted: this.formatBytes(compressed.sizeBytes),
      mimeType: 'image/jpeg',
      uploadedBy: uploadedBy || (typeof window !== 'undefined' && window.auth?.getUser()?.username) || 'ADMIN',
      uploadedAt: new Date().toISOString(),
      status: isOffline ? 'PENDING_SYNC' : 'VERIFIED',
      previewUrl: compressed.dataUrl
    };

    // Remove any previous active photo document for this customer
    this.documents = this.documents.filter(d => !(d.customerId === customerId && d.docType === 'CUSTOMER_PHOTO'));
    this.documents.unshift(newDocRecord);
    this.saveDocuments(this.documents);

    // Link Photo directly to Customer Profile in CustomerManager
    if (typeof window !== 'undefined' && window.customerManager) {
      const cust = window.customerManager.getCustomerById(customerId);
      if (cust) {
        cust.photoUrl = compressed.dataUrl;
        cust.photoDocId = newDocId;
        cust.photoSyncStatus = isOffline ? 'PENDING' : 'SYNCED';
        window.customerManager.saveCustomers(window.customerManager.customers);
      }
    }

    const base64Data = compressed.dataUrl.split(',')[1] || compressed.dataUrl;

    if (isOffline) {
      if (typeof window !== 'undefined' && window.syncQueueManager) {
        await window.syncQueueManager.enqueueTransaction('CUSTOMER_PHOTO', {
          customerId,
          docType: 'CUSTOMER_PHOTO',
          fileName: safeFilename,
          base64Data,
          mimeType: 'image/jpeg',
          docId: newDocId
        });
      }
    } else if (typeof window !== 'undefined' && window.api && typeof window.api.post === 'function') {
      window.api.post('uploadDocument', {
        customerId,
        docType: 'CUSTOMER_PHOTO',
        fileName: safeFilename,
        base64Data,
        mimeType: 'image/jpeg'
      }).then(res => {
        if (res && res.success && res.data && res.data.fileId) {
          newDocRecord.driveFileId = res.data.fileId;
          newDocRecord.status = 'VERIFIED';
          this.saveDocuments(this.documents);
        }
      }).catch(err => {
        console.warn('Customer photo cloud sync failed, queuing offline:', err);
        if (window.syncQueueManager) {
          window.syncQueueManager.enqueueTransaction('CUSTOMER_PHOTO', {
            customerId,
            docType: 'CUSTOMER_PHOTO',
            fileName: safeFilename,
            base64Data,
            mimeType: 'image/jpeg',
            docId: newDocId
          });
        }
      });
    }

    return {
      success: true,
      document: newDocRecord,
      photoUrl: compressed.dataUrl,
      isOffline
    };
  }

  /**
   * Get Active Customer Photo Record
   */
  getCustomerPhoto(customerId) {
    if (!customerId) return null;
    return this.documents.find(d => d.customerId === customerId && d.docType === 'CUSTOMER_PHOTO' && d.status !== 'ARCHIVED') || null;
  }

  /**
   * Upload Document (Supports Camera frame, Image File, Scanner PDF)
   */
  async uploadDocument({
    customerId,
    docType = 'SUPPORTING_DOC',
    docTitle = '',
    pledgeId = '',
    fileOrDataUrl = null,
    originalFilename = 'document.jpg',
    mimeType = 'image/jpeg',
    fileSizeBytes = 500000,
    uploadedBy = null
  }) {
    if (!customerId) {
      return { success: false, message: 'Customer ID is required' };
    }

    const year = new Date().getFullYear();
    const seq = (this.documents.length + 1).toString().padStart(6, '0');
    const newDocId = `DOC-${year}-${seq}`;

    const safeFilename = this.generateSafeFilename(customerId, docType, originalFilename, pledgeId);
    let targetFolder = `AS Jewellar Pawn Shop/Customers/${customerId}/`;
    if (['CUSTOMER_PHOTO', 'SIGNATURE', 'THUMB_IMPRESSION', 'THUMB'].includes(docType)) {
      targetFolder += 'Profile/';
    } else if (['AADHAAR_ID', 'ADDRESS_PROOF', 'PAN_CARD', 'OTHER_ID', 'SUPPORTING_DOC', 'ID_PROOF'].includes(docType)) {
      targetFolder += 'KYC/';
    } else if (pledgeId || ['PLEDGE_ITEM_PHOTO', 'PAWN_TICKET_PDF'].includes(docType)) {
      targetFolder += pledgeId ? `Pledges/${pledgeId}/` : 'Pledges/';
    }

    let previewUrl = 'assets/logo/logo.svg';
    let base64Data = '';
    let finalSizeBytes = fileSizeBytes;

    // Handle Data URL (Image or PDF)
    if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
      previewUrl = fileOrDataUrl;
      base64Data = fileOrDataUrl.split(',')[1] || '';
      finalSizeBytes = Math.round((fileOrDataUrl.length * 3) / 4);
    }

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    const newDocRecord = {
      docId: newDocId,
      customerId,
      pledgeId: pledgeId || '',
      docType,
      docTitle: docTitle || DOCUMENT_TYPES[docType]?.labelEn || safeFilename,
      originalFilename,
      storedFilename: safeFilename,
      driveFileId: isOffline ? `PENDING_DRIVE_${newDocId}` : `1DRIVE_${newDocId}`,
      driveFolder: targetFolder,
      fileSizeBytes: finalSizeBytes,
      fileSizeFormatted: this.formatBytes(finalSizeBytes),
      mimeType,
      uploadedBy: uploadedBy || (typeof window !== 'undefined' && window.auth?.getUser()?.username) || 'ADMIN',
      uploadedAt: new Date().toISOString(),
      status: isOffline ? 'PENDING_SYNC' : 'VERIFIED',
      previewUrl
    };

    this.documents.unshift(newDocRecord);
    this.saveDocuments(this.documents);

    // If uploading a customer photo, link to customer record
    if (docType === 'CUSTOMER_PHOTO' && typeof window !== 'undefined' && window.customerManager) {
      const cust = window.customerManager.getCustomerById(customerId);
      if (cust) {
        cust.photoUrl = previewUrl;
        cust.photoDocId = newDocId;
        window.customerManager.saveCustomers(window.customerManager.customers);
      }
    }

    // Sync to backend or offline queue
    if (isOffline) {
      if (typeof window !== 'undefined' && window.syncQueueManager) {
        await window.syncQueueManager.enqueueTransaction('uploadDocument', {
          customerId,
          docType,
          fileName: safeFilename,
          base64Data,
          mimeType,
          pledgeId,
          docId: newDocId
        });
      }
    } else if (typeof window !== 'undefined' && window.api && typeof window.api.post === 'function') {
      window.api.post('uploadDocument', {
        customerId,
        docType,
        fileName: safeFilename,
        base64Data,
        mimeType,
        pledgeId
      }).then(res => {
        if (res && res.success && res.data && res.data.fileId) {
          newDocRecord.driveFileId = res.data.fileId;
          newDocRecord.status = 'VERIFIED';
          this.saveDocuments(this.documents);
        }
      }).catch(err => {
        console.warn('Backend Drive sync notice, queuing offline:', err);
        if (window.syncQueueManager) {
          window.syncQueueManager.enqueueTransaction('uploadDocument', {
            customerId,
            docType,
            fileName: safeFilename,
            base64Data,
            mimeType,
            pledgeId,
            docId: newDocId
          });
        }
      });
    }

    return { success: true, document: newDocRecord };
  }

  /**
   * Replace Document (Updates version, preview, and syncs replacement)
   */
  async replaceDocument(docId, fileOrDataUrlOrOptions, originalFilename, mimeType = 'image/jpeg', fileSizeBytes = 0, uploadedBy = null) {
    let fileOrDataUrl = fileOrDataUrlOrOptions;
    let origFilename = originalFilename;
    let mime = mimeType;
    let sizeBytes = fileSizeBytes;
    let uploader = uploadedBy;

    if (fileOrDataUrlOrOptions && typeof fileOrDataUrlOrOptions === 'object' && !(typeof Blob !== 'undefined' && fileOrDataUrlOrOptions instanceof Blob)) {
      fileOrDataUrl = fileOrDataUrlOrOptions.fileOrDataUrl;
      origFilename = fileOrDataUrlOrOptions.originalFilename;
      mime = fileOrDataUrlOrOptions.mimeType || 'image/jpeg';
      sizeBytes = fileOrDataUrlOrOptions.fileSizeBytes || 0;
      uploader = fileOrDataUrlOrOptions.uploadedBy;
    }

    const doc = this.documents.find(d => d.docId === docId);
    if (!doc) return { success: false, message: 'Document not found' };

    let base64Data = '';
    if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
      doc.previewUrl = fileOrDataUrl;
      base64Data = fileOrDataUrl.split(',')[1] || '';
      doc.fileSizeBytes = Math.round((fileOrDataUrl.length * 3) / 4);
    } else if (sizeBytes) {
      doc.fileSizeBytes = sizeBytes;
    }

    doc.originalFilename = origFilename || doc.originalFilename;
    doc.mimeType = mime || doc.mimeType;
    doc.fileSizeFormatted = this.formatBytes(doc.fileSizeBytes);
    doc.updatedAt = new Date().toISOString();
    doc.uploadedBy = uploader || (typeof window !== 'undefined' && window.auth?.getUser()?.username) || 'ADMIN';
    doc.status = 'VERIFIED';

    this.saveDocuments(this.documents);

    // Sync replacement to backend if online
    if (typeof window !== 'undefined' && window.api && typeof window.api.post === 'function') {
      window.api.post('uploadDocument', {
        customerId: doc.customerId,
        docType: doc.docType,
        fileName: doc.storedFilename,
        base64Data,
        mimeType: doc.mimeType,
        pledgeId: doc.pledgeId
      }).catch(e => console.warn('Replace document sync notice:', e));
    }

    return { success: true, document: doc };
  }

  /**
   * Rename Document Title
   */
  async renameDocument(docId, newTitle) {
    const doc = this.documents.find(d => d.docId === docId);
    if (!doc) return { success: false, message: 'Document not found' };

    doc.docTitle = newTitle.trim();
    doc.updatedAt = new Date().toISOString();
    this.saveDocuments(this.documents);
    return { success: true, document: doc };
  }

  /**
   * Soft Delete / Archive Document (Toggles ACTIVE / ARCHIVED)
   */
  async archiveDocument(docId) {
    const doc = this.documents.find(d => d.docId === docId);
    if (!doc) return { success: false, message: 'Document not found' };

    doc.status = (doc.status === 'ARCHIVED') ? 'VERIFIED' : 'ARCHIVED';
    doc.updatedAt = new Date().toISOString();
    this.saveDocuments(this.documents);
    return { success: true, document: doc };
  }

  /**
   * Compute Customer 360 KYC Health & Checklist Status
   */
  getCustomerKycStatus(customerId) {
    if (!customerId) {
      return {
        hasPhoto: false,
        hasIdProof: false,
        hasSignature: false,
        hasAddressProof: false,
        isKycComplete: false,
        checklist: []
      };
    }

    const activeDocs = this.documents.filter(d => d.customerId === customerId && d.status !== 'ARCHIVED');

    // 1. Photo Check
    let hasPhoto = activeDocs.some(d => d.docType === 'CUSTOMER_PHOTO');
    if (!hasPhoto && typeof window !== 'undefined' && window.customerManager) {
      const cust = window.customerManager.getCustomerById(customerId);
      if (cust && cust.photoUrl) hasPhoto = true;
    }

    // 2. ID Proof Check (Aadhaar, PAN, Voter, Driving Licence, or general ID_PROOF)
    const hasIdProof = activeDocs.some(d => ['AADHAAR_ID', 'PAN_CARD', 'OTHER_ID', 'ID_PROOF'].includes(d.docType));

    // 3. Signature / Thumb Check
    const hasSignature = activeDocs.some(d => ['SIGNATURE', 'THUMB_IMPRESSION', 'THUMB'].includes(d.docType));

    // 4. Address Proof Check (Address Proof, Ration Card, or Aadhaar)
    const hasAddressProof = activeDocs.some(d => ['ADDRESS_PROOF', 'AADHAAR_ID'].includes(d.docType));

    const isKycComplete = hasPhoto && hasIdProof && hasSignature && hasAddressProof;

    const checklist = [
      {
        key: 'PHOTO',
        docType: 'CUSTOMER_PHOTO',
        labelEn: 'Customer Photograph',
        labelTa: 'வாடிக்கையாளர் புகைப்படம்',
        status: hasPhoto ? 'DONE' : 'MISSING',
        icon: '📷'
      },
      {
        key: 'ID_PROOF',
        docType: 'AADHAAR_ID',
        labelEn: 'Identity Proof (Aadhaar / Voter ID / PAN)',
        labelTa: 'அடையாள சான்று (ஆதார் / வாக்காளர்)',
        status: hasIdProof ? 'DONE' : 'MISSING',
        icon: '🪪'
      },
      {
        key: 'SIGNATURE',
        docType: 'SIGNATURE',
        labelEn: 'Signature / Thumb Impression',
        labelTa: 'கையொப்பம் / கைரேகை மாதிரி',
        status: hasSignature ? 'DONE' : 'MISSING',
        icon: '✍️'
      },
      {
        key: 'ADDRESS_PROOF',
        docType: 'ADDRESS_PROOF',
        labelEn: 'Residential Address Proof (Ration / EB)',
        labelTa: 'முகவரி சான்று (குடும்ப அட்டை / EB)',
        status: hasAddressProof ? 'DONE' : 'MISSING',
        icon: '🏠'
      }
    ];

    return {
      hasPhoto,
      hasIdProof,
      hasSignature,
      hasAddressProof,
      isKycComplete,
      checklist
    };
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
      list = list.filter(d => ['AADHAAR_ID', 'ADDRESS_PROOF', 'PAN_CARD', 'OTHER_ID', 'SUPPORTING_DOC', 'ID_PROOF'].includes(d.docType));
    } else if (docCategory === 'PROFILE') {
      list = list.filter(d => ['CUSTOMER_PHOTO', 'SIGNATURE', 'THUMB_IMPRESSION', 'THUMB'].includes(d.docType));
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
          (d.docId && d.docId.toLowerCase().includes(q)) ||
          (d.docTitle && d.docTitle.toLowerCase().includes(q)) ||
          (d.customerId && d.customerId.toLowerCase().includes(q)) ||
          (d.pledgeId && d.pledgeId.toLowerCase().includes(q)) ||
          (d.originalFilename && d.originalFilename.toLowerCase().includes(q)) ||
          (d.storedFilename && d.storedFilename.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }

  async addDocument(docData) {
    const res = await this.uploadDocument({
      ...docData,
      docType: docData.docType || 'SUPPORTING_DOC'
    });
    return {
      success: res.success,
      doc: res.document || null,
      document: res.document || null,
      message: res.message
    };
  }

  getDocumentsByCustomer(customerId) {
    return this.filterDocuments({ customerId, status: 'ALL' });
  }
}

// Global DocumentManager Instance for browser runtime
if (typeof window !== 'undefined') {
  window.DOCUMENT_TYPES = DOCUMENT_TYPES;
  window.documentManager = new DocumentManager();
}

// Export for Node.js test environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DocumentManager,
    DOCUMENT_TYPES,
    MAX_FILE_SIZE_BYTES,
    ALLOWED_MIME_TYPES
  };
}
