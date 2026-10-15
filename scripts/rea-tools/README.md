# 🛠️ REA (Reverse Engineer Anything) en Antigravity

Guía de uso para clonar y analizar aplicaciones con **REA** directamente desde tu terminal y agente.

---

## 1. ¿Cómo ejecutar REA?

Ya está listo para usarse vía `npx` o usando el script ejecutable local:

```bash
# Opción 1: Directo con el wrapper del proyecto
./scripts/rea-tools/rea.sh <comando> [opciones]

# Opción 2: Con npx
npx rea-agents@latest <comando> [opciones]
```

Verificar versión instalada:
```bash
./scripts/rea-tools/rea.sh --version
# Salida esperada: 6.5.0
```

---

## 2. Casos de uso para "Clonar" o Extraer Apps

### A. Clonar / Inspeccionar una Web o Webapp existente
Para extraer cómo funciona un sitio o flujo (p. ej. un checkout, un cotizador, un editor):
```bash
./scripts/rea-tools/rea.sh inspect-web-page https://ejemplo.com
```

Para inspeccionar eventos y listeners (botones, formularios, lógica JS nativa):
```bash
./scripts/rea-tools/rea.sh inspect-web-event-listeners --url https://ejemplo.com --selector "button#submit"
```

Para analizar el tráfico de red / APIs capturado en un archivo `.har`:
```bash
./scripts/rea-tools/rea.sh inspect-web-network-capture --file ruta/al/archivo.har
```

---

### B. Clonar / Inspeccionar Apps de Escritorio (Electron / Slack / Notion / etc.)
Las aplicaciones de Electron contienen paquetes `.asar` con código JavaScript y React empaquetado:

```bash
# Recuperar y desenpaquetar el código fuente legible
./scripts/rea-tools/rea.sh recover-javascript-sources --path /Applications/AppEjemplo.app/Contents/Resources/app.asar
```

---

### C. Inspeccionar Base de Datos SQLite embebida de una App
Si una aplicación móvil o de escritorio guarda datos localmente:
```bash
./scripts/rea-tools/rea.sh inspect-sqlite-database --file ruta/a/basededatos.sqlite
```

---

### D. Rastrear una funcionalidad específica ("Trace")
Para rastrear cómo una función o palabra clave viaja por el código:
```bash
./scripts/rea-tools/rea.sh trace --query "calculateEscandallo"
```

---

## 3. ¿Cómo me pides ayuda a mí (el agente)?
Cuando quieras clonar una app o función:
1. Pon el archivo (APK, ASAR, binario o URL) en tu carpeta de trabajo.
2. Dime: *"Analiza esta app / URL con REA y muéstrame cómo implementan la función X para replicarla en nuestro proyecto"*.
3. Yo ejecutaré los comandos de REA en segundo plano, leeré los esquemas y lógica recuperada, y te escribiré el código nativo en React/Tailwind/Supabase listo para usar.
