# 📡 Documentation API Backend - ErgoVoice-Todo

## 🎯 Vue d'ensemble

Ce document décrit toutes les APIs nécessaires pour le backend de l'application ErgoVoice-Todo. Chaque API est conçue pour assurer une **performance optimale** et une **compatibilité maximale** avec le frontend React.

---

## 🔐 Authentification & Sécurité

### Base URL
```
Production: https://api.ergovoice-todo.com/v1
Développement: http://localhost:3001/api/v1
```

### Headers requis
```http
Content-Type: application/json
Authorization: Bearer <token>
X-Request-ID: <uuid> (pour le tracking)
```

---

## 📋 1. Gestion des Tâches (Tasks)

### 1.1 GET `/tasks` - Récupérer toutes les tâches

**Rôle :** Récupère la liste complète des tâches de l'utilisateur avec support de filtrage, tri et recherche côté serveur.

**Paramètres de requête :**
```typescript
{
  filter?: 'all' | 'active' | 'completed' | 'today',  // Filtre par statut
  sortBy?: 'date' | 'priority' | 'category' | 'alphabetical',  // Tri
  search?: string,  // Recherche textuelle
  page?: number,  // Pagination (défaut: 1)
  limit?: number,  // Nombre d'éléments par page (défaut: 50, max: 100)
  category?: 'Perso' | 'Travail' | 'Études',  // Filtre par catégorie
  priority?: 'Haute' | 'Moyenne' | 'Basse'  // Filtre par priorité
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "title": "string",
        "description": "string | null",
        "completed": boolean,
        "category": "Perso" | "Travail" | "Études",
        "priority": "Haute" | "Moyenne" | "Basse",
        "dueDate": "ISO 8601 string | null",
        "createdAt": "ISO 8601 string",
        "updatedAt": "ISO 8601 string"
      }
    ],
    "pagination": {
      "page": number,
      "limit": number,
      "total": number,
      "totalPages": number
    }
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO 8601 string"
  }
}
```

**Performance :**
- ✅ Indexation DB sur `userId`, `completed`, `category`, `priority`, `dueDate`
- ✅ Cache Redis avec TTL de 30 secondes pour les requêtes fréquentes
- ✅ Pagination obligatoire pour éviter les surcharges
- ✅ Compression gzip activée

**Compatibilité :**
- ✅ Support des dates ISO 8601
- ✅ Gestion des valeurs null/undefined
- ✅ Validation stricte des enums

---

### 1.2 GET `/tasks/:id` - Récupérer une tâche spécifique

**Rôle :** Récupère les détails complets d'une tâche par son ID.

**Paramètres :**
- `id` (path) : UUID de la tâche

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "uuid",
      "title": "string",
      "description": "string | null",
      "completed": boolean,
      "category": "Perso" | "Travail" | "Études",
      "priority": "Haute" | "Moyenne" | "Basse",
      "dueDate": "ISO 8601 string | null",
      "createdAt": "ISO 8601 string",
      "updatedAt": "ISO 8601 string"
    }
  }
}
```

**Performance :**
- ✅ Cache Redis avec clé `task:{id}` (TTL: 60s)
- ✅ Vérification de propriété utilisateur avant retour

---

### 1.3 POST `/tasks` - Créer une nouvelle tâche

**Rôle :** Crée une nouvelle tâche avec validation complète des données.

**Body :**
```json
{
  "title": "string (requis, min: 1, max: 200)",
  "description": "string | null (max: 1000)",
  "category": "Perso" | "Travail" | "Études (défaut: 'Perso')",
  "priority": "Haute" | "Moyenne" | "Basse (défaut: 'Moyenne')",
  "dueDate": "ISO 8601 string | null"
}
```

**Réponse 201 :**
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "uuid",
      "title": "string",
      "description": "string | null",
      "completed": false,
      "category": "Perso" | "Travail" | "Études",
      "priority": "Haute" | "Moyenne" | "Basse",
      "dueDate": "ISO 8601 string | null",
      "createdAt": "ISO 8601 string",
      "updatedAt": "ISO 8601 string"
    }
  },
  "message": "Tâche créée avec succès"
}
```

**Performance :**
- ✅ Validation côté serveur avant insertion
- ✅ Transaction DB pour garantir l'intégrité
- ✅ Invalidation du cache utilisateur après création
- ✅ Retour immédiat avec données complètes (pas besoin de re-fetch)

**Compatibilité :**
- ✅ Génération UUID v4 pour les IDs
- ✅ Dates automatiques (createdAt, updatedAt)
- ✅ Valeurs par défaut pour catégorie et priorité

---

