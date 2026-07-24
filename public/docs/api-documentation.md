# Documentation API Convessa

## Introduction

Convessa vous permet d'envoyer des messages WhatsApp via une API REST simple et puissante. Cette documentation vous guide dans l'intégration de l'API dans votre application.

## Ce que vous avez reçu après inscription

### Clé API Unique

Après avoir connecté votre WhatsApp, vous avez reçu une **clé API unique** de la forme :

```
wag_live_a3f8c2d1e9b4f7a0c5e2d8b1f6a3c9e4d7b0f2a5c8e1d4b7f0a3c6e9d2b5f8a1
```

### URL de Base

```
https://api.convessa.com   (ou http://localhost:3005 en local)
```

> ⚠️ **Important** : La clé n'est affichée qu'une seule fois au moment de la connexion. Stockez-la dans les variables d'environnement de votre application, jamais dans le code source.

---

## Comment ça marche

Vous envoyez une requête HTTP POST à notre service avec :
- Le numéro de téléphone du destinataire
- Le message à envoyer

Notre service envoie le message via **votre numéro WhatsApp** connecté au scan du QR.

```
Votre Application
      │
      │  POST /api/v1/messages/send
      │  X-Api-Key: wag_live_votre-cle
      │  { "to": "22994119476", "message": "..." }
      ▼
Convessa API
      │
      ▼
Destinataire reçoit le message
(depuis votre numéro connecté)
```

---

## Envoyer un message texte

### Requête

```http
POST https://api.convessa.com/api/v1/messages/send
Content-Type: application/json
X-Api-Key: wag_live_votre-cle
```

```json
{
  "to": "22994119476",
  "message": "Bonjour, votre commande est prête !"
}
```

> 📌 **Note** : Le numéro `to` doit inclure l'indicatif international, sans le `+`.  
> **Exemples** : `33612345678` (France), `22994119476` (Bénin), `12025550123` (USA)

### Réponse succès (202)

```json
{
  "success": true,
  "queued": true,
  "messageId": "550e8400-e29b-41d4-a716-446655440000",
  "position": 1
}
```

Conservez le `messageId` pour vérifier l'état de l'envoi.

---

## Vérifier le statut d'un message

```http
GET https://api.convessa.com/api/v1/messages/{messageId}
X-Api-Key: wag_live_votre-cle
```

### Réponse

```json
{
  "success": true,
  "messageId": "550e8400-...",
  "status": "sent",
  "to": "229XXXXX476",
  "sentAt": "2026-07-23T10:30:05.000Z",
  "attempts": 1
}
```

**Statuts possibles** : `queued` → `sending` → `sent` ou `failed`

---

## Envoyer un fichier (PDF, image, vidéo…)

### Exemple avec PDF

```json
{
  "to": "22994119476",
  "message": "Voici votre facture",
  "media": {
    "type": "document",
    "mime": "application/pdf",
    "name": "facture-2026-07.pdf",
    "base64": "JVBERi0xLjQK..."
  }
}
```

### Exemple avec Image

```json
{
  "to": "22994119476",
  "media": {
    "type": "image",
    "mime": "image/jpeg",
    "base64": "/9j/4AAQSkZJRgAB..."
  }
}
```

### Formats et limites

| Type | Formats | Taille max |
|---|---|---|
| `image` | JPEG, PNG | 5 MB |
| `video` | MP4 | 16 MB |
| `audio` | MP3, M4A, OGG | 16 MB |
| `document` | PDF, Word, Excel, PPT, ZIP, TXT | 100 MB |

---

## Exemples par langage

### Node.js / Express

```javascript
// .env : API_URL=http://... API_KEY=wag_live_...

async function sendWhatsApp(to, message) {
    const res = await fetch(`${process.env.API_URL}/api/v1/messages/send`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key':    process.env.API_KEY,
        },
        body: JSON.stringify({ to, message }),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error?.message)
    return data.messageId
}
```

### Python (Django / Flask)

```python
import os, requests

API_URL = os.environ['API_URL']
API_KEY = os.environ['API_KEY']

def send_whatsapp(to: str, message: str) -> str:
    resp = requests.post(
        f'{API_URL}/api/v1/messages/send',
        json={'to': to, 'message': message},
        headers={'X-Api-Key': API_KEY},
        timeout=10
    )
    resp.raise_for_status()
    return resp.json()['messageId']
```

