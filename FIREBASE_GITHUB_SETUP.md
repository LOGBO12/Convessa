# Configuration GitHub OAuth dans Firebase

## Problème
La connexion GitHub ne fonctionne pas car le provider GitHub n'est pas activé dans Firebase Console.

## Solution - Activer GitHub OAuth

### 1. Aller dans Firebase Console
Ouvrez https://console.firebase.google.com et sélectionnez le projet **whatsappservice-50e51**

### 2. Aller dans Authentication
Dans le menu de gauche :
- Cliquez sur **Build** → **Authentication**
- Allez dans l'onglet **Sign-in method**

### 3. Activer GitHub
1. Dans la liste des providers, trouvez **GitHub**
2. Cliquez sur **GitHub** pour ouvrir la configuration
3. Cliquez sur le bouton **Enable** (Activer)

### 4. Configurer GitHub OAuth App

#### 4.1 Créer une OAuth App sur GitHub
1. Allez sur https://github.com/settings/developers
2. Cliquez sur **OAuth Apps** → **New OAuth App**
3. Remplissez les champs :
   - **Application name**: `Convessa WhatsApp API`
   - **Homepage URL**: `http://localhost:5173` (ou votre domaine production)
   - **Authorization callback URL**: Copiez l'URL fournie par Firebase (exemple: `https://whatsappservice-50e51.firebaseapp.com/__/auth/handler`)
4. Cliquez sur **Register application**
5. Notez le **Client ID** et générez un **Client Secret**

#### 4.2 Configurer dans Firebase
1. Retournez dans Firebase Console → Authentication → GitHub
2. Collez le **Client ID** de GitHub
3. Collez le **Client Secret** de GitHub
4. Cliquez sur **Save** (Enregistrer)

### 5. Ajouter les domaines autorisés
Dans Firebase Console → Authentication → Settings → Authorized domains :
- Assurez-vous que `localhost` est présent (pour le développement)
- Ajoutez votre domaine de production si nécessaire

### 6. Tester
1. Retournez sur l'application : http://localhost:5173/auth
2. Cliquez sur **Continuer avec GitHub**
3. Autorisez l'application GitHub
4. Vous devriez être redirigé vers le dashboard

## Vérification Backend

Le backend accepte déjà GitHub dans `ALLOWED_PROVIDERS` :

```typescript
// whatsapp-service-convessa/src/api/routes/auth.ts
const ALLOWED_PROVIDERS = ['google.com', 'github.com']
```

Donc une fois configuré dans Firebase, tout fonctionnera automatiquement ! ✅

## Erreurs courantes

### "auth/operation-not-allowed"
→ GitHub provider n'est pas activé dans Firebase Console

### "auth/unauthorized-domain"
→ Le domaine n'est pas dans la liste des domaines autorisés

### "auth/popup-blocked"
→ Le navigateur bloque les popups. Autorisez-les pour localhost

## Alternative : Désactiver GitHub temporairement

Si vous ne voulez pas configurer GitHub tout de suite, vous pouvez retirer le bouton GitHub de `Auth.jsx` :

```jsx
// Commentez ou supprimez cette section dans src/pages/Auth.jsx
/*
<button onClick={() => handleSocialAuth('github')} ...>
  Continuer avec GitHub
</button>
*/
```
