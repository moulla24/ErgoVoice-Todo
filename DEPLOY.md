# Guide de déploiement sur Vercel

## ✅ Prérequis

- Compte GitHub, GitLab ou Bitbucket
- Compte Vercel (gratuit) : [vercel.com/signup](https://vercel.com/signup)
- Node.js installé localement (pour tester le build)

## 🚀 Déploiement en 5 étapes

### Étape 1 : Préparer le repository Git

```bash
# Initialiser Git si ce n'est pas déjà fait
git init

# Ajouter tous les fichiers
git add .

# Créer un commit
git commit -m "Initial commit - ErgoVoice Todo App"

# Créer un repository sur GitHub/GitLab/Bitbucket
# Puis connecter :
git remote add origin <URL_DE_VOTRE_REPO>
git push -u origin main
```

### Étape 2 : Tester le build localement

```bash
# Installer les dépendances
npm install

# Tester le build
npm run build

# Si le build réussit, vous êtes prêt !
```

### Étape 3 : Connecter à Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **"Sign Up"** ou **"Log In"**
3. Connectez-vous avec votre compte GitHub/GitLab/Bitbucket
4. Autorisez Vercel à accéder à vos repositories

### Étape 4 : Importer le projet

1. Dans le dashboard Vercel, cliquez sur **"Add New Project"**
2. Sélectionnez votre repository **ErgoVoice-Todo Interface Design**
3. Vercel détectera automatiquement :
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Étape 5 : Déployer

1. Vérifiez que les paramètres sont corrects :
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (racine du projet)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

2. Cliquez sur **"Deploy"**

3. Attendez 1-2 minutes pendant le déploiement

4. Une fois terminé, vous recevrez une URL comme : `https://votre-projet.vercel.app`

## 🔄 Déploiements automatiques

Vercel déploiera automatiquement :
- ✅ Chaque push sur `main` → Production
- ✅ Chaque pull request → Preview

## 🔧 Configuration personnalisée

Le fichier `vercel.json` est déjà configuré avec :
- ✅ Redirection SPA (toutes les routes → index.html)
- ✅ Configuration Vite
- ✅ Dossier de build : `dist`

## 🐛 Problèmes courants

### Build échoue
- Vérifiez que `npm run build` fonctionne localement
- Consultez les logs de build sur Vercel
- Vérifiez que toutes les dépendances sont dans `package.json`

### 404 sur les routes
- Le fichier `vercel.json` devrait résoudre ce problème
- Vérifiez que les rewrites sont bien configurés

### Microphone ne fonctionne pas
- HTTPS est requis pour la reconnaissance vocale
- Vercel fournit automatiquement HTTPS
- Vérifiez que l'utilisateur autorise le microphone dans le navigateur

## 📝 Commandes utiles

```bash
# Déployer via CLI (optionnel)
npm i -g vercel
vercel login
vercel --prod
```

## 🎉 C'est tout !

Votre application est maintenant en ligne et accessible via HTTPS.

