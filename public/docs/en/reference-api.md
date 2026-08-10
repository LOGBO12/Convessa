# API Reference

All sending endpoints require:

```
X-Api-Key: pk_convessa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
```

---

## Sending

### POST /api/v1/send

Sends a text message and/or media to one or several recipients.

**Body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `to` | string or string[] | Yes | Number(s) in international format, or `groupId` |
| `message` | string | Depending on case | Text: max 4096 characters |
| `media` | object | Depending on case | See structure below |

At least `message` or `media` is required. Maximum 50 recipients in a `to` array.

**`media` structure:**

| Field | Type | Required |
|---|---|---|
| `type` | `image` / `video` / `audio` / `document` | Yes |
| `mime` | string | Yes |
| `url` | string | Either `url` or `base64` |
| `base64` | string | Either `url` or `base64` |
| `name` | string | No |

**202 response:**

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

Checks the session state and returns the media limits.

**200 response:**

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

Returns the status of a message.

**200 response:**

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

`status` values: `queued` · `sent` · `delivered` · `failed`

### GET /api/v1/send/history

Returns the history of sent messages. Parameter: `limit` (default 50, max 200).

**200 response:**

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

## Groups

### POST /api/v1/groups

Creates a group or returns an existing group with the same name (idempotent by name).

**Body:** `{ "name": "string", "participants": ["229xxxxxxxxx"] }`

**201 / 200 response:**

```json
{
  "success": true,
  "created": true,
  "groupId": "uuid",
  "name": "Premium Customers",
  "addedDirectly": 5,
  "invitedByLink": 2,
  "message": "..."
}
```

### GET /api/v1/groups

Lists all groups in the session.

### GET /api/v1/groups/{groupId}

Details of a group (name, number of participants, invite code).

### GET /api/v1/groups/{groupId}/invite

Generates or returns the group's WhatsApp invite link.

**Response:** `{ "success": true, "groupId": "...", "inviteLink": "https://chat.whatsapp.com/..." }`

### POST /api/v1/groups/{groupId}/participants

Adds participants to an existing group.

**Body:** `{ "participants": ["229xxxxxxxxx"] }`

---

## Session

These endpoints use a Firebase Bearer token (`Authorization: Bearer {idToken}`).

### POST /api/v1/tenants

Creates a WhatsApp session.

**Body (optional):** `{ "name": "My bot", "webhookUrl": "https://..." }`

**201 response:**

```json
{
  "success": true,
  "tenantId": "uuid",
  "status": "pending_qr",
  "message": "Session starting. Call GET /api/v1/tenants/me/qr in 3-5 seconds."
}
```

### GET /api/v1/tenants/me

Returns information about your session.

**200 response:**

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

Returns the QR code to scan (base64 PNG). Call it 3 to 5 seconds after `POST /tenants`.

### POST /api/v1/tenants/me/activate

Generates the API key after scanning the QR code.

**Body (optional):** `{ "referralCode": "CODE" }`

**200 response:**

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

Retrieves the full API key of your session.

### DELETE /api/v1/tenants/me

Deletes your WhatsApp session and revokes your API key.

---

## Plans

### GET /api/v1/plans

Lists the available plans. Public endpoint, no authentication required.

**200 response:**

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
      "description": "To get started",
      "features": ["500 messages", "REST API"],
      "isPopular": false
    }
  ]
}
```
