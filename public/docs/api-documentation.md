# Documentation API Convessa

**Version 1.0 | Dernière mise à jour : 23 juillet 2026**

## Démarrage Rapide

### 1. Inscription
Créez votre compte sur [convessa.dev/auth](https://convessa.dev/auth)

### 2. Récupération de votre clé API
Connectez-vous à votre tableau de bord pour obtenir votre clé API unique :
```
sk_live_xxxxxxxxxxxxxxxxxxxxx
```

**Important :** Ne partagez JAMAIS votre clé API publiquement !

### 3. Configuration WhatsApp
Avant d'utiliser l'API, vous devez connecter un numéro WhatsApp :

1. Allez dans **Dashboard > Sessions WhatsApp**
2. Cliquez sur **"Ajouter une session"**
3. Scannez le QR code avec votre WhatsApp (comme WhatsApp Web)
4. Attendez la confirmation de connexion

**Recommandation :** Utilisez un compte **WhatsApp Business** dédié.

---

## Authentification

Toutes les requêtes API doivent inclure votre clé API dans le header :

```bash
Authorization: Bearer YOUR_API_KEY
```

### Exemple avec cURL
```bash
curl -X POST https://api.convessa.dev/v1/messages/send \
  -H "Authorization: Bearer sk_live_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+33612345678",
    "message": "Hello from Convessa!"
  }'
```

---

## 📨 Envoyer un Message

### Endpoint
```
POST https://api.convessa.dev/v1/messages/send
```

### Paramètres

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `to` | string | ✅ | Numéro au format international (+33...) |
| `message` | string | ✅ | Contenu du message (max 4096 caractères) |
| `session_id` | string | ❌ | ID de la session (si multiple) |

### Exemple : Message Texte Simple

```javascript
// Node.js avec fetch
const response = await fetch('https://api.convessa.dev/v1/messages/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_live_xxxxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: '+33612345678',
    message: 'Bonjour ! Ceci est un message test.'
  })
});

const data = await response.json();
console.log(data);
```

### Réponse Succès (200)
```json
{
  "success": true,
  "message_id": "3EB0XXXXXXXXXXXXXXXX",
  "status": "sent",
  "to": "+33612345678",
  "timestamp": "2026-07-23T14:30:00Z"
}
```

### Réponse Erreur (400/401/429/500)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PHONE_NUMBER",
    "message": "Le numéro de téléphone n'est pas valide"
  }
}
```

---

## 📸 Envoyer une Image

### Endpoint
```
POST https://api.convessa.dev/v1/messages/send-media
```

### Paramètres

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `to` | string | ✅ | Numéro au format international |
| `type` | string | ✅ | Type de média (`image`, `video`, `audio`, `document`) |
| `media_url` | string | ✅ | URL publique du fichier |
| `caption` | string | ❌ | Légende (pour image/video) |
| `filename` | string | ❌ | Nom du fichier (pour document) |

### Exemple

```javascript
const response = await fetch('https://api.convessa.dev/v1/messages/send-media', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_live_xxxxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: '+33612345678',
    type: 'image',
    media_url: 'https://example.com/image.jpg',
    caption: 'Regardez cette belle image !'
  })
});
```

**Formats supportés :**
- Images : JPG, PNG, GIF (max 5MB)
- Vidéos : MP4, 3GP (max 16MB)
- Audio : MP3, OGG, AAC (max 16MB)
- Documents : PDF, DOC, XLSX, etc. (max 100MB)

---

## 📩 Recevoir des Messages (Webhooks)

Pour recevoir les messages entrants, configurez un webhook dans votre dashboard.

### Configuration

1. Allez dans **Dashboard > Paramètres > Webhooks**
2. Entrez votre URL de webhook : `https://votreapp.com/webhook`
3. Choisissez les événements à recevoir
4. Sauvegardez

### Format des Webhooks

Convessa enverra une requête POST à votre URL :

```json
{
  "event": "message.received",
  "timestamp": "2026-07-23T14:30:00Z",
  "data": {
    "message_id": "3EB0XXXXXXXXXXXXXXXX",
    "from": "+33698765432",
    "message": "Bonjour !",
    "type": "text",
    "timestamp": "2026-07-23T14:29:55Z"
  }
}
```

### Sécurisation du Webhook

Chaque requête webhook inclut une signature HMAC dans le header `X-Convessa-Signature`.

```javascript
// Vérification de la signature (Node.js)
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return hash === signature;
}

// Dans votre endpoint webhook
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-convessa-signature'];
  const isValid = verifyWebhook(req.body, signature, YOUR_WEBHOOK_SECRET);
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  // Traiter le message...
  console.log('Message reçu:', req.body);
  res.status(200).send('OK');
});
```

---

## 📊 Vérifier le Statut d'une Session

### Endpoint
```
GET https://api.convessa.dev/v1/sessions/{session_id}/status
```

### Exemple

```javascript
const response = await fetch('https://api.convessa.dev/v1/sessions/sess_xxxxx/status', {
  headers: {
    'Authorization': 'Bearer sk_live_xxxxx'
  }
});

const data = await response.json();
console.log(data);
```

