# 🚀 Quick Start Guide

Guide de démarrage rapide pour lancer l'application ENC en 5 minutes.

## ⚡ Démarrage Ultra-Rapide

```bash
# 1. Cloner et entrer dans le projet
git clone <your-repo-url>
cd boilerplate-enc-webapp

# 2. Lancer avec Docker
docker-compose up -d

# 3. Ouvrir dans le navigateur
open http://localhost:5173
```

C'est tout ! 🎉

## 📋 Checklist de Vérification

Après `docker-compose up -d`, vérifier que tous les services sont actifs :

```bash
docker-compose ps
```

Vous devriez voir :
- ✅ enc-backend (port 3000)
- ✅ enc-frontend (port 5173)
- ✅ enc-postgres (port 5432)
- ✅ enc-redis (port 6379)

## 🎮 Premiers Pas

### 1. Lancer la Simulation (30 secondes)

1. Ouvrir http://localhost:5173
2. Aller dans l'onglet **"Vessels"**
3. Cliquer sur **"Start Simulation"**
4. Observer les navires se déplacer sur la carte 🚢

### 2. Importer une Carte ENC (2 minutes)

1. Aller dans l'onglet **"Layers"**
2. Cliquer sur **"Upload ENC File (.000)"**
3. Sélectionner un fichier S-57
4. Attendre la conversion
5. Cliquer sur **"Show"** pour afficher la carte

### 3. Visualiser les Messages NMEA (10 secondes)

1. Aller dans l'onglet **"NMEA"**
2. Observer les messages en temps réel
3. Chaque message contient position, vitesse, cap

## 🔧 Commandes Utiles

```bash
# Voir les logs en temps réel
docker-compose logs -f

# Redémarrer un service
docker-compose restart backend

# Arrêter tout
docker-compose down

# Rebuild après modifications
docker-compose up -d --build

# Nettoyer complètement
docker-compose down -v
```

## 🐛 Problèmes Courants

### Le frontend ne se connecte pas au backend

```bash
# Vérifier que le backend est actif
curl http://localhost:3000/api/enc/layers

# Si erreur, voir les logs
docker-compose logs backend
```

### La conversion ENC échoue

```bash
# Vérifier que GDAL est installé dans le conteneur
docker-compose exec backend which ogr2ogr

# Tester manuellement
docker-compose exec backend ogr2ogr --version
```

### WebSocket ne se connecte pas

```bash
# Vérifier les variables d'environnement
docker-compose exec frontend env | grep VITE

# Devrait afficher :
# VITE_API_URL=http://localhost:3000
# VITE_WS_URL=ws://localhost:3000
```

## 📊 Tester l'API

```bash
# Lister les couches ENC
curl http://localhost:3000/api/enc/layers

# Upload un fichier ENC
curl -X POST http://localhost:3000/api/enc/upload \
  -F "file=@/path/to/chart.000"

# Récupérer le GeoJSON d'une couche
curl http://localhost:3000/api/enc/layers/1/geojson
```

## 🎯 Prochaines Étapes

1. **Personnaliser les styles** → Éditer `frontend/src/views/MapView.vue`
2. **Ajouter des capteurs** → Créer un nouveau module dans `backend/src/`
3. **Configurer la production** → Voir `README.md` section "Build Production"
4. **Intégrer des équipements réels** → Publier dans Redis

## 📚 Documentation Complète

Pour plus de détails, consulter [README.md](./README.md)

---

**Besoin d'aide ?** Ouvrir une issue sur GitHub 🙋‍♂️
