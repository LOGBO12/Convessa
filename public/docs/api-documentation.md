# Documentation API

## Vue d'ensemble

Cette API vous permet d'envoyer des messages WhatsApp (texte et médias) depuis le numéro que vous avez connecté sur votre tableau de bord, en un seul appel HTTP.

- **Base URL** : `https://votre-domaine.com/api/v1`
- **Format** : JSON
- **Authentification** : header `X-Api-Key`

## Authentification

Chaque requête d'envoi doit inclure votre clé API dans le header :

```
X-Api-Key: pk_convessa_VOTRE_CLE
```

Cette clé identifie de façon unique votre session WhatsApp — inutile de préciser un expéditeur, il est déduit automatiquement de votre clé.

| Erreur | Code HTTP | Cause |
|---|---|---|
| `UNAUTHORIZED` | 401 | Header `X-Api-Key` manquant |
| `INVALID_API_KEY_FORMAT` | 401 | La clé ne commence pas par `pk_convessa_` |
| `INVALID_API_KEY` | 401 | Clé inconnue ou révoquée |
| `SESSION_NOT_ACTIVE` | 403 | Session déconnectée ou révoquée — reconnectez-vous depuis le dashboard |

## Endpoints

| Méthode | Endpoint | Description |
|---|---|---|
| `POST` | `/send` | Envoyer un message (texte et/ou média) |
| `GET` | `/send/info` | Vérifier l'état de votre session et vos limites média |

### POST /send

Voir la page dédiée [Envoyer un message](/docs?section=send-message) pour le détail complet des paramètres.

Résumé rapide :

```bash
curl -X POST https://votre-domaine.com/api/v1/send \
  -H "X-Api-Key: pk_convessa_VOTRE_CLE" \
  -H "Content-Type: application/json" \
  -d '{ "to": "22960000000", "message": "Bonjour !" }'
```

### GET /send/info

Retourne l'état actuel de votre session (utile pour un healthcheck avant envoi en masse) :

```json
{
  "success": true,
  "tenantId": "a1b2c3...",
  "from": "229****919",
  "status": "connected",
  "connected": true,
  "connectedAt": "2026-07-20T10:00:00.000Z",
  "mediaLimits": {
    "image":    "Image (JPEG, PNG — max 5 MB)",
    "video":    "Vidéo MP4 (H.264 + AAC — max 16 MB)",
    "audio":    "Audio MP3, M4A ou OGG/Opus (max 16 MB)",
    "document": "Document PDF, Word, Excel, PowerPoint, ZIP, TXT (max 100 MB)"
  }
}
```

## Gestion des erreurs

Toutes les erreurs suivent le même format :

```json
{
  "success": false,
  "error": {
    "code": "CODE_ERREUR",
    "message": "Description lisible de l'erreur"
  }
}
```

| Code HTTP | Code erreur | Signification | Action recommandée |
|---|---|---|---|
| 400 | `VALIDATION_ERROR` | Champ manquant ou mal formé (`to`, `message`, `media`) | Vérifiez le corps de la requête |
| 401 | `UNAUTHORIZED` / `INVALID_API_KEY` / `INVALID_API_KEY_FORMAT` | Clé API absente, invalide ou mal formée | Vérifiez le header `X-Api-Key` |
| 403 | `SESSION_NOT_ACTIVE` | Session déconnectée ou révoquée | Reconnectez votre WhatsApp depuis le dashboard |
| 429 | `RATE_LIMIT_EXCEEDED` | Trop de requêtes (max 60 / minute / IP) | Espacez vos appels ou mettez en file d'attente côté client |
| 500 | `SEND_ERROR` | Erreur lors de l'envoi effectif du message | Réessayez ; contactez le support si persistant |
| 503 | `SESSION_NOT_CONNECTED` | Session WhatsApp non connectée en temps réel | Vérifiez `/send/info`, rescannez le QR si besoin |

### Limite de débit

Chaque adresse IP peut effectuer **60 requêtes par minute** sur les endpoints sensibles (création de session, récupération de QR, envoi de message). Au-delà, l'API répond `429 RATE_LIMIT_EXCEEDED`.

## Exemples de code

### Node.js

```javascript
async function sendWhatsApp(to, message) {
  const res = await fetch('https://votre-domaine.com/api/v1/send', {
    method: 'POST',
    headers: {
      'X-Api-Key': process.env.CONVESSA_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to, message }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? 'Erreur envoi WhatsApp');
  }

  return res.json();
}

await sendWhatsApp('22960000000', 'Bonjour depuis Node.js !');
```

### Python

```python
import os
import requests

def send_whatsapp(to: str, message: str) -> dict:
    response = requests.post(
        "https://votre-domaine.com/api/v1/send",
        headers={"X-Api-Key": os.environ["CONVESSA_API_KEY"]},
        json={"to": to, "message": message},
        timeout=15,
    )
    response.raise_for_status()
    return response.json()

send_whatsapp("22960000000", "Bonjour depuis Python !")
```

### PHP / Laravel

```php
use Illuminate\Support\Facades\Http;

$response = Http::withHeaders([
    'X-Api-Key' => config('services.convessa.api_key'),
])->post('https://votre-domaine.com/api/v1/send', [
    'to'      => '22960000000',
    'message' => 'Bonjour depuis Laravel !',
]);

if ($response->failed()) {
    throw new \RuntimeException($response->json('error.message'));
}
```

### Java / Spring

```java
RestTemplate restTemplate = new RestTemplate();

HttpHeaders headers = new HttpHeaders();
headers.set("X-Api-Key", System.getenv("CONVESSA_API_KEY"));
headers.setContentType(MediaType.APPLICATION_JSON);

Map<String, String> body = Map.of(
    "to", "22960000000",
    "message", "Bonjour depuis Java !"
);

HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

ResponseEntity<String> response = restTemplate.postForEntity(
    "https://votre-domaine.com/api/v1/send", request, String.class
);
```

### C# / .NET

```csharp
using var client = new HttpClient();
client.DefaultRequestHeaders.Add("X-Api-Key", Environment.GetEnvironmentVariable("CONVESSA_API_KEY"));

var payload = new { to = "22960000000", message = "Bonjour depuis .NET !" };

var response = await client.PostAsJsonAsync(
    "https://votre-domaine.com/api/v1/send", payload
);

response.EnsureSuccessStatusCode();
```

## Bonnes pratiques

- Stockez votre clé API dans une variable d'environnement, jamais en dur dans le code.
- Gérez le code `503 SESSION_NOT_CONNECTED` avec une nouvelle tentative après quelques secondes (la reconnexion WhatsApp peut prendre un court instant).
- Pour un envoi en masse, espacez vos appels pour rester sous la limite de 60 requêtes/minute.
- N'envoyez qu'à des destinataires ayant consenti à recevoir vos messages — voir [Avertissements légaux](/docs?section=legal-warnings).
