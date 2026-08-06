# Tarifs, Forfaits et Limites d'Envoi

Convessa propose des forfaits souples adaptés à tous les besoins d'envoi de messages WhatsApp, des PME aux grands comptes.

---

## 1. Vue d'ensemble des Forfaits

- **Plan Starter / Découverte** : Idéal pour tester la plateforme, envoyer des alertes occasionnelles et configurer vos premières intégrations API.
- **Plan Pro / Business** : Conçu pour les entreprises nécessitant un volume d'envoi régulier, l'accès aux webhooks en temps réel et la gestion des groupes.
- **Plan Enterprise / Illimité** : Dédié aux forts volumes avec support prioritaire, bande passante garantie et gestion multi-comptes.

---

## 2. Quotas et Limites de Messages

Chaque compte dispose d'un quota de messages inclus selon le plan souscrit.

### Comment consulter vos messages restants :
1. Connectez-vous à votre tableau de bord Convessa.
2. Accédez à la rubrique **Mon Compte** ou **Sessions**.
3. Vous y trouverez l'indicateur de vos **messages envoyés** et **messages restants** sur la période en cours.
4. *Astuce* : L'assistant IA du chatbot peut également vous indiquer votre quota restant directement en lui posant la question !

---

## 3. Renouveler ou Augmenter votre Quota

Lorsque vous atteignez la limite de votre forfait :
- Les appels d'envoi API renverront une erreur `HTTP 429` (Quota dépassé).
- Pour recharger vos messages, rendez-vous dans la section **Tarifs & Abonnement** du tableau de bord et choisissez votre nouveau forfait ou une recharge.
- La mise à jour de votre quota est instantanée et votre clé API reste inchangée.

---

## 4. Bonnes Pratiques pour Éviter le Bannissement WhatsApp

WhatsApp applique des règles anti-spam très strictes pour protéger ses utilisateurs :
- **Consentement préalable (Opt-in)** : N'envoyez de messages qu'aux personnes ayant donné leur accord explicite.
- **Rythme d'envoi** : Espacerez les envois en masse si vous utilisez l'API pour diffuser à une large liste.
- **Signalements** : Si trop de destinataires bloquent ou signalent votre numéro, WhatsApp peut suspendre votre ligne.
