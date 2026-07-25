const CONFIG = {
  SHEET_ID: "19EpiDMC4QHPOJN3afRYIzq5GmsEBTrTpqtxL3oNR2HM",
  DRIVE_FOLDER_ID: "1uPol8K9ZzJgf_cRB-mT_0QpqB_ZnEuka"
};

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName("Feuille 1");
    const data = sheet.getDataRange().getValues();
    
    const docs = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][1]) {
        docs.push({
          cat: data[i][0],
          name: data[i][1],
          date: data[i][2],
          desc: data[i][3],
          url: data[i][4],
          id: data[i][5]
        });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: docs
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: e.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    
    if (payload.action === "upload") {
      const cat = payload.category;
      const fileName = payload.fileName;
      const fileData = payload.fileData;
      const date = payload.date;
      const desc = payload.description || "";
      
      // Décoder et créer le fichier
      const blob = Utilities.newBlob(
        Utilities.base64Decode(fileData),
        getMimeType(fileName),
        fileName
      );
      
      // Accéder au dossier
      const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
      const catFolder = getCategoryFolder(folder, cat);
      const file = catFolder.createFile(blob);
      file.setSharing(DriveApp.Access.READER, DriveApp.Permission.ANYONE);
      
      // Ajouter au Sheets
      const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
      const sheet = ss.getSheetByName("Feuille 1");
      sheet.appendRow([
        getCategoryName(cat),
        fileName,
        date,
        desc,
        file.getUrl(),
        file.getId()
      ]);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        fileUrl: file.getUrl(),
        fileId: file.getId()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Action inconnue"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: e.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getCategoryFolder(parent, cat) {
  const name = getCategoryName(cat);
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parent.createFolder(name);
}

function getCategoryName(cat) {
  const names = {
    'photo': '📸 Photos',
    'plan': '📐 Plans',
    'doc': '✅ Documents'
  };
  return names[cat] || cat;
}

function getMimeType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  const types = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  return types[ext] || 'application/octet-stream';
}
