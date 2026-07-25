const SHEET = "19EpiDMC4QHPOJN3afRYIzq5GmsEBTrTpqtxL3oNR2HM";
const FOLDER = "1uPol8K9ZzJgf_cRB-mT_0QpqB_ZnEuka";

function doGet(e) {
  try {
    let ss = SpreadsheetApp.openById(SHEET);
    let data = ss.getSheets()[0].getDataRange().getValues();
    let docs = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][1]) docs.push({cat: data[i][0], name: data[i][1], date: data[i][2], desc: data[i][3], url: data[i][4]});
    }
    return ContentService.createTextOutput(JSON.stringify({ok: true, data: docs})).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ok: false, msg: e.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    let p = JSON.parse(e.postData.contents);
    let blob = Utilities.newBlob(Utilities.base64Decode(p.file), "application/octet-stream", p.name);
    let folder = DriveApp.getFolderById(FOLDER);
    let subFolder = null;
    let folders = folder.getFoldersByName(p.cat);
    if (folders.hasNext()) {
      subFolder = folders.next();
    } else {
      subFolder = folder.createFolder(p.cat);
    }
    let file = subFolder.createFile(blob);
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (x) {}
    
    let ss = SpreadsheetApp.openById(SHEET);
    ss.getSheets()[0].appendRow([p.cat, p.name, p.date, p.desc, file.getUrl(), file.getId()]);
    
    return ContentService.createTextOutput(JSON.stringify({ok: true, url: file.getUrl()})).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ok: false, msg: e.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}