### Réponse
```json
{
  "success": true,
  "session_id": "sess_xxxxx",
  "status": "connected",
  "phone_number": "+33612345678",
  "connected_at": "2026-07-23T10:00:00Z",
  "battery_level": 85,
  "battery_charging": false
}
```

**Statuts possibles :**
- `connected` : Session active
- `disconnected` : Déconnecté
- `connecting` : Connexion en cours
- `qr_code` : En attente de scan QR

---

## ⚠️ Gestion des Erreurs

### Codes d'Erreur

| Code | Statut HTTP | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Clé API invalide ou manquante |
| `RATE_LIMIT_EXCEEDED` | 429 | Trop de requêtes |
| `INVALID_PHONE_NUMBER` | 400 | Format de numéro invalide |
| `SESSION_NOT_CONNECTED` | 400 | Session WhatsApp déconnectée |
| `MESSAGE_TOO_LONG` | 400 | Message > 4096 caractères |
| `MEDIA_DOWNLOAD_FAILED` | 400 | Impossible de télécharger le média |
| `QUOTA_EXCEEDED` | 403 | Quota mensuel dépassé |
| `INTERNAL_ERROR` | 500 | Erreur serveur |

### Exemple de Gestion

```javascript
try {
  const response = await fetch('https://api.convessa.dev/v1/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sk_live_xxxxx',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ to: '+33612345678', message: 'Hello' })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    switch (data.error.code) {
      case 'RATE_LIMIT_EXCEEDED':
        console.error('Trop de messages envoyés, attendez 1 minute');
        break;
      case 'SESSION_NOT_CONNECTED':
        console.error('WhatsApp déconnecté, reconnectez-vous');
        break;
      default:
        console.error('Erreur:', data.error.message);
    }
    return;
  }
  
  console.log('Message envoyé avec succès !');
} catch (error) {
  console.error('Erreur réseau:', error);
}
```

---

## 🔒 Bonnes Pratiques

### 1. Rate Limiting
Respectez les limites :
- **1 seconde minimum** entre chaque message
- Maximum 20 msg/min (Plan Gratuit) ou 100 msg/min (Pro)

```javascript
// Exemple avec délai
async function sendMessages(messages) {
  for (const msg of messages) {
    await sendMessage(msg);
    await sleep(1000); // Attendre 1 seconde
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 2. Gestion des Reconnexions
Surveillez le statut de votre session et reconnectez si nécessaire :

```javascript
async function checkSession() {
  const status = await getSessionStatus();
  
  if (status.status !== 'connected') {
    console.warn('Session déconnectée, veuillez vous reconnecter');
    // Notifier l'utilisateur ou rediriger vers le scan QR
  }
}

// Vérifier toutes les 5 minutes
setInterval(checkSession, 5 * 60 * 1000);
```

### 3. Validation des Numéros
Validez les numéros avant d'envoyer :

```javascript
function isValidPhoneNumber(phone) {
  // Doit commencer par + et contenir 10-15 chiffres
  return /^\+[1-9]\d{9,14}$/.test(phone);
}
```

### 4. Sécurité de la Clé API
- ✅ Stockez dans une variable d'environnement (`.env`)
- ✅ Ne committez JAMAIS la clé dans Git
- ✅ Utilisez côté serveur uniquement (pas dans le front)
- ✅ Régénérez si compromise

```javascript
// .env
CONVESSA_API_KEY=sk_live_xxxxx

// Dans votre code
require('dotenv').config();
const apiKey = process.env.CONVESSA_API_KEY;
```

---

## 📚 Bibliothèques Clientes

### Node.js

```bash
npm install @convessa/sdk
```

```javascript
const Convessa = require('@convessa/sdk');

const client = new Convessa('sk_live_xxxxx');

// Envoyer un message
await client.messages.send({
  to: '+33612345678',
  message: 'Hello from Node.js!'
});

// Écouter les messages entrants
client.on('message', (message) => {
  console.log('Message reçu:', message);
});
```

### Python

```bash
pip install convessa
```

```python
from convessa import Convessa

client = Convessa('sk_live_xxxxx')

# Envoyer un message
response = client.messages.send(
    to='+33612345678',
    message='Hello from Python!'
)

print(response)
```

### PHP

```bash
composer require convessa/sdk
```

```php
<?php
require 'vendor/autoload.php';

use Convessa\ConvessaClient;

$client = new ConvessaClient('sk_live_xxxxx');

$response = $client->messages->send([
    'to' => '+33612345678',
    'message' => 'Hello from PHP!'
]);

echo $response->message_id;
```

---

## 🆘 Support

- 📧 Email : support@convessa.dev
- 💬 Discord : [discord.gg/convessa](https://discord.gg/convessa)
- 📖 Documentation : [docs.convessa.dev](https://docs.convessa.dev)
- 🐛 Signaler un bug : [github.com/convessa/issues](https://github.com/convessa/issues)

---

## ⚖️ Limitations et Responsabilités

⚠️ **Rappel Important :**
- Convessa utilise Baileys, une bibliothèque non officielle
- L'utilisation viole les Conditions d'Utilisation de WhatsApp
- Votre compte WhatsApp peut être banni
- Utilisez à vos propres risques

Consultez nos [Conditions d'Utilisation](https://convessa.dev/terms) pour plus de détails.
