@description('Azure-Region, in der die Ressourcen angelegt werden.')
param location string

@description('Basis-Name, aus dem die Ressourcennamen abgeleitet werden, z. B. "cocktail-orders-dev".')
param namePrefix string

@description('Vollständige Image-Referenz, z. B. ghcr.io/<owner>/<repo>-server:<tag>.')
param containerImage string

@description('Registry-Server, von dem das Image gezogen wird.')
param registryServer string = 'ghcr.io'

@description('Benutzername für den Registry-Login (z. B. GitHub-Benutzer-/Orgname).')
param registryUsername string

@description('Passwort/Token für den Registry-Login (z. B. ein GitHub PAT mit read:packages).')
@secure()
param registryPassword string

@description('Fertiger Postgres-Connection-String (z. B. von Neon), inkl. sslmode=require.')
@secure()
param databaseUrl string

@description('Passwort für den Barkeeper-Login.')
@secure()
param barkeeperPassword string

@description('API-Key für Groq (Freitext-Empfehlung).')
@secure()
param groqApiKey string

@description('Ursprung (Origin), den das Backend per CORS zulässt, z. B. https://<static-web-app>.azurestaticapps.net.')
param corsOrigin string

@description('Minimale Anzahl Replicas. 0 = Scale-to-Zero, spart Kosten in Ruhephasen.')
param minReplicas int = 0

@description('Maximale Anzahl Replicas.')
param maxReplicas int = 2

@description('Wie viele Tage Log Analytics die Log-Daten aufbewahrt. Kleinerer Wert = weniger Speicherkosten.')
param logRetentionInDays int = 30

// Log Analytics Workspace: Pflicht-Ziel für die Container-Logs der
// Environment. Ohne eigenes Application-Insights-Modul, da für dieses
// kleine Projekt reine Log-Sammlung reicht.
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${namePrefix}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: logRetentionInDays
  }
}

// Container Apps Environment: die verwaltete Laufzeitumgebung, in der die
// Container App läuft (vergleichbar mit einem AKS-Cluster, nur vollständig
// verwaltet - kein sichtbarer Node, kein kubectl).
resource containerAppEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${namePrefix}-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
  }
}

// Die Container App selbst: Backend (Express + WebSocket auf einem
// gemeinsamen Port, siehe server/index.js), Postgres-Migrationen laufen
// beim Containerstart automatisch (server/Dockerfile CMD).
resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: '${namePrefix}-server'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    configuration: {
      // "external: true" macht die App über eine öffentliche HTTPS-URL
      // erreichbar (nötig, damit das Static-Web-App-Frontend sie ansprechen
      // kann). "transport: auto" leitet auch WebSocket-Upgrades über
      // denselben Port durch.
      ingress: {
        external: true
        targetPort: 3001
        transport: 'auto'
        allowInsecure: false
      }
      registries: [
        {
          server: registryServer
          username: registryUsername
          passwordSecretRef: 'registry-password'
        }
      ]
      // Alle sensiblen Werte laufen über "secrets" statt als Klartext in
      // "env" zu stehen. Container Apps verschlüsselt sie at-rest und
      // maskiert sie in Logs/Portal.
      secrets: [
        {
          name: 'registry-password'
          value: registryPassword
        }
        {
          name: 'database-url'
          value: databaseUrl
        }
        {
          name: 'barkeeper-password'
          value: barkeeperPassword
        }
        {
          name: 'groq-api-key'
          value: groqApiKey
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'server'
          image: containerImage
          resources: {
            // Kleinstmögliche Container-Apps-Größe - reicht für dieses
            // Projekt mit wenig gleichzeitigem Traffic locker aus und hält
            // die Kosten niedrig.
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            { name: 'DATABASE_URL', secretRef: 'database-url' }
            { name: 'BARKEEPER_PASSWORD', secretRef: 'barkeeper-password' }
            { name: 'GROQ_API_KEY', secretRef: 'groq-api-key' }
            { name: 'CORS_ORIGIN', value: corsOrigin }
            { name: 'PORT', value: '3001' }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
      }
    }
  }
}

output containerAppFqdn string = containerApp.properties.configuration.ingress.fqdn
output containerAppUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
