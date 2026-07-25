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
    const fileBlob = Utilities.newBlob(
      Utilities.base64Decode(fileDataBase64),
      getMimeType(fileName),
      fileName
    );
    
    const parentFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    const folderName = getCategoryFolderName(category);
    
    // Trouver ou créer le dossier de catégorie
    const folders = parentFolder.getFoldersByName(folderName);
    const folder = folders.hasNext() ? folders.next() : parentFolder.createFolder(folderName);
    
    // Créer le fichier
    const file = folder.createFile(fileBlob);
    file.setSharing(DriveApp.Access.READER, DriveApp.Permission.ANYONE);
    
    return {
      id: file.getId(),
      url: file.getUrl()
    };
  } catch (error) {
    Logger.log("Erreur Drive: " + error);
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
