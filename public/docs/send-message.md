# Envoyer un message

## Endpoint

```
POST /api/v1/send
```

## Authentification

| Header | Valeur |
|---|---|
| `X-Api-Key` | Votre clé API tenant (`pk_convessa_...`) |

## Corps de la requête

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `to` | string \| string[] | ✅ | Un numéro, un tableau de numéros (voir [Diffusion à plusieurs destinataires](#diffusion-à-plusieurs-destinataires)), ou un `groupId` (voir [Envoyer dans un groupe](/docs?section=groups)) |
| `message` | string | selon cas | Texte du message (max 4096 caractères) |
| `media` | object | selon cas | Voir [Envoyer un média](#envoyer-un-média) |

> La requête doit contenir au moins `message` ou `media`.

## Exemple — message texte

```bash
curl -X POST https://votre-domaine.com/api/v1/send \
  -H "X-Api-Key: pk_convessa_VOTRE_CLE" \
  -H "Content-Type: application/json" \
  -d '{ "to": "22960000000", "message": "Votre commande est prête !" }'
```

## Diffusion à plusieurs destinataires

Passez un tableau de numéros dans `to` : le même message est envoyé
individuellement à chacun (50 destinataires maximum par appel).

```bash
curl -X POST https://votre-domaine.com/api/v1/send \
  -H "X-Api-Key: pk_convessa_VOTRE_CLE" \
  -H "Content-Type: application/json" \
  -d '{
        "to": ["22960000000", "22961111111", "22962222222"],
        "message": "Notre boutique ouvre ce samedi !"
      }'
```

La réponse contient alors un `messageId` distinct par destinataire (voir
[Réponse](#réponse)) — chacun a son propre statut de livraison.

## Envoyer un média

Ajoutez l'objet `media` :

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `type` | string | ✅ | `image`, `video`, `audio` ou `document` |
| `mime` | string | ✅ | Type MIME exact (ex: `image/jpeg`) |
| `url` | string | soit url, soit base64 | URL publique du fichier |
| `base64` | string | soit url, soit base64 | Contenu encodé en base64 |
| `name` | string | optionnel | Nom de fichier (utile pour `document`) |

### Limites par type de média

| Type | Formats acceptés | Taille max |
|---|---|---|
| Image | JPEG, PNG | 5 MB |
| Vidéo | MP4 (H.264 + AAC) | 16 MB |
| Audio | MP3, M4A, OGG/Opus | 16 MB |
| Document | PDF, Word, Excel, PowerPoint, ZIP, TXT | 100 MB |

### Exemple — image par URL

```bash
curl -X POST https://votre-domaine.com/api/v1/send \
  -H "X-Api-Key: pk_convessa_VOTRE_CLE" \
  -H "Content-Type: application/json" \
  -d '{
        "to": "22960000000",
        "message": "Voici votre facture",
        "media": {
          "type": "document",
          "mime": "application/pdf",
          "url": "https://exemple.com/facture.pdf",
          "name": "facture.pdf"
        }
      }'
```

## Réponse

**202 Accepted** — accusé de réception, PAS la confirmation de livraison.

> ⚠️ **Important.** Cette réponse signifie seulement que le message a été
> accepté et qu'un envoi est en cours. Pour un média volumineux (vidéo,
> document), l'upload vers WhatsApp peut prendre plus de temps qu'un aller-
> retour HTTP habituel. Le statut réel (`sent` ou `failed`) arrive séparément
> — voir [Suivre le statut réel d'un envoi](#suivre-le-statut-réel-dun-envoi).
> Ne traitez jamais l'absence de confirmation immédiate comme un échec.

```json
{
  "success": true,
  "status": "queued",
  "from": "229****919",
  "messages": [
    { "to": "229...@s.whatsapp.net", "messageId": "b7e1...", "toType": "contact" }
  ],
  "messageId": "b7e1...",
  "to": "229...@s.whatsapp.net"
}
```

(`messageId`/`to` à la racine sont un raccourci pratique quand `to` était un
seul destinataire — `messages[]` est le format complet, toujours présent.)

## Suivre le statut réel d'un envoi

Trois façons complémentaires, à choisir selon votre intégration :

**1. Socket.io (recommandé pour une UI temps réel)**

Écoutez l'événement `message_status` :

```json
{ "tenantId": "...", "messageId": "b7e1...", "status": "sent", "to": "229...@s.whatsapp.net", "waMessageId": "3EB0..." }
```

`status` vaut `sent` ou `failed` (avec un champ `error` si échec).

**2. Webhook**

Si vous avez configuré `webhookUrl` sur votre session, Convessa POST automatiquement :

```json
{ "event": "message.sent", "messageId": "b7e1...", "tenantId": "...", "to": "...", "waMessageId": "3EB0..." }
```

(ou `"event": "message.failed"` avec un champ `error`.)

**3. Polling**

```
GET /api/v1/send/status/:messageId
```

```bash
curl https://votre-domaine.com/api/v1/send/status/b7e1... \
  -H "X-Api-Key: pk_convessa_VOTRE_CLE"
```

```json
{
  "success": true,
  "messageId": "b7e1...",
  "status": "sent",
  "to": "229...@s.whatsapp.net",
  "waMessageId": "3EB0...",
  "sentAt": "2026-07-25T10:00:03.000Z"
}
```

## Historique des envois

```
GET /api/v1/send/history?limit=50
```

Renvoie vos derniers messages (tous statuts confondus) — utile pour un tableau de bord ou un audit.

## Vérifier l'état de votre session

```
GET /api/v1/send/info
```

Utile pour savoir si votre session WhatsApp est bien connectée avant d'envoyer :

```bash
curl https://votre-domaine.com/api/v1/send/info \
  -H "X-Api-Key: pk_convessa_VOTRE_CLE"
```

```json
{
  "success": true,
  "tenantId": "...",
  "from": "229****919",
  "status": "connected",
  "connected": true,
  "connectedAt": "2026-07-20T10:00:00.000Z",
  "mediaLimits": { "...": "..." }
}
```

Pour la liste complète des erreurs possibles, voir [Gestion des erreurs](/docs?section=api-documentation).
