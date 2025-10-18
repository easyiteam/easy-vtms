# 🌊 ENC Maritime Web Application - Boilerplate

Boilerplate complet pour une application web de rendu ENC (Electronic Navigational Charts) avec données maritimes en temps réel (AIS, NMEA, radar).

## 🎯 Objectif

Ce projet sert de socle pour un système de surveillance maritime professionnel intégrant :
- Rendu de cartes ENC (S-57/S-101)
- Données AIS en temps réel
- Messages NMEA
- Fusion de données radar
- Architecture extensible et performante

## 🏗️ Architecture

### Stack Technique

**Backend:**
- NestJS (TypeScript)
- Socket.IO (WebSocket temps réel)
- PostgreSQL + PostGIS (données géospatiales)
- Redis (Pub/Sub)
- GDAL/OGR (conversion S-57 → GeoJSON)

**Frontend:**
- Vue 3 + Composition API
- Vite (build tool)
- TailwindCSS (styling)
- OpenLayers (cartographie)
- Pinia (state management)

**Infrastructure:**
- Docker + Docker Compose
- Multi-conteneurs (backend, frontend, postgres, redis)

## 📁 Structure du Projet

```
boilerplate-enc-webapp/
├── backend/                    # Backend NestJS
│   ├── src/
│   │   ├── enc/               # Module ENC (upload, conversion)
│   │   ├── realtime/          # Module WebSocket + NMEA
│   │   ├── redis/             # Service Redis
│   │   ├── scripts/           # Scripts utilitaires
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── data/                  # Données ENC converties
│   ├── Dockerfile
│   └── package.json
├── frontend/                   # Frontend Vue 3
│   ├── src/
│   │   ├── views/             # Pages (MapView)
│   │   ├── stores/            # Pinia stores
│   │   ├── router/            # Vue Router
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
├── data/                       # Volume partagé
│   ├── enc/                   # Fichiers GeoJSON
│   └── uploads/               # Uploads temporaires
├── docker-compose.yml
└── README.md
```

## 🚀 Démarrage Rapide

### Prérequis

- Docker & Docker Compose
- Node.js 18+ (pour développement local)
- Git

### Installation avec Docker (Recommandé)

1. **Cloner le repository**
```bash
git clone <your-repo-url>
cd boilerplate-enc-webapp
```

2. **Créer les fichiers d'environnement**
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

3. **Lancer tous les services**
```bash
docker-compose up -d
```

4. **Vérifier les services**
```bash
docker-compose ps
```

Les services seront disponibles sur :
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

### Installation Locale (Développement)

#### Backend

```bash
cd backend
npm install
cp .env.example .env

# Lancer PostgreSQL et Redis via Docker
docker-compose up -d postgres redis

# Lancer le backend
npm run start:dev
```

#### Frontend

```bash
cd frontend
npm install
cp .env.example .env

# Lancer le frontend
npm run dev
```

## 📖 Utilisation

### 1. Importer un Fichier ENC (.000)

**Via l'interface web:**
1. Ouvrir http://localhost:5173
2. Cliquer sur l'onglet "Layers"
3. Cliquer sur "Upload ENC File (.000)"
4. Sélectionner un fichier S-57 (.000 ou .s57)
5. Le fichier sera automatiquement converti en GeoJSON

**Via API:**
```bash
curl -X POST http://localhost:3000/api/enc/upload \
  -F "file=@/path/to/your/chart.000"
```

### 2. Visualiser les Couches ENC

1. Dans l'onglet "Layers", cliquer sur "Show" pour afficher une couche
2. La carte se centrera automatiquement sur la couche
3. Utiliser les contrôles de zoom et de navigation

### 3. Lancer la Simulation AIS/NMEA

**Via l'interface web:**
1. Aller dans l'onglet "Vessels"
2. Cliquer sur "Start Simulation"
3. Observer les navires se déplacer en temps réel

**Via script autonome:**
```bash
cd backend
npm run simulate
```

Ce script simule 3 navires avec des trajectoires différentes et publie les données dans Redis.

### 4. Visualiser les Messages NMEA

1. Aller dans l'onglet "NMEA"
2. Observer les messages NMEA RMC en temps réel
3. Chaque message contient : timestamp, position, vitesse, cap

### 5. Suivre un Navire

1. Dans l'onglet "Vessels", cliquer sur un navire
2. La carte se centrera automatiquement sur sa position

## 🔌 API Endpoints

### ENC Management

```
POST   /api/enc/upload           # Upload S-57 file
GET    /api/enc/layers           # List all layers
GET    /api/enc/layers/:id       # Get layer info
GET    /api/enc/layers/:id/geojson  # Get layer GeoJSON
DELETE /api/enc/layers/:id       # Delete layer
```

### WebSocket Events

