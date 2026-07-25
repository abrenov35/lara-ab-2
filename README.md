# 📋 LARA v2 - Gestion Documentaire de Chantier

Application web simple pour gérer les documents de chantier (photos, plans, documents).

## 🚀 Architecture

- **Frontend**: HTML/JS simple (GitHub Pages)
- **Backend**: Google Apps Script Web App
- **Database**: Google Sheets
- **Storage**: Google Drive

## 📋 Setup en 5 minutes

### 1. Google Apps Script Web App

1. Va à: `https://script.google.com`
2. Créer un **nouveau projet**
3. **Copie le contenu de `backend.gs`** et colle-le
4. Enregistre (Ctrl+S)
5. Clic **"Déployer"** → **"Nouvelle version"**
   - Type: Web App
   - Exécuter en tant que: Ton compte
   - Accès: Tout le monde
6. **Copie l'URL du Web App** (la longue URL en `/exec`)

### 2. Mettre à jour le frontend

1. Ouvre `index.html`
2. Cherche: `const WEB_APP_URL = "https://script.google.com/macros/s/PLACEHOLDER_URL/exec";`
3. **Remplace `PLACEHOLDER_URL`** par l'ID du Web App (la partie après `/s/` et avant `/exec`)
4. Sauvegarde

### 3. Pusher sur GitHub

```bash
git add -A
git commit -m "Initial LARA v2 setup"
git push
```

### 4. Activer GitHub Pages

1. Va sur GitHub: `https://github.com/abrenov35/lara-ab-2`
2. Settings → Pages
3. Source: Deploy from a branch
4. Branch: main
5. Folder: / (root)
6. Clique **"Save"**

### 5. Accès

- Frontend: `https://abrenov35.github.io/lara-ab-2/`
- Google Sheets: `https://docs.google.com/spreadsheets/d/19EpiDMC4QHPOJN3afRYIzq5GmsEBTrTpqtxL3oNR2HM/`

## 📝 Configuration

IDs utilisés (voir `backend.gs`):

```
SHEET_ID: 19EpiDMC4QHPOJN3afRYIzq5GmsEBTrTpqtxL3oNR2HM
DRIVE_FOLDER_ID: 1uPol8K9ZzJgf_cRB-mT_0QpqB_ZnEuka
SHEET_NAME: Feuille 1
```

## 🎯 Fonctionnalités

✅ Upload de fichiers (photos, plans, documents)
✅ Catégorisation automatique
✅ Affichage en liste
✅ Aperçu direct (Google Drive Viewer)
✅ Suppression locale
✅ localStorage backup

## 🔧 Développement

### Logs du Web App

Va à: `https://script.google.com` → Ouvre le projet → Onglet "Exécution"

### Tester le GET

```bash
curl "https://script.google.com/macros/s/[YOUR_URL]/exec"
```

### Tester le POST

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"action":"upload","category":"photo","fileName":"test.jpg","date":"2025-01-25","description":"Test","fileData":"...base64..."}' \
  "https://script.google.com/macros/s/[YOUR_URL]/exec"
```

## 📊 Structure Sheets

Colonnes (ligne 1):
- A: Catégorie (📸 Photos, 📐 Plans, ✅ Documents)
- B: Fichier (nom du fichier)
- C: Date (YYYY-MM-DD)
- D: Description
- E: Lien (URL Google Drive)
- F: ID (File ID)

## 🐛 Troubleshooting

### CORS Error

- Vérifier que le Web App est déployé en "Tout le monde"
- Vérifier le Content-Type JSON dans `respond()`

### "Erreur création fichier Drive"

- Vérifier que `DRIVE_FOLDER_ID` existe et est accessible
- Vérifier les permissions du Web App

### Documents vides

- Vérifier que le Sheets a des documents en ligne 2+
- Vérifier que la colonne B (Fichier) n'est pas vide

## 📦 Fichiers

- `index.html`: Frontend complet
- `backend.gs`: Code Google Apps Script
- `README.md`: Ce fichier
- `.nojekyll`: Fichier pour GitHub Pages

---

Fait avec ❤️ pour AB RENOV 35
