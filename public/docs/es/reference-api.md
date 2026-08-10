# Referencia de la API

Todos los endpoints de envío requieren:

```
X-Api-Key: pk_convessa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
```

---

## Envío

### POST /api/v1/send

Envía un mensaje de texto y/o un medio a uno o varios destinatarios.

**Cuerpo:**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `to` | string o string[] | Sí | Número(s) en formato internacional, o `groupId` |
| `message` | string | Según el caso | Texto: máx. 4096 caracteres |
| `media` | object | Según el caso | Ver estructura abajo |

Se requiere al menos `message` o `media`. Máximo 50 destinatarios en un array `to`.

**Estructura de `media`:**

| Campo | Tipo | Requerido |
|---|---|---|
| `type` | `image` / `video` / `audio` / `document` | Sí |
| `mime` | string | Sí |
| `url` | string | `url` o `base64` |
| `base64` | string | `url` o `base64` |
| `name` | string | No |

**Respuesta 202:**

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

Verifica el estado de la sesión y devuelve los límites de medios.

**Respuesta 200:**

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

Devuelve el estado de un mensaje.

**Respuesta 200:**

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

Valores de `status`: `queued` · `sent` · `delivered` · `failed`

### GET /api/v1/send/history

Devuelve el historial de mensajes enviados. Parámetro: `limit` (por defecto 50, máx. 200).

**Respuesta 200:**

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

## Grupos

### POST /api/v1/groups

Crea un grupo o devuelve un grupo existente con el mismo nombre (idempotente por nombre).

**Cuerpo:** `{ "name": "string", "participants": ["229xxxxxxxxx"] }`

**Respuesta 201 / 200:**

```json
{
  "success": true,
  "created": true,
  "groupId": "uuid",
  "name": "Clientes Premium",
  "addedDirectly": 5,
  "invitedByLink": 2,
  "message": "..."
}
```

### GET /api/v1/groups

Lista todos los grupos de la sesión.

### GET /api/v1/groups/{groupId}

Detalle de un grupo (nombre, número de participantes, código de invitación).

### GET /api/v1/groups/{groupId}/invite

Genera o devuelve el enlace de invitación de WhatsApp del grupo.

**Respuesta:** `{ "success": true, "groupId": "...", "inviteLink": "https://chat.whatsapp.com/..." }`

### POST /api/v1/groups/{groupId}/participants

Añade participantes a un grupo existente.

**Cuerpo:** `{ "participants": ["229xxxxxxxxx"] }`

---

## Sesión

Estos endpoints usan un token Bearer de Firebase (`Authorization: Bearer {idToken}`).

### POST /api/v1/tenants

Crea una sesión de WhatsApp.

**Cuerpo (opcional):** `{ "name": "Mi bot", "webhookUrl": "https://..." }`

**Respuesta 201:**

```json
{
  "success": true,
  "tenantId": "uuid",
  "status": "pending_qr",
  "message": "Sesión iniciándose. Llama a GET /api/v1/tenants/me/qr en 3-5 segundos."
}
```

### GET /api/v1/tenants/me

Devuelve la información de tu sesión.

**Respuesta 200:**

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

Devuelve el código QR a escanear (base64 PNG). Llamar 3 a 5 segundos después de `POST /tenants`.

### POST /api/v1/tenants/me/activate

Genera la clave API después de escanear el código QR.

**Cuerpo (opcional):** `{ "referralCode": "CODE" }`

**Respuesta 200:**

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

Recupera la clave API completa de tu sesión.

### DELETE /api/v1/tenants/me

Elimina tu sesión de WhatsApp y revoca tu clave API.

---

## Planes

### GET /api/v1/plans

Lista los planes disponibles. Endpoint público, sin autenticación.

**Respuesta 200:**

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
      "description": "Para empezar",
      "features": ["500 mensajes", "API REST"],
      "isPopular": false
    }
  ]
}
```