**Client → Server:**
```javascript
socket.emit('nmea:send', { sentence: '$GPRMC,...' })
socket.emit('simulation:start')
socket.emit('simulation:stop')
```

**Server → Client:**
```javascript
socket.on('vessel:position', (data) => { ... })
socket.on('nmea:data', (data) => { ... })
socket.on('ais:data', (data) => { ... })
```

## 🔧 Configuration

### Variables d'Environnement

**Backend (.env):**
```env
NODE_ENV=development
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=enc_user
DATABASE_PASSWORD=enc_password
DATABASE_NAME=enc_db
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGIN=http://localhost:5173
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

## 🧪 Tests

```bash
# Backend
cd backend
npm run test
npm run test:e2e

# Frontend
cd frontend
npm run test
```

## 📦 Build Production

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
# Les fichiers sont dans dist/
```

## 🐳 Docker Commands

```bash
# Lancer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down

# Rebuild après modifications
docker-compose up -d --build

# Nettoyer les volumes
docker-compose down -v
```

## 🔍 Debugging

### Vérifier les logs

```bash
# Backend
docker-compose logs -f backend

# Frontend
docker-compose logs -f frontend

# PostgreSQL
docker-compose logs -f postgres

# Redis
docker-compose logs -f redis
```

### Accéder aux conteneurs

```bash
# Backend
docker-compose exec backend sh

# PostgreSQL
docker-compose exec postgres psql -U enc_user -d enc_db

# Redis
docker-compose exec redis redis-cli
```

### Vérifier la base de données

```bash
docker-compose exec postgres psql -U enc_user -d enc_db

# Dans psql:
\dt                          # Lister les tables
SELECT * FROM enc_layers;    # Voir les couches ENC
SELECT * FROM ais_tracks ORDER BY timestamp DESC LIMIT 10;
```

## 🎨 Personnalisation

### Ajouter un Nouveau Type de Capteur

1. **Backend:** Créer un nouveau module dans `backend/src/`
2. **Ajouter les entités TypeORM**
3. **Créer les événements WebSocket**
4. **Frontend:** Ajouter le store Pinia correspondant
5. **Mettre à jour l'interface MapView**

### Modifier le Style de Rendu ENC

Éditer `frontend/src/views/MapView.vue`, fonction `toggleLayer()`:

```typescript
const vectorLayer = new VectorLayer({
  source: vectorSource,
  style: new Style({
    stroke: new Stroke({
      color: '#YOUR_COLOR',
      width: 2,
    }),
    fill: new Fill({
      color: 'rgba(YOUR_COLOR, 0.2)',
    }),
  }),
})
```

### Ajouter des Équipements Réels

1. **Publier dans Redis:**
```typescript
// Exemple: Publier des données AIS réelles
await redisService.publish('ais:data', JSON.stringify({
  mmsi: '123456789',
  latitude: 48.1173,
  longitude: -1.6778,
  speed: 12.5,
  course: 45,
  timestamp: new Date(),
}))
```

2. **Le backend écoute automatiquement** via `RealtimeGateway`
3. **Le frontend reçoit** via WebSocket

## 🚧 Roadmap / Améliorations Futures

- [ ] Authentification JWT
- [ ] Historique AIS avec replay
- [ ] Intégration radar (fusion de pistes)
- [ ] Style S-52 complet pour ENC
- [ ] Support S-101 (nouvelle norme)
- [ ] Alertes et notifications
- [ ] Export de données
- [ ] Dashboard analytics
- [ ] Support multi-utilisateurs
- [ ] API REST complète pour intégrations tierces

## 📚 Ressources

### Standards Maritimes
- [IHO S-57](https://iho.int/en/s-57-enc-product-specification) - Electronic Navigational Charts
- [IHO S-52](https://iho.int/en/s-52-specifications-for-chart-content-and-display-aspects-of-ecdis) - ECDIS Display Specifications
- [NMEA 0183](https://www.nmea.org/content/STANDARDS/NMEA_0183_Standard) - Marine Data Protocol
- [AIS Protocol](https://www.itu.int/rec/R-REC-M.1371/en) - Automatic Identification System

### Technologies
- [NestJS Documentation](https://docs.nestjs.com/)
- [Vue 3 Documentation](https://vuejs.org/)
- [OpenLayers Documentation](https://openlayers.org/)
- [GDAL/OGR](https://gdal.org/)
- [PostGIS](https://postgis.net/)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

MIT License - voir le fichier LICENSE pour plus de détails

## 👥 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation
- Contacter l'équipe de développement

---

**Note:** Ce boilerplate est conçu pour être un point de départ professionnel. Adaptez-le selon vos besoins spécifiques et les exigences de votre projet SaaS de surveillance maritime.

🌊 **Bon développement maritime !** ⚓
