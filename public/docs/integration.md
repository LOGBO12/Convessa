# Intégration

## Authentification

Chaque requête d'envoi doit inclure votre clé API dans le header :

```
X-Api-Key: pk_convessa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Ce header identifie votre session WhatsApp. L'expéditeur est automatiquement déduit de votre clé.

## Vérifier votre session

Avant tout envoi, vérifiez que votre session est active :

```
GET /api/v1/send/info
```

Réponse attendue :

```json
{
  "success": true,
  "from": "229xxxxxxxxx",
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

Si `connected` est `false`, reconnectez votre numéro depuis le tableau de bord.

## Variables d'environnement

Stockez votre clé dans une variable d'environnement. Ne la commitez jamais dans votre code source.

```bash
CONVESSA_API_KEY=pk_convessa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Exemples par langage

Tous les exemples ci-dessous couvrent les cas d'usage courants : message texte, médias, groupes, diffusion et suivi de statut.

### Node.js

```javascript
const API_KEY = process.env.CONVESSA_API_KEY;
const BASE    = process.env.CONVESSA_API_URL;

async function apiPost(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'X-Api-Key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? `Erreur ${res.status}`);
  return data;
}

async function apiGet(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { 'X-Api-Key': API_KEY } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? `Erreur ${res.status}`);
  return data;
}

// Message texte
await apiPost('/api/v1/send', { to: '229xxxxxxxxx', message: 'Votre commande a été confirmée.' });

// Image par URL
await apiPost('/api/v1/send', {
  to: '229xxxxxxxxx',
  message: 'Voici le plan.',
  media: { type: 'image', mime: 'image/jpeg', url: 'https://cdn.example.com/plan.jpg' },
});

// Document PDF
await apiPost('/api/v1/send', {
  to: '229xxxxxxxxx',
  message: 'Votre facture.',
  media: {
    type: 'document', mime: 'application/pdf',
    url: 'https://cdn.example.com/facture.pdf', name: 'facture.pdf',
  },
});

// Diffusion à plusieurs (max 50)
await apiPost('/api/v1/send', {
  to: ['229xxxxxxxxx', '229yyyyyyyyy', '229zzzzzzzzz'],
  message: 'Notre boutique est ouverte ce samedi.',
});

// Créer un groupe
const group = await apiPost('/api/v1/groups', {
  name: 'Clients Premium',
  participants: ['229xxxxxxxxx', '229yyyyyyyyy'],
});

// Envoyer dans un groupe
await apiPost('/api/v1/send', { to: group.groupId, message: 'Rappel : réunion demain.' });

// Vérifier le statut d'un message
const status = await apiGet(`/api/v1/send/status/${messageId}`);
console.log(status.status); // "sent" | "failed" | "queued"

// Historique des envois
const history = await apiGet('/api/v1/send/history?limit=50');
```

### Python

```python
import os
import requests

API_KEY = os.environ['CONVESSA_API_KEY']
BASE    = os.environ['CONVESSA_API_URL']
HEADERS = {'X-Api-Key': API_KEY, 'Content-Type': 'application/json'}

def api_post(path, body):
    r = requests.post(f'{BASE}{path}', headers=HEADERS, json=body, timeout=30)
    r.raise_for_status()
    return r.json()

def api_get(path):
    r = requests.get(f'{BASE}{path}', headers={'X-Api-Key': API_KEY}, timeout=30)
    r.raise_for_status()
    return r.json()

# Message texte
api_post('/api/v1/send', {'to': '229xxxxxxxxx', 'message': 'Votre commande a été confirmée.'})

# Image
api_post('/api/v1/send', {
    'to': '229xxxxxxxxx',
    'media': {'type': 'image', 'mime': 'image/jpeg', 'url': 'https://cdn.example.com/plan.jpg'},
})

# Document PDF
api_post('/api/v1/send', {
    'to': '229xxxxxxxxx',
    'message': 'Votre facture.',
    'media': {
        'type': 'document', 'mime': 'application/pdf',
        'url': 'https://cdn.example.com/facture.pdf', 'name': 'facture.pdf',
    },
})

# Diffusion
api_post('/api/v1/send', {
    'to': ['229xxxxxxxxx', '229yyyyyyyyy'],
    'message': 'Notre boutique est ouverte ce samedi.',
})

# Créer un groupe
group = api_post('/api/v1/groups', {
    'name': 'Clients Premium',
    'participants': ['229xxxxxxxxx'],
})

# Envoyer dans le groupe
api_post('/api/v1/send', {'to': group['groupId'], 'message': 'Rappel : réunion demain.'})

# Statut
status = api_get(f'/api/v1/send/status/{message_id}')
print(status['status'])  # "sent" | "failed"
```

### PHP

```php
<?php

$apiKey = getenv('CONVESSA_API_KEY');
$base   = getenv('CONVESSA_API_URL');

