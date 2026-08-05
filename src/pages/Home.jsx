import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Zap,
  Shield,
  Clock,
  Code,
  ArrowRight,
  Check,
  MessageCircle,
  Key,
  Smartphone,
  Boxes,
} from 'lucide-react';
import Footer from '../components/Footer';
import { plansAPI } from '../services/api';

const Home = () => {
  const { t } = useTranslation();
  usePageTitle(null); // titre par défaut = Convessa : API WhatsApp pour développeurs

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      setPlansLoading(true);
      setPlansError(null);
      try {
        const data = await plansAPI.list();
        if (!cancelled) {
          setPlans(Array.isArray(data.plans) ? data.plans : []);
        }
      } catch (err) {
        if (!cancelled) {
          setPlansError(err.message || 'Erreur lors du chargement des plans.');
        }
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    }

    loadPlans();
    return () => { cancelled = true; };
  }, []);

  function formatPlanPrice(price) {
    if (!price || price === 0) return 'Gratuit';
    return `${Number(price).toLocaleString('fr-FR')} Frs CFA`;
  }

  function formatPlanUsage(plan) {
    if (plan.unlimited) return 'Usage illimité';
    if (plan.usageType === 'duration') return `Valable ${plan.usageValue} jour(s)`;
    if (plan.usageType === 'requests') return `${plan.usageValue} requête(s) incluses`;
    return null;
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="pt-16">
      {/* Hero Section - Dégradé vert WhatsApp */}
      <section className="relative overflow-hidden bg-whatsapp-dark py-20 md:py-32">
        {/* Pattern de fond */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div {...fadeInUp} className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 px-4 py-2 rounded-full mb-6"
            >
              <MessageCircle size={20} />
              <span className="font-medium">WhatsApp API for Developers</span>
            </motion.div>

            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              {t('home.hero.title')}
            </h1>

            <p className="text-base sm:text-xl md:text-2xl text-white/90 mb-10 leading-relaxed">
              {t('home.hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center space-x-2 bg-white text-whatsapp-dark px-5 py-3 sm:px-8 sm:py-4 rounded-lg hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-base sm:text-lg font-medium"
              >
                <span>{t('home.hero.cta')}</span>
                <ArrowRight size={20} />
              </Link>
              <Link
                to="/docs"
                className="inline-flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-5 py-3 sm:px-8 sm:py-4 rounded-lg border-2 border-white/30 hover:bg-white/20 transition-all text-base sm:text-lg font-medium"
              >
                <Code size={20} />
                <span>{t('home.hero.secondaryCta')}</span>
              </Link>
            </div>

            {/* Code Preview - SUPPRIMÉ */}
          </motion.div>
        </div>
      </section>

      {/* Features Section - Fond blanc propre */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('home.features.title')}
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
          >
            {[
              { icon: Code, key: 'feature1', bgColor: 'bg-blue-50', iconColor: 'text-blue-600', borderColor: 'border-blue-100' },
              { icon: Zap, key: 'feature2', bgColor: 'bg-amber-50', iconColor: 'text-amber-600', borderColor: 'border-amber-100' },
              { icon: Clock, key: 'feature3', bgColor: 'bg-gray-100', iconColor: 'text-whatsapp-dark', borderColor: 'border-gray-200' },
              { icon: Shield, key: 'feature4', bgColor: 'bg-rose-50', iconColor: 'text-rose-600', borderColor: 'border-rose-100' },
            ].map(({ icon: Icon, key, bgColor, iconColor, borderColor }, index) => (
              <motion.div
                key={key}
                variants={fadeInUp}
                className="bg-white border-2 border-gray-200 rounded-2xl p-5 sm:p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group"
              >
                <div
                  className={`w-16 h-16 rounded-2xl ${bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className={`${iconColor}`} size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {t(`home.features.${key}.title`)}
                </h3>
                <p className="text-gray-600 leading-relaxed">{t(`home.features.${key}.description`)}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section - Fond vert très clair */}
      <section className="py-20 bg-whatsapp-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('home.howItWorks.title')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: MessageCircle, key: 'step1', step: '01' },
              { icon: Key, key: 'step2', step: '02' },
              { icon: Smartphone, key: 'step3', step: '03' },
              { icon: Boxes, key: 'step4', step: '04' },
            ].map(({ icon: Icon, key, step }, index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 h-full border-2 border-gray-200 relative overflow-hidden">
                  {/* Badge numéro en haut à gauche */}
                  <div className="absolute -top-4 -left-4 w-20 h-20 bg-whatsapp-dark rounded-full flex items-center justify-center shadow-xl border-4 border-white z-10">
                    <span className="text-3xl font-black text-white">{step}</span>
                  </div>
                  <div className="mt-8">
                    <div className="w-14 h-14 rounded-xl bg-whatsapp-dark flex items-center justify-center mb-6 shadow-lg">
                      <Icon className="text-white" size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {t(`home.howItWorks.${key}.title`)}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{t(`home.howItWorks.${key}.description`)}</p>
                  </div>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="text-whatsapp-dark" size={32} strokeWidth={3} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Fond blanc */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('home.pricing.title')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {plansLoading && (
              [0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-3xl p-8 bg-white border-2 border-gray-200 animate-pulse"
                >
                  <div className="h-6 w-24 bg-gray-200 rounded mb-6"></div>
                  <div className="h-10 w-32 bg-gray-200 rounded mb-8"></div>
                  <div className="h-4 w-full bg-gray-100 rounded mb-3"></div>
                  <div className="h-4 w-3/4 bg-gray-100 rounded mb-8"></div>
                  <div className="h-12 w-full bg-gray-200 rounded-xl"></div>
                </div>
              ))
            )}

            {!plansLoading && plansError && (
              <div className="md:col-span-3 text-center text-gray-500 py-8">
                Impossible de charger les plans pour le moment. Veuillez réessayer plus tard.
              </div>
            )}

            {!plansLoading && !plansError && plans.length === 0 && (
              <div className="md:col-span-3 text-center text-gray-500 py-8">
                Aucun plan disponible pour le moment.
              </div>
            )}

            {!plansLoading && !plansError && plans.length > 0 && plans.map((plan, index) => {
              const isPopular = plans.length >= 3 && index === Math.floor((plans.length - 1) / 2);
              const usageLabel = formatPlanUsage(plan);

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`rounded-3xl p-6 sm:p-8 ${
                    isPopular
                      ? 'bg-whatsapp-dark text-white shadow-2xl sm:transform sm:scale-105 border-4 border-whatsapp-dark'
                      : 'bg-white border-2 border-gray-200 hover:border-whatsapp-dark hover:shadow-xl transition-all duration-300'
                  }`}
                >
                  {isPopular && (
                    <div className="inline-flex items-center space-x-1 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold mb-6">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      <span>POPULAIRE</span>
                    </div>
                  )}
                  <h3
                    className={`text-2xl font-bold mb-4 ${isPopular ? 'text-white' : 'text-gray-900'}`}
                  >
                    {plan.name}
                  </h3>
                  <div className="mb-8">
                    <span className="text-3xl sm:text-5xl font-bold">{formatPlanPrice(plan.price)}</span>
                  </div>
                  {usageLabel && (
                    <ul className="space-y-4 mb-8">
                      <li className="flex items-start space-x-3">
                        <Check
                          className={`flex-shrink-0 mt-1 ${isPopular ? 'text-white' : 'text-whatsapp-dark'}`}
                          size={20}
                          strokeWidth={3}
                        />
                        <span className={`${isPopular ? 'text-white' : 'text-gray-700'}`}>
                          {usageLabel}
                        </span>
                      </li>
                    </ul>
                  )}
                  <Link
                    to="/signup"
                    className={`block w-full text-center py-4 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                      isPopular
                        ? 'bg-white text-whatsapp-dark hover:bg-gray-50 shadow-lg'
                        : 'bg-whatsapp-dark text-white hover:bg-whatsapp-dark shadow-md hover:shadow-lg'
                    }`}
                  >
                    Choisir ce plan
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section - Fond gris clair */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('home.faq.title')}
            </h2>
          </motion.div>

          <div className="space-y-6">
            {['q1', 'q2', 'q3', 'q4'].map((q, index) => (
              <motion.div
                key={q}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-whatsapp-dark"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-start">
                  <span className="text-whatsapp-dark mr-3 text-2xl">Q.</span>
                  {t(`home.faq.${q}.question`)}
                </h3>
                <p className="text-gray-600 leading-relaxed ml-9">{t(`home.faq.${q}.answer`)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Dégradé vert WhatsApp */}
      <section className="py-24 bg-whatsapp-dark text-white relative overflow-hidden">
        {/* Pattern décoratif */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-6">{t('home.cta.title')}</h2>
            <p className="text-base sm:text-xl md:text-2xl text-white/90 mb-10 leading-relaxed">{t('home.cta.subtitle')}</p>
            <Link
              to="/signup"
              className="inline-flex items-center space-x-2 bg-white text-whatsapp-dark px-6 py-4 sm:px-10 sm:py-5 rounded-xl hover:bg-gray-50 transition-all shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 text-base sm:text-lg font-bold"
            >
              <span>{t('home.cta.button')}</span>
              <ArrowRight size={24} />
            </Link>
            <p className="mt-8 text-white/80 text-sm">
              Aucune carte bancaire requise &bull; Prêt en 2 minutes
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;