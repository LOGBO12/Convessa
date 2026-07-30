# Envoi de messages

Tous les exemples requièrent le header `X-Api-Key` avec votre clé.

## Message texte

```
POST /api/v1/send
```

```json
{
  "to": "229xxxxxxxxx",
  "message": "Votre commande a été confirmée."
}
```

Réponse **202 Accepted** :

```json
{
  "success": true,
  "status": "queued",
  "from": "229xxxxxxxx",
  "messageId": "b7e1f3a2-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "to": "229xxxxxxxxx@s.whatsapp.net",
  "messages": [
    { "to": "229xxxxxxxxx@s.whatsapp.net", "messageId": "b7e1f3a2-...", "toType": "contact" }
  ]
}
```

Le code `202` signifie que le message est accepté et en cours d'envoi. Le champ `messageId` permet de suivre le statut réel.

## Diffusion à plusieurs destinataires

Passez un tableau dans `to` pour envoyer le même message à plusieurs contacts. Chaque destinataire reçoit un message individuel. Maximum 50 destinataires par appel.

```json
{
  "to": ["229xxxxxxxxx", "229yyyyyyyyy", "229zzzzzzzzz"],
  "message": "Notre boutique est ouverte ce samedi de 9h à 18h."
}
```

La réponse contient un `messageId` distinct pour chaque destinataire dans le tableau `messages`.

## Envoyer dans un groupe

Utilisez le `groupId` (UUID retourné par `POST /api/v1/groups`) à la place d'un numéro :

```json
{
  "to": "e3c1f9a0-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "message": "Rappel : réunion demain à 9h."
}
```

## Envoi avec média

Ajoutez l'objet `media` à votre requête. Vous pouvez combiner texte et média.

Champs de l'objet `media` :

| Champ | Type | Requis | Description |
|---|---|---|---|
| `type` | string | Oui | `image`, `video`, `audio` ou `document` |
| `mime` | string | Oui | Type MIME exact du fichier |
| `url` | string | Soit `url` soit `base64` | URL publique accessible |
| `base64` | string | Soit `url` soit `base64` | Contenu encodé en base64 |
| `name` | string | Non | Nom du fichier (recommandé pour `document`) |

### Limites par type

| Type | Formats | Taille max |
|---|---|---|
| `image` | JPEG, PNG | 5 MB |
| `video` | MP4 (H.264, audio AAC) | 16 MB |
| `audio` | MP3, M4A, OGG, Opus | 16 MB |
| `document` | PDF, Word, Excel, PowerPoint, ZIP, TXT | 100 MB |

### Image par URL

```json
{
  "to": "229xxxxxxxxx",
  "message": "Voici le plan de livraison.",
  "media": {
    "type": "image",
    "mime": "image/jpeg",
    "url": "https://cdn.example.com/carte.jpg"
  }
}
```

### Document PDF par URL

```json
{
  "to": "229xxxxxxxxx",
  "message": "Votre facture est en pièce jointe.",
  "media": {
    "type": "document",
    "mime": "application/pdf",
    "url": "https://cdn.example.com/facture.pdf",
    "name": "facture-2026.pdf"
  }
}
```

### Document par base64

```json
{
  "to": "229xxxxxxxxx",
  "media": {
    "type": "document",
    "mime": "application/pdf",
    "base64": "JVBERi0xLjQKJeLjz9MKN...",
    "name": "rapport.pdf"
  }
}
```

## Suivi du statut

Le statut réel d'un message arrive après la réponse `202`. Trois méthodes disponibles.

### Polling

```
GET /api/v1/send/status/{messageId}
```

```json
{
  "success": true,
  "messageId": "b7e1f3a2-...",
  "status": "sent",
  "to": "229xxxxxxxxx@s.whatsapp.net",
  "toType": "contact",
  "hasMedia": false,
  "waMessageId": "3EB0xxxxxxxxxxxx",
  "createdAt": "2026-07-25T10:00:00.000Z",
  "sentAt": "2026-07-25T10:00:03.000Z"
}
```

Valeurs de `status` : `queued` · `sent` · `delivered` · `failed`

En cas d'échec, les champs `errorCode` et `errorMessage` sont présents.

### Webhook

Si vous avez configuré une URL webhook sur votre session, Convessa envoie automatiquement une requête POST à cette URL :

```json
{
  "event": "message.sent",
  "messageId": "b7e1f3a2-...",
  "tenantId": "...",
  "to": "229xxxxxxxxx@s.whatsapp.net",
  "waMessageId": "3EB0xxxxxxxxxxxx"
}
```

En cas d'échec :

```json
{
  "event": "message.failed",
  "messageId": "b7e1f3a2-...",
  "tenantId": "...",
  "to": "229xxxxxxxxx@s.whatsapp.net",
  "error": "Description de l'erreur"
}
```

### Socket.io

```javascript
import { io } from 'socket.io-client';

const socket = io(process.env.CONVESSA_API_URL);

socket.on('message_status', (data) => {
  // data: { messageId, status, to, waMessageId }
  console.log(data.messageId, data.status); // "sent" | "failed"
});
```

## Historique des envois

```
GET /api/v1/send/history?limit=50
```

Retourne vos derniers messages (max 200 par appel).

```json
{
  "success": true,
  "count": 3,
  "messages": [
    {
      "messageId": "b7e1f3a2-...",
      "to": "229xxxxxxxxx@s.whatsapp.net",
      "toType": "contact",
      "status": "sent",
      "hasMedia": false,
      "createdAt": "2026-07-25T10:00:00.000Z",
      "sentAt": "2026-07-25T10:00:03.000Z"
    }
  ]
}
```