### 1.4 PATCH `/tasks/:id` - Mettre à jour une tâche

**Rôle :** Met à jour partiellement une tâche (PATCH pour updates partiels).

**Paramètres :**
- `id` (path) : UUID de la tâche

**Body (tous les champs sont optionnels) :**
```json
{
  "title": "string (min: 1, max: 200)",
  "description": "string | null (max: 1000)",
  "completed": boolean,
  "category": "Perso" | "Travail" | "Études",
  "priority": "Haute" | "Moyenne" | "Basse",
  "dueDate": "ISO 8601 string | null"
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "task": {
      // Objet tâche complet mis à jour
    }
  },
  "message": "Tâche mise à jour avec succès"
}
```

**Performance :**
- ✅ Update partiel (seuls les champs fournis sont modifiés)
- ✅ Vérification de propriété avant update
- ✅ Invalidation cache après modification
- ✅ Optimistic locking pour éviter les conflits

---

### 1.5 PUT `/tasks/:id/toggle` - Basculer le statut d'une tâche

**Rôle :** Endpoint spécialisé pour basculer rapidement le statut completed/active.

**Paramètres :**
- `id` (path) : UUID de la tâche

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "task": {
      // Objet tâche avec completed inversé
    },
    "wasCompleted": boolean,  // État précédent
    "isNowCompleted": boolean  // Nouvel état
  }
}
```

**Performance :**
- ✅ Update atomique (une seule opération DB)
- ✅ Retour immédiat pour feedback UI
- ✅ Cache invalidation ciblée

---

### 1.6 DELETE `/tasks/:id` - Supprimer une tâche

**Rôle :** Supprime définitivement une tâche.

**Paramètres :**
- `id` (path) : UUID de la tâche

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Tâche supprimée avec succès",
  "data": {
    "deletedId": "uuid"
  }
}
```

**Performance :**
- ✅ Soft delete optionnel (archivage) pour récupération
- ✅ Vérification de propriété avant suppression
- ✅ Invalidation cache immédiate

---

### 1.7 DELETE `/tasks/completed` - Supprimer toutes les tâches terminées

**Rôle :** Supprime en masse toutes les tâches complétées de l'utilisateur.

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "deletedCount": number,
    "deletedIds": ["uuid", ...]
  },
  "message": "X tâche(s) terminée(s) supprimée(s)"
}
```

**Performance :**
- ✅ Transaction DB pour atomicité
- ✅ Suppression en batch (efficace)
- ✅ Invalidation cache globale utilisateur

---

## 📊 2. Statistiques (Stats)

### 2.1 GET `/stats` - Récupérer les statistiques

**Rôle :** Récupère les statistiques agrégées des tâches de l'utilisateur.

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "total": number,
    "active": number,
    "completed": number,
    "completionRate": number,  // Pourcentage (0-100)
    "byCategory": {
      "Perso": { "total": number, "active": number, "completed": number },
      "Travail": { "total": number, "active": number, "completed": number },
      "Études": { "total": number, "active": number, "completed": number }
    },
    "byPriority": {
      "Haute": { "total": number, "active": number, "completed": number },
      "Moyenne": { "total": number, "active": number, "completed": number },
      "Basse": { "total": number, "active": number, "completed": number }
    },
    "overdue": number,  // Tâches en retard
    "dueToday": number,  // Tâches dues aujourd'hui
    "dueThisWeek": number  // Tâches dues cette semaine
  }
}
```

**Performance :**
- ✅ Cache Redis avec TTL de 60 secondes
- ✅ Calculs agrégés en DB (pas de traitement applicatif)
- ✅ Indexation sur `completed`, `category`, `priority`, `dueDate`
- ✅ Invalidation cache lors des modifications de tâches

**Compatibilité :**
- ✅ Calculs précis avec arrondi à 2 décimales
- ✅ Gestion des dates timezone-aware

---

## 🎤 3. Contrôle Vocal (Voice)

### 3.1 POST `/voice/process` - Traiter une commande vocale

**Rôle :** Traite une commande vocale en français et retourne une action structurée.

**Body :**
```json
{
  "transcript": "string (texte transcrit)",
  "language": "fr-FR" (défaut)
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "action": "create" | "toggle" | "delete" | "filter" | "sort" | "unknown",
    "confidence": number,  // 0-1
    "extractedData": {
      // Pour action: "create"
      "title": "string",
      "category": "Perso" | "Travail" | "Études" | null,
      "priority": "Haute" | "Moyenne" | "Basse" | null,
      
      // Pour action: "toggle"
      "taskTitle": "string",  // Titre recherché
      
      // Pour action: "filter"
      "filter": "all" | "active" | "completed" | "today",
      
      // Pour action: "sort"
      "sortBy": "date" | "priority" | "category" | "alphabetical"
    },
    "response": "string"  // Message vocal de confirmation
  }
}
```

