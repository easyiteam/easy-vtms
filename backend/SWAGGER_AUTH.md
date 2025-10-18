# 🔐 Swagger Basic Authentication

## Configuration

La documentation Swagger est maintenant protégée par **Basic Authentication** pour empêcher l'accès non autorisé à la documentation de l'API.

## Accès à la Documentation

### URL
**http://localhost:3000/api/docs**

### Identifiants par Défaut
- **Username**: `admin`
- **Password**: `vtms2025`

## Configuration des Identifiants

### Via Variables d'Environnement

Créez ou modifiez votre fichier `.env`:

```env
SWAGGER_USER=votre_username
SWAGGER_PASSWORD=votre_mot_de_passe_securise
```

### Recommandations de Sécurité

#### Développement
```env
SWAGGER_USER=admin
SWAGGER_PASSWORD=vtms2025
```

#### Production
```env
SWAGGER_USER=vtms_admin
SWAGGER_PASSWORD=un_mot_de_passe_tres_securise_et_complexe_123!@#
```

**⚠️ Important**: 
- Changez TOUJOURS les identifiants par défaut en production
- Utilisez un mot de passe fort (minimum 16 caractères)
- Ne commitez JAMAIS le fichier `.env` dans Git

## Routes Protégées

Les routes suivantes nécessitent une authentification:
- `/api/docs` - Interface Swagger UI
- `/api/docs-json` - Spécification OpenAPI JSON

## Fonctionnement

1. Lorsque vous accédez à `/api/docs`, votre navigateur affiche une popup de connexion
2. Entrez le username et password configurés
3. Le navigateur mémorise vos identifiants pour la session
4. Vous pouvez maintenant accéder à toute la documentation Swagger

## Désactiver l'Authentification (Non Recommandé)

Si vous devez désactiver l'authentification (uniquement en développement local):

1. Commentez les lignes dans `src/main.ts`:
```typescript
// app.use(
//   ['/api/docs', '/api/docs-json'],
//   basicAuth({
//     challenge: true,
//     users: {
//       [swaggerUser]: swaggerPassword,
//     },
//   }),
// );
```

## Test

```bash
# Démarrer le serveur
npm run start:dev

# Accéder à Swagger
open http://localhost:3000/api/docs

# Entrer les identifiants:
# Username: admin
# Password: vtms2025
```

## Intégration CI/CD

Pour les tests automatisés, utilisez les variables d'environnement:

```bash
export SWAGGER_USER=test_user
export SWAGGER_PASSWORD=test_password
npm run test:e2e
```

## Sécurité Additionnelle

Pour une sécurité renforcée en production:

1. **HTTPS obligatoire**: Assurez-vous que Swagger n'est accessible que via HTTPS
2. **IP Whitelisting**: Limitez l'accès à certaines IPs
3. **Rate Limiting**: Ajoutez un rate limiter sur `/api/docs`
4. **Rotation des mots de passe**: Changez régulièrement les identifiants
5. **Logs d'accès**: Surveillez les tentatives de connexion

## Dépendances

- `express-basic-auth`: ^1.2.1

## Support

En cas de problème:
1. Vérifiez que `express-basic-auth` est installé
2. Vérifiez les variables d'environnement
3. Consultez les logs du serveur
4. Testez avec les identifiants par défaut

---

**✅ Swagger est maintenant sécurisé avec Basic Auth!**
