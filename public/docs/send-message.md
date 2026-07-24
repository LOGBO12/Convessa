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
| `to` | string | ✅ | Numéro destinataire, indicatif international, sans `+` (ex: `22960000000`) |
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

**202 Accepted**

```json
{
  "success": true,
  "sent": true,
  "from": "229****919",
  "to": "229****000",
  "message": "Votre commande est prête !",
  "hasMedia": false
}
```

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