**Performance :**
- ✅ Traitement NLP léger (regex + règles)
- ✅ Cache des patterns fréquents
- ✅ Timeout de 2 secondes max
- ✅ Rate limiting (10 req/min par utilisateur)

**Compatibilité :**
- ✅ Support des variantes linguistiques françaises
- ✅ Gestion des accents et fautes d'orthographe courantes
- ✅ Fallback sur patterns simples si NLP échoue

---

### 3.2 POST `/voice/validate-task` - Valider une tâche créée vocalement

**Rôle :** Valide et crée une tâche à partir des données extraites de la commande vocale.

**Body :**
```json
{
  "title": "string (requis)",
  "category": "Perso" | "Travail" | "Études",
  "priority": "Haute" | "Moyenne" | "Basse",
  "source": "voice"  // Indique l'origine
}
```

**Réponse 201 :**
```json
{
  "success": true,
  "data": {
    "task": {
      // Objet tâche complet
    },
    "voiceResponse": "string"  // Message de confirmation vocal
  }
}
```

**Performance :**
- ✅ Validation identique à POST `/tasks`
- ✅ Génération automatique de réponse vocale
- ✅ Logging pour amélioration NLP

---

## 🔍 4. Recherche & Filtres Avancés

### 4.1 GET `/tasks/search` - Recherche avancée

**Rôle :** Recherche full-text dans les tâches avec support de filtres multiples.

**Paramètres de requête :**
```typescript
{
  q: string,  // Requête de recherche (requis)
  category?: "Perso" | "Travail" | "Études",
  priority?: "Haute" | "Moyenne" | "Basse",
  completed?: boolean,
  dueDateFrom?: "ISO 8601",
  dueDateTo?: "ISO 8601",
  page?: number,
  limit?: number
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "tasks": [...],
    "pagination": {...},
    "searchMeta": {
      "query": "string",
      "totalMatches": number,
      "searchTime": number  // ms
    }
  }
}
```

**Performance :**
- ✅ Index full-text sur `title` et `description`
- ✅ Recherche avec ranking (pertinence)
- ✅ Limite de 100 résultats max
- ✅ Cache des recherches fréquentes (5 min TTL)

---

## 🔄 5. Synchronisation & Optimistic Updates

### 5.1 POST `/tasks/batch` - Opérations en batch

**Rôle :** Permet d'effectuer plusieurs opérations en une seule requête (pour sync offline).

**Body :**
```json
{
  "operations": [
    {
      "type": "create" | "update" | "delete",
      "id": "uuid (pour update/delete)",
      "data": { /* données de la tâche */ }
    }
  ]
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "operation": "create" | "update" | "delete",
        "success": boolean,
        "task": { /* tâche créée/mise à jour */ } | null,
        "error": "string | null"
      }
    ],
    "summary": {
      "total": number,
      "succeeded": number,
      "failed": number
    }
  }
}
```

**Performance :**
- ✅ Transaction DB pour atomicité
- ✅ Traitement parallèle des opérations indépendantes
- ✅ Rollback en cas d'erreur critique
- ✅ Limite de 50 opérations par batch

---

### 5.2 GET `/tasks/sync` - Synchronisation

**Rôle :** Récupère les modifications depuis une date donnée (pour sync incrémentale).

**Paramètres de requête :**
```typescript
{
  since: "ISO 8601 string",  // Date de dernière sync
  includeDeleted?: boolean  // Inclure les IDs supprimés
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "tasks": [...],  // Tâches modifiées/créées
    "deleted": ["uuid", ...],  // IDs supprimés
    "syncTimestamp": "ISO 8601 string"
  }
}
```

**Performance :**
- ✅ Requête optimisée avec index sur `updatedAt`
- ✅ Retour uniquement des changements
- ✅ Support des conflits de version

---

## 🚨 6. Gestion des Erreurs

### Format d'erreur standard

