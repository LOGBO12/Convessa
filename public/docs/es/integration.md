# Integración

## Autenticación

Cada solicitud de envío debe incluir tu clave API en el encabezado:

```
X-Api-Key: pk_convessa_xxxxxx...xxxxxx
```

Este encabezado identifica tu sesión de WhatsApp. El remitente se deduce automáticamente de tu clave.

## Verificar tu sesión

Antes de cualquier envío, verifica que tu sesión esté activa:

```
GET /api/v1/send/info
```

Respuesta esperada:

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

Si `connected` es `false`, vuelve a conectar tu número desde el panel de control.

## Variables de entorno

Guarda tu clave en una variable de entorno. Nunca la subas a tu código fuente.

```bash
CONVESSA_API_KEY=pk_convessa_xxxxxx...xxxxxx
```

## Ejemplos por lenguaje

Todos los ejemplos siguientes cubren los casos de uso habituales: mensaje de texto, medios, grupos, difusión y seguimiento de estado.

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

// Mensaje de texto
await apiPost('/api/v1/send', { to: '229xxxxxxxxx', message: 'Tu pedido ha sido confirmado.' });

// Imagen por URL
await apiPost('/api/v1/send', {
  to: '229xxxxxxxxx',
  message: 'Aquí está el plano.',
  media: { type: 'image', mime: 'image/jpeg', url: 'https://cdn.example.com/plan.jpg' },
});

// Documento PDF
await apiPost('/api/v1/send', {
  to: '229xxxxxxxxx',
  message: 'Tu factura.',
  media: {
    type: 'document', mime: 'application/pdf',
    url: 'https://cdn.example.com/factura.pdf', name: 'factura.pdf',
  },
});

// Difusión a varios (máx. 50)
await apiPost('/api/v1/send', {
  to: ['229xxxxxxxxx', '229yyyyyyyyy', '229zzzzzzzzz'],
  message: 'Nuestra tienda está abierta este sábado.',
});

// Crear un grupo
const group = await apiPost('/api/v1/groups', {
  name: 'Clientes Premium',
  participants: ['229xxxxxxxxx', '229yyyyyyyyy'],
});

// Enviar a un grupo
await apiPost('/api/v1/send', { to: group.groupId, message: 'Recordatorio: reunión mañana.' });

// Verificar el estado de un mensaje
const status = await apiGet(`/api/v1/send/status/${messageId}`);
console.log(status.status); // "sent" | "failed" | "queued"

// Historial de envíos
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

# Mensaje de texto
api_post('/api/v1/send', {'to': '229xxxxxxxxx', 'message': 'Tu pedido ha sido confirmado.'})

# Imagen
api_post('/api/v1/send', {
    'to': '229xxxxxxxxx',
    'media': {'type': 'image', 'mime': 'image/jpeg', 'url': 'https://cdn.example.com/plan.jpg'},
})

# Documento PDF
api_post('/api/v1/send', {
    'to': '229xxxxxxxxx',
    'message': 'Tu factura.',
    'media': {
        'type': 'document', 'mime': 'application/pdf',
        'url': 'https://cdn.example.com/factura.pdf', 'name': 'factura.pdf',
    },
})

# Difusión
api_post('/api/v1/send', {
    'to': ['229xxxxxxxxx', '229yyyyyyyyy'],
    'message': 'Nuestra tienda está abierta este sábado.',
})

# Crear un grupo
group = api_post('/api/v1/groups', {
    'name': 'Clientes Premium',
    'participants': ['229xxxxxxxxx'],
})

# Enviar al grupo
api_post('/api/v1/send', {'to': group['groupId'], 'message': 'Recordatorio: reunión mañana.'})

# Estado
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

// Mensaje de texto
convessa('POST', '/api/v1/send', ['to' => '229xxxxxxxxx', 'message' => 'Pedido confirmado.']);

// Documento PDF
convessa('POST', '/api/v1/send', [
    'to'    => '229xxxxxxxxx',
    'media' => [
        'type' => 'document', 'mime' => 'application/pdf',
        'url'  => 'https://cdn.example.com/factura.pdf', 'name' => 'factura.pdf',
    ],
]);

// Difusión
convessa('POST', '/api/v1/send', [
    'to'      => ['229xxxxxxxxx', '229yyyyyyyyy'],
    'message' => '¡Abrimos el sábado!',
]);

// Grupo
$group   = convessa('POST', '/api/v1/groups', ['name' => 'VIP', 'participants' => ['229xxxxxxxxx']]);
$groupId = $group['groupId'];
convessa('POST', '/api/v1/send', ['to' => $groupId, 'message' => 'Recordatorio de reunión.']);

// Laravel (fachada Http)
// Http::withHeaders(['X-Api-Key' => config('services.convessa.key')])
//     ->post(config('services.convessa.url').'/api/v1/send',
//            ['to' => '229xxxxxxxxx', 'message' => '¡Hola!']);
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
        // Texto
        post("/api/v1/send",
            "{\"to\":\"229xxxxxxxxx\",\"message\":\"Pedido confirmado.\"}");

        // Documento
        post("/api/v1/send",
            "{\"to\":\"229xxxxxxxxx\",\"media\":{\"type\":\"document\"," +
            "\"mime\":\"application/pdf\",\"url\":\"https://cdn.example.com/factura.pdf\"," +
            "\"name\":\"factura.pdf\"}}");

        // Estado
        get("/api/v1/send/status/tu-message-id");
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
