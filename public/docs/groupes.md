# Groupes WhatsApp

Créez un groupe une seule fois, récupérez son `groupId`, puis utilisez-le indéfiniment pour y envoyer des messages.

## Créer un groupe

```
POST /api/v1/groups
```

```json
{
  "name": "Clients Premium",
  "participants": ["229xxxxxxxxx", "229yyyyyyyyy"]
}
```

| Champ | Type | Requis | Description |
|---|---|---|---|
| `name` | string | Oui | Nom du groupe (unique par session) |
| `participants` | string[] | Oui | Numéros à ajouter — 256 maximum |

Cet endpoint est **idempotent par nom** : si un groupe portant ce nom existe déjà sur votre session, il est retourné sans créer de doublon.

Réponse **201 Created** (ou 200 si déjà existant) :

```json
{
  "success": true,
  "created": true,
  "groupId": "e3c1f9a0-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "name": "Clients Premium",
  "addedDirectly": 1,
  "invitedByLink": 1,
  "message": "Groupe créé. 1 participant(s) invité(s) par lien (réglages de confidentialité)."
}
```

`invitedByLink` indique combien de participants ont été invités par lien en raison de leurs paramètres de confidentialité WhatsApp. Convessa leur envoie automatiquement le lien en message privé.

## Lister vos groupes

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
      "name": "Clients Premium",
      "participantsCount": 12,
      "createdAt": "2026-07-01T08:00:00.000Z"
    }
  ]
}
```

## Détail d'un groupe

```
GET /api/v1/groups/{groupId}
```

```json
{
  "success": true,
  "groupId": "e3c1f9a0-...",
  "name": "Clients Premium",
  "participantsCount": 12,
  "inviteCode": "AbCdEf123",
  "createdAt": "2026-07-01T08:00:00.000Z"
}
```

## Lien d'invitation

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

## Ajouter des participants

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
  "message": "Tous les participants ont été ajoutés."
}
```

## Envoyer dans un groupe

Utilisez le `groupId` dans le champ `to` de `POST /api/v1/send` :

```json
{
  "to": "e3c1f9a0-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "message": "Rappel : rendez-vous demain à 9h."
}
```

Le comportement est identique à un envoi vers un contact : réponse `202` immédiate, statut réel via polling, webhook ou Socket.io.
