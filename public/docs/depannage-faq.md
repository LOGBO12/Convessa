# Foire Aux Questions (FAQ) & Guide de Dépannage

Retrouvez ici les réponses aux questions les plus fréquemment posées et les solutions aux erreurs courantes lors de l'utilisation de Convessa.

---

## 1. Questions Fréquentes sur le Tableau de Bord

### Où se trouve ma clé API ?
Votre clé API (`pk_convessa_...`) est générée et affichée dans la rubrique **Sessions** de votre tableau de bord dès que vous connectez votre numéro. Pour des raisons de sécurité, elle n'est affichée qu'une seule fois en clair. Si vous l'avez perdue, vous pouvez la renouveler depuis l'interface.

### Mon numéro doit-il rester allumé et connecté à internet ?
Oui. Convessa s'appuie sur la technologie officielle d'appareils liés de WhatsApp. Votre smartphone doit disposer d'une connexion internet (Wi-Fi ou données mobiles) active pour relayer les messages.

### Puis-je utiliser mon propre compte WhatsApp Business ?
Absolument. Convessa fonctionne aussi bien avec un compte WhatsApp classique qu'avec WhatsApp Business.

---

## 2. Guide de Dépannage des Erreurs API

### Erreur `401 Unauthorized`
- **Cause** : La clé API envoyée dans le header `X-Api-Key` est absente, invalide ou révoquée.
- **Solution** : Vérifiez l'orthographe de votre clé dans votre code ou fichier `.env`, ou générez une nouvelle clé depuis l'onglet **Sessions**.

### Erreur `429 Too Many Requests / Quota Exceeded`
- **Cause** : Vous avez atteint la limite de messages allouée à votre forfait actuel.
- **Solution** : Souscrivez à un forfait supérieur ou rechargez vos crédits dans la rubrique **Tarifs**.

### Erreur `503 Service Unavailable / WhatsApp Disconnected`
- **Cause** : Votre session WhatsApp est actuellement déconnectée ou hors ligne.
- **Solution** : Retournez sur votre tableau de bord dans la section **Sessions**, cliquez sur **Reconnecter** et scannez à nouveau le QR code.

---

## 3. Problèmes de Réception ou d'Envoi de Messages

### Les messages restent bloqués en statut "En attente"
- Vérifiez que le smartphone est bien allumé et connecté au réseau.
- Ouvrez l'application WhatsApp sur le téléphone pour forcer la synchronisation s'il s'est mis en veille prolongée.

### Le destinataire ne reçoit pas mes messages
- Assurez-vous que le numéro de téléphone du destinataire est saisi au format international sans espace ni signe `+` (exemple pour la France : `33612345678`, pour la Côte d'Ivoire : `2250700000000`).
- Vérifiez si le destinataire possède bien un compte WhatsApp actif sur ce numéro.
