function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const check = [
  ["1. Créer un compte",         "1-creer-un-compte"],
  ["2. Connecter votre numéro",  "2-connecter-votre-numero"],
  ["3. Récupérer votre clé API", "3-recuperer-votre-cle-api"],
  ["Conservation de la clé",    "conservation-de-la-cle"],
  ["Durée de validité",          "duree-de-validite"],
  ["Renouveler ou révoquer",     "renouveler-ou-revoquer"],
  ["Authentification",           "authentification"],
  ["Vérifier votre session",     "verifier-votre-session"],
  ["Variables d'environnement",  "variables-d-environnement"],
  ["Exemples par langage",       "exemples-par-langage"],
  ["Message texte",              "message-texte"],
  ["Diffusion à plusieurs destinataires", "diffusion-a-plusieurs-destinataires"],
  ["Envoyer dans un groupe",     "envoyer-dans-un-groupe"],
  ["Envoi avec média",           "envoi-avec-media"],
  ["Suivi du statut",            "suivi-du-statut"],
  ["Historique des envois",      "historique-des-envois"],
  ["Créer un groupe",            "creer-un-groupe"],
  ["Lister vos groupes",         "lister-vos-groupes"],
  ["Détail d'un groupe",         "detail-d-un-groupe"],
  ["Lien d'invitation",          "lien-d-invitation"],
  ["Ajouter des participants",   "ajouter-des-participants"],
  ["Codes d'erreur",             "codes-d-erreur"],
  ["Limites de débit",           "limites-de-debit"],
  ["Limites des médias",         "limites-des-medias"],
  ["Bonnes pratiques",           "bonnes-pratiques"],
  ["2. Absence d'affiliation",   "2-absence-d-affiliation"],
  ["3. Risque de bannissement",  "3-risque-de-bannissement"],
  ["5. Usages autorisés",        "5-usages-autorises"],
  ["6. Usages interdits",        "6-usages-interdits"],
  // reference-api.md h2 titles
  ["Envoi",    "envoi"],
  ["Groupes",  "groupes"],
  ["Session",  "session"],
  ["Plans",    "plans"],
  // introduction
  ["Ce que vous pouvez faire",   "ce-que-vous-pouvez-faire"],
  ["Fonctionnement général",     "fonctionnement-general"],
  ["Avant de commencer",         "avant-de-commencer"],
];

let ok = 0, fail = 0;
check.forEach(([title, nav]) => {
  const produced = slugify(title);
  if (produced !== nav) {
    console.log(`FAIL: "${title}" => "${produced}" (expected: "${nav}")`);
    fail++;
  } else {
    ok++;
  }
});
console.log(`\n${ok} OK, ${fail} FAIL`);
