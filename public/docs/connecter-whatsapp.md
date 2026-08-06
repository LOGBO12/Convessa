# Connecter et Gérer votre Session WhatsApp

Pour envoyer des messages via la plateforme Convessa, vous devez connecter votre numéro de téléphone WhatsApp personnel ou professionnel à votre compte.

---

## 1. Comment connecter votre numéro WhatsApp

1. Connectez-vous à votre tableau de bord **Convessa**.
2. Dans le menu latéral, cliquez sur **Sessions** (ou **Connexion WhatsApp**).
3. Cliquez sur le bouton **Connecter un numéro**. Un **QR Code** unique s'affiche à l'écran.
4. Ouvrez l'application **WhatsApp** ou **WhatsApp Business** sur votre téléphone mobile.
5. Allez dans :
   - Sur Android : **Menu (3 points en haut à droite) > Appareils liés**
   - Sur iPhone : **Réglages (en bas à droite) > Appareils liés**
6. Appuyez sur **Lier un appareil**.
7. Scannez le QR Code affiché sur votre écran d'ordinateur.
8. En quelques secondes, le statut de votre session passe à **Connecté** (`connected`).

---

## 2. Comprendre les Statuts de Session

| Statut | Signification | Actions recommandées |
| :--- | :--- | :--- |
| **En attente (pending_qr)** | Le QR code a été généré et attend d'être scanné sur le téléphone. | Scannez le QR code dans les 60 secondes. Si expirée, rafraîchissez la page. |
| **Connecté (connected)** | La session est active et opérationnelle. Votre clé API est prête à l'emploi. | Vous pouvez commencer à envoyer des messages via l'API ou l'interface. |
| **Déconnecté (disconnected)** | La connexion WhatsApp a été fermée (déconnexion depuis le téléphone ou expiration). | Cliquez sur **Reconnecter** et scannez un nouveau QR code. |

---

## 3. Comment Reconnecter ou Changer de Numéro

- **Reconnecter le même numéro** : Allez dans **Sessions**, puis cliquez sur **Reconnecter** et scannez à nouveau le QR code.
- **Changer de numéro expéditeur** : Déconnectez d'abord la session active depuis l'onglet **Sessions**, puis cliquez sur **Lier un nouveau numéro**.

---

## 4. Résolution des Problèmes de Connexion (Dépannage)

### Le QR Code ne s'affiche pas ou tourne en boucle
- Vérifiez votre connexion internet.
- Rafraîchissez la page de votre navigateur.
- Assurez-vous qu'aucun bloqueur de publicité ou d'extension navigateur ne bloque les requêtes WebSocket (`Socket.io`).

### WhatsApp se déconnecte fréquemment
- Assurez-vous que votre téléphone mobile reste connecté à un réseau internet stable (Wi-Fi ou 4G/5G).
- Désactivez l'optimisation de la batterie pour WhatsApp sur Android afin d'éviter que le système ne ferme l'application en arrière-plan.
- Ne déconnectez pas la session "Convessa / Appareil lié" depuis l'application mobile WhatsApp.
