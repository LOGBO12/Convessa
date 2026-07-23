# Démarrage Rapide

Bienvenue dans la documentation Convessa ! Ce guide vous aidera à envoyer votre premier message WhatsApp en moins de 5 minutes.

## Prérequis

- Un compte Convessa (gratuit)
- **Un compte WhatsApp Business OBLIGATOIRE** (compte personnel non supporté)
- Node.js 14+ ou Python 3.7+ (pour les exemples)

## Étape 1 : Créer un compte

Rendez-vous sur [convessa.dev/auth](https://convessa.dev/auth) et créez votre compte en utilisant :
- Google
- GitHub
- Numéro de téléphone + OTP WhatsApp

## Étape 2 : Récupérer votre clé API

Une fois connecté, accédez à votre tableau de bord pour obtenir votre clé API :

```
sk_live_xxxxxxxxxxxxxxxxxxxxx
```

**Important :** Ne partagez JAMAIS votre clé API publiquement. Stockez-la dans une variable d'environnement.

## Étape 3 : Configurer WhatsApp Business

**ATTENTION :** Seuls les comptes WhatsApp Business sont supportés. Les comptes personnels ne fonctionneront pas.

### Installation de WhatsApp Business

Si vous n'avez pas encore WhatsApp Business :

1. Téléchargez **WhatsApp Business** depuis :
   - Google Play Store (Android)
   - Apple App Store (iOS)
2. Installez l'application sur votre téléphone
3. Configurez votre compte professionnel
4. Utilisez un numéro dédié (différent de votre WhatsApp personnel)

### Connexion à Convessa

1. Dans votre dashboard Convessa, cliquez sur **"Ajouter une session WhatsApp"**
2. Scannez le QR code avec votre application WhatsApp Business
3. Attendez la confirmation de connexion

**Important :** N'utilisez JAMAIS votre numéro WhatsApp personnel. Utilisez un numéro dédié pour votre activité professionnelle.

## Étape 4 : Envoyer votre premier message

### Option A : cURL (Rapide pour tester)

```bash
curl -X POST https://api.convessa.dev/v1/messages/send \
  -H "Authorization: Bearer sk_live_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+33612345678",
    "message": "Hello from Convessa!"
  }'
```

### Option B : Node.js

```javascript
const response = await fetch('https://api.convessa.dev/v1/messages/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_live_xxxxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: '+33612345678',
    message: 'Hello from Convessa!'
  })
});

const data = await response.json();
console.log('Message envoyé:', data.message_id);
```

### Option C : Python

```python
import requests

response = requests.post(
    'https://api.convessa.dev/v1/messages/send',
    headers={
        'Authorization': 'Bearer sk_live_xxxxx',
        'Content-Type': 'application/json'
    },
    json={
        'to': '+33612345678',
        'message': 'Hello from Convessa!'
    }
)

data = response.json()
print(f"Message envoyé: {data['message_id']}")
```

### Option D : PHP

```php
<?php
$ch = curl_init('https://api.convessa.dev/v1/messages/send');

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer sk_live_xxxxx',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'to' => '+33612345678',
    'message' => 'Hello from Convessa!'
]));

$response = curl_exec($ch);
$data = json_decode($response, true);

echo "Message envoyé: " . $data['message_id'];
curl_close($ch);
?>
```

## Réponse attendue

Si tout fonctionne correctement, vous recevrez :

```json
{
  "success": true,
  "message_id": "3EB0XXXXXXXXXXXXXXXX",
  "status": "sent",
  "to": "+33612345678",
  "timestamp": "2026-07-23T14:30:00Z"
}
```

## Et après ?

Maintenant que votre premier message est envoyé, explorez :

- **Envoyer des médias** : images, vidéos, documents
- **Recevoir des messages** : configurez les webhooks
- **Bonnes pratiques** : évitez le bannissement
- **Gestion des erreurs** : gérez les cas d'erreur

## Besoin d'aide ?

- Documentation complète : Parcourez les sections à gauche
- Support : support@convessa.dev
- Discord : discord.gg/convessa

## Avertissement Important

Convessa utilise Baileys, une bibliothèque non officielle basée sur WhatsApp Web. Consultez les **Avertissements Légaux** avant d'utiliser en production.
