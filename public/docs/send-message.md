# Envoyer un Message

L'endpoint principal pour envoyer des messages texte via WhatsApp.

## Endpoint

```
POST https://api.convessa.dev/v1/messages/send
```

## Authentification

Incluez votre clé API dans le header Authorization :

```
Authorization: Bearer YOUR_API_KEY
```

## Paramètres de la requête

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `to` | string | Oui | Numéro au format international (ex: +33612345678) |
| `message` | string | Oui | Contenu du message (max 4096 caractères) |
| `session_id` | string | Non | ID de la session si vous en avez plusieurs |

## Format du numéro

Le numéro doit être au **format international** avec le préfixe pays :

- France : `+33612345678`
- États-Unis : `+15551234567`
- Maroc : `+212612345678`

**Astuce :** Pas d'espaces, pas de tirets, juste le `+` suivi des chiffres.

## Exemples de requêtes

### Message simple

```javascript
// JavaScript / Node.js
const response = await fetch('https://api.convessa.dev/v1/messages/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_live_xxxxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: '+33612345678',
    message: 'Bonjour ! Ceci est un message de test.'
  })
});

const data = await response.json();
```

### Message avec session spécifique

Si vous avez plusieurs sessions WhatsApp connectées :

```javascript
const response = await fetch('https://api.convessa.dev/v1/messages/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_live_xxxxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: '+33612345678',
    message: 'Message depuis une session spécifique',
    session_id: 'sess_abc123'
  })
});
```

### Message multilignes

```javascript
const message = `Bonjour,

Voici les informations demandées :
- Point 1
- Point 2
- Point 3

Cordialement`;

const response = await fetch('https://api.convessa.dev/v1/messages/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_live_xxxxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: '+33612345678',
    message: message
  })
});
```

### Formatage du texte

WhatsApp supporte quelques formatages simples :

```javascript
const message = `
*Texte en gras*
_Texte en italique_
~Texte barré~
\`\`\`Code monospace\`\`\`
`;

// Envoi...
```

## Réponses

### Succès (200 OK)

```json
{
  "success": true,
  "message_id": "3EB0XXXXXXXXXXXXXXXX",
  "status": "sent",
  "to": "+33612345678",
  "timestamp": "2026-07-23T14:30:00Z"
}
```

| Champ | Description |
|-------|-------------|
| `success` | Toujours `true` en cas de succès |
| `message_id` | ID unique du message (fourni par WhatsApp) |
| `status` | Statut d'envoi : `sent`, `pending`, `failed` |
| `to` | Numéro du destinataire |
| `timestamp` | Date/heure d'envoi au format ISO 8601 |

### Erreurs

#### 400 Bad Request - Numéro invalide

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PHONE_NUMBER",
    "message": "Le format du numéro est invalide. Utilisez le format international (+33...)"
  }
}
```

#### 400 Bad Request - Message trop long

```json
{
  "success": false,
  "error": {
    "code": "MESSAGE_TOO_LONG",
    "message": "Le message dépasse la limite de 4096 caractères"
  }
}
```

#### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Clé API invalide ou manquante"
  }
}
```

#### 400 Bad Request - Session déconnectée

```json
{
  "success": false,
  "error": {
    "code": "SESSION_NOT_CONNECTED",
    "message": "Votre session WhatsApp est déconnectée. Reconnectez-vous depuis le dashboard."
  }
}
```

#### 429 Too Many Requests

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Limite de taux dépassée. Maximum 20 messages par minute.",
    "retry_after": 60
  }
}
```

#### 403 Forbidden - Quota dépassé

```json
{
  "success": false,
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Vous avez atteint votre quota mensuel de 100 messages. Passez au plan Pro."
  }
}
```

## Gestion des erreurs

Exemple de gestion robuste des erreurs :

```javascript
async function sendMessage(to, message) {
  try {
    const response = await fetch('https://api.convessa.dev/v1/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CONVESSA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ to, message })
    });

    const data = await response.json();

    if (!response.ok) {
      // Gérer les erreurs spécifiques
      switch (data.error.code) {
        case 'RATE_LIMIT_EXCEEDED':
          console.error('Trop de messages envoyés. Attendez 1 minute.');
          // Attendre et réessayer
          await new Promise(resolve => setTimeout(resolve, 60000));
          return sendMessage(to, message); // Réessayer
          
        case 'SESSION_NOT_CONNECTED':
          console.error('Session WhatsApp déconnectée !');
          // Notifier l'administrateur
          break;
          
        case 'INVALID_PHONE_NUMBER':
          console.error('Numéro invalide:', to);
          break;
          
        case 'QUOTA_EXCEEDED':
          console.error('Quota mensuel dépassé !');
          break;
          
        default:
          console.error('Erreur:', data.error.message);
      }
      
      return null;
    }

    console.log('Message envoyé avec succès:', data.message_id);
    return data;
    
  } catch (error) {
    console.error('Erreur réseau:', error);
    return null;
  }
}

// Utilisation
await sendMessage('+33612345678', 'Hello!');
```

## Bonnes pratiques

### 1. Respecter les délais

Attendez au moins **1 seconde** entre chaque message :

```javascript
async function sendMessages(recipients) {
  for (const recipient of recipients) {
    await sendMessage(recipient.phone, recipient.message);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pause 1s
  }
}
```

### 2. Valider les numéros

```javascript
function isValidPhoneNumber(phone) {
  // Format international requis
  return /^\+[1-9]\d{9,14}$/.test(phone);
}

if (!isValidPhoneNumber(phone)) {
  console.error('Numéro invalide');
  return;
}
```

### 3. Gérer les tentatives

```javascript
async function sendMessageWithRetry(to, message, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await sendMessage(to, message);
      if (result) return result;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
}
```

### 4. Logger les envois

```javascript
async function sendMessageWithLog(to, message) {
  console.log(`[${new Date().toISOString()}] Envoi à ${to}:`, message.substring(0, 50));
  
  const result = await sendMessage(to, message);
  
  if (result) {
    console.log(`[${new Date().toISOString()}] Succès:`, result.message_id);
  } else {
    console.error(`[${new Date().toISOString()}] Échec pour ${to}`);
  }
  
  return result;
}
```

## Limites

- **Taille max** : 4096 caractères par message
- **Rate limit** : 20 msg/min (gratuit), 100 msg/min (Pro)
- **Quota** : 100 msg/mois (gratuit), 5000 msg/mois (Pro)

Consultez la page [Limites de Taux](/?section=rate-limits) pour plus de détails.

## Prochaines étapes

- [Envoyer des médias](/?section=send-media) : images, vidéos, documents
- [Recevoir des messages](/?section=webhooks) : configurez les webhooks
- [Gestion des erreurs](/?section=error-handling) : guide complet
