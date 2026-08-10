# Grupos de WhatsApp

Crea un grupo una sola vez, obtén su `groupId`, y luego úsalo indefinidamente para enviarle mensajes.

## Crear un grupo

```
POST /api/v1/groups
```

```json
{
  "name": "Clientes Premium",
  "participants": ["229xxxxxxxxx", "229yyyyyyyyy"]
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `name` | string | Sí | Nombre del grupo (único por sesión) |
| `participants` | string[] | Sí | Números a añadir: 256 máximo |

Este endpoint es **idempotente por nombre**: si ya existe un grupo con este nombre en tu sesión, se devuelve sin crear un duplicado.

Respuesta **201 Created** (o 200 si ya existe):

```json
{
  "success": true,
  "created": true,
  "groupId": "e3c1f9a0-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "name": "Clientes Premium",
  "addedDirectly": 1,
  "invitedByLink": 1,
  "message": "Grupo creado. 1 participante(s) invitado(s) por enlace (configuración de privacidad)."
}
```

`invitedByLink` indica cuántos participantes fueron invitados por enlace debido a su configuración de privacidad de WhatsApp. Convessa les envía automáticamente el enlace en un mensaje privado.

## Listar tus grupos

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
      "name": "Clientes Premium",
      "participantsCount": 12,
      "createdAt": "2026-07-01T08:00:00.000Z"
    }
  ]
}
```

## Detalle de un grupo

```
GET /api/v1/groups/{groupId}
```

```json
{
  "success": true,
  "groupId": "e3c1f9a0-...",
  "name": "Clientes Premium",
  "participantsCount": 12,
  "inviteCode": "AbCdEf123",
  "createdAt": "2026-07-01T08:00:00.000Z"
}
```

## Enlace de invitación

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

## Añadir participantes

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
  "message": "Todos los participantes han sido añadidos."
}
```

## Enviar a un grupo

Usa el `groupId` en el campo `to` de `POST /api/v1/send`:

```json
{
  "to": "e3c1f9a0-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "message": "Recordatorio: cita mañana a las 9h."
}
```

El comportamiento es idéntico al envío a un contacto: respuesta `202` inmediata, estado real mediante polling, webhook o Socket.io.
