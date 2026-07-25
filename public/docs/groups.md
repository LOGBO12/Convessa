# Groupes WhatsApp

Créez un groupe une seule fois, puis envoyez-lui des messages indéfiniment
via son `groupId` — pas besoin de le recréer à chaque envoi.

> Un groupe n'est jamais créé automatiquement en arrière-plan lors d'un envoi
> de message : c'est un geste explicite (mais réduit à un seul appel), pour
> rester dans les usages normaux de WhatsApp.

## Créer (ou récupérer) un groupe

```
POST /api/v1/groups
```

**Idempotent par nom** : rappeler avec le même `name` renvoie le groupe déjà
créé (`created: false`) plutôt que d'en créer un doublon. Vous pouvez donc
appeler cet endpoint à chaque fois que vous voulez vous assurer qu'un groupe
existe, sans avoir à vérifier vous-même s'il l'a déjà été.

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `name` | string | ✅ | Nom du groupe |
| `participants` | string[] | ✅ | Numéros à ajouter (256 maximum — limite WhatsApp) |

```bash
curl -X POST https://votre-domaine.com/api/v1/groups \
  -H "X-Api-Key: pk_convessa_VOTRE_CLE" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "Clients VIP",
        "participants": ["22960000000", "22961111111"]
      }'
```

**201 Created** (ou **200 OK** si le groupe existait déjà) :

```json
{
  "success": true,
  "created": true,
  "groupId": "e3c1f9a0-...",
  "name": "Clients VIP",
  "addedDirectly": 1,
  "invitedByLink": 1,
  "message": "Groupe créé. 1 participant(s) n'ont pas pu être ajoutés directement (réglages de confidentialité) — un lien d'invitation leur a été envoyé en message privé."
}
```

### Réglages de confidentialité des participants

Certains contacts limitent qui peut les ajouter directement à un groupe
("Tout le monde" / "Mes contacts" / "Personne", dans WhatsApp). Pour ceux-là,
Convessa **envoie automatiquement le lien d'invitation en message privé** à
la place — vous n'avez rien à gérer, `invitedByLink` vous indique juste
combien ont dû passer par ce chemin.

## Lister mes groupes

```
GET /api/v1/groups
```

```json
{ "success": true, "count": 2, "groups": [ { "groupId": "...", "name": "Clients VIP", "participantsCount": 2, "createdAt": "..." } ] }
```

## Détail d'un groupe

```
GET /api/v1/groups/:groupId
```

## Récupérer le lien d'invitation

```
GET /api/v1/groups/:groupId/invite
```

```json
{ "success": true, "groupId": "...", "inviteLink": "https://chat.whatsapp.com/AbCdEf123..." }
```

## Ajouter des participants à un groupe existant

```
POST /api/v1/groups/:groupId/participants
```

| Champ | Type | Obligatoire |
|---|---|---|
| `participants` | string[] | ✅ |

```bash
curl -X POST https://votre-domaine.com/api/v1/groups/e3c1f9a0-.../participants \
  -H "X-Api-Key: pk_convessa_VOTRE_CLE" \
  -H "Content-Type: application/json" \
  -d '{ "participants": ["22963333333"] }'
```

## Envoyer un message dans un groupe

Utilisez le `groupId` (pas un numéro) dans `to` de [`POST /api/v1/send`](/docs?section=send-message) :

```bash
curl -X POST https://votre-domaine.com/api/v1/send \
  -H "X-Api-Key: pk_convessa_VOTRE_CLE" \
  -H "Content-Type: application/json" \
  -d '{ "to": "e3c1f9a0-...", "message": "Promo valable ce week-end !" }'
```

Le comportement (accusé de réception immédiat, statut réel via Socket.io/webhook)
est identique à un envoi vers un contact — voir
[Suivre le statut réel d'un envoi](/docs?section=send-message).

## Tester directement depuis la plateforme

La page **Envoyer un Message** de votre dashboard propose un mode "Groupe" :
création de groupe et envoi s'y testent en conditions réelles, sans écrire de code.
