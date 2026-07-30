# Référence API

Tous les endpoints d'envoi requièrent :

```
X-Api-Key: pk_convessa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
```

---

## Envoi

### POST /api/v1/send

Envoie un message texte et/ou un média à un ou plusieurs destinataires.

**Corps :**

| Champ | Type | Requis | Description |
|---|---|---|---|
| `to` | string ou string[] | Oui | Numéro(s) au format international, ou `groupId` |
| `message` | string | Selon cas | Texte — max 4096 caractères |
| `media` | object | Selon cas | Voir structure ci-dessous |

Au moins `message` ou `media` est requis. Maximum 50 destinataires dans un tableau `to`.

**Structure `media` :**

| Champ | Type | Requis |
|---|---|---|
| `type` | `image` / `video` / `audio` / `document` | Oui |
| `mime` | string | Oui |
| `url` | string | Soit `url`, soit `base64` |
| `base64` | string | Soit `url`, soit `base64` |
| `name` | string | Non |

**Réponse 202 :**

```json
{
  "success": true,
  "status": "queued",
  "from": "229xxxxxxxx",
  "messages": [
    { "to": "229xxxxxxxxx@s.whatsapp.net", "messageId": "uuid", "toType": "contact" }
  ],
  "messageId": "uuid",
  "to": "229xxxxxxxxx@s.whatsapp.net"
}
```

### GET /api/v1/send/info

Vérifie l'état de la session et retourne les limites média.

**Réponse 200 :**

```json
{
  "success": true,
  "tenantId": "uuid",
  "from": "229xxxxxxxx",
  "status": "connected",
  "connected": true,
  "connectedAt": "2026-07-20T10:00:00.000Z",
  "mediaLimits": {
    "image":    "JPEG, PNG — 5 MB max",
    "video":    "MP4 H.264/AAC — 16 MB max",
    "audio":    "MP3, M4A, OGG/Opus — 16 MB max",
    "document": "PDF, Word, Excel, ZIP, TXT — 100 MB max"
  }
}
```

### GET /api/v1/send/status/{messageId}

Retourne le statut d'un message.

**Réponse 200 :**

```json
{
  "success": true,
  "messageId": "uuid",
  "status": "sent",
  "to": "229xxxxxxxxx@s.whatsapp.net",
  "toType": "contact",
  "hasMedia": false,
  "errorCode": null,
  "errorMessage": null,
  "waMessageId": "3EB0xxxxxxxxxxxx",
  "createdAt": "2026-07-25T10:00:00.000Z",
  "sentAt": "2026-07-25T10:00:03.000Z"
}
```

Valeurs de `status` : `queued` · `sent` · `delivered` · `failed`

### GET /api/v1/send/history

Retourne l'historique des messages envoyés. Paramètre : `limit` (défaut 50, max 200).

**Réponse 200 :**

```json
{
  "success": true,
  "count": 50,
  "messages": [
    {
      "messageId": "uuid",
      "to": "229xxxxxxxxx@s.whatsapp.net",
      "toType": "contact",
      "status": "sent",
      "hasMedia": false,
      "errorCode": null,
      "createdAt": "...",
      "sentAt": "..."
    }
  ]
}
```

---

## Groupes

### POST /api/v1/groups

Crée un groupe ou retourne un groupe existant portant le même nom (idempotent par nom).

**Corps :** `{ "name": "string", "participants": ["229xxxxxxxxx"] }`

**Réponse 201 / 200 :**

```json
{
  "success": true,
  "created": true,
  "groupId": "uuid",
  "name": "Clients Premium",
  "addedDirectly": 5,
  "invitedByLink": 2,
  "message": "..."
}
```

### GET /api/v1/groups

Liste tous les groupes de la session.

### GET /api/v1/groups/{groupId}

Détail d'un groupe (nom, nombre de participants, code d'invitation).

### GET /api/v1/groups/{groupId}/invite

Génère ou retourne le lien d'invitation WhatsApp du groupe.

**Réponse :** `{ "success": true, "groupId": "...", "inviteLink": "https://chat.whatsapp.com/..." }`

### POST /api/v1/groups/{groupId}/participants

Ajoute des participants à un groupe existant.

**Corps :** `{ "participants": ["229xxxxxxxxx"] }`

---

## Session

Ces endpoints utilisent un Bearer token Firebase (`Authorization: Bearer {idToken}`).

### POST /api/v1/tenants

Crée une session WhatsApp.

**Corps (optionnel) :** `{ "name": "Mon bot", "webhookUrl": "https://..." }`

**Réponse 201 :**

```json
{
  "success": true,
  "tenantId": "uuid",
  "status": "pending_qr",
  "message": "Session en cours de démarrage. Appelez GET /api/v1/tenants/me/qr dans 3-5 secondes."
}
```

### GET /api/v1/tenants/me

Retourne les informations de votre session.

**Réponse 200 :**

```json
{
  "success": true,
  "tenantId": "uuid",
  "phone": "229xxxxxxxx",
  "status": "connected",
  "apiKeyHint": "pk_convessa_xxxx...",
  "apiKeyExpiresAt": "2026-08-20T00:00:00.000Z",
  "connectedAt": "2026-07-20T10:00:00.000Z",
  "usageType": "requests",
  "messagesLimit": 500,
  "messagesSent": 47
}
```

### GET /api/v1/tenants/me/qr

Retourne le QR code à scanner (base64 PNG). À appeler 3 à 5 secondes après `POST /tenants`.

### POST /api/v1/tenants/me/activate

Génère la clé API après avoir scanné le QR code.

**Corps (optionnel) :** `{ "referralCode": "CODE" }`

**Réponse 200 :**

```json
{
  "success": true,
  "tenantId": "uuid",
  "apiKey": "pk_convessa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "apiKeyHint": "pk_convessa_xxxx...",
  "apiKeyExpiresAt": "2026-08-20T00:00:00.000Z"
}
```

### GET /api/v1/tenants/me/api-key

Récupère la clé API complète de votre session.

### DELETE /api/v1/tenants/me

Supprime votre session WhatsApp et révoque votre clé API.

---

## Plans

### GET /api/v1/plans

Liste les plans disponibles. Endpoint public, sans authentification.

**Réponse 200 :**

```json
{
  "success": true,
  "count": 3,
  "plans": [
    {
      "id": "uuid",
      "name": "Starter",
      "price": 0,
      "unlimited": false,
      "usageType": "requests",
      "usageValue": 500,
      "description": "Pour démarrer",
      "features": ["500 messages", "API REST"],
      "isPopular": false
    }
  ]
}
```
