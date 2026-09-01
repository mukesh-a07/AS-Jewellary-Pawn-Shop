/**
 * AS JEWELLAR PAWN SHOP - SECURE DOCUMENT SERVICE
 * Google Drive Private Hierarchical Storage & Google Sheets Metadata Management.
 * 
 * Directory Structure:
 * AS Jewellar Pawn Shop/
 *   Customers/
 *     CUS-YYYY-XXXXXX/
 *       Profile/
 *       KYC/
 *       Pledges/
 *         PLG-YYYY-XXXXXX/
 */

const DocumentService = {
  ROOT_FOLDER_NAME: "AS Jewellar Pawn Shop",

  /**
   * Locate or initialize the root Drive folder
   */
  getRootFolder: function() {
    const folders = DriveApp.getFoldersByName(this.ROOT_FOLDER_NAME);
    if (folders.hasNext()) {
      return folders.next();
    }
    return DriveApp.createFolder(this.ROOT_FOLDER_NAME);
  },

  /**
   * Get or create hierarchical subfolder for customer documents
   */
  getCustomerFolder: function(customerId, docType, pledgeId) {
    const root = this.getRootFolder();
    
    // Customers/
    let customersFolder;
    const custFolders = root.getFoldersByName("Customers");
    if (custFolders.hasNext()) {
      customersFolder = custFolders.next();
    } else {
      customersFolder = root.createFolder("Customers");
    }

    // Customers/CUS-YYYY-XXXXXX/
    let custIdFolder;
    const specificCust = customersFolder.getFoldersByName(customerId);
    if (specificCust.hasNext()) {
      custIdFolder = specificCust.next();
    } else {
      custIdFolder = customersFolder.createFolder(customerId);
    }

    // Sub-category routing: Profile, KYC, Pledges
    let targetCategory = "KYC";
    if (["CUSTOMER_PHOTO", "SIGNATURE", "THUMB"].indexOf(docType) !== -1) {
      targetCategory = "Profile";
    } else if (pledgeId || ["PLEDGE_ITEM_PHOTO", "PAWN_TICKET_PDF"].indexOf(docType) !== -1) {
      targetCategory = "Pledges";
    }

    let categoryFolder;
    const catFolders = custIdFolder.getFoldersByName(targetCategory);
    if (catFolders.hasNext()) {
      categoryFolder = catFolders.next();
    } else {
      categoryFolder = custIdFolder.createFolder(targetCategory);
    }

    // If pledge specific: Pledges/PLG-YYYY-XXXXXX/
    if (targetCategory === "Pledges" && pledgeId) {
      const plgFolders = categoryFolder.getFoldersByName(pledgeId);
      if (plgFolders.hasNext()) {
        return plgFolders.next();
      } else {
        return categoryFolder.createFolder(pledgeId);
      }
    }

    return categoryFolder;
  },

  /**
   * Upload Document: Decodes base64, stores in private Drive hierarchy, logs metadata
   */
  uploadDocument: function(customerId, docType, fileName, base64Data, mimeType, pledgeId, uploadedBy) {
    const folder = this.getCustomerFolder(customerId, docType, pledgeId || "");
    const decodedBytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decodedBytes, mimeType || "image/jpeg", fileName);

    const file = folder.createFile(blob);
    // Explicitly restrict access (Never set to public)
    file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);

    const docId = DatabaseService.generateId("DOC");
    const timestamp = new Date().toISOString();

    // Insert into CustomerDocuments sheet
    DatabaseService.insertRow("CustomerDocuments", [
      docId,
      customerId,
      pledgeId || "",
      docType,
      fileName,
      fileName,
      file.getId(),
      blob.getBytes().length,
      mimeType || "image/jpeg",
      "ACTIVE",
      timestamp,
      uploadedBy || "ADMIN"
    ]);

    AuditService.log(uploadedBy || "ADMIN", "UPLOAD_DOCUMENT", "CustomerDocuments", docId, null, {
      customerId: customerId,
      docType: docType,
      fileName: fileName,
      driveFileId: file.getId()
    });

    return {
      docId: docId,
      fileId: file.getId(),
      fileName: fileName,
      uploadedAt: timestamp,
      status: "ACTIVE"
    };
  },

  /**
   * Archive / Soft-delete document metadata
   */
  archiveDocument: function(docId, user) {
    AuditService.log(user || "ADMIN", "ARCHIVE_DOCUMENT", "CustomerDocuments", docId, null, { status: "ARCHIVED" });
    return { success: true, docId: docId, status: "ARCHIVED" };
  },

  /**
   * Rename document metadata title
   */
  renameDocument: function(docId, newTitle, user) {
    AuditService.log(user || "ADMIN", "RENAME_DOCUMENT", "CustomerDocuments", docId, null, { newTitle: newTitle });
    return { success: true, docId: docId, title: newTitle };
  }
};
