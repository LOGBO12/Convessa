# Connecter et Gérer votre Session WhatsApp

Pour envoyer des messages via CONVESSA, vous devez connecter votre numéro WhatsApp personnel ou professionnel à votre compte. Ce numéro devient l'expéditeur de tous vos messages.

---

## Accéder aux sessions

Depuis votre tableau de bord CONVESSA, cliquez sur **Sessions** dans le menu latéral. C'est ici que vous gérez toutes vos connexions WhatsApp et que vous récupérez votre clé API.

---

## Générer le QR code

1. Dans l'onglet **Sessions**, cliquez sur le bouton **Connecter un numéro**.
2. Un **QR Code unique** s'affiche à l'écran. Il est valable **60 secondes**.
3. Si le QR code expire avant que vous le scanniez, rafraîchissez simplement la page pour en générer un nouveau.

> Si le QR code ne s'affiche pas ou tourne en boucle, vérifiez votre connexion internet et assurez-vous qu'aucun bloqueur de publicité ou extension navigateur ne bloque les requêtes WebSocket.

---

## Scanner le QR code

Ouvrez **WhatsApp** ou **WhatsApp Business** sur votre téléphone, puis accédez aux appareils liés :

- **Sur Android** : Menu (3 points en haut à droite) > **Appareils liés**
- **Sur iPhone** : Réglages (en bas à droite) > **Appareils liés**

Appuyez sur **Lier un appareil** et scannez le QR code affiché sur votre écran d'ordinateur.

En quelques secondes, le statut de votre session passe à **Connecté** (`connected`) et votre clé API est disponible dans l'onglet Sessions.

---

## Statuts de session

| Statut | Signification | Action recommandée |
| :--- | :--- | :--- |
| **En attente** (`pending_qr`) | Le QR code a été généré et attend d'être scanné. | Scannez dans les 60 secondes. Si expiré, rafraîchissez la page. |
| **Connecté** (`connected`) | La session est active. Votre clé API est prête à l'emploi. | Vous pouvez commencer à envoyer des messages via l'API. |
| **Déconnecté** (`disconnected`) | La connexion a été fermée (déconnexion téléphone ou expiration). | Cliquez sur **Reconnecter** et scannez un nouveau QR code. |

---

## Reconnecter ou changer de numéro

- **Reconnecter le même numéro** : Dans l'onglet **Sessions**, cliquez sur **Reconnecter** et scannez à nouveau le QR code. Votre clé API reste inchangée.
- **Changer de numéro expéditeur** : Déconnectez d'abord la session active, puis cliquez sur **Lier un nouveau numéro**. Une nouvelle clé API est générée.

---

## Bonnes pratiques de stabilité

- Maintenez votre smartphone connecté à un réseau internet stable (Wi-Fi ou 4G/5G).
- Sur Android, désactivez l'optimisation de la batterie pour WhatsApp afin d'éviter que le système ne ferme l'application en arrière-plan.
- Ne déconnectez jamais la session **Convessa / Appareil lié** depuis l'application mobile WhatsApp — gérez toujours la connexion depuis votre tableau de bord.
