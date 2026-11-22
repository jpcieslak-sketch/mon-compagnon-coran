# Mon compagnon Coran — PWA

Application web installable (PWA) qui remplace le carnet papier de suivi de mémorisation
et de révision du Coran. 100 % hors-ligne, aucune donnée envoyée : tout reste dans le
navigateur (localStorage), avec export/import JSON.

## Fonctionnalités

- **Assistant de démarrage** : intention & motivation (comme la page 2 du carnet),
  état des lieux des 114 sourates (connue / oubliée / objectif), capacités
  (écoutes, lectures, minutes de révision par jour), objectifs hebdomadaires,
  jour de cours.
- **Aujourd'hui** : programme du jour généré automatiquement — mémorisation
  (méthode en 5 étapes du carnet : écouter, lire, réciter sans regarder),
  révisions dues (répétition espacée 1-2-3-5-7-14-30-60 jours), portion du cours,
  et **bilan du soir** à cocher.
- **Les 114 sourates** : grille interactive avec statuts, progression en sourates,
  versets et % du Coran.
- **Calendrier de l'année** : jours de cours générés automatiquement (jeudi par
  défaut), assignation d'une sourate/portion par cours, jours off modifiables.
- **Ma semaine** + rappel de la méthode d'apprentissage.
- **Notifications** : rappel du programme le matin, bilan le soir (lorsque
  l'app est en arrière-plan ouverte sur le téléphone ; le push à distance est
  prévu en V2).
- **Réglages** : export/import de sauvegarde, réinitialisation.

## Lancer

Aucun build ; c'est un site statique :

```bash
npx serve .        # ou python3 -m http.server 8080
```

Puis ouvrir http://localhost:8080 (le service worker exige http://localhost ou https).

Installer sur téléphone : ouvrir l'URL (en HTTPS, ex. GitHub Pages) puis
« Ajouter à l'écran d'accueil ».

## Hébergement gratuit recommandé

GitHub Pages, Netlify, ou tout hébergeur statique — déposer le contenu du dossier.

## Structure

```
index.html          écrans + assistant
css/style.css       thème émeraude & crème
js/data.js          114 sourates, statuts, méthode, invocations
js/store.js         persistance localStorage + export/import
js/schedule.js      calendrier annuel, tâches du jour, révision espacée, streak
js/app.js           logique des écrans + notifications
sw.js               cache hors-ligne + notifications
manifest.webmanifest
```

## V2 envisagée

- Gestion par portions/versets (longues sourates type Al-Baqara)
- Audio intégré (récitation en boucle, choix du récitant)
- Push à distance (serveur VAPID) pour les notifs app fermée
- Multi-profils / vue enseignant
