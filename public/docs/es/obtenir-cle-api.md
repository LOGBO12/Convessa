# Obtener tu clave API

Tu clave API se genera automáticamente cuando conectas un número de WhatsApp a tu cuenta.

## 1. Crear una cuenta

Crea una cuenta en la plataforma con tu correo electrónico, tu cuenta de Google o tu número de teléfono.

## 2. Conectar tu número

Desde tu panel de control, accede a la sección **Sesiones**. Haz clic en **Conectar un número** y luego escanea el código QR con la aplicación WhatsApp en tu teléfono:

1. Abre WhatsApp en tu teléfono
2. Ve a **Ajustes > Dispositivos vinculados**
3. Pulsa **Vincular un dispositivo**
4. Escanea el código QR que aparece en tu panel de control

Una vez establecida la conexión, tu sesión pasa al estado **Conectado**.

## 3. Recuperar tu clave API

Tu clave API está disponible en la sección **Sesiones** de tu panel de control. Tiene este formato:

```
pk_convessa_xxxxxx...xxxxxx
```

Cópiala de inmediato: por razones de seguridad, no volverá a mostrarse completa después de esta primera visualización.

## Conservación de la clave

Guarda tu clave en una variable de entorno, nunca directamente en tu código fuente.

```bash
# .env
CONVESSA_API_KEY=pk_convessa_xxxxxx...xxxxxx
```

Nunca subas tu archivo `.env` a un repositorio Git. Añádelo a tu `.gitignore`.

## Periodo de validez

La clave API está vinculada a tu suscripción activa. Según el plan elegido, es válida por una duración determinada o por un número de mensajes definido. Consulta la sección **Sesiones** de tu panel de control para ver la fecha de expiración y tu cuota restante.

## Renovar o revocar

- **Renovar**: suscríbete a un nuevo plan desde la sección **Precios** — se te asigna una nueva clave de inmediato.
- **Revocar**: desde la sección **Sesiones**, desconecta tu sesión. Esto invalida inmediatamente la clave asociada.

En caso de sospecha de compromiso, desconecta tu sesión sin demora.
