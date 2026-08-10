# Convessa: API de WhatsApp

Convessa es una plataforma para enviar mensajes de WhatsApp a través de una API REST. Conectas tu propio número de WhatsApp, obtienes una clave API y envías mensajes desde cualquier aplicación con una sola llamada HTTP.

Sin SDK propietario que instalar. Un encabezado, un endpoint, un JSON.

## Qué puedes hacer

- Enviar mensajes de texto a uno o varios destinatarios
- Enviar imágenes, videos, audios y documentos
- Crear grupos de WhatsApp y difundir mensajes en ellos
- Seguir el estado de cada mensaje en tiempo real mediante Socket.io o webhook
- Consultar el historial de tus envíos

## Funcionamiento general

Cada cuenta de Convessa está vinculada a un número de WhatsApp que conectas escaneando un código QR desde tu panel de control. Este número se convierte en el remitente de todos tus mensajes. Tu clave API identifica esta sesión de forma única.

Todos los endpoints de envío usan el encabezado `X-Api-Key`. El remitente se deduce automáticamente de tu clave — no necesitas especificarlo.

## Antes de empezar

Lee las [condiciones de uso](/docs?section=legal) antes de integrar la API en un caso de uso de alto volumen. El envío no solicitado expone tu número a ser bloqueado por WhatsApp.
