# WhatsApp Groups

Create a group once, get its `groupId`, then use it indefinitely to send messages to it.

## Create a group

```
POST /api/v1/groups
```

```json
{
  "name": "Premium Customers",
  "participants": ["229xxxxxxxxx", "229yyyyyyyyy"]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Group name (unique per session) |
| `participants` | string[] | Yes | Numbers to add: 256 maximum |

This endpoint is **idempotent by name**: if a group with this name already exists on your session, it is returned without creating a duplicate.

**201 Created** response (or 200 if it already exists):

```json
{
  "success": true,
  "created": true,
  "groupId": "e3c1f9a0-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "name": "Premium Customers",
  "addedDirectly": 1,
  "invitedByLink": 1,
  "message": "Group created. 1 participant(s) invited by link (privacy settings)."
}
```

`invitedByLink` indicates how many participants were invited by link due to their WhatsApp privacy settings. Convessa automatically sends them the link in a private message.

## List your groups

```
GET /api/v1/groups
```

```json
{
  "success": true,
  "count": 2,
  "groups": [
    {
      "groupId": "e3c1f9a0-...",
      "name": "Premium Customers",
      "participantsCount": 12,
      "createdAt": "2026-07-01T08:00:00.000Z"
    }
  ]
}
```

## Group details

```
GET /api/v1/groups/{groupId}
```

```json
{
  "success": true,
  "groupId": "e3c1f9a0-...",
  "name": "Premium Customers",
  "participantsCount": 12,
  "inviteCode": "AbCdEf123",
  "createdAt": "2026-07-01T08:00:00.000Z"
}
```

## Invite link

```
GET /api/v1/groups/{groupId}/invite
```

```json
{
  "success": true,
  "groupId": "e3c1f9a0-...",
  "inviteLink": "https://chat.whatsapp.com/xxxxxxxxxxxx"
}
```

## Add participants

```
POST /api/v1/groups/{groupId}/participants
```

```json
{ "participants": ["229zzzzzzzzz"] }
```

```json
{
  "success": true,
  "addedDirectly": 1,
  "invitedByLink": 0,
  "message": "All participants have been added."
}
```

## Sending to a group

Use the `groupId` in the `to` field of `POST /api/v1/send`:

```json
{
  "to": "e3c1f9a0-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "message": "Reminder: appointment tomorrow at 9am."
}
```

The behavior is identical to sending to a contact: immediate `202` response, actual status via polling, webhook, or Socket.io.
