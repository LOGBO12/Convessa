import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle, Shield, Zap, DollarSign, Code, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FAQ = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(null);

  const faqCategories = [
    {
      icon: MessageCircle,
      title: 'Général',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      questions: [
        {
          question: "Qu'est-ce que Convessa ?",
          answer: "Convessa est une plateforme SaaS qui permet aux développeurs d'intégrer facilement l'API WhatsApp dans leurs applications. Nous fournissons une API REST simple pour envoyer et recevoir des messages WhatsApp sans la complexité de l'implémentation directe."
        },
        {
          question: "Est-ce que Convessa est officiel WhatsApp ?",
          answer: "Non, Convessa utilise l'API WhatsApp Web (protocole Baileys) pour se connecter à votre compte. C'est la même technologie utilisée par WhatsApp Web dans votre navigateur. Nous ne sommes pas affiliés à WhatsApp/Meta."
        },
        {
          question: "Puis-je utiliser Convessa avec WhatsApp Business ?",
          answer: "Oui ! Convessa fonctionne avec les comptes WhatsApp personnels ET WhatsApp Business. Vous pouvez utiliser n'importe quel type de compte WhatsApp. Nous recommandons WhatsApp Business pour un usage professionnel."
        },
        {
          question: "Dans quels pays Convessa est-il disponible ?",
          answer: "Convessa est disponible dans tous les pays où WhatsApp fonctionne. Notre plateforme supporte les numéros internationaux avec l'indicatif pays (par exemple +229 pour le Bénin, +33 pour la France, etc.)"
        }
      ]
    },
    {
      icon: Shield,
      title: 'Sécurité & Confidentialité',
      color: 'text-green-600',
      bg: 'bg-green-50',
      questions: [
        {
          question: "Mes données sont-elles sécurisées ?",
          answer: "Absolument. Nous utilisons le chiffrement de bout en bout de WhatsApp et ne stockons aucun message. Vos données restent entre vous et WhatsApp. Nous ne stockons que les métadonnées nécessaires au fonctionnement du service (statut des messages, file d'attente)."
        },
        {
          question: "Où sont stockées mes données ?",
          answer: "Les sessions WhatsApp sont chiffrées et stockées de manière sécurisée sur nos serveurs. Les messages ne sont jamais stockés - ils transitent directement entre votre application et WhatsApp. Nous sommes conformes au RGPD."
        },
        {
          question: "Qui peut voir mes messages ?",
          answer: "Personne ! Grâce au chiffrement de bout en bout de WhatsApp, seuls vous et vos destinataires pouvez lire les messages. Même Convessa et WhatsApp ne peuvent pas lire le contenu de vos messages."
        },
        {
          question: "Comment protéger ma clé API ?",
          answer: "Ne partagez JAMAIS votre clé API publiquement. Stockez-la dans des variables d'environnement (.env), utilisez des secrets managers (comme AWS Secrets Manager), et ne l'incluez jamais dans votre code source ou repositories Git."
        }
      ]
    },
    {
      icon: Code,
      title: 'Technique & Développement',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      questions: [
        {
          question: "Quels langages de programmation sont supportés ?",
          answer: "Convessa est une API REST standard, donc elle fonctionne avec n'importe quel langage capable de faire des requêtes HTTP : JavaScript/Node.js, Python, PHP, Java, C#, Go, Ruby, etc. Nous fournissons des exemples de code pour les langages les plus populaires."
        },
        {
          question: "Quelle est la limite de messages par minute ?",
          answer: "Pour éviter le spam, nous limitons à 20 messages par minute sur le plan gratuit et 100 messages/minute sur les plans payants. Si vous avez besoin de limites plus élevées, contactez-nous pour un plan Enterprise personnalisé."
        },
        {
          question: "Comment recevoir des messages entrants ?",
          answer: "Configurez un webhook dans votre dashboard. Convessa enverra une requête POST à votre URL à chaque message reçu. Vous recevrez les données du message en JSON (expéditeur, contenu, timestamp, etc.)"
        },
        {
          question: "Puis-je envoyer des médias (images, vidéos) ?",
          answer: "Oui ! Convessa supporte l'envoi d'images (16MB max), vidéos (64MB max), audio (16MB max) et documents (100MB max). Les médias sont envoyés en base64 via l'API."
        },
        {
          question: "Y a-t-il une limite de caractères pour les messages ?",
          answer: "Oui, les messages WhatsApp sont limités à 4096 caractères. Au-delà, le message sera tronqué. Si vous devez envoyer plus de texte, divisez-le en plusieurs messages."
        }
      ]
    },
    {
      icon: DollarSign,
      title: 'Tarifs & Facturation',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      questions: [
        {
          question: "Combien coûte Convessa ?",
          answer: "Nous proposons un plan gratuit (100 messages/mois), un plan Pro à 29€/mois (5000 messages), et des plans Enterprise sur mesure avec messages illimités. Consultez notre page Tarifs pour plus de détails."
        },
        {
          question: "Y a-t-il des frais cachés ?",
          answer: "Non ! Le prix affiché est le prix que vous payez. Pas de frais d'installation, pas de frais supplémentaires par message au-delà de votre quota inclus. Si vous dépassez votre quota, votre service est simplement mis en pause jusqu'au prochain mois."
        },
        {
          question: "Puis-je changer de plan à tout moment ?",
          answer: "Oui, vous pouvez upgrader ou downgrader votre plan à tout moment depuis votre dashboard. Les changements prennent effet immédiatement. En cas de downgrade, vous conservez votre quota jusqu'à la fin de la période de facturation en cours."
        },
        {
          question: "Proposez-vous des réductions pour les associations ?",
          answer: "Oui ! Nous offrons des réductions jusqu'à 50% pour les associations à but non lucratif, les écoles et les projets open source. Contactez-nous avec les détails de votre organisation."
        }
      ]
    },
    {
      icon: Zap,
      title: 'Dépannage',
      color: 'text-red-600',
      bg: 'bg-red-50',
      questions: [
        {
          question: "Mon QR code ne fonctionne pas",
          answer: "Assurez-vous que : 1) Votre téléphone a une connexion internet stable, 2) WhatsApp est à jour sur votre téléphone, 3) Le QR code n'a pas expiré (60 secondes), 4) Vous utilisez la bonne fonctionnalité dans WhatsApp (Menu > Appareils liés > Lier un appareil)."
        },
        {
          question: "Mes messages ne sont pas envoyés",
          answer: "Vérifiez : 1) Que votre session WhatsApp est connectée (Dashboard > Ma Session), 2) Que vous n'avez pas dépassé votre quota mensuel, 3) Que le numéro du destinataire est au format international (+XXX...), 4) Que votre clé API est correcte dans vos en-têtes HTTP."
        },
        {
          question: "Mon compte WhatsApp a été banni",
          answer: "L'utilisation d'API non officielles comporte un risque de bannissement par WhatsApp. Pour minimiser ce risque : 1) Utilisez un compte WhatsApp Business dédié, 2) N'envoyez PAS de spam, 3) Respectez les limites de débit, 4) Ajoutez un délai entre les messages. Nous recommandons l'API WhatsApp Business officielle pour un usage critique."
        },
        {
          question: "J'ai perdu ma clé API",
          answer: "Connectez-vous à votre dashboard. Votre clé API est affichée dans la section 'Ma Session WhatsApp'. Vous pouvez la copier à tout moment. Si vous pensez que votre clé a été compromise, contactez le support pour la régénérer."
        }
      ]
    },
    {
      icon: HelpCircle,
      title: 'Support',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      questions: [
        {
          question: "Comment contacter le support ?",
          answer: "Support communautaire (plan gratuit) : Discord et GitHub Discussions. Support par email (plan Pro) : Réponse sous 24h ouvrées. Support prioritaire 24/7 (plan Enterprise) : Email, téléphone et Slack dédié."
        },
        {
          question: "Y a-t-il une documentation pour développeurs ?",
          answer: "Oui ! Notre documentation complète est disponible sur /docs. Elle contient des guides de démarrage, la référence API complète, des exemples de code dans plusieurs langages, et des tutoriels pas à pas."
        },
        {
          question: "Proposez-vous des intégrations avec d'autres services ?",
          answer: "Oui, Convessa s'intègre facilement avec Zapier, Make (anciennement Integromat), n8n, et d'autres plateformes d'automatisation. Nous proposons également des webhooks pour intégrer avec vos propres systèmes."
        },
        {
          question: "Où puis-je voir des exemples d'utilisation ?",
          answer: "Consultez notre section Exemples sur /examples (bientôt disponible) ou notre repository GitHub avec des projets exemples en Node.js, Python, PHP et autres langages."
        }
      ]
    }
  ];

  const toggleQuestion = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Questions Fréquentes
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Trouvez rapidement des réponses à vos questions sur Convessa, notre API WhatsApp et nos services.
          </p>
        </motion.div>

        {/* FAQ Categories */}
        <div className="space-y-12">
          {faqCategories.map((category, categoryIndex) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={categoryIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.1 }}
                className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden"
              >
                {/* Category Header */}
                <div className={`${category.bg} px-6 py-4 border-b border-gray-200`}>
                  <div className="flex items-center space-x-3">
                    <div className={`${category.color}`}>
                      <Icon size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{category.title}</h2>
                  </div>
                </div>

                {/* Questions */}
                <div className="divide-y divide-gray-200">
                  {category.questions.map((item, questionIndex) => {
                    const key = `${categoryIndex}-${questionIndex}`;
                    const isOpen = openIndex === key;

                    return (
                      <div key={questionIndex} className="p-6">
                        <button
                          onClick={() => toggleQuestion(categoryIndex, questionIndex)}
                          className="w-full flex items-start justify-between text-left group"
                        >
                          <span className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors pr-4">
                            {item.question}
                          </span>
                          <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex-shrink-0"
                          >
                            <ChevronDown className={`${isOpen ? 'text-primary-600' : 'text-gray-400'}`} size={24} />
                          </motion.div>
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <p className="mt-4 text-gray-600 leading-relaxed">
                                {item.answer}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-12 shadow-xl"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Vous ne trouvez pas votre réponse ?
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Notre équipe de support est là pour vous aider
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@convessa.dev"
              className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-md"
            >
              Contacter le support
            </a>
            <a
              href="/docs"
              className="bg-primary-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-900 transition-colors"
            >
              Consulter la documentation
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQ;
