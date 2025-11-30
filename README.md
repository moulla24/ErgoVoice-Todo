
# ErgoVoice-Todo Interface Design

Application de gestion de tâches avec contrôle vocal en français. L'interface originale est disponible sur [Figma](https://www.figma.com/design/0ofG9caDkDmIQrZVzO7oG2/ErgoVoice-Todo-Interface-Design).

## 🚀 Fonctionnalités

- ✅ Gestion de tâches avec catégories (Perso, Travail, Études)
- 🎤 Contrôle vocal en français
- 📊 Statistiques et filtres
- 🎨 Interface moderne et responsive

## 📦 Installation

```bash
npm install
```

## 🛠️ Développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## 🏗️ Build

```bash
npm run build
```

Le build sera généré dans le dossier `dist/`

## 🚀 Déploiement sur Vercel

### Méthode 1 : Via l'interface Vercel (Recommandé)

1. **Préparer le projet**
   - Assurez-vous que tous les fichiers sont commités dans Git
   - Poussez votre code sur GitHub, GitLab ou Bitbucket

2. **Connecter à Vercel**
   - Allez sur [vercel.com](https://vercel.com)
   - Connectez-vous avec votre compte GitHub/GitLab/Bitbucket
   - Cliquez sur "Add New Project"
   - Importez votre repository

3. **Configuration automatique**
   - Vercel détectera automatiquement Vite
   - Les paramètres suivants seront utilisés automatiquement :
     - **Framework Preset**: Vite
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

4. **Déployer**
   - Cliquez sur "Deploy"
   - Vercel déploiera automatiquement votre application

### Méthode 2 : Via Vercel CLI

1. **Installer Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Se connecter**
   ```bash
   vercel login
   ```

3. **Déployer**
   ```bash
   vercel
   ```

4. **Déployer en production**
   ```bash
   vercel --prod
   ```

## 📝 Notes importantes

- ⚠️ **HTTPS requis** : La reconnaissance vocale nécessite HTTPS en production. Vercel fournit automatiquement HTTPS.
- 🎤 **Microphone** : L'application nécessite l'autorisation du microphone dans le navigateur.
- 🌐 **Navigateurs supportés** : Chrome, Edge, Safari (dernière version) pour la reconnaissance vocale.

## 🔧 Configuration

Le fichier `vercel.json` est déjà configuré pour :
- Rediriger toutes les routes vers `index.html` (SPA)
- Utiliser Vite comme framework
- Builder dans le dossier `dist`

## 📄 Structure du projet

```
├── src/
│   ├── components/      # Composants React
│   ├── styles/          # Styles globaux
│   ├── App.tsx          # Composant principal
│   └── main.tsx         # Point d'entrée
├── index.html           # HTML principal
├── vite.config.ts       # Configuration Vite
├── vercel.json          # Configuration Vercel
└── package.json         # Dépendances
```

## 🐛 Dépannage

Si le déploiement échoue :
1. Vérifiez que `npm run build` fonctionne localement
2. Vérifiez les logs de build sur Vercel
3. Assurez-vous que toutes les dépendances sont dans `package.json`

## 📞 Support

Pour toute question ou problème, consultez la documentation Vercel : [vercel.com/docs](https://vercel.com/docs)
