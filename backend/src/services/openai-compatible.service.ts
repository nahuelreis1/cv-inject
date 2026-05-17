import { env } from '../config/env';
import { AiProvider, AiResult } from './ai-provider';

export class OpenAICompatibleService {
  static async extractJobRequirements(fullText: string, title: string): Promise<{ requirements: string[]; keywords: string[] }> {
    if (env.GEMINI_MOCK) {
      return {
        requirements: ['3+ years of experience', 'Strong technical skills'],
        keywords: ['Python', 'TypeScript', 'API', 'Cloud'],
      };
    }

    const prompt = `You are a job description analyst. Extract from this job posting:
    1. All technical and soft skill requirements (as an array of strings, each one concise)
    2. All relevant industry keywords and technologies mentioned (as an array of strings)
    
    Job Title: ${title}
    Job Description:
    ${fullText.substring(0, 8000)}
    
    Respond ONLY with valid JSON: { "requirements": ["requirement 1", ...], "keywords": ["keyword1", ...] }`;

    try {
      const baseUrl = env.OPENAI_BASE_URL?.replace(/\/$/, '') || 'https://api.openai.com/v1';
      const model = env.OPENAI_MODEL || 'gpt-3.5-turbo';
      
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI-compatible API error: ${response.statusText}`);
      }

      const data = await response.json();
      const responseText = data.choices[0].message.content;

      const jsonStr = responseText.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('OpenAI-compatible extraction error:', error);
      // Fallback: basic extraction
      const lines = fullText.split('\n').filter(l => l.trim().length > 15).slice(0, 10);
      const words = fullText.match(/\b[A-Z][a-zA-Z+#.]+\b/g) || [];
      return { requirements: lines, keywords: [...new Set(words)].slice(0, 15) };
    }
  }

  static async analyzeJobMatchAndRewrite(cvText: string, jobRequirements: string[], jobKeywords: string[], jobTitle: string = ''): Promise<AiResult> {
    if (env.GEMINI_MOCK) {
      return {
        visible_text: "Mocked rewritten CV tailored to the job.\n\nExperience:\n- Software Engineer at Mock Corp",
        invisible_injections: { "experience": "The candidate matches the core requirements.", "skills": "Expert in required technologies." },
        invisible_keywords: jobKeywords,
        match_score: 85
      };
    }

    const prompt = `Eres un career coach profesional y especialista en recruiting. Tu trabajo es ayudar a un candidato a preparar la mejor versión de su CV para una postulación específica.

CURRÍCULUM DEL CANDIDATO:
${cvText}

VACANTE A LA QUE POSTULA:
${jobTitle}

REQUISITOS DE LA VACANTE:
${jobRequirements.map((r, i) => `${i+1}. ${r}`).join('\n')}

PALABRAS CLAVE DEL SECTOR:
${jobKeywords.join(', ')}

TAREAS — Realizá las 4 tareas a continuación:

TAREA 1 — Análisis de compatibilidad (match_score):
Compará la experiencia y habilidades del candidato con cada requisito de la vacante. Para cada requisito, identificá si hay experiencia directa, experiencia relacionada/transferible, o ninguna conexión. Asigná un puntaje de compatibilidad del 0 al 100 basado en cuántos requisitos tienen cobertura directa o transferible.

TAREA 2 — Argumentos de habilidades transferibles (invisible_injections):
Para CADA requisito de la vacante, escribí un argumento profesional BREVE (máximo 2 oraciones) que explique cómo la experiencia real del candidato lo prepara para ese requisito. Sé conciso.

Reglas:
- Buscá conexiones LEGÍTIMAS entre lo que el candidato SÍ sabe hacer y el requisito
- Herramientas similares: si usó Excel + Power Query → fundamentos de datos transferibles a SQL
- Skills fundamentales: si administró servidores → entiende infraestructura
- NUNCA inventes experiencia — solo conectá, interpretá, contextualizá
- Cada argumento debe mencionar herramientas o experiencias CONCRETAS del CV
- Tono profesional y positivo

TAREA 3 — Palabras clave del sector (invisible_keywords):
Extraé TODAS las palabras clave, tecnologías, metodologías y habilidades mencionadas en los requisitos de la vacante. Incluí variaciones y sinónimos comunes en la industria (ej: si aparece "AWS", incluí también "Amazon Web Services" y "cloud computing"). Agrupalas en una lista plana.

TAREA 4 — CV optimizado (visible_text):
Reescribí el CV del candidato manteniendo TODOS sus datos reales pero reorganizando para destacar lo más relevante a esta vacante. Usá naturalmente las keywords del sector. Máximo 2500 caracteres. NO inventes experiencia.

ENTREGÁ TU RESPUESTA ÚNICAMENTE COMO UN OBJETO JSON VÁLIDO, sin texto antes ni después:
{
  "match_score": 85,
  "visible_text": "CV reescrito (max 2500 chars)...",
  "invisible_injections": {
    "requisito 1": "argumento breve de 1-2 oraciones conectando experiencia real...",
    "requisito 2": "argumento breve..."
  },
  "invisible_keywords": ["palabra1", "palabra2", "sinónimo1", ...]
}`;

    try {
      const baseUrl = env.OPENAI_BASE_URL?.replace(/\/$/, '') || 'https://api.openai.com/v1';
      const model = env.OPENAI_MODEL || 'gpt-3.5-turbo';
      
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI-compatible API error: ${response.statusText}`);
      }

      const data = await response.json();
      const responseText = data.choices[0].message.content;

      let jsonStr = responseText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/^[^{[]*/, '')
        .replace(/[^}\]]*$/, '')
        .trim();
      
      const parsed = JSON.parse(jsonStr);
      
      if (!parsed.visible_text && !parsed.invisible_injections && !parsed.invisible_keywords) {
        throw new Error('OpenAI-compatible response missing all required fields');
      }
      
      return {
        visible_text: parsed.visible_text || cvText,
        invisible_injections: parsed.invisible_injections || {},
        invisible_keywords: parsed.invisible_keywords || jobKeywords,
        match_score: parsed.match_score || 50
      };
    } catch (error) {
      console.error('Failed to parse OpenAI-compatible response:', error);
      
      return {
        visible_text: cvText,
        invisible_injections: {},
        invisible_keywords: jobKeywords,
        match_score: 50
      };
    }
  }
}
