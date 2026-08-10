# Errores y límites

## Formato de los errores

Todos los errores devueltos por la API siguen el mismo formato:

```json
{
  "success": false,
  "error": {
    "code": "CODIGO_ERROR",
    "message": "Descripción del error"
  }
}
```

## Códigos de error

| Código HTTP | Código de error | Causa | Acción |
|---|---|---|---|
| 400 | `VALIDATION_ERROR` | Campo faltante o inválido | Verifica el cuerpo de la solicitud |
| 401 | `UNAUTHORIZED` | Falta el encabezado `X-Api-Key` | Añade el encabezado |
| 401 | `INVALID_API_KEY_FORMAT` | La clave no empieza por `pk_convessa_` | Verifica el formato de tu clave |
| 401 | `INVALID_API_KEY` | Clave desconocida o revocada | Verifica tu clave en el panel de control |
| 403 | `SESSION_NOT_ACTIVE` | Sesión desconectada o revocada | Vuelve a conectarte desde el panel de control |
| 403 | `ACCESS_DENIED` | Cuota alcanzada o suscripción expirada | Renueva tu suscripción |
| 404 | `NOT_FOUND` | Recurso no encontrado | Verifica el identificador proporcionado |
| 404 | `GROUP_NOT_FOUND` | El grupo no existe en tu sesión | Créalo mediante `POST /groups` |
| 429 | `RATE_LIMIT_EXCEEDED` | Demasiadas solicitudes | Espera antes de reintentar |
| 500 | `SEND_ERROR` | Error al enviar por WhatsApp | Reintenta; contacta con soporte si persiste |
| 503 | `SESSION_NOT_CONNECTED` | Sesión de WhatsApp no conectada | Verifica `/send/info`, vuelve a escanear el QR si es necesario |

## Límites de frecuencia

Cada dirección IP está limitada a **60 solicitudes por minuto** en los endpoints sensibles (envío de mensajes, obtención de QR, creación de sesión).

Más allá de eso, la API devuelve `429 RATE_LIMIT_EXCEEDED`. La ventana es deslizante de un minuto.

Para envíos de gran volumen, espacia tus llamadas o implementa una cola en el lado del cliente.

## Límites de medios

| Tipo | Formatos | Tamaño máximo |
|---|---|---|
| Imagen | JPEG, PNG | 5 MB |
| Video | MP4 (H.264 + AAC) | 16 MB |
| Audio | MP3, M4A, OGG, Opus | 16 MB |
| Documento | PDF, Word, Excel, PowerPoint, ZIP, TXT | 100 MB |

Los archivos en base64 aumentan el tamaño en ~33% respecto al archivo original.

## Límites de difusión

Una llamada `POST /send` acepta un máximo de **50 destinatarios** en el array `to`. Para volúmenes mayores, divide tus envíos en varias llamadas.

## Límites de grupos

Un grupo de WhatsApp puede contener un máximo de **256 participantes**. Más allá de eso, los participantes adicionales no se añaden.

## Buenas prácticas

- Gestiona `503 SESSION_NOT_CONNECTED` con un nuevo intento tras unos segundos.
- Guarda los `messageId` devueltos para poder consultar su estado más tarde.
- Configura un webhook para evitar el polling sistemático.
- Para envíos transaccionales críticos, verifica siempre el estado final mediante webhook o polling.
