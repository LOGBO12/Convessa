# Changelog - Corrections Auth & UX

## ✅ Corrections effectuées

### 1. Pays par défaut → Bénin (BJ)
**Fichiers modifiés :**
- `src/pages/Auth.jsx` : `defaultCountry="BJ"` + placeholder `+229 94 11 94 76`
- `src/pages/SendMessage.jsx` : `defaultCountry="BJ"` + placeholder `+229 94 11 94 76`

**Avant :**
```jsx
<PhoneInput defaultCountry="FR" placeholder="+33 6 12 34 56 78" />
```

**Après :**
```jsx
<PhoneInput defaultCountry="BJ" placeholder="+229 94 11 94 76" />
```

### 2. Icône Google avec couleurs officielles
**Fichier modifié :** `src/pages/Auth.jsx`

**Avant :** Icône monochrome (`fill="currentColor"`)

**Après :** Couleurs officielles Google
- Bleu (#4285F4)
- Vert (#34A853)  
- Jaune (#FBBC05)
- Rouge (#EA4335)

```jsx
<svg className="w-5 h-5" viewBox="0 0 24 24">
  <path fill="#4285F4" d="..." />  {/* Bleu */}
  <path fill="#34A853" d="..." />  {/* Vert */}
  <path fill="#FBBC05" d="..." />  {/* Jaune */}
  <path fill="#EA4335" d="..." />  {/* Rouge */}
</svg>
```

### 3. Amélioration gestion d'erreurs GitHub
**Fichier modifié :** `src/services/authService.js`

Ajout de messages d'erreur explicites :
- `auth/popup-closed-by-user` → "Connexion annulée"
- `auth/popup-blocked` → "Popup bloquée par le navigateur..."
- `auth/unauthorized-domain` → "Domaine non autorisé..."
- `auth/operation-not-allowed` → "GitHub OAuth non activé..."

```javascript
export async function signInWithGithub() {
  try {
    // ... code connexion
  } catch (error) {
    let errorMessage = error.message;
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Connexion annulée';
    } 
    // ... autres cas
    return { success: false, error: errorMessage };
  }
}
```

## 🔧 Configuration GitHub requise

⚠️ **Important :** Pour que la connexion GitHub fonctionne, il faut configurer GitHub OAuth dans Firebase Console.

**Documentation complète :** Voir `FIREBASE_GITHUB_SETUP.md`

**Étapes rapides :**
1. Firebase Console → Authentication → Sign-in method
2. Activer **GitHub** provider
3. Créer une OAuth App sur GitHub (https://github.com/settings/developers)
4. Copier Client ID et Client Secret dans Firebase
5. Ajouter l'URL callback Firebase dans GitHub

Sans cette configuration, l'erreur suivante apparaîtra :
```
GitHub OAuth non activé. Contactez l'administrateur.
```

## 📱 Résultat Final

### Page Auth
- ✅ Pays par défaut : **Bénin (BJ +229)**
- ✅ Icône Google avec **vraies couleurs**
- ✅ Messages d'erreur GitHub **explicites**
- ✅ Placeholder : `+229 94 11 94 76`

### Page Send Message  
- ✅ Pays par défaut : **Bénin (BJ +229)**
- ✅ Placeholder : `+229 94 11 94 76`

## 🧪 Tests recommandés

1. **Connexion Google** : Devrait fonctionner (déjà configuré)
2. **Connexion GitHub** : Nécessite configuration Firebase (voir doc)
3. **Connexion Phone** : Tester avec numéro béninois `+229 XX XX XX XX`
4. **Envoi message** : Tester avec numéro béninois par défaut

## 📝 Notes

- Le backend accepte déjà `github.com` dans `ALLOWED_PROVIDERS`
- Une fois GitHub configuré dans Firebase, tout fonctionnera automatiquement
- Les numéros béninois commencent par +229 (8 chiffres après l'indicatif)
