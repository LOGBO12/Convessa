# Foire Aux Questions (FAQ) & Guide de Dépannage

Retrouvez ici les réponses aux questions les plus fréquemment posées et les solutions aux erreurs courantes lors de l'utilisation de CONVESSA.

---

## Problèmes de connexion

### Le QR code ne s'affiche pas ou tourne en boucle

- Vérifiez votre connexion internet.
- Rafraîchissez la page de votre navigateur.
- Assurez-vous qu'aucun bloqueur de publicité ou extension navigateur ne bloque les requêtes WebSocket (`Socket.io`).
- Essayez dans un autre navigateur (Chrome ou Firefox recommandé).

### WhatsApp se déconnecte fréquemment

- Votre smartphone doit rester connecté à un réseau internet stable (Wi-Fi ou 4G/5G). Convessa s'appuie sur la technologie officielle d'appareils liés de WhatsApp.
- Sur Android, désactivez l'optimisation de la batterie pour WhatsApp afin d'éviter que le système ferme l'application en arrière-plan.
- Ne déconnectez jamais la session **Convessa / Appareil lié** depuis l'application mobile WhatsApp — gérez toujours la connexion depuis l'onglet **Sessions** de votre tableau de bord.

### Où se trouve ma clé API ?

Votre clé API (`pk_convessa_...`) est disponible dans l'onglet **Sessions** de votre tableau de bord, dès que votre numéro est connecté. Pour des raisons de sécurité, copiez-la immédiatement : elle n'est affichée en clair qu'à la première consultation. Si vous l'avez perdue, déconnectez et reconnectez votre session pour en générer une nouvelle.

### Puis-je utiliser mon propre compte WhatsApp Business ?

Oui. CONVESSA fonctionne aussi bien avec un compte WhatsApp classique qu'avec WhatsApp Business.

---

## Problèmes d'envoi

### Erreur `401 Unauthorized`

- **Cause** : La clé API envoyée dans le header `X-Api-Key` est absente, invalide ou révoquée.
- **Solution** : Vérifiez l'orthographe de votre clé dans votre code ou fichier `.env`. La clé doit commencer par `pk_convessa_`. Si elle est perdue ou compromise, générez-en une nouvelle depuis l'onglet **Sessions**.

### Erreur `429 Too Many Requests / Quota Exceeded`

- **Cause** : Vous avez atteint la limite de messages allouée à votre forfait.
- **Solution** : Souscrivez à un forfait supérieur ou rechargez vos crédits dans la section **[Voir les forfaits](/pricing)**. La mise à jour du quota est instantanée et votre clé API reste inchangée.

### Erreur `503 WhatsApp Disconnected`

- **Cause** : Votre session WhatsApp est déconnectée ou hors ligne.
- **Solution** : Retournez dans l'onglet **[Accéder à mes sessions](/sessions)**, cliquez sur **Reconnecter** et scannez à nouveau le QR code.

### Les messages restent en statut "En attente"

- Vérifiez que le smartphone est bien allumé et connecté au réseau.
- Ouvrez l'application WhatsApp sur votre téléphone pour forcer la synchronisation s'il était en veille prolongée.

### Le destinataire ne reçoit pas les messages

- Assurez-vous que le numéro est saisi au format international sans espace ni `+` — exemples : `33612345678` (France), `2250700000000` (Côte d'Ivoire), `22961000000` (Bénin).
- Vérifiez que le destinataire possède un compte WhatsApp actif sur ce numéro.

---

## Bannissement WhatsApp

### Mon numéro a été banni. Que faire ?

WhatsApp peut temporairement ou définitivement bannir un numéro qui enfreint ses Conditions d'utilisation (envoi en masse non sollicité, spam, comportement automatisé abusif). CONVESSA ne peut pas être tenu responsable d'un bannissement.

Pour limiter les risques :

- N'envoyez de messages qu'aux personnes ayant donné leur **consentement explicite (opt-in)**.
- Espacez les envois en masse et évitez les messages identiques répétés.
- Consultez les [Conditions d'utilisation](/docs?section=legal) pour les usages autorisés et interdits.

Si votre numéro est banni, vous devrez utiliser un autre numéro et créer une nouvelle session depuis l'onglet **Sessions**.
