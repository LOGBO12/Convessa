import React, { useState, useEffect, useCallback } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
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
  Users,
  User,
  UsersRound,
  Plus,
  Clock,
  XCircle,
} from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { tenantSendAPI, groupsAPI, getTenantApiKey } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import useUserSession from '../hooks/useUserSession';
import { connectSocket, onMessageStatus } from '../services/socket';

// Types de médias acceptés
const MEDIA_TYPES = {
  image:    { icon: Image,    label: 'Image',    accept: 'image/*',                              maxMb: 16  },
  video:    { icon: Video,    label: 'Vidéo',     accept: 'video/*',                              maxMb: 64  },
  audio:    { icon: Music,    label: 'Audio',     accept: 'audio/*',                              maxMb: 16  },
  document: { icon: FileText, label: 'Document',  accept: '.pdf,.doc,.docx,.txt,.xlsx,.ppt,.pptx', maxMb: 100 },
};

// Mode de destinataire
const RECIPIENT_MODES = [
  { id: 'contact',  label: 'Un contact',           icon: User },
  { id: 'multiple', label: 'Plusieurs contacts',   icon: Users },
  { id: 'group',    label: 'Un groupe',            icon: UsersRound },
];

const SendMessage = () => {
  const { user } = useAuth();
  usePageTitle('Envoyer un message');
  const { session: userSession, loading: sessionLoading } = useUserSession();
  const tenantApiKey = getTenantApiKey(user?.uid);

  const [recipientMode, setRecipientMode] = useState('contact');

  // Mode "contact"
  const [phoneValue, setPhoneValue] = useState('');

  // Mode "multiple"
  const [multiplePhones, setMultiplePhones] = useState('');

  // Mode "group"
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupParticipants, setNewGroupParticipants] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  const [message, setMessage] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Suivi en temps réel des messages envoyés (messageId → statut)
  // { [messageId]: { to, status: 'queued'|'sent'|'failed', error? } }
  const [tracked, setTracked] = useState({});

  // ── Charger la liste des groupes (mode "group") ─────────────────────────────
  const loadGroups = useCallback(async () => {
    if (!tenantApiKey) return;
    setGroupsLoading(true);
    try {
      const res = await groupsAPI.list(tenantApiKey);
      setGroups(res.groups || []);
    } catch (err) {
      console.error('Erreur chargement groupes:', err);
    } finally {
      setGroupsLoading(false);
    }
  }, [tenantApiKey]);

  useEffect(() => {
    if (recipientMode === 'group') loadGroups();
  }, [recipientMode, loadGroups]);

  // ── Écoute Socket.io — statut final réel de chaque message envoyé ──────────
  // C'est la SEULE source de vérité pour savoir si un message est parti :
  // la réponse HTTP de /send n'est qu'un accusé "reçu et en cours".
  useEffect(() => {
    connectSocket();
    const unsub = onMessageStatus((data) => {
      setTracked((prev) => {
        if (!(data.messageId in prev)) return prev; // pas un message de cette page/session
        return {
          ...prev,
          [data.messageId]: {
            ...prev[data.messageId],
            status: data.status,
            error: data.error,
          },
        };
      });
    });
    return unsub;
  }, []);

  const handleMediaSelect = (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = MEDIA_TYPES[type].accept;

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const maxSize = MEDIA_TYPES[type].maxMb * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`Fichier trop volumineux. Taille max: ${MEDIA_TYPES[type].maxMb} MB`);
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

  // ── Créer un nouveau groupe (idempotent par nom côté backend) ──────────────
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setError('Le nom du groupe est requis');
      return;
    }
    const participants = newGroupParticipants
      .split(/[\n,]/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (participants.length === 0) {
      setError('Ajoutez au moins un participant (un numéro par ligne ou séparés par des virgules)');
      return;
    }

    setCreatingGroup(true);
    setError('');
    try {
      const res = await groupsAPI.create({ name: newGroupName.trim(), participants }, tenantApiKey);
      await loadGroups();
      setSelectedGroupId(res.groupId);
      setShowNewGroupForm(false);
      setNewGroupName('');
      setNewGroupParticipants('');
      if (res.invitedByLink > 0) {
        setError(''); // pas une erreur — informatif seulement
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la création du groupe');
    } finally {
      setCreatingGroup(false);
    }
  };

  const buildRecipient = () => {
    if (recipientMode === 'contact') {
      return phoneValue ? phoneValue.replace(/\s/g, '') : null;
    }
    if (recipientMode === 'multiple') {
      const list = multiplePhones
        .split(/[\n,]/)
        .map((p) => p.trim().replace(/\s/g, ''))
        .filter(Boolean);
      return list.length > 0 ? list : null;
    }
    if (recipientMode === 'group') {
      return selectedGroupId || null;
    }
    return null;
  };

  const handleSend = async (e) => {
    e.preventDefault();

    const to = buildRecipient();
    if (!to || (Array.isArray(to) && to.length === 0)) {
      setError(
        recipientMode === 'group'
          ? 'Sélectionnez ou créez un groupe'
          : 'Veuillez entrer un numéro de téléphone'
      );
      return;
    }

    if (!message && !mediaFile) {
      setError('Veuillez entrer un message ou sélectionner un média');
      return;
    }

    if (!tenantApiKey) {
      setError('Clé API introuvable. Reconnectez votre WhatsApp depuis la page Sessions.');
      return;
    }

    setSending(true);
    setError('');

    try {
      let payload = {
        to,
        message: message.trim() || undefined,
        tenantApiKey,
      };

      if (mediaFile) {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
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

      // Le backend répond immédiatement avec 1..N messages en statut "queued".
      // On les ajoute au suivi — leur statut réel arrivera par Socket.io.
      const newlyTracked = {};
      for (const m of response.messages || []) {
        newlyTracked[m.messageId] = { to: m.to, status: 'queued' };
      }
      setTracked((prev) => ({ ...prev, ...newlyTracked }));

      // Réinitialiser le formulaire (le suivi de statut reste affiché)
      setMessage('');
      removeMedia();
      if (recipientMode === 'contact') setPhoneValue('');
      if (recipientMode === 'multiple') setMultiplePhones('');
    } catch (err) {
      console.error('Erreur envoi message:', err);
      setError(err.message || "Erreur lors de l'envoi du message");
    } finally {
      setSending(false);
    }
  };

  const copyText = (text) => navigator.clipboard.writeText(text);

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
            {userSession ? 'Session WhatsApp non connectée' : 'Aucune session WhatsApp'}
          </h3>

          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {userSession
              ? `Votre session WhatsApp est en statut "${userSession.status}". Vous devez d'abord la connecter pour envoyer des messages.`
              : "Vous devez d'abord connecter votre WhatsApp depuis la page Sessions pour pouvoir envoyer des messages."}
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
  if (!tenantApiKey) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-red-200 p-12 text-center"
        >
          <AlertCircle className="mx-auto text-red-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Clé API introuvable</h3>
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

  const trackedList = Object.entries(tracked).reverse();

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
          <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center space-x-2">
            <Send size={24} />
            <span>Envoyer un Message WhatsApp</span>
          </h2>
          <p className="text-primary-100 text-sm mt-1">
            Envoi depuis : <span className="font-semibold text-white">+{userSession.phone}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSend} className="p-6 space-y-6">
          {/* Sélecteur de mode destinataire */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Destinataire</label>
            <div className="grid grid-cols-3 gap-2">
              {RECIPIENT_MODES.map((m) => {
                const Icon = m.icon;
                const active = recipientMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setRecipientMode(m.id); setError(''); }}
                    className={`flex flex-col items-center gap-1.5 py-2.5 sm:py-3 rounded-lg border-2 text-xs sm:text-sm font-medium transition-colors ${
                      active
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-xs sm:text-sm leading-tight text-center">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode : un contact */}
          {recipientMode === 'contact' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Numéro du destinataire</label>
              <PhoneInput
                international
                defaultCountry="BJ"
                value={phoneValue}
                onChange={setPhoneValue}
                className="phone-input-dashboard"
                placeholder="+229 94 11 94 76"
              />
              <p className="text-xs text-gray-500 mt-2">Format international requis (ex: +33612345678)</p>
            </div>
          )}

          {/* Mode : plusieurs contacts (broadcast) */}
          {recipientMode === 'multiple' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Numéros des destinataires
              </label>
              <textarea
                value={multiplePhones}
                onChange={(e) => setMultiplePhones(e.target.value)}
                rows={4}
                placeholder={'+22960000000\n+22961111111\n+22962222222'}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none resize-none font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Un numéro par ligne (ou séparés par des virgules) — 50 destinataires maximum par envoi.
                Le même message est envoyé individuellement à chacun.
              </p>
            </div>
          )}

          {/* Mode : groupe */}
          {recipientMode === 'group' && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">Groupe</label>

              {!showNewGroupForm ? (
                <>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="flex-1 border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                    >
                      <option value="">
                        {groupsLoading ? 'Chargement...' : groups.length === 0 ? 'Aucun groupe — créez-en un' : 'Sélectionner un groupe'}
                      </option>
                      {groups.map((g) => (
                        <option key={g.groupId} value={g.groupId}>
                          {g.name} ({g.participantsCount} membres)
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewGroupForm(true)}
                      className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 text-sm font-medium whitespace-nowrap"
                    >
                      <Plus size={16} />
                      Nouveau
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Le groupe créé une fois reste disponible pour tous vos envois futurs.
                  </p>
                </>
              ) : (
                <div className="border-2 border-primary-200 bg-primary-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Créer un nouveau groupe</p>
                    <button type="button" onClick={() => setShowNewGroupForm(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={18} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Nom du groupe"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  />
                  <textarea
                    value={newGroupParticipants}
                    onChange={(e) => setNewGroupParticipants(e.target.value)}
                    rows={3}
                    placeholder={'Participants — un numéro par ligne\n+22960000000\n+22961111111'}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-primary-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreateGroup}
                    disabled={creatingGroup}
                    className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
                  >
                    {creatingGroup ? <Loader className="animate-spin" size={16} /> : <UsersRound size={16} />}
                    <span>{creatingGroup ? 'Création...' : 'Créer le groupe'}</span>
                  </button>
                  <p className="text-xs text-gray-600">
                    Les contacts dont les réglages de confidentialité empêchent l'ajout direct
                    recevront automatiquement un lien d'invitation en message privé.
                  </p>
                </div>
              )}
            </div>
          )}

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
              <p className="text-xs text-gray-600 font-medium">{message.length} / 4096</p>
            </div>
          </div>

          {/* Media Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Ajouter un média (optionnel)
            </label>

            {!mediaFile ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(MEDIA_TYPES).map(([type, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleMediaSelect(type)}
                      className="flex flex-col items-center justify-center p-4 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
                    >
                      <Icon className="text-gray-400 group-hover:text-primary-600 mb-2" size={32} />
                      <span className="text-sm font-medium text-gray-600 group-hover:text-primary-700">{cfg.label}</span>
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
                          <img src={mediaPreview} alt="Aperçu" className="w-24 h-24 object-cover rounded-lg" />
                        )}
                        {mediaType === 'video' && (
                          <video src={mediaPreview} className="w-24 h-24 object-cover rounded-lg" controls={false} />
                        )}
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                        {React.createElement(MEDIA_TYPES[mediaType].icon, { className: 'text-primary-600', size: 32 })}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{mediaFile.name}</p>
                      <p className="text-sm text-gray-600">
                        {(mediaFile.size / 1024).toFixed(2)} KB • {MEDIA_TYPES[mediaType].label}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={sending || (!message && !mediaFile)}
            className={`w-full flex items-center justify-center space-x-2 py-4 rounded-lg transition-all shadow-md hover:shadow-lg font-semibold ${
              sending || (!message && !mediaFile)
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

      {/* Suivi des envois en temps réel */}
      {trackedList.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-5"
        >
          <h3 className="font-semibold text-gray-900 mb-3">Suivi des envois</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {trackedList.map(([messageId, info]) => (
              <div key={messageId} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  {info.status === 'queued' && <Clock size={16} className="text-yellow-500 flex-shrink-0 animate-pulse" />}
                  {info.status === 'sent'   && <CheckCircle size={16} className="text-green-600 flex-shrink-0" />}
                  {info.status === 'failed' && <XCircle size={16} className="text-red-600 flex-shrink-0" />}
                  <span className="truncate text-gray-700">{info.to}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-medium ${
                    info.status === 'sent' ? 'text-green-700' : info.status === 'failed' ? 'text-red-700' : 'text-yellow-700'
                  }`}>
                    {info.status === 'queued' && 'Envoi en cours...'}
                    {info.status === 'sent'   && 'Envoyé'}
                    {info.status === 'failed' && (info.error || 'Échec')}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(messageId)}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Copier l'ID du message"
                  >
                    <Copy size={12} className="text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Un envoi peut légitimement prendre plus de temps pour les médias volumineux (vidéo,
            document) — "Envoi en cours" ne signifie pas un échec, seulement que Baileys n'a pas
            encore confirmé la remise.
          </p>
        </motion.div>
      )}

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
