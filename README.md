# ErgoVoice-Todo

Application moderne de gestion de tâches avec contrôle vocal en français. Interface élégante et intuitive pour organiser vos tâches personnelles, professionnelles et académiques.

## 🚀 Fonctionnalités

- ✅ Gestion complète des tâches avec catégories (Perso, Travail, Études)
- 🎤 Contrôle vocal en français pour créer et gérer les tâches
- 📊 Statistiques en temps réel (total, actives, terminées, priorités)
- 🔍 Recherche et filtres avancés (par statut, catégorie, date)
- 📅 Dates d'échéance avec indicateurs visuels
- 🎨 Interface moderne et responsive

## 🛠️ Technologies

- React 18 + TypeScript
- Vite 6
- Tailwind CSS v4
- Web Speech API

## 📦 Installation

```bash
git clone https://github.com/moulla24/ErgoVoice-Todo.git
cd ergovoice-todo
npm install
```

## 🚀 Développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## 🏗️ Build

```bash
npm run build
npm run preview
```

## 📄 Structure du projet

```
src/
├── components/          # Composants React
│   ├── AddTaskModal.tsx
│   ├── FilterBar.tsx
│   ├── Header.tsx
│   ├── StatsPanel.tsx
│   ├── TaskItem.tsx
│   ├── TaskList.tsx
│   └── VoiceControlPanel.tsx
├── App.tsx              # Composant principal
├── main.tsx             # Point d'entrée
└── index.css            # Styles Tailwind
```

## 🎤 Contrôle vocal

1. Cliquez sur le bouton micro
2. Dites votre tâche
3. Validez et indiquez priorité/catégorie

**Commandes vocales :**
- "Coche [titre]" - Marquer comme terminée
- "Supprime les tâches terminées"
- "Affiche les tâches d'aujourd'hui"
- "Trier par priorité"

## 🚀 Déploiement sur Vercel

1. Connectez votre repository GitHub à Vercel
2. Vercel détectera automatiquement Vite
3. Cliquez sur "Deploy"

**Via CLI :**
```bash
npm i -g vercel
vercel login
vercel --prod
```

## 📡 Backend API

Documentation complète disponible dans [`BACKEND_API.md`](./BACKEND_API.md)

## ⚠️ Notes importantes

- HTTPS requis pour la reconnaissance vocale en production
- Autorisation microphone nécessaire
- Navigateurs supportés : Chrome, Edge, Safari
- Stockage actuel : localStorage

## 🐛 Dépannage

**Build échoue :** Vérifiez que `npm run build` fonctionne localement

**Reconnaissance vocale :** Vérifiez HTTPS et autorisation microphone

## 📞 Support

- Documentation Vercel : [vercel.com/docs](https://vercel.com/docs)
- Documentation API : [`BACKEND_API.md`](./BACKEND_API.md)

---

**Développé avec ❤️**
