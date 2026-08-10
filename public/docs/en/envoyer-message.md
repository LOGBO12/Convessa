# Sending messages

All examples require the `X-Api-Key` header with your key.

## Text message

```
POST /api/v1/send
```

```json
{
  "to": "229xxxxxxxxx",
  "message": "Your order has been confirmed."
}
```

**202 Accepted** response:

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

The `202` status means the message has been accepted and is being sent. The `messageId` field lets you track the actual status.

## Broadcasting to several recipients

Pass an array in `to` to send the same message to several contacts. Each recipient gets an individual message. Maximum 50 recipients per call.

```json
{
  "to": ["229xxxxxxxxx", "229yyyyyyyyy", "229zzzzzzzzz"],
  "message": "Our shop is open this Saturday from 9am to 6pm."
}
```

The response contains a distinct `messageId` for each recipient in the `messages` array.

## Sending to a group

Use the `groupId` (UUID returned by `POST /api/v1/groups`) instead of a phone number:

```json
{
  "to": "e3c1f9a0-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "message": "Reminder: meeting tomorrow at 9am."
}
```

## Sending with media

Add a `media` object to your request. You can combine text and media.

Fields of the `media` object:

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | string | Yes | `image`, `video`, `audio`, or `document` |
| `mime` | string | Yes | Exact MIME type of the file |
| `url` | string | Either `url` or `base64` | Publicly accessible URL |
| `base64` | string | Either `url` or `base64` | Base64-encoded content |
| `name` | string | No | File name (recommended for `document`) |

### Limits by type

| Type | Formats | Max size |
|---|---|---|
| `image` | JPEG, PNG | 5 MB |
| `video` | MP4 (H.264, AAC audio) | 16 MB |
| `audio` | MP3, M4A, OGG, Opus | 16 MB |
| `document` | PDF, Word, Excel, PowerPoint, ZIP, TXT | 100 MB |

### Image by URL

```json
{
  "to": "229xxxxxxxxx",
  "message": "Here's the delivery map.",
  "media": {
    "type": "image",
    "mime": "image/jpeg",
    "url": "https://cdn.example.com/carte.jpg"
  }
}
```

### PDF document by URL

```json
{
  "to": "229xxxxxxxxx",
  "message": "Your invoice is attached.",
  "media": {
    "type": "document",
    "mime": "application/pdf",
    "url": "https://cdn.example.com/invoice.pdf",
    "name": "invoice-2026.pdf"
  }
}
```

### Document by base64

```json
{
  "to": "229xxxxxxxxx",
  "media": {
    "type": "document",
    "mime": "application/pdf",
    "base64": "JVBERi0xLjQKJeLjz9MKN...",
    "name": "report.pdf"
  }
}
```

## Status tracking

The actual status of a message arrives after the `202` response. Three methods are available.

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

`status` values: `queued` · `sent` · `delivered` · `failed`

On failure, the `errorCode` and `errorMessage` fields are present.

### Webhook

If you've configured a webhook URL on your session, Convessa automatically sends a POST request to that URL:

```json
{
  "event": "message.sent",
  "messageId": "b7e1f3a2-...",
  "tenantId": "...",
  "to": "229xxxxxxxxx@s.whatsapp.net",
  "waMessageId": "3EB0xxxxxxxxxxxx"
}
```

On failure:

```json
{
  "event": "message.failed",
  "messageId": "b7e1f3a2-...",
  "tenantId": "...",
  "to": "229xxxxxxxxx@s.whatsapp.net",
  "error": "Error description"
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

## Sending history

```
GET /api/v1/send/history?limit=50
```

Returns your most recent messages (max 200 per call).

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
