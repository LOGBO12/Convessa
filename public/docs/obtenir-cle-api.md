# Obtenir votre clé API

Votre clé API est générée automatiquement lorsque vous connectez un numéro WhatsApp à votre compte.

## 1. Créer un compte

Créez un compte sur la plateforme avec votre adresse e-mail, votre compte Google, ou votre numéro de téléphone.

## 2. Connecter votre numéro

Depuis votre tableau de bord, accédez à la section **Sessions**. Cliquez sur **Connecter un numéro**, puis scannez le QR code avec l'application WhatsApp sur votre téléphone :

1. Ouvrez WhatsApp sur votre téléphone
2. Allez dans **Paramètres > Appareils liés**
3. Appuyez sur **Lier un appareil**
4. Scannez le QR code affiché sur votre tableau de bord

Une fois la connexion établie, votre session passe à l'état **Connecté**.

## 3. Récupérer votre clé API

Votre clé API est disponible dans la section **Sessions** de votre tableau de bord. Elle se présente sous la forme :

```
pk_convessa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Copiez-la immédiatement : pour des raisons de sécurité, elle ne sera plus affichée en clair après cette première consultation.

## Conservation de la clé

Stockez votre clé dans une variable d'environnement, jamais en dur dans votre code source.

```bash
# .env
CONVESSA_API_KEY=pk_convessa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Ne commitez jamais votre fichier `.env` dans un dépôt Git. Ajoutez-le à votre `.gitignore`.

## Durée de validité

La clé API est liée à votre abonnement actif. Selon le plan choisi, elle est valable pour une durée déterminée ou pour un nombre de messages défini. Consultez la section **Sessions** de votre tableau de bord pour voir la date d'expiration et votre quota restant.

## Renouveler ou révoquer

- **Renouveler** : souscrivez à un nouveau plan depuis la section **Tarifs** : une nouvelle clé vous est attribuée immédiatement.
- **Révoquer** : depuis la section **Sessions**, déconnectez votre session. Cela invalide immédiatement la clé associée.

En cas de compromission, déconnectez votre session sans délai.
