# 📝 Audit Log - Guide d'Utilisation

## Architecture

Le système d'audit logging utilise un **Interceptor** et un **Decorator** pour automatiser la journalisation des actions utilisateur.

### Composants

1. **`@AuditLog` Decorator** - Marque les endpoints à auditer
2. **`AuditLogInterceptor`** - Intercepte les requêtes et crée les logs automatiquement
3. **`SecurityService`** - Service pour gérer les logs d'audit

## Utilisation

### Import

```typescript
import { AuditLog } from '@/security/decorators';
import { AuditAction, AuditEntity } from '@/security/entities/audit-log.entity';
```

### Exemples

#### 1. Créer un Navire

```typescript
@Post('vessels')
@AuditLog({ 
  action: AuditAction.CREATE, 
  entity: AuditEntity.VESSEL,
  description: 'Create new vessel'
})
async createVessel(@Body() vesselData: CreateVesselDto) {
  return this.vesselService.create(vesselData);
}
```

#### 2. Mettre à Jour un Navire

```typescript
@Put('vessels/:id')
@AuditLog({ 
  action: AuditAction.UPDATE, 
  entity: AuditEntity.VESSEL 
})
async updateVessel(@Param('id') id: string, @Body() data: UpdateVesselDto) {
  return this.vesselService.update(id, data);
}
```

#### 3. Supprimer un Navire

```typescript
@Delete('vessels/:id')
@AuditLog({ 
  action: AuditAction.DELETE, 
  entity: AuditEntity.VESSEL,
  description: 'Delete vessel from system'
})
async deleteVessel(@Param('id') id: string) {
  return this.vesselService.delete(id);
}
```

#### 4. Exporter des Données

```typescript
@Get('export')
@AuditLog({ 
  action: AuditAction.EXPORT, 
  entity: AuditEntity.VESSEL 
})
async exportVessels(@Query('format') format: string) {
  return this.vesselService.export(format);
}
```

#### 5. Login Utilisateur

```typescript
@Post('auth/login')
@AuditLog({ 
  action: AuditAction.LOGIN, 
  entity: AuditEntity.USER 
})
async login(@Body() credentials: LoginDto) {
  return this.authService.login(credentials);
}
```

## Actions Disponibles

```typescript
enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXPORT = 'export',
  IMPORT = 'import',
}
```

## Entités Disponibles

```typescript
enum AuditEntity {
  VESSEL = 'vessel',
  ALERT = 'alert',
  MESSAGE = 'message',
  BERTH = 'berth',
  RESERVATION = 'reservation',
  PILOT_SERVICE = 'pilot_service',
  USER = 'user',
  ENC = 'enc',
  SYSTEM = 'system',
}
```

## Ce qui est Automatiquement Capturé

L'interceptor capture automatiquement:

- ✅ **User ID** - ID de l'utilisateur (si authentifié)
- ✅ **User Name** - Nom de l'utilisateur
- ✅ **IP Address** - Adresse IP de la requête
- ✅ **User Agent** - Navigateur/client utilisé
- ✅ **Method** - HTTP method (GET, POST, PUT, DELETE)
- ✅ **URL** - Endpoint appelé
- ✅ **Entity ID** - ID de l'entité (depuis params ou body)
- ✅ **Request Body** - Données envoyées (sauf GET)
- ✅ **Duration** - Temps d'exécution
- ✅ **Status Code** - Code de réponse HTTP
- ✅ **Success/Failure** - Si l'opération a réussi
- ✅ **Error Message** - Message d'erreur si échec

## Exemple Complet - Port Controller

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditLog } from '@/security/decorators';
import { AuditAction, AuditEntity } from '@/security/entities/audit-log.entity';

@ApiTags('berths')
@Controller('api/port/berths')
export class BerthController {
  
  @Get()
  @AuditLog({ action: AuditAction.READ, entity: AuditEntity.BERTH })
  async getAllBerths() {
    return this.berthService.findAll();
  }

  @Post()
  @AuditLog({ 
    action: AuditAction.CREATE, 
    entity: AuditEntity.BERTH,
    description: 'Create new berth'
  })
  async createBerth(@Body() data: CreateBerthDto) {
    return this.berthService.create(data);
  }

  @Put(':id')
  @AuditLog({ action: AuditAction.UPDATE, entity: AuditEntity.BERTH })
  async updateBerth(@Param('id') id: string, @Body() data: UpdateBerthDto) {
    return this.berthService.update(id, data);
  }

  @Delete(':id')
  @AuditLog({ 
    action: AuditAction.DELETE, 
    entity: AuditEntity.BERTH,
    description: 'Delete berth from port'
  })
  async deleteBerth(@Param('id') id: string) {
    return this.berthService.delete(id);
  }
}
```

## Consulter les Logs

### Via API

```bash
# Tous les logs
GET /api/security/audit

# Filtrer par utilisateur
GET /api/security/audit?userId=user123

# Filtrer par action
GET /api/security/audit?action=delete

# Filtrer par entité
GET /api/security/audit?entity=vessel

# Filtrer par période
GET /api/security/audit?startDate=2025-01-01&endDate=2025-12-31

# Limiter les résultats
GET /api/security/audit?limit=50
```

### Via Base de Données

```sql
-- Tous les logs d'un utilisateur
SELECT * FROM audit_logs WHERE user_id = 'user123' ORDER BY created_at DESC;

-- Toutes les suppressions
SELECT * FROM audit_logs WHERE action = 'delete' ORDER BY created_at DESC;

-- Logs avec erreurs
SELECT * FROM audit_logs WHERE is_success = false ORDER BY created_at DESC;

-- Top utilisateurs par activité
SELECT user_name, COUNT(*) as actions 
FROM audit_logs 
GROUP BY user_name 
ORDER BY actions DESC 
LIMIT 10;
```

## Avantages

✅ **Automatique** - Pas besoin d'appeler manuellement le service
✅ **Déclaratif** - Simple décorateur sur les endpoints
✅ **Complet** - Capture automatiquement toutes les infos
✅ **Erreurs** - Log aussi les échecs
✅ **Performance** - Temps d'exécution capturé
✅ **GDPR** - Conformité avec anonymisation
✅ **Sécurité** - Traçabilité complète

## Configuration

### Désactiver pour un Endpoint

Simplement ne pas ajouter le décorateur `@AuditLog`:

```typescript
@Get('public/status')
async getStatus() {
  // Pas de log d'audit pour cet endpoint
  return { status: 'ok' };
}
```

### Désactiver Globalement

Dans `.env`:

```env
ENABLE_AUDIT_LOG=false
```

Puis dans `SecurityService`:

```typescript
async logAudit(entry: AuditLogEntry): Promise<AuditLog> {
  if (process.env.ENABLE_AUDIT_LOG === 'false') {
    return null;
  }
  // ...
}
```

## Bonnes Pratiques

1. ✅ **Toujours auditer** les opérations sensibles (CREATE, UPDATE, DELETE)
2. ✅ **Auditer les exports** de données (GDPR)
3. ✅ **Auditer les logins/logouts**
4. ✅ **Descriptions claires** pour faciliter la compréhension
5. ❌ **Ne pas auditer** les endpoints publics simples (health check, status)
6. ❌ **Ne pas auditer** les GET de liste (trop de logs)
7. ✅ **Auditer** les GET d'entités spécifiques sensibles

---

**✅ Audit Logging Automatique Configuré!**
