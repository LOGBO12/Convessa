# Tarifs, Forfaits et Limites d'Envoi

CONVESSA propose des forfaits souples adaptés à tous les besoins d'envoi de messages WhatsApp, des indépendants aux équipes à fort volume.

---

## Forfaits disponibles

| Plan | Usage cible | Inclus |
| :--- | :--- | :--- |
| **Starter / Découverte** | Tests, alertes occasionnelles, premiers projets | Quota limité de messages, accès à l'API REST complète |
| **Pro / Business** | Volume régulier, automatisations, équipes | Quota élevé, accès webhooks temps réel, gestion des groupes |
| **Enterprise / Illimité** | Forts volumes, multi-comptes | Volume garanti, support prioritaire, gestion multi-sessions |

Pour consulter les prix actuels et souscrire à un forfait, rendez-vous dans la section **[Voir les forfaits](/pricing)** de l'application.

---

## Quotas et renouvellement

Chaque compte dispose d'un quota de messages inclus selon le plan souscrit.

### Comment consulter vos messages restants

1. Connectez-vous à votre tableau de bord CONVESSA.
2. Accédez à l'onglet **Sessions** ou **Mon Compte**.
3. Vous y trouvez l'indicateur de vos **messages envoyés** et **messages restants** sur la période en cours.

Astuce : l'assistant IA du chatbot peut aussi vous indiquer votre quota restant en temps réel — il suffit de lui poser la question directement.

### Que se passe-t-il en cas de quota dépassé ?

Lorsque vous atteignez la limite de votre forfait, les appels d'envoi API renvoient une erreur `HTTP 429 ACCESS_DENIED` (Quota dépassé). La clé API reste valide mais les envois sont bloqués jusqu'au renouvellement.

Pour recharger vos messages, rendez-vous dans la section **Tarifs & Abonnement** du tableau de bord et choisissez votre nouveau forfait ou une recharge. La mise à jour de votre quota est instantanée et votre clé API reste inchangée.

---

## Modes de paiement

Les modes de paiement acceptés sont affichés lors du processus de souscription dans l'application. Votre abonnement est activé immédiatement après confirmation du paiement — aucune intervention manuelle n'est nécessaire.

---

## Bonnes pratiques anti-bannissement

WhatsApp applique des règles anti-spam strictes. Respecter ces pratiques protège votre numéro :

- **Consentement préalable (Opt-in)** : N'envoyez de messages qu'aux personnes ayant donné leur accord explicite.
- **Rythme d'envoi** : Espacez les envois en masse si vous diffusez à une large liste. Évitez d'envoyer des centaines de messages en quelques secondes.
- **Signalements** : Si trop de destinataires bloquent ou signalent votre numéro, WhatsApp peut suspendre votre ligne.
- **Contenu** : Évitez les messages qui ressemblent à du spam (liens raccourcis suspects, messages identiques répétés en masse).

Consultez les [Conditions d'utilisation](/docs?section=legal) pour plus d'informations sur les usages autorisés et interdits.