function convessa(string $method, string $path, ?array $body = null): array
{
    global $apiKey, $base;
    $ch = curl_init("$base$path");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => ["X-Api-Key: $apiKey", 'Content-Type: application/json'],
        CURLOPT_POSTFIELDS     => $body ? json_encode($body) : null,
        CURLOPT_TIMEOUT        => 30,
    ]);
    $resp   = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $data = json_decode($resp, true);
    if ($status >= 400) throw new RuntimeException($data['error']['message'] ?? "Erreur $status");
    return $data;
}

// Message texte
convessa('POST', '/api/v1/send', ['to' => '229xxxxxxxxx', 'message' => 'Commande confirmée.']);

// Document PDF
convessa('POST', '/api/v1/send', [
    'to'    => '229xxxxxxxxx',
    'media' => [
        'type' => 'document', 'mime' => 'application/pdf',
        'url'  => 'https://cdn.example.com/facture.pdf', 'name' => 'facture.pdf',
    ],
]);

// Diffusion
convessa('POST', '/api/v1/send', [
    'to'      => ['229xxxxxxxxx', '229yyyyyyyyy'],
    'message' => 'Ouverture samedi !',
]);

// Groupe
$group   = convessa('POST', '/api/v1/groups', ['name' => 'VIP', 'participants' => ['229xxxxxxxxx']]);
$groupId = $group['groupId'];
convessa('POST', '/api/v1/send', ['to' => $groupId, 'message' => 'Rappel réunion.']);

// Laravel (Http facade)
// Http::withHeaders(['X-Api-Key' => config('services.convessa.key')])
//     ->post(config('services.convessa.url').'/api/v1/send',
//            ['to' => '229xxxxxxxxx', 'message' => 'Bonjour !']);
```

### Java

```java
import java.net.http.*;
import java.net.URI;

public class ConvessaClient {
    private static final String BASE    = System.getenv("CONVESSA_API_URL");
    private static final String API_KEY = System.getenv("CONVESSA_API_KEY");
    private final HttpClient http = HttpClient.newHttpClient();

    private String post(String path, String json) throws Exception {
        var req = HttpRequest.newBuilder()
            .uri(URI.create(BASE + path))
            .header("X-Api-Key", API_KEY)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();
        var res = http.send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() >= 400) throw new RuntimeException("API: " + res.body());
        return res.body();
    }

    private String get(String path) throws Exception {
        var req = HttpRequest.newBuilder()
            .uri(URI.create(BASE + path))
            .header("X-Api-Key", API_KEY)
            .GET().build();
        return http.send(req, HttpResponse.BodyHandlers.ofString()).body();
    }

    public void examples() throws Exception {
        // Texte
        post("/api/v1/send",
            "{\"to\":\"229xxxxxxxxx\",\"message\":\"Commande confirmée.\"}");

        // Document
        post("/api/v1/send",
            "{\"to\":\"229xxxxxxxxx\",\"media\":{\"type\":\"document\"," +
            "\"mime\":\"application/pdf\",\"url\":\"https://cdn.example.com/facture.pdf\"," +
            "\"name\":\"facture.pdf\"}}");

        // Statut
        get("/api/v1/send/status/votre-message-id");
    }
}
```

### C#

```csharp
using System.Net.Http.Json;

public class ConvessaClient
{
    private static readonly string Base   = Environment.GetEnvironmentVariable("CONVESSA_API_URL")!;
    private static readonly string ApiKey = Environment.GetEnvironmentVariable("CONVESSA_API_KEY")!;
    private readonly HttpClient _http;

    public ConvessaClient(HttpClient http)
    {
        _http = http;
        _http.DefaultRequestHeaders.Add("X-Api-Key", ApiKey);
    }

    public Task<object?> SendTextAsync(string to, string message) =>
        PostAsync("/api/v1/send", new { to, message });

    public Task<object?> SendDocumentAsync(string to, string pdfUrl, string name) =>
        PostAsync("/api/v1/send", new {
            to,
            media = new { type = "document", mime = "application/pdf", url = pdfUrl, name },
        });

    public Task<object?> BroadcastAsync(string[] recipients, string message) =>
        PostAsync("/api/v1/send", new { to = recipients, message });

    public Task<object?> CreateGroupAsync(string name, string[] participants) =>
        PostAsync("/api/v1/groups", new { name, participants });

    public Task<object?> SendToGroupAsync(string groupId, string message) =>
        PostAsync("/api/v1/send", new { to = groupId, message });

    public async Task<object?> GetStatusAsync(string messageId)
    {
        var res = await _http.GetAsync($"{Base}/api/v1/send/status/{messageId}");
        return await res.Content.ReadFromJsonAsync<object>();
    }

    private async Task<object?> PostAsync(string path, object body)
    {
        var res = await _http.PostAsJsonAsync($"{Base}{path}", body);
        res.EnsureSuccessStatusCode();
        return await res.Content.ReadFromJsonAsync<object>();
    }
}
```
