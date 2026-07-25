# Démarrage rapide

Envoyer un message WhatsApp depuis votre application prend **3 étapes**.

## 1. Récupérez votre clé API

Depuis votre [tableau de bord](/sessions), connectez votre numéro WhatsApp en scannant le QR code. Une clé API unique (`pk_convessa_...`) vous est alors attribuée — copiez-la et gardez-la en lieu sûr, elle ne sera plus affichée en clair par la suite.

> ⚠️ Ne partagez jamais cette clé publiquement (GitHub, forums, front-end client...). Elle donne un accès complet d'envoi depuis votre numéro WhatsApp.

## 2. Envoyez votre premier message

Un seul appel HTTP suffit :

```bash
curl -X POST https://votre-domaine.com/api/v1/send \
  -H "X-Api-Key: pk_convessa_VOTRE_CLE" \
  -H "Content-Type: application/json" \
  -d '{
        "to": "22960000000",
        "message": "Bonjour depuis mon application 👋"
      }'
```

Réponse (202 Accepted) :

```json
{
  "success": true,
  "sent": true,
  "from": "229****919",
  "to": "229****000",
  "message": "Bonjour depuis mon application 👋",
  "hasMedia": false
}
```

## 3. C'est tout

Il n'y a rien d'autre à configurer : pas de webhook obligatoire, pas de SDK à installer. Un header, un endpoint, un JSON.

## Exemple minimal en Node.js

```javascript
const response = await fetch('https://votre-domaine.com/api/v1/send', {
  method: 'POST',
  headers: {
    'X-Api-Key': 'pk_convessa_VOTRE_CLE',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: '22960000000',
    message: 'Bonjour depuis mon application 👋',
  }),
});

const data = await response.json();
console.log(data);
```

## Et ensuite ?

- Consultez la [Documentation API complète](/docs?section=api-documentation) pour l'envoi de médias, la gestion des erreurs et des exemples dans d'autres langages.
- Testez l'envoi directement depuis votre [interface de test](/send-message).
