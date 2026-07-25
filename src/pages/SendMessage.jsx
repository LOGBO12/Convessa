import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Send,
  Image,
  Video,
  FileText,
  Music,
  X,
  Loader,
  CheckCircle,
  AlertCircle,
  Copy,
  Smartphone,
  WifiOff,
} from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { tenantSendAPI, getTenantApiKey } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import useUserSession from '../hooks/useUserSession';

const SendMessage = () => {
  const { user } = useAuth();
  const { session: userSession, loading: sessionLoading } = useUserSession();

  const [phoneValue, setPhoneValue] = useState('');
  const [message, setMessage] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Types de médias acceptés
  const mediaTypes = {
    image: {
      icon: Image,
      label: 'Image',
      accept: 'image/*',
      maxMb: 16,
    },
    video: {
      icon: Video,
      label: 'Vidéo',
      accept: 'video/*',
      maxMb: 64,
    },
    audio: {
      icon: Music,
      label: 'Audio',
      accept: 'audio/*',
      maxMb: 16,
    },
    document: {
      icon: FileText,
      label: 'Document',
      accept: '.pdf,.doc,.docx,.txt,.xlsx,.ppt,.pptx',
      maxMb: 100,
    },
  };

  const handleMediaSelect = (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = mediaTypes[type].accept;

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const maxSize = mediaTypes[type].maxMb * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`Fichier trop volumineux. Taille max: ${mediaTypes[type].maxMb} MB`);
        return;
      }

      setMediaFile(file);
      setMediaType(type);
      setError('');

      if (type === 'image' || type === 'video') {
        const reader = new FileReader();
        reader.onload = (ev) => setMediaPreview(ev.target.result);
        reader.readAsDataURL(file);
      } else {
        setMediaPreview(null);
      }
    };

    input.click();
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (!phoneValue) {
      setError('Veuillez entrer un numéro de téléphone');
      return;
    }

    if (!message && !mediaFile) {
      setError('Veuillez entrer un message ou sélectionner un média');
      return;
    }

    // Récupérer la clé API tenant depuis localStorage
    const tenantApiKey = getTenantApiKey(user?.uid);
    if (!tenantApiKey) {
      setError('Clé API introuvable. Reconnectez votre WhatsApp depuis la page Sessions.');
      return;
    }

    setSending(true);
    setError('');
    setResult(null);

    try {
      // Nettoyer le numéro (garder le + pour l'international)
      const cleanPhone = phoneValue.replace(/\s/g, '');

      let payload = {
        to: cleanPhone,
        message: message.trim() || undefined,
        tenantApiKey,
      };

      // Encoder le média en base64 si présent
      if (mediaFile) {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const b64 = reader.result.split(',')[1];
            resolve(b64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(mediaFile);
        });

        payload.media = {
          type: mediaType,
          mime: mediaFile.type,
          name: mediaFile.name,
          base64,
        };
      }

      const response = await tenantSendAPI.sendAsUser(payload);

      setResult({
        success: true,
        messageId: response.messageId,
        position: response.position,
      });

      // Réinitialiser le formulaire après succès
      setTimeout(() => {
        setPhoneValue('');
        setMessage('');
        removeMedia();
        setResult(null);
      }, 5000);
    } catch (err) {
      console.error('Erreur envoi message:', err);
      setError(err.message || 'Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const copyMessageId = () => {
    if (result?.messageId) {
      navigator.clipboard.writeText(result.messageId);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  // ── Pas de session ou session non connectée ────────────────────────────────
  if (!userSession || userSession.status !== 'connected') {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-12 text-center"
        >
          {userSession ? (
            <WifiOff className="mx-auto text-yellow-500 mb-4" size={64} />
          ) : (
            <Smartphone className="mx-auto text-gray-400 mb-4" size={64} />
          )}

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {userSession
              ? 'Session WhatsApp non connectée'
              : 'Aucune session WhatsApp'}
          </h3>

          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {userSession
              ? `Votre session WhatsApp est en statut "${userSession.status}". Vous devez d'abord la connecter pour envoyer des messages.`
              : 'Vous devez d\'abord connecter votre WhatsApp depuis la page Sessions pour pouvoir envoyer des messages.'}
          </p>

          <Link
            to="/sessions"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg font-medium"
          >
            <Smartphone size={20} />
            <span>Aller à la page Sessions</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── Clé API absente malgré session connectée ───────────────────────────────
  const tenantApiKey = getTenantApiKey(user?.uid);
  if (!tenantApiKey) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-red-200 p-12 text-center"
        >
          <AlertCircle className="mx-auto text-red-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Clé API introuvable
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Votre clé API n'est pas disponible localement. Reconnectez votre WhatsApp pour la régénérer.
          </p>
          <Link
            to="/sessions"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg font-medium"
          >
            <Smartphone size={20} />
            <span>Aller à la page Sessions</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── Formulaire d'envoi ─────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Send size={24} />
            <span>Envoyer un Message WhatsApp</span>
          </h2>
          <p className="text-primary-100 text-sm mt-1">
            Envoi depuis :{' '}
            <span className="font-semibold text-white">
              +{userSession.phone}
            </span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSend} className="p-6 space-y-6">
          {/* Phone Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Numéro du destinataire
            </label>
            <PhoneInput
              international
              defaultCountry="BJ"
              value={phoneValue}
              onChange={setPhoneValue}
              className="phone-input-dashboard"
              placeholder="+229 94 11 94 76"
            />
            <p className="text-xs text-gray-500 mt-2">
              Format international requis (ex: +33612345678)
            </p>
          </div>

          {/* Message Text */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Message (optionnel si média)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              maxLength={4096}
              placeholder="Entrez votre message ici..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">Maximum 4096 caractères</p>
              <p className="text-xs text-gray-600 font-medium">
                {message.length} / 4096
              </p>
            </div>
          </div>

          {/* Media Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Ajouter un média (optionnel)
            </label>

            {!mediaFile ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(mediaTypes).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleMediaSelect(type)}
                      className="flex flex-col items-center justify-center p-4 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
                    >
                      <Icon
                        className="text-gray-400 group-hover:text-primary-600 mb-2"
                        size={32}
                      />
                      <span className="text-sm font-medium text-gray-600 group-hover:text-primary-700">
                        {config.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="border-2 border-primary-200 bg-primary-50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {mediaPreview ? (
                      <div className="relative">
                        {mediaType === 'image' && (
                          <img
                            src={mediaPreview}
                            alt="Aperçu"
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        )}
                        {mediaType === 'video' && (
                          <video
                            src={mediaPreview}
                            className="w-24 h-24 object-cover rounded-lg"
                            controls={false}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                        {React.createElement(mediaTypes[mediaType].icon, {
                          className: 'text-primary-600',
                          size: 32,
                        })}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{mediaFile.name}</p>
                      <p className="text-sm text-gray-600">
                        {(mediaFile.size / 1024).toFixed(2)} KB •{' '}
                        {mediaTypes[mediaType].label}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeMedia}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    aria-label="Supprimer le média"
                  >
                    <X className="text-red-600" size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-sm text-red-700">{error}</p>
            </motion.div>
          )}

          {/* Success Message */}
          {result?.success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-start space-x-3">
                <CheckCircle
                  className="text-green-600 flex-shrink-0 mt-0.5"
                  size={20}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">
                    Message mis en file d'attente avec succès !
                  </p>
                  <div className="mt-2 space-y-1">
                    {result.messageId && (
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-green-700">
                          ID :{' '}
                          <code className="bg-green-100 px-2 py-0.5 rounded">
                            {result.messageId}
                          </code>
                        </p>
                        <button
                          type="button"
                          onClick={copyMessageId}
                          className="p-1 hover:bg-green-100 rounded transition-colors"
                          aria-label="Copier l'ID du message"
                        >
                          <Copy size={14} className="text-green-600" />
                        </button>
                      </div>
                    )}
                    {result.position != null && (
                      <p className="text-xs text-green-700">
                        Position dans la file : {result.position}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={sending || (!message && !mediaFile) || !phoneValue}
            className={`w-full flex items-center justify-center space-x-2 py-4 rounded-lg transition-all shadow-md hover:shadow-lg font-semibold ${
              sending || (!message && !mediaFile) || !phoneValue
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800'
            }`}
          >
            {sending ? (
              <>
                <Loader className="animate-spin" size={20} />
                <span>Envoi en cours...</span>
              </>
            ) : (
              <>
                <Send size={20} />
                <span>Envoyer le message</span>
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4"
      >
        <h3 className="font-semibold text-blue-900 mb-2">Limites des médias</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Images : 16 MB max (JPEG, PNG, GIF, WebP)</li>
          <li>• Vidéos : 64 MB max (MP4, 3GPP)</li>
          <li>• Audio : 16 MB max (MP3, OGG, AAC)</li>
          <li>• Documents : 100 MB max (PDF, DOC, TXT, etc.)</li>
        </ul>
      </motion.div>
    </div>
  );
};

export default SendMessage;
