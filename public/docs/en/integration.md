# Integration

## Authentication

Every send request must include your API key in the header:

```
X-Api-Key: pk_convessa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

This header identifies your WhatsApp session. The sender is automatically deduced from your key.

## Checking your session

Before sending anything, check that your session is active:

```
GET /api/v1/send/info
```

Expected response:

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

If `connected` is `false`, reconnect your number from the dashboard.

## Environment variables

Store your key in an environment variable. Never commit it to your source code.

```bash
CONVESSA_API_KEY=pk_convessa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Examples by language

All the examples below cover common use cases: text message, media, groups, broadcasting, and status tracking.

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
  if (!res.ok) throw new Error(data.error?.message ?? `Error ${res.status}`);
  return data;
}

async function apiGet(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { 'X-Api-Key': API_KEY } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? `Error ${res.status}`);
  return data;
}

// Text message
await apiPost('/api/v1/send', { to: '229xxxxxxxxx', message: 'Your order has been confirmed.' });

// Image by URL
await apiPost('/api/v1/send', {
  to: '229xxxxxxxxx',
  message: 'Here is the map.',
  media: { type: 'image', mime: 'image/jpeg', url: 'https://cdn.example.com/plan.jpg' },
});

// PDF document
await apiPost('/api/v1/send', {
  to: '229xxxxxxxxx',
  message: 'Your invoice.',
  media: {
    type: 'document', mime: 'application/pdf',
    url: 'https://cdn.example.com/invoice.pdf', name: 'invoice.pdf',
  },
});

// Broadcast to several recipients (max 50)
await apiPost('/api/v1/send', {
  to: ['229xxxxxxxxx', '229yyyyyyyyy', '229zzzzzzzzz'],
  message: 'Our shop is open this Saturday.',
});

// Create a group
const group = await apiPost('/api/v1/groups', {
  name: 'Premium Customers',
  participants: ['229xxxxxxxxx', '229yyyyyyyyy'],
});

// Send to a group
await apiPost('/api/v1/send', { to: group.groupId, message: 'Reminder: meeting tomorrow.' });

// Check a message's status
const status = await apiGet(`/api/v1/send/status/${messageId}`);
console.log(status.status); // "sent" | "failed" | "queued"

// Sending history
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

# Text message
api_post('/api/v1/send', {'to': '229xxxxxxxxx', 'message': 'Your order has been confirmed.'})

# Image
api_post('/api/v1/send', {
    'to': '229xxxxxxxxx',
    'media': {'type': 'image', 'mime': 'image/jpeg', 'url': 'https://cdn.example.com/plan.jpg'},
})

# PDF document
api_post('/api/v1/send', {
    'to': '229xxxxxxxxx',
    'message': 'Your invoice.',
    'media': {
        'type': 'document', 'mime': 'application/pdf',
        'url': 'https://cdn.example.com/invoice.pdf', 'name': 'invoice.pdf',
    },
})

# Broadcast
api_post('/api/v1/send', {
    'to': ['229xxxxxxxxx', '229yyyyyyyyy'],
    'message': 'Our shop is open this Saturday.',
})

# Create a group
group = api_post('/api/v1/groups', {
    'name': 'Premium Customers',
    'participants': ['229xxxxxxxxx'],
})

# Send to the group
api_post('/api/v1/send', {'to': group['groupId'], 'message': 'Reminder: meeting tomorrow.'})

# Status
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
    if ($status >= 400) throw new RuntimeException($data['error']['message'] ?? "Error $status");
    return $data;
}

// Text message
convessa('POST', '/api/v1/send', ['to' => '229xxxxxxxxx', 'message' => 'Order confirmed.']);

// PDF document
convessa('POST', '/api/v1/send', [
    'to'    => '229xxxxxxxxx',
    'media' => [
        'type' => 'document', 'mime' => 'application/pdf',
        'url'  => 'https://cdn.example.com/invoice.pdf', 'name' => 'invoice.pdf',
    ],
]);

// Broadcast
convessa('POST', '/api/v1/send', [
    'to'      => ['229xxxxxxxxx', '229yyyyyyyyy'],
    'message' => 'Opening Saturday!',
]);

// Group
$group   = convessa('POST', '/api/v1/groups', ['name' => 'VIP', 'participants' => ['229xxxxxxxxx']]);
$groupId = $group['groupId'];
convessa('POST', '/api/v1/send', ['to' => $groupId, 'message' => 'Meeting reminder.']);

// Laravel (Http facade)
// Http::withHeaders(['X-Api-Key' => config('services.convessa.key')])
//     ->post(config('services.convessa.url').'/api/v1/send',
//            ['to' => '229xxxxxxxxx', 'message' => 'Hello!']);
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
        // Text
        post("/api/v1/send",
            "{\"to\":\"229xxxxxxxxx\",\"message\":\"Order confirmed.\"}");

        // Document
        post("/api/v1/send",
            "{\"to\":\"229xxxxxxxxx\",\"media\":{\"type\":\"document\"," +
            "\"mime\":\"application/pdf\",\"url\":\"https://cdn.example.com/invoice.pdf\"," +
            "\"name\":\"invoice.pdf\"}}");

        // Status
        get("/api/v1/send/status/your-message-id");
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
