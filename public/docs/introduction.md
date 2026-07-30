# Convessa — API WhatsApp

Convessa est une plateforme d'envoi de messages WhatsApp via API REST. Vous connectez votre propre numéro WhatsApp, vous obtenez une clé API, et vous envoyez des messages depuis n'importe quelle application en un seul appel HTTP.

Aucun SDK propriétaire à installer. Un header, un endpoint, un JSON.

## Ce que vous pouvez faire

- Envoyer des messages texte à un ou plusieurs destinataires
- Envoyer des images, vidéos, audios et documents
- Créer des groupes WhatsApp et y diffuser des messages
- Suivre le statut de chaque message en temps réel via Socket.io ou webhook
- Consulter l'historique de vos envois

## Fonctionnement général

Chaque compte Convessa est lié à un numéro WhatsApp que vous connectez en scannant un QR code depuis votre tableau de bord. Ce numéro devient l'expéditeur de tous vos messages. Votre clé API identifie cette session de façon unique.

Tous les endpoints d'envoi utilisent le header `X-Api-Key`. L'expéditeur est automatiquement déduit de votre clé — vous n'avez pas à le préciser.

## Avant de commencer

Lisez les [conditions d'utilisation](/docs?section=legal) avant d'intégrer l'API dans un cas d'usage à fort volume. L'envoi non sollicité expose votre numéro à un bannissement par WhatsApp.