**Réponse 4xx/5xx :**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Message d'erreur lisible",
    "details": {},  // Détails optionnels
    "requestId": "uuid"
  },
  "meta": {
    "timestamp": "ISO 8601 string"
  }
}
```

### Codes d'erreur

- `VALIDATION_ERROR` (400) : Données invalides
- `UNAUTHORIZED` (401) : Token manquant/invalide
- `FORBIDDEN` (403) : Accès refusé (pas propriétaire)
- `NOT_FOUND` (404) : Ressource introuvable
- `CONFLICT` (409) : Conflit de version/modification
- `RATE_LIMIT_EXCEEDED` (429) : Trop de requêtes
- `INTERNAL_ERROR` (500) : Erreur serveur
- `SERVICE_UNAVAILABLE` (503) : Service temporairement indisponible

---

## ⚡ 7. Optimisations Performance

### 7.1 Caching Strategy

**Redis Cache :**
- Liste des tâches : TTL 30s
- Tâche individuelle : TTL 60s
- Statistiques : TTL 60s
- Recherches : TTL 5min

**Invalidation :**
- Automatique après CREATE/UPDATE/DELETE
- Pattern: `user:{userId}:tasks:*`

### 7.2 Pagination

- **Défaut :** 50 items par page
- **Maximum :** 100 items par page
- **Offset-based** pour compatibilité
- **Cursor-based** optionnel pour très grandes listes

### 7.3 Compression

- **Gzip** activé pour toutes les réponses > 1KB
- **Brotli** pour clients supportant

### 7.4 Rate Limiting

- **Général :** 100 req/min par utilisateur
- **Voice API :** 10 req/min par utilisateur
- **Search :** 30 req/min par utilisateur
- Headers de réponse : `X-RateLimit-*`

---

## 🔒 8. Sécurité & Compatibilité

### 8.1 Authentification

- **JWT** avec expiration 24h
- **Refresh token** avec rotation
- **HTTPS** obligatoire en production

### 8.2 Validation

- **Schema validation** (JSON Schema ou Zod)
- **Sanitization** des inputs (XSS protection)
- **Type checking** strict (TypeScript)

### 8.3 CORS

```http
Access-Control-Allow-Origin: https://ergovoice-todo.com
Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

### 8.4 Versioning

- **URL versioning :** `/api/v1/...`
- **Header versioning :** `X-API-Version: 1`
- **Support multi-versions** pendant transitions

---

## 📝 9. Standards & Conventions

### 9.1 Dates

- **Format :** ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- **Timezone :** UTC stocké, conversion côté client
- **Validation :** Rejet des dates invalides

### 9.2 IDs

- **Format :** UUID v4
- **Génération :** Côté serveur uniquement
- **Validation :** Format strict

### 9.3 Enums

- **Catégories :** `Perso`, `Travail`, `Études`
- **Priorités :** `Haute`, `Moyenne`, `Basse`
- **Validation :** Case-sensitive, rejet des valeurs invalides

---

## 🧪 10. Tests & Monitoring

### 10.1 Health Check

**GET `/health`**
```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "database": "connected" | "disconnected",
  "cache": "connected" | "disconnected",
  "uptime": number,
  "version": "string"
}
```

### 10.2 Monitoring

- **Logs structurés** (JSON)
- **Métriques Prometheus** (latence, erreurs, throughput)
- **Alerting** sur erreurs 5xx > 1%
- **Tracing** avec request IDs

---

## 📚 11. Documentation API

### 11.1 OpenAPI/Swagger

- **Endpoint :** `/api-docs`
- **Format :** OpenAPI 3.0
- **Exemples** inclus pour chaque endpoint

### 11.2 Postman Collection

- Collection Postman exportable
- Variables d'environnement
- Tests automatisés

---

## 🎯 12. Checklist d'Implémentation

### Backend Core
- [ ] Framework choisi (Express, Fastify, NestJS, etc.)
- [ ] Base de données configurée (PostgreSQL recommandé)
- [ ] Cache Redis configuré
- [ ] Authentification JWT implémentée
- [ ] Validation des schémas
- [ ] Gestion d'erreurs centralisée
- [ ] Logging structuré
- [ ] Rate limiting
- [ ] CORS configuré

### APIs
- [ ] CRUD tâches complet
- [ ] API statistiques
- [ ] API contrôle vocal
- [ ] API recherche
- [ ] API batch/sync
- [ ] Health check

### Performance
- [ ] Indexation DB optimale
- [ ] Cache Redis implémenté
- [ ] Pagination sur toutes les listes
- [ ] Compression activée
- [ ] Query optimization

### Sécurité
- [ ] Validation inputs
- [ ] Sanitization XSS
- [ ] HTTPS en production
- [ ] Rate limiting
- [ ] CORS restrictif

### Monitoring
- [ ] Logs structurés
- [ ] Métriques exposées
- [ ] Alerting configuré
- [ ] Health checks

---

## 📞 Support

Pour toute question sur l'implémentation de ces APIs, consultez :
- Documentation technique complète
- Exemples de code
- Tests d'intégration

---

**Version :** 1.0.0  
**Dernière mise à jour :** 2025-01-XX  
**Auteur :** Équipe ErgoVoice-Todo