### PHP (Laravel)

```php
// Config dans config/services.php
// 'whatsapp' => ['url' => env('API_URL'), 'key' => env('API_KEY')]

$response = Http::withHeaders(['X-Api-Key' => config('services.whatsapp.key')])
    ->post(config('services.whatsapp.url') . '/api/v1/messages/send', [
        'to'      => $user->phone,
        'message' => "Bonjour {$user->name}, votre commande est confirmée.",
    ]);

if ($response->successful()) {
    $messageId = $response->json('messageId');
}
```

### Java (Spring Boot)

```java
// application.properties : api.url=... api.key=wag_live_...

@Service
public class WhatsAppService {
    @Value("${api.url}")     private String apiUrl;
    @Value("${api.key}")     private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public String send(String to, String message) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Api-Key", apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = Map.of("to", to, "message", message);
        ResponseEntity<Map> resp = restTemplate.exchange(
            apiUrl + "/api/v1/messages/send",
            HttpMethod.POST,
            new HttpEntity<>(body, headers),
            Map.class
        );
        return (String) resp.getBody().get("messageId");
    }
}
```

### C# (.NET)

```csharp
// appsettings.json : "Api": { "Url": "...", "Key": "wag_live_..." }

public class WhatsAppService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;

    public WhatsAppService(HttpClient http, IConfiguration config)
    {
        _http   = http;
        _apiKey = config["Api:Key"]!;
        _http.BaseAddress = new Uri(config["Api:Url"]!);
    }

    public async Task<string> SendAsync(string to, string message)
    {
        _http.DefaultRequestHeaders.Remove("X-Api-Key");
        _http.DefaultRequestHeaders.Add("X-Api-Key", _apiKey);

        var resp = await _http.PostAsJsonAsync("/api/v1/messages/send",
            new { to, message });
        resp.EnsureSuccessStatusCode();

        var data = await resp.Content.ReadFromJsonAsync<JsonElement>();
        return data.GetProperty("messageId").GetString()!;
    }
}
```

---

## Variables d'environnement recommandées

Peu importe le langage, stockez toujours :

```env
API_URL=https://api.convessa.com
API_KEY=wag_live_a3f8c2d1e9b4f7a0...
```

**Ne mettez jamais la clé en dur dans le code source.**

---

## Erreurs courantes

| Erreur | Cause | Solution |
|---|---|---|
| `401 UNAUTHORIZED` | Clé API absente ou invalide | Vérifiez le header `X-Api-Key` |
| `400 VALIDATION_ERROR` | Numéro invalide | Numéro en chiffres uniquement, avec indicatif |
| `503 SERVICE_NOT_CONNECTED` | Votre WhatsApp est déconnecté | Reconnectez-vous depuis le dashboard |
| `404 PHONE_NOT_ON_WHATSAPP` | Destinataire n'a pas WhatsApp | Vérifiez le numéro |
| `429 RATE_LIMIT_EXCEEDED` | Trop de requêtes rapides | Ajoutez un délai entre les appels |

---

## Bonnes pratiques

1. **Stockez votre clé API de manière sécurisée**
   - Utilisez des variables d'environnement (`.env`)
   - Ne commitez jamais la clé dans votre repository

2. **Gérez les erreurs correctement**
   - Implémentez des retry avec backoff exponentiel
   - Loggez les erreurs pour debugging

3. **Respectez les limites de taux**
   - Ajoutez un délai entre les messages
   - Utilisez une file d'attente pour les envois en masse

4. **Validez les numéros de téléphone**
   - Format international sans `+`
   - Vérifiez que le numéro existe sur WhatsApp

5. **Monitorer vos envois**
   - Conservez les `messageId` retournés
   - Vérifiez régulièrement le statut des messages

---

## Support

Besoin d'aide ? Contactez-nous :

- **Email** : support@convessa.com
- **Documentation** : https://docs.convessa.com
- **Dashboard** : https://app.convessa.com

---

*Dernière mise à jour : 2026-07-23*
