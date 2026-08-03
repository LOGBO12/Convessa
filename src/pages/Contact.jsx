/**
 * Contact.jsx — Page de contact Convessa.
 * Permet d'envoyer un message qui notifie l'admin via WhatsApp.
 */

import React, { useState } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { motion } from 'framer-motion';
import {
  Mail, Phone, MessageSquare, Send, CheckCircle,
  AlertCircle, Loader, MapPin, Clock, ExternalLink,
} from 'lucide-react';
import { contactAPI } from '../services/api';

const SUBJECTS = [
  'Question générale',
  'Support technique',
  'Facturation / Abonnement',
  'Signaler un problème',
  'Partenariat',
  'Autre',
];

export default function Contact() {
  usePageTitle('Nous contacter');
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: SUBJECTS[0], message: '' });
  const [sending, setSending]   = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const res = await contactAPI.send(form);
      setSuccess(res.message || 'Message envoyé ! Nous vous répondrons bientôt.');
      setForm({ name: '', email: '', phone: '', subject: SUBJECTS[0], message: '' });
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi. Réessayez.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">

      {/* Hero */}
      <section className="bg-gradient-to-br from-whatsapp-darker via-whatsapp-dark to-primary-700 py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/20 px-4 py-2 rounded-full mb-6 text-sm font-medium">
              <MessageSquare size={16} />
              Nous sommes à votre écoute
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight">
              Contactez-nous
            </h1>
            <p className="text-base sm:text-xl text-white/85 max-w-2xl mx-auto">
              Une question, une suggestion, un partenariat ? Envoyez-nous un message — nous répondons sous 24h.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-10">

          {/* Infos de contact */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Informations de contact</h2>
              <div className="space-y-4">
                {[
                  { icon: Mail, label: 'Email', value: 'supportconvessa@gmail.com', href: 'mailto:supportconvessa@gmail.com' },
                  { icon: Phone, label: 'WhatsApp', value: 'Discuter sur WhatsApp', href: 'https://wa.me/22990000000' },
                  { icon: Clock, label: 'Disponibilité', value: 'Lun–Sam, 8h–20h (WAT)' },
                ].map(({ icon: Icon, label, value, href }) => (
                  <div key={label} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon size={20} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                      {href ? (
                        <a href={href} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 mt-0.5">
                          {value} <ExternalLink size={12} />
                        </a>
                      ) : (
                        <p className="text-sm text-gray-900 font-medium mt-0.5">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Liens rapides */}
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Ressources utiles</h3>
              <ul className="space-y-2">
                {[
                  { label: 'Documentation API', href: '/docs' },
                  { label: 'FAQ', href: '/faq' },
                  { label: 'Plans & Tarifs', href: '/pricing' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Formulaire */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">Envoyer un message</h2>

            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 gap-4 text-center"
              >
                <CheckCircle size={56} className="text-green-500" />
                <h3 className="text-xl font-bold text-gray-900">Message envoyé !</h3>
                <p className="text-gray-600 max-w-sm">{success}</p>
                <button
                  onClick={() => setSuccess('')}
                  className="mt-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium transition-colors"
                >
                  Envoyer un autre message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  {/* Nom */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Nom complet <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="name" value={form.name} onChange={handleChange} required
                      placeholder="Don Diègue MIKPONHOUE"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
                    />
                  </div>
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="email" type="email" value={form.email} onChange={handleChange} required
                      placeholder="vous@exemple.com"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  {/* Téléphone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Téléphone <span className="text-gray-400 font-normal">(optionnel)</span>
                    </label>
                    <input
                      name="phone" value={form.phone} onChange={handleChange}
                      placeholder="+229 90 00 00 00"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
                    />
                  </div>
                  {/* Sujet */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Sujet <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="subject" value={form.subject} onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors bg-white"
                    >
                      {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message" value={form.message} onChange={handleChange} required
                    rows={6} placeholder="Décrivez votre demande en détail..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">{form.message.length} / 2000 caractères</p>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <button
                  type="submit" disabled={sending}
                  className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3.5 rounded-xl hover:from-primary-700 hover:to-primary-800 font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <><Loader size={18} className="animate-spin" /> Envoi en cours...</>
                  ) : (
                    <><Send size={18} /> Envoyer le message</>
                  )}
                </button>

                <p className="text-xs text-center text-gray-400">
                  En envoyant ce formulaire, vous acceptez que vos données soient utilisées pour vous répondre.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
