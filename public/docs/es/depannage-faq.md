# Preguntas Frecuentes (FAQ) y Guía de Solución de Problemas

Aquí encontrarás respuestas a las preguntas más comunes y soluciones a problemas frecuentes al usar CONVESSA.

---

## Problemas de conexión

### El código QR no se muestra o carga en bucle

- Verifica tu conexión a internet.
- Recarga la página de tu navegador.
- Asegúrate de que ningún bloqueador de anuncios o extensión del navegador esté bloqueando las solicitudes WebSocket (`Socket.io`).
- Intenta usar otro navegador (se recomienda Chrome o Firefox).

### WhatsApp se desconecta con frecuencia

- Tu teléfono inteligente debe permanecer conectado a una red de internet estable (Wi-Fi o 4G/5G). Convessa se basa en la tecnología oficial de dispositivos vinculados de WhatsApp.
- En Android, desactiva la optimización de batería para WhatsApp para evitar que el sistema operativo cierre la aplicación en segundo plano.
- Nunca desconectes la sesión **Convessa / Dispositivo vinculado** desde la aplicación móvil de WhatsApp; gestiona siempre la conexión desde la pestaña **Sesiones** de tu panel de control.

### ¿Dónde está mi clave API?

Tu clave API (`pk_convessa_...`) está disponible en la pestaña **Sesiones** de tu panel de control tan pronto como tu número esté conectado. Por razones de seguridad, cópiala de inmediato: solo se muestra en texto plano durante la primera consulta. Si la perdiste, desconecta y vuelve a conectar tu sesión para generar una nueva.

### ¿Puedo usar mi propia cuenta de WhatsApp Business?

Sí. CONVESSA funciona igualmente bien con una cuenta estándar de WhatsApp o con una cuenta de WhatsApp Business.

---

## Problemas de envío

### Error `401 Unauthorized`

- **Causa**: La clave API enviada en el encabezado `X-Api-Key` falta, es inválida o fue revocada.
- **Solución**: Verifica la ortografía de tu clave en tu código o archivo `.env`. La clave debe comenzar con `pk_convessa_`. Si la perdiste o se vio comprometida, genera una nueva desde la pestaña **Sesiones**.

### Error `429 Too Many Requests / Quota Exceeded`

- **Causa**: Has alcanzado el límite de mensajes asignado a tu plan.
- **Solución**: Actualiza a un plan superior o recarga créditos en la sección **[Ver planes](/pricing)**. La actualización de la cuota es instantánea y tu clave API permanece inalterada.

### Error `503 WhatsApp Disconnected`

- **Causa**: Tu sesión de WhatsApp está desconectada o fuera de línea.
- **Solución**: Vuelve a la pestaña **[Acceder a mis sesiones](/sessions)**, haz clic en **Reconectar** y escanea nuevamente el código QR.

### Los mensajes permanecen en estado "Pendiente"

- Asegúrate de que el teléfono inteligente esté encendido y conectado a internet.
- Abre la aplicación WhatsApp en tu teléfono para forzar la sincronización si estuvo en reposo prolongado.

### El destinatario no recibe los mensajes

- Asegúrate de ingresar el número en formato internacional sin espacios ni `+`; ejemplos: `33612345678` (Francia), `2250700000000` (Costa de Marfil), `22961000000` (Benín).
- Verifica que el destinatario tenga una cuenta activa de WhatsApp en ese número.

---

## Baneo de WhatsApp

### Mi número fue baneado. ¿Qué debo hacer?

WhatsApp puede banear temporal o permanentemente un número que viole sus Términos de uso (mensajes masivos no solicitados, spam, comportamiento automatizado abusivo). CONVESSA no se hace responsable de un baneo.

Para minimizar riesgos:

- Solo envía mensajes a personas que hayan dado su **consentimiento explícito (opt-in)**.
- Espacia los envíos masivos y evita repetir mensajes idénticos.
- Consulta los [Términos de uso](/docs?section=legal) para conocer los usos permitidos y prohibidos.

Si tu número es baneado, deberás usar otro número y crear una nueva sesión desde la pestaña **Sesiones**.
