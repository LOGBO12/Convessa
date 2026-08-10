# Envío de mensajes

Todos los ejemplos requieren el encabezado `X-Api-Key` con tu clave.

## Mensaje de texto

```
POST /api/v1/send
```

```json
{
  "to": "229xxxxxxxxx",
  "message": "Tu pedido ha sido confirmado."
}
```

Respuesta **202 Accepted**:

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

El código `202` significa que el mensaje ha sido aceptado y está siendo enviado. El campo `messageId` permite seguir el estado real.

## Difusión a varios destinatarios

Pasa un array en `to` para enviar el mismo mensaje a varios contactos. Cada destinatario recibe un mensaje individual. Máximo 50 destinatarios por llamada.

```json
{
  "to": ["229xxxxxxxxx", "229yyyyyyyyy", "229zzzzzzzzz"],
  "message": "Nuestra tienda está abierta este sábado de 9h a 18h."
}
```

La respuesta contiene un `messageId` distinto para cada destinatario en el array `messages`.

## Enviar a un grupo

Usa el `groupId` (UUID devuelto por `POST /api/v1/groups`) en lugar de un número:

```json
{
  "to": "e3c1f9a0-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "message": "Recordatorio: reunión mañana a las 9h."
}
```

## Envío con medios

Añade el objeto `media` a tu solicitud. Puedes combinar texto y medios.

Campos del objeto `media`:

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `type` | string | Sí | `image`, `video`, `audio` o `document` |
| `mime` | string | Sí | Tipo MIME exacto del archivo |
| `url` | string | `url` o `base64` | URL pública accesible |
| `base64` | string | `url` o `base64` | Contenido codificado en base64 |
| `name` | string | No | Nombre del archivo (recomendado para `document`) |

### Límites por tipo

| Tipo | Formatos | Tamaño máximo |
|---|---|---|
| `image` | JPEG, PNG | 5 MB |
| `video` | MP4 (H.264, audio AAC) | 16 MB |
| `audio` | MP3, M4A, OGG, Opus | 16 MB |
| `document` | PDF, Word, Excel, PowerPoint, ZIP, TXT | 100 MB |

### Imagen por URL

```json
{
  "to": "229xxxxxxxxx",
  "message": "Aquí está el plano de entrega.",
  "media": {
    "type": "image",
    "mime": "image/jpeg",
    "url": "https://cdn.example.com/carte.jpg"
  }
}
```

### Documento PDF por URL

```json
{
  "to": "229xxxxxxxxx",
  "message": "Tu factura está adjunta.",
  "media": {
    "type": "document",
    "mime": "application/pdf",
    "url": "https://cdn.example.com/factura.pdf",
    "name": "factura-2026.pdf"
  }
}
```

### Documento por base64

```json
{
  "to": "229xxxxxxxxx",
  "media": {
    "type": "document",
    "mime": "application/pdf",
    "base64": "JVBERi0xLjQKJeLjz9MKN...",
    "name": "informe.pdf"
  }
}
```

## Seguimiento del estado

El estado real de un mensaje llega después de la respuesta `202`. Hay tres métodos disponibles.

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

Valores de `status`: `queued` · `sent` · `delivered` · `failed`

En caso de fallo, los campos `errorCode` y `errorMessage` están presentes.

### Webhook

Si has configurado una URL de webhook en tu sesión, Convessa envía automáticamente una solicitud POST a esa URL:

```json
{
  "event": "message.sent",
  "messageId": "b7e1f3a2-...",
  "tenantId": "...",
  "to": "229xxxxxxxxx@s.whatsapp.net",
  "waMessageId": "3EB0xxxxxxxxxxxx"
}
```

En caso de fallo:

```json
{
  "event": "message.failed",
  "messageId": "b7e1f3a2-...",
  "tenantId": "...",
  "to": "229xxxxxxxxx@s.whatsapp.net",
  "error": "Descripción del error"
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

## Historial de envíos

```
GET /api/v1/send/history?limit=50
```

Devuelve tus últimos mensajes (máx. 200 por llamada).

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
