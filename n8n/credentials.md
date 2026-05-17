# Guía de Credenciales y Variables de Entorno - n8n

Para que los workflows de **CV Prompt Injection Tool** funcionen correctamente, es necesario configurar las siguientes credenciales y variables de entorno en tu instancia de n8n.

## 1. Credenciales en n8n

Debes crear estas credenciales desde la sección **Credentials** en el panel lateral de n8n.

### Supabase API (`supabaseApi`)
Utilizada para interactuar con la base de datos PostgreSQL y el Storage de Supabase.
- **Tipo**: Supabase API
- **Host**: La URL de tu proyecto Supabase (ej: `https://xyz.supabase.co`)
- **Service Role Secret / API Key**: Tu `service_role` key de Supabase (necesaria para saltar RLS en tareas de background como el cleanup).

### Google Gemini API (`googleGeminiApi`)
Utilizada por los nodos de IA para extraer datos, hacer matching y reescribir CVs.
- **Tipo**: Google Gemini API
- **API Key**: Tu clave de API de Google AI Studio.

## 2. Variables de Entorno

El workflow de Cleanup utiliza la API REST de Supabase Storage mediante un nodo HTTP Request. Para que la URL se construya correctamente, debes inyectar la siguiente variable de entorno en tu contenedor/instancia de n8n:

- `SUPABASE_URL`: La URL base de tu proyecto Supabase (ej: `https://xyz.supabase.co`).

*Nota: Si usas Coolify, puedes agregar esta variable en la sección "Environment Variables" del servicio de n8n.*

## 3. Conexión con el Backend

En el workflow `cv-generation-pipeline.json`, el nodo **Backend Generate CV** hace una petición HTTP al backend de la aplicación.

Por defecto, la URL está configurada como `http://backend:3000/api/generate-cv` (asumiendo que n8n y el backend están en la misma red de Docker/Coolify). 
Si tu backend está expuesto en un dominio público o en otra IP, debes actualizar la URL en ese nodo específico dentro del workflow.