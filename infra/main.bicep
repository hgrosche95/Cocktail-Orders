targetScope = 'resourceGroup'

@description('Azure-Region für die meisten Ressourcen (Container Apps, Log Analytics).')
param location string = resourceGroup().location

@description('Region für die Static Web App. Static Web Apps sind nur in wenigen Regionen verfügbar, deshalb ein eigener Parameter statt der allgemeinen "location".')
param staticWebAppLocation string = 'westeurope'

@description('Basis-Name für alle Ressourcen, z. B. "cocktail-orders-dev". Fließt in global-eindeutige Namen (Static Web App) mit ein.')
param namePrefix string

@description('Vollständige Backend-Image-Referenz, z. B. ghcr.io/<owner>/cocktail-orders-server:<tag>.')
param containerImage string

@description('Benutzername für den GHCR-Login (z. B. GitHub-Benutzer-/Orgname).')
param registryUsername string

@description('Passwort/Token für den GHCR-Login (z. B. ein GitHub PAT mit read:packages).')
@secure()
param registryPassword string

@description('Fertiger Postgres-Connection-String fürs Backend (z. B. von Neon), inkl. sslmode=require.')
@secure()
param databaseUrl string

@description('Passwort für den Barkeeper-Login.')
@secure()
param barkeeperPassword string

module staticWebApp 'modules/static-web-app.bicep' = {
  name: 'static-web-app-deployment'
  params: {
    location: staticWebAppLocation
    namePrefix: namePrefix
  }
}

module containerApp 'modules/container-app.bicep' = {
  name: 'container-app-deployment'
  params: {
    location: location
    namePrefix: namePrefix
    containerImage: containerImage
    registryUsername: registryUsername
    registryPassword: registryPassword
    databaseUrl: databaseUrl
    barkeeperPassword: barkeeperPassword
    corsOrigin: 'https://${staticWebApp.outputs.staticWebAppDefaultHostname}'
  }
}

output containerAppUrl string = containerApp.outputs.containerAppUrl
output staticWebAppName string = staticWebApp.outputs.staticWebAppName
output staticWebAppDefaultHostname string = staticWebApp.outputs.staticWebAppDefaultHostname
