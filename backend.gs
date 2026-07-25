/**
 * LARA v2 - Backend Google Apps Script
 * Upload files to Google Drive + Sheets
 * 
 * Déployer comme Web App:
 * - Exécuter en tant que: Ton compte
 * - Accès: Tout le monde
 */

const CONFIG = {
  SHEET_ID: "19EpiDMC4QHPOJN3afRYIzq5GmsEBTrTpqtxL3oNR2HM",
  DRIVE_FOLDER_ID: "1uPol8K9ZzJgf_cRB-mT_0QpqB_ZnEuka",
  SHEET_NAME: "Feuille 1"
};

// ============================================
// ENTRÉES HTTP
// ============================================

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    const documents = [];
    
    // Sauter l'en-tête (ligne 0)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] || !row[1]) continue; // Sauter les lignes vides
      
      documents.push({
        cat: row[0],
        name: row[1],
        date: row[2],
        desc: row[3],
        url: row[4],
        id: row[5]
      });
    }
    
    return respond(true, "Liste récupérée", { data: documents });
  } catch (error) {
    Logger.log("Erreur doGet: " + error);
    return respond(false, "Erreur: " + error.toString());
  }
}

function doPost(e) {
  try {
    const postData = e.postData.contents;
    const payload = JSON.parse(postData);
    const action = payload.action;
    
    if (action === 'upload') {
      return handleUpload(payload);
    } else {
      return respond(false, "Action inconnue");
    }
  } catch (error) {
    Logger.log("Erreur doPost: " + error);
    return respond(false, "Erreur: " + error.toString());
  }
}

// ============================================
// UPLOAD
// ============================================

function handleUpload(payload) {
  const category = payload.category;
  const date = payload.date;
  const fileName = payload.fileName;
  const fileData = payload.fileData;
  const description = payload.description || "";
  
  if (!category || !date || !fileName || !fileData) {
    return respond(false, "Paramètres manquants");
  }
  
  try {
    // 1. Créer le fichier Drive
    const driveFile = createFileInDrive(category, fileName, fileData);
    if (!driveFile) {
      return respond(false, "Erreur création fichier Drive");
    }
    
    // 2. Ajouter au Sheets
    addToSheet(category, fileName, date, description, driveFile.url, driveFile.id);
    
    // 3. Retourner succès
    return respond(true, "Document uploadé", {
      fileId: driveFile.id,
      fileUrl: driveFile.url
    });
    
  } catch (error) {
    Logger.log("Erreur upload: " + error);
    return respond(false, "Erreur: " + error.toString());
  }
}

// ============================================
// HELPERS
// ============================================

function createFileInDrive(category, fileName, fileDataBase64) {
  try {
    Logger.log("🔷 Début createFileInDrive");
    Logger.log("  Category: " + category);
    Logger.log("  FileName: " + fileName);
    Logger.log("  FileData size: " + (fileDataBase64 ? fileDataBase64.length : 0));
    
    // Décoder le fichier
    Logger.log("🔷 Décodage base64...");
    const decodedData = Utilities.base64Decode(fileDataBase64);
    Logger.log("  Decoded size: " + decodedData.length);
    
    // Créer le blob
    Logger.log("🔷 Création du blob...");
    const mimeType = getMimeType(fileName);
    Logger.log("  MIME type: " + mimeType);
    const fileBlob = Utilities.newBlob(decodedData, mimeType, fileName);
    Logger.log("  Blob créé ✓");
    
    // Accéder au dossier parent
    Logger.log("🔷 Accès au dossier parent...");
    Logger.log("  FOLDER_ID: " + CONFIG.DRIVE_FOLDER_ID);
    const parentFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    Logger.log("  Dossier parent: " + parentFolder.getName());
    
    // Trouver/créer le dossier de catégorie
    Logger.log("🔷 Recherche dossier catégorie...");
    const folderName = getCategoryFolderName(category);
    Logger.log("  Cherchant: " + folderName);
    
    const folders = parentFolder.getFoldersByName(folderName);
    const folder = folders.hasNext() ? folders.next() : parentFolder.createFolder(folderName);
    Logger.log("  Dossier trouvé/créé: " + folder.getName());
    
    // Créer le fichier
    Logger.log("🔷 Création du fichier...");
    const file = folder.createFile(fileBlob);
    Logger.log("  Fichier créé: " + file.getName());
    
    // Partager publiquement
    Logger.log("🔷 Partage publique...");
    file.setSharing(DriveApp.Access.READER, DriveApp.Permission.ANYONE);
    Logger.log("  Partage ✓");
    
    Logger.log("✅ Fichier créé avec succès!");
    return {
      id: file.getId(),
      url: file.getUrl()
    };
  } catch (error) {
    Logger.log("❌ Erreur createFileInDrive:");
    Logger.log("  " + error.toString());
    Logger.log("  Stack: " + error.stack);
    return null;
  }
}

function addToSheet(category, fileName, date, description, fileUrl, fileId) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.SHEET_NAME);
    sheet.appendRow([
      getCategoryFolderName(category),
      fileName,
      date,
      description,
      fileUrl,
      fileId
    ]);
  } catch (error) {
    Logger.log("Erreur Sheets: " + error);
  }
}

function getCategoryFolderName(category) {
  const names = {
    'photo': '📸 Photos',
    'plan': '📐 Plans',
    'doc': '✅ Documents'
  };
  return names[category] || category;
}

function getMimeType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  const types = {
    'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif',
    'pdf': 'application/pdf', 'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  return types[ext] || 'application/octet-stream';
}

function respond(success, message, data = {}) {
  const response = {
    success: success,
    message: message,
    ...data
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// TEST - Forcer les permissions Drive
// ============================================

function testPermissions() {
  try {
    // Essayer d'accéder à Drive
    const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    const name = folder.getName();
    
    Logger.log("✅ Permissions Drive OK");
    Logger.log("Dossier parent: " + name);
    
    return "Permissions Drive confirmées ✅";
  } catch (error) {
    Logger.log("❌ Erreur permissions: " + error);
    return "Erreur: " + error.toString();
  }
}
