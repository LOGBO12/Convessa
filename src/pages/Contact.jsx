/**
 * Contact.jsx — Page de contact Convessa.
 * Permet d'envoyer un message qui notifie l'admin via WhatsApp.
 */

import React, { useState } from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useTranslation, Trans } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle';
import { motion } from 'framer-motion';
import {
  MessageSquare, Send, CheckCircle,
  AlertCircle, Loader, Clock, ExternalLink,
} from 'lucide-react';
import { contactAPI } from '../services/api';

export default function Contact() {
  const { t } = useTranslation();
  usePageTitle('pageTitles.contact');
  const SUBJECTS = t('contactPage.subjects', { returnObjects: true });
  const [form, setForm]       = useState({ name: '', email: '', subject: SUBJECTS[0], message: '' });
  const [phoneValue, setPhoneValue] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !phoneValue || !form.message.trim()) {
      setError(t('contactPage.requiredFieldsError'));
      return;
    }
    setSending(true);
    setError('');
    try {
      const res = await contactAPI.send({ ...form, phone: phoneValue });
      setSuccess(res.message || t('contactPage.sentDefault'));
      setForm({ name: '', email: '', subject: SUBJECTS[0], message: '' });
      setPhoneValue('');
    } catch (err) {
      setError(err.message || t('contactPage.sendError'));
    } finally {
      setSending(false);
    }
  };

  const resourceLinks = [
    { key: 'docs', href: '/docs' },
    { key: 'faq', href: '/faq' },
    { key: 'pricing', href: '/pricing' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16">

      {/* Hero */}
      <section className="bg-whatsapp-dark py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/20 px-4 py-2 rounded-full mb-6 text-sm font-medium">
              <MessageSquare size={16} />
              {t('contactPage.heroTag')}
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight">
              {t('contactPage.heroTitle')}
            </h1>
            <p className="text-base sm:text-xl text-white/85 max-w-2xl mx-auto">
              {t('contactPage.heroSubtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-10">

          {/* Formulaire de contact - Prend 2 colonnes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">{t('contactPage.formTitle')}</h2>

            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 gap-4 text-center"
              >
                <CheckCircle size={56} className="text-green-500" />
                <h3 className="text-xl font-bold text-gray-900">{t('contactPage.sentTitle')}</h3>
                <p className="text-gray-600 max-w-sm">{success}</p>
                <button
                  onClick={() => setSuccess('')}
                  className="mt-2 px-6 py-2.5 bg-whatsapp-dark text-white rounded-xl hover:bg-whatsapp-dark font-medium transition-colors"
                >
                  {t('contactPage.sendAnother')}
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  {/* Nom */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {t('contactPage.fullName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="name" value={form.name} onChange={handleChange} required
                      placeholder={t('contactPage.namePlaceholder')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-whatsapp-dark focus:outline-none transition-colors"
                    />
                  </div>
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {t('contactPage.email')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="email" type="email" value={form.email} onChange={handleChange} required
                      placeholder="vous@exemple.com"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-whatsapp-dark focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  {/* Téléphone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {t('contactPage.whatsappPhone')} <span className="text-red-500">*</span>
                    </label>
                    <PhoneInput
                      international
                      defaultCountry="BJ"
                      value={phoneValue}
                      onChange={(val) => { setPhoneValue(val || ''); setError(''); }}
                      className="phone-input-contact"
                      placeholder="94 00 00 00"
                    />
                    <p className="text-xs text-gray-400 mt-1">{t('contactPage.phoneHint')}</p>
                  </div>
                  {/* Sujet */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {t('contactPage.subject')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="subject" value={form.subject} onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-whatsapp-dark focus:outline-none transition-colors bg-white"
                    >
                      {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('contactPage.message')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message" value={form.message} onChange={handleChange} required
                    rows={6} placeholder={t('contactPage.messagePlaceholder')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-whatsapp-dark focus:outline-none transition-colors resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">{form.message.length} / 2000 {t('contactPage.charCount')}</p>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <button
                  type="submit" disabled={sending}
                  className="w-full flex items-center justify-center gap-2.5 bg-whatsapp-dark text-white py-3.5 rounded-xl hover:bg-whatsapp-dark font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <><Loader size={18} className="animate-spin" /> {t('contactPage.sending')}</>
                  ) : (
                    <><Send size={18} /> {t('contactPage.sendMessage')}</>
                  )}
                </button>

                <p className="text-xs text-center text-gray-400">
                  {t('contactPage.consentNotice')}
                </p>
              </form>
            )}
          </motion.div>

          {/* Ressources utiles - Sidebar à droite */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-6"
          >
            <div className="bg-gray-100 border border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">{t('contactPage.resourcesTitle')}</h3>
              <p className="text-sm text-gray-600 mb-4">
                {t('contactPage.resourcesSubtitle')}
              </p>
              <ul className="space-y-3">
                {resourceLinks.map(({ key, href }) => (
                  <li key={key}>
                    <a 
                      href={href} 
                      className="block p-3 bg-white rounded-lg border border-whatsapp-light hover:border-whatsapp-dark hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-whatsapp-dark rounded-full mt-2 flex-shrink-0" />
                        <div>
                          <p className="inline-flex items-center gap-2 text-sm font-semibold text-whatsapp-dark">
                            {t(`contactPage.resources.${key}.label`)}
                            <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{t(`contactPage.resources.${key}.desc`)}</p>
                        </div>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Info supplémentaire */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                <Clock size={16} className="text-whatsapp-dark" />
                {t('contactPage.responseTimeTitle')}
              </h4>
              <p className="text-sm text-gray-600">
                <Trans i18nKey="contactPage.responseTimeText" components={{ strong: <strong /> }} />
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
