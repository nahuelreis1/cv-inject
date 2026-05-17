# CV Prompt Injection Tool - n8n Workflows

Este directorio contiene los workflows de n8n para el proyecto **CV Prompt Injection Tool**.

## Workflows

### 1. CV LinkedIn Scraper (`cv-linkedin-scraper.json`)
Este workflow se encarga de extraer la información de una vacante de LinkedIn a partir de su URL y guardarla en la base de datos.

- **Trigger**: Webhook (POST `/webhook/cv-linkedin-scraper`)
  - Payload esperado: `{ "url": "https://linkedin.com/...", "job_id": "uuid-opcional" }`
- **Flujo**:
  1. Recibe la URL mediante el Webhook.
  2. Realiza un HTTP Request a LinkedIn usando un User-Agent realista para evitar bloqueos.
  3. Extrae el HTML del body.
  4. Utiliza Gemini 2.5 Flash para analizar el texto y extraer: título, empresa, requisitos, keywords y seniority.
  5. Parsea la respuesta de Gemini.
  6. Guarda los datos estructurados en la tabla `jobs` de Supabase.
  7. Responde al Webhook con los datos extraídos.

### 2. CV Generation Pipeline (`cv-generation-pipeline.json`)
Este workflow es el core de la aplicación. Toma un CV subido y una lista de vacantes, y genera las versiones optimizadas con prompt injection.

- **Trigger**: Webhook (POST `/webhook/cv-generation-pipeline`)
  - Payload esperado: `{ "cv_id": "uuid", "job_ids": ["uuid1", "uuid2"] }`
- **Flujo**:
  1. Recibe los IDs mediante el Webhook.
  2. Obtiene el CV original desde la tabla `cvs` en Supabase.
  3. Prepara un array para iterar sobre cada `job_id`.
  4. Inicia un loop (Split In Batches) para procesar cada vacante:
     - Obtiene los detalles de la vacante (`jobs`) desde Supabase.
     - **Gemini Matcher**: Analiza el match entre el CV y la vacante, identificando keywords faltantes.
     - **Gemini Injector**: Genera el texto de prompt injection (justificaciones invisibles) basado en las keywords faltantes.
     - **Gemini Rewriter**: Reescribe el CV para orientarlo mejor a la vacante.
     - Llama al backend (`POST /api/generate-cv`) para compilar el PDF final.
     - Actualiza el status de la generación a `completed` en Supabase.
  5. El loop continúa hasta procesar todas las vacantes.

### 3. Cleanup Old CVs (`cleanup-old-cvs.json`)
Este workflow es una tarea de mantenimiento para eliminar PDFs antiguos y ahorrar espacio en el Storage.

- **Trigger**: Schedule Trigger (Cron: `0 3 * * *` - Todos los días a las 3 AM)
- **Flujo**:
  1. Se ejecuta automáticamente según el cron.
  2. Consulta a Supabase las generaciones con más de 7 días de antigüedad y status `completed`.
  3. Inicia un loop para cada registro encontrado:
     - Realiza un HTTP Request a la API REST de Supabase Storage para eliminar el archivo PDF.
     - Actualiza el status del registro a `expired` en la base de datos.
     - Loggea la operación.

## Instalación

1. Abre tu instancia de n8n.
2. Ve a **Workflows** > **Add Workflow**.
3. Haz clic en el menú de opciones (tres puntos) arriba a la derecha y selecciona **Import from File**.
4. Selecciona los archivos JSON de este directorio.
5. Configura las credenciales necesarias (ver `credentials.md`).
6. Activa los workflows.