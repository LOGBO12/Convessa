# Erreurs et limites

## Format des erreurs

Toutes les erreurs retournées par l'API suivent le même format :

```json
{
  "success": false,
  "error": {
    "code": "CODE_ERREUR",
    "message": "Description de l'erreur"
  }
}
```

## Codes d'erreur

| Code HTTP | Code erreur | Cause | Action |
|---|---|---|---|
| 400 | `VALIDATION_ERROR` | Champ manquant ou invalide | Vérifiez le corps de la requête |
| 401 | `UNAUTHORIZED` | Header `X-Api-Key` absent | Ajoutez le header |
| 401 | `INVALID_API_KEY_FORMAT` | La clé ne commence pas par `pk_convessa_` | Vérifiez le format de votre clé |
| 401 | `INVALID_API_KEY` | Clé inconnue ou révoquée | Vérifiez votre clé dans le tableau de bord |
| 403 | `SESSION_NOT_ACTIVE` | Session déconnectée ou révoquée | Reconnectez-vous depuis le tableau de bord |
| 403 | `ACCESS_DENIED` | Quota atteint ou abonnement expiré | Renouvelez votre abonnement |
| 404 | `NOT_FOUND` | Ressource introuvable | Vérifiez l'identifiant fourni |
| 404 | `GROUP_NOT_FOUND` | Groupe inexistant sur votre session | Créez-le via `POST /groups` |
| 429 | `RATE_LIMIT_EXCEEDED` | Trop de requêtes | Attendez avant de renvoyer |
| 500 | `SEND_ERROR` | Erreur lors de l'envoi WhatsApp | Réessayez ; contactez le support si persistant |
| 503 | `SESSION_NOT_CONNECTED` | Session WhatsApp non connectée | Vérifiez `/send/info`, rescannez le QR si nécessaire |

## Limites de débit

Chaque adresse IP est limitée à **60 requêtes par minute** sur les endpoints sensibles (envoi de message, récupération de QR, création de session).

Au-delà, l'API retourne `429 RATE_LIMIT_EXCEEDED`. La fenêtre est glissante d'une minute.

Pour des envois en volume, espacez vos appels ou mettez en place une file d'attente côté client.

## Limites des médias

| Type | Formats | Taille maximale |
|---|---|---|
| Image | JPEG, PNG | 5 MB |
| Vidéo | MP4 (H.264 + AAC) | 16 MB |
| Audio | MP3, M4A, OGG, Opus | 16 MB |
| Document | PDF, Word, Excel, PowerPoint, ZIP, TXT | 100 MB |

Les fichiers en base64 augmentent la taille de ~33% par rapport au fichier original.

## Limites de diffusion

Un appel `POST /send` accepte au maximum **50 destinataires** dans le tableau `to`. Pour des volumes supérieurs, découpez vos envois en plusieurs appels.

## Limites des groupes

Un groupe WhatsApp peut contenir au maximum **256 participants**. Au-delà, les participants supplémentaires ne sont pas ajoutés.

## Bonnes pratiques

- Gérez `503 SESSION_NOT_CONNECTED` avec une nouvelle tentative après quelques secondes.
- Stockez les `messageId` retournés pour pouvoir interroger leur statut ultérieurement.
- Configurez un webhook pour éviter le polling systématique.
- Pour les envois transactionnels critiques, vérifiez toujours le statut final via webhook ou polling.
