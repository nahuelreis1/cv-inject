# CV Prompt Injection Tool

> Optimiza tu CV para sistemas ATS con IA. 1 comando, 0 configuración.

## Quick Start

```bash
git clone https://github.com/nahuelreis1/cv-inject.git
cd cv-inject
npm start
```

La primera vez te pedirá tu API key de IA. Después, abrí http://localhost:4321.

## ¿Qué es CV Prompt Injection?

Las empresas usan IAs para filtrar CVs automáticamente. El 75% de los currículums son descartados antes de que un humano los lea. Esta herramienta nivela la cancha usando **Prompt Injection**: inyecta texto blanco invisible (color #FFFFFF, tamaño 1pt) en tu PDF con keywords y justificaciones. El reclutador humano ve tu CV normal. El ATS lee al candidato perfecto.

## Proveedores de IA

| Proveedor | Precio | Obtener API Key |
|-----------|--------|----------------|
| Google Gemini | Gratis (15 RPM) | https://aistudio.google.com/apikey |
| DeepSeek | ~$0.14/1M tokens | https://platform.deepseek.com |
| OpenAI-compatible | Variable | Cualquier endpoint (Qwen, Groq, Ollama) |

## ¿Cómo funciona?

1. Subí tu CV en PDF
2. Pegá la URL de la vacante (o el texto)
3. La IA genera un PDF con keywords invisibles para ATS
4. El reclutador humano ve tu CV normal. El ATS ve al candidato perfecto.

## Modo sin API Key (prueba)

Para probar la herramienta sin una API key real:

```bash
# Edita backend/.env y agrega:
GEMINI_MOCK=true
```

Luego `npm start` de nuevo. Usará datos de prueba.

## Stack

- Frontend: Astro 5 + React 19 + Tailwind CSS 4
- Backend: Express.js + TypeScript
- PDF: pdf-parse + pdf-lib
- IA: Gemini / DeepSeek / OpenAI-compatible

## Estructura del proyecto

```
cv-inject/
├── package.json          ← npm start orquesta todo
├── setup.js              ← wizard interactivo (API key)
├── backend/
│   └── src/
│       ├── services/     ← IA (Gemini, DeepSeek, OpenAI), PDF
│       ├── routes/       ← API REST
│       └── db/           ← memory-store (sin PostgreSQL)
├── frontend/
│   └── src/
│       ├── pages/        ← Astro pages
│       └── components/   ← React (uploader, preview, results)
├── database/
│   └── schema.sql        ← Schema PostgreSQL (opcional)
└── infra/
    └── docker-compose.yml ← Docker (opcional)
```
