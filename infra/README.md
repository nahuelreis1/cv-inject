# CV Prompt Injection Tool - Infraestructura

Este directorio contiene la configuración de infraestructura para levantar el proyecto localmente y para su despliegue en producción.

## Requisitos Previos

- Docker y Docker Compose instalados.
- Credenciales de Supabase (URL, Anon Key, Service Key).
- API Key de Gemini.

## Estructura de Archivos

- `Dockerfile.frontend`: Multi-stage build para el frontend en Astro SSR (optimizado con node:20-alpine).
- `Dockerfile.backend`: Multi-stage build para el backend en Express (optimizado con node:20-alpine).
- `docker-compose.yml`: Orquestación de servicios (Frontend, Backend, n8n) con red interna y health checks.
- `.env.example`: Plantilla de variables de entorno requeridas.
- `coolify.config.json` / `coolify.md`: Configuración e instrucciones paso a paso para el despliegue en Coolify.

## Desarrollo Local

1. Copiar el archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```

2. Completar las variables en el archivo `.env` con tus credenciales reales.

3. Levantar los servicios:
   ```bash
   docker-compose up -d --build
   ```

4. Verificar que los servicios estén corriendo:
   - **Frontend**: `http://localhost:4321`
   - **Backend Health Check**: `curl http://localhost:3000/api/health`
   - **n8n**: `http://localhost:5678`

## Troubleshooting Común

- **Error de puertos en uso**: Asegúrate de que los puertos `3000`, `4321` y `5678` estén libres en tu máquina antes de levantar los contenedores.
- **n8n no tiene permisos de escritura**: Verifica los permisos del volumen de Docker para n8n (`n8n_data`).
- **El frontend no se conecta al backend**: Revisa que `PUBLIC_API_URL` esté apuntando correctamente a `http://backend:3000` dentro de la red de Docker (para SSR), o a `http://localhost:3000` si accedes desde el navegador localmente (dependiendo de cómo Astro haga el fetch en SSR vs Client).
- **Contenedores se reinician constantemente**: Revisa los logs con `docker-compose logs -f <servicio>` para identificar errores de inicio (ej. variables de entorno faltantes).