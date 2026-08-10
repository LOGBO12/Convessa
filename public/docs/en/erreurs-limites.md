# Errors and limits

## Error format

All errors returned by the API follow the same format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

## Error codes

| HTTP code | Error code | Cause | Action |
|---|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing or invalid field | Check the request body |
| 401 | `UNAUTHORIZED` | Missing `X-Api-Key` header | Add the header |
| 401 | `INVALID_API_KEY_FORMAT` | Key doesn't start with `pk_convessa_` | Check your key's format |
| 401 | `INVALID_API_KEY` | Unknown or revoked key | Check your key in the dashboard |
| 403 | `SESSION_NOT_ACTIVE` | Session disconnected or revoked | Reconnect from the dashboard |
| 403 | `ACCESS_DENIED` | Quota reached or subscription expired | Renew your subscription |
| 404 | `NOT_FOUND` | Resource not found | Check the provided identifier |
| 404 | `GROUP_NOT_FOUND` | Group doesn't exist on your session | Create it via `POST /groups` |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests | Wait before retrying |
| 500 | `SEND_ERROR` | Error while sending via WhatsApp | Retry; contact support if it persists |
| 503 | `SESSION_NOT_CONNECTED` | WhatsApp session not connected | Check `/send/info`, rescan the QR code if needed |

## Rate limits

Each IP address is limited to **60 requests per minute** on sensitive endpoints (sending messages, retrieving QR codes, creating sessions).

Beyond that, the API returns `429 RATE_LIMIT_EXCEEDED`. The window is a sliding one minute.

For high-volume sending, space out your calls or set up a queue on the client side.

## Media limits

| Type | Formats | Max size |
|---|---|---|
| Image | JPEG, PNG | 5 MB |
| Video | MP4 (H.264 + AAC) | 16 MB |
| Audio | MP3, M4A, OGG, Opus | 16 MB |
| Document | PDF, Word, Excel, PowerPoint, ZIP, TXT | 100 MB |

Base64-encoded files are about 33% larger than the original file.

## Broadcast limits

A `POST /send` call accepts a maximum of **50 recipients** in the `to` array. For larger volumes, split your sends across several calls.

## Group limits

A WhatsApp group can contain a maximum of **256 participants**. Beyond that, additional participants are not added.

## Best practices

- Handle `503 SESSION_NOT_CONNECTED` by retrying after a few seconds.
- Store the returned `messageId` values so you can query their status later.
- Set up a webhook to avoid systematic polling.
- For critical transactional sends, always check the final status via webhook or polling.
