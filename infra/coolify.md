# Despliegue en Coolify

Esta guía detalla los pasos para desplegar los servicios del proyecto **CV Prompt Injection Tool** utilizando Coolify.

## 1. Frontend (Astro SSR)

1. En el panel de Coolify, crea un nuevo recurso seleccionando **"Docker based"**.
2. Selecciona el repositorio de GitHub del proyecto.
3. Configura el **Build Pack** como `Dockerfile`.
4. Establece el **Dockerfile path** a `/infra/Dockerfile.frontend`.
5. Establece el **Base Directory** a `/frontend`.
6. Configura el puerto expuesto a `4321`.
7. Asigna el dominio correspondiente (ej. `https://cv-inject.nrlabs.com.ar`).
8. En la sección de **Environment Variables**, agrega:
   - `PUBLIC_API_URL` (apuntando a la URL pública del backend, ej. `https://api.cv-inject.nrlabs.com.ar`).

## 2. Backend (Express)

1. Crea un nuevo recurso seleccionando **"Docker based"**.
2. Selecciona el repositorio de GitHub del proyecto.
3. Configura el **Build Pack** como `Dockerfile`.
4. Establece el **Dockerfile path** a `/infra/Dockerfile.backend`.
5. Establece el **Base Directory** a `/backend`.
6. Configura el puerto expuesto a `3000`.
7. Asigna el dominio correspondiente (ej. `https://api.cv-inject.nrlabs.com.ar`).
8. En la sección de **Environment Variables**, agrega todas las variables necesarias:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `GEMINI_API_KEY`
   - `STORAGE_BUCKET_CV_UPLOADS=cv-uploads`
   - `STORAGE_BUCKET_CV_OUTPUTS=cv-outputs`

## 3. n8n

1. Crea un nuevo servicio desde los **Templates** de Coolify buscando "n8n".
2. Asigna un dominio (ej. `https://n8n.cv-inject.nrlabs.com.ar`).
3. Configura las variables de entorno necesarias para n8n:
   - `N8N_ENCRYPTION_KEY`
   - `SUPABASE_URL`
   - `GEMINI_API_KEY`
   - `WEBHOOK_URL` (apuntando al dominio de n8n, ej. `https://n8n.cv-inject.nrlabs.com.ar/`)
4. Asegúrate de que el volumen de datos persistente esté configurado correctamente para `/home/node/.n8n`.