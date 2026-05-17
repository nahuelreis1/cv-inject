# CV Prompt Injection Tool - IA Layer

Esta carpeta contiene la capa de Inteligencia Artificial para el proyecto **CV Prompt Injection Tool**, diseñada para operar con Google Gemini 2.5 Flash.

## Arquitectura de Agentes

El sistema utiliza un flujo de 4 agentes especializados para procesar la vacante, evaluar el CV, generar inyecciones invisibles y reescribir el texto visible.

### 1. Job Analyzer (`agents/job-analyzer.prompt.md`)
- **Objetivo**: Extraer datos estructurados de una descripción de vacante (LinkedIn, etc.).
- **Input**: Texto plano de la vacante.
- **Output**: JSON con título, seniority, skills (must-have/nice-to-have) y keywords ATS.

### 2. CV Matcher (`agents/cv-matcher.prompt.md`)
- **Objetivo**: Evaluar la compatibilidad real entre el CV y la vacante.
- **Input**: CV parseado + JSON del Job Analyzer.
- **Output**: JSON con match score (0-100), fortalezas, gaps y keywords sugeridas para inyección.

### 3. Injection Generator (`agents/injection-generator.prompt.md`) 🌟 *Core Feature*
- **Objetivo**: Crear justificaciones persuasivas que conecten habilidades reales con requisitos faltantes.
- **Input**: Gaps identificados + fragmentos del CV original.
- **Output**: JSON array con textos de justificación diseñados para ser inyectados como texto invisible (#FFFFFF) en el PDF final.
- **Regla de Oro**: NUNCA inventar experiencia. Siempre buscar conexiones legítimas (ej. Excel avanzado -> SQL).

### 4. CV Rewriter (`agents/cv-rewriter.prompt.md`)
- **Objetivo**: Optimizar el texto visible del CV para el reclutador humano.
- **Input**: CV original + JSON del Job Analyzer.
- **Output**: JSON con el CV reestructurado, enfatizando logros relevantes e integrando keywords de forma natural.

## Configuración y Templates

- `templates/gemini-config.ts`: Configuración optimizada para Gemini 2.5 Flash (Temperatura 0.3 para consistencia en JSON, maxOutputTokens 4096).
- `templates/injection-examples.json`: Ejemplos Few-Shot para el Injection Generator, cubriendo casos comunes de transferencia de habilidades (Excel->SQL, JS->TS, etc.).

## Flujo de Ejecución (Pipeline)

1. El usuario sube su CV (PDF) y pega la URL/texto de la vacante.
2. El backend extrae el texto del PDF.
3. Se ejecuta el **Job Analyzer** sobre la vacante.
4. Se ejecuta el **CV Matcher** comparando ambos textos.
5. En paralelo:
   - Se ejecuta el **Injection Generator** para crear el texto invisible basado en los gaps.
   - Se ejecuta el **CV Rewriter** para mejorar el texto visible.
6. El backend ensambla el nuevo PDF combinando el texto reescrito (visible) y las justificaciones inyectadas (invisible).

## Costos Estimados (Gemini 2.5 Flash)

- **Job Analyzer**: ~800 tokens in / ~200 tokens out
- **CV Matcher**: ~1500 tokens in / ~150 tokens out
- **Injection Generator**: ~2000 tokens in (con few-shot) / ~300 tokens out
- **CV Rewriter**: ~1500 tokens in / ~800 tokens out
- **Total por CV**: ~5800 tokens in / ~1450 tokens out (Costo extremadamente bajo, ideal para escalar).
