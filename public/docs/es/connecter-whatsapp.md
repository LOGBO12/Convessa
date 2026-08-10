# Conectar y Gestionar tu Sesión de WhatsApp

Para enviar mensajes a través de CONVESSA, debes conectar tu número de WhatsApp personal o empresarial a tu cuenta. Este número se convierte en el remitente de todos tus mensajes.

---

## Acceder a las sesiones

Desde tu panel de control de CONVESSA, haz clic en **Sesiones** en el menú lateral. Aquí es donde gestionas todas tus conexiones de WhatsApp y recuperas tu clave API.

---

## Generar el código QR

1. En la pestaña **Sesiones**, haz clic en el botón **Conectar un número**.
2. Aparecerá un **código QR único** en la pantalla. Es válido durante **60 segundos**.
3. Si el código QR expira antes de que lo escanees, simplemente recarga la página para generar uno nuevo.

> Si el código QR no se muestra o carga indefinidamente, verifica tu conexión a internet y asegúrate de que ningún bloqueador de anuncios o extensión del navegador esté bloqueando las solicitudes WebSocket.

---

## Escanear el código QR

Abre **WhatsApp** o **WhatsApp Business** en tu teléfono, luego ve a los dispositivos vinculados:

- **En Android**: Menú (3 puntos arriba a la derecha) > **Dispositivos vinculados**
- **En iPhone**: Configuración (abajo a la derecha) > **Dispositivos vinculados**

Toca **Vincular un dispositivo** y escanea el código QR mostrado en la pantalla de tu computadora.

En unos segundos, el estado de tu sesión cambiará a **Conectado** (`connected`) y tu clave API estará disponible en la pestaña Sesiones.

---

## Estados de sesión

| Estado | Significado | Acción recomendada |
| :--- | :--- | :--- |
| **Pendiente** (`pending_qr`) | El código QR fue generado y espera ser escaneado. | Escanea dentro de los 60 segundos. Si expira, recarga la página. |
| **Conectado** (`connected`) | La sesión está activa. Tu clave API está lista para usarse. | Puedes comenzar a enviar mensajes a través de la API. |
| **Desconectado** (`disconnected`) | La conexión se cerró (desconexión del teléfono o expiración). | Haz clic en **Reconectar** y escanea un nuevo código QR. |

---

## Reconectar o cambiar el número de remitente

- **Reconectar el mismo número**: En la pestaña **Sesiones**, haz clic en **Reconectar** y vuelve a escanear el código QR. Tu clave API permanece inalterada.
- **Cambiar número remitente**: Primero desconecta la sesión activa, luego haz clic en **Vincular un nuevo número**. Se generará una nueva clave API.

---

## Buenas prácticas de estabilidad

- Mantén tu teléfono inteligente conectado a una red de internet estable (Wi-Fi o 4G/5G).
- En Android, desactiva la optimización de batería para WhatsApp para evitar que el sistema cierre la aplicación en segundo plano.
- Nunca desconectes la sesión **Convessa / Dispositivo vinculado** desde la aplicación móvil de WhatsApp; gestiona siempre la conexión desde tu panel de control.
