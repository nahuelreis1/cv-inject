// Uses relative URL. In dev, Astro proxy forwards /api to backend.
// In production (same origin), /api hits the backend directly.
export const API_URL = '';

export interface CVUploadResponse {
  cv_id: string;
  filename: string;
  text_preview: string;
  pages: number;
}

export interface JobAnalysisResponse {
  job_id: string;
  title: string;
  company: string;
  requirements: string[];
  keywords: string[];
}

export interface GenerationResult {
  generation_id: string;
  job_id: string;
  download_url: string;
  match_score: number;
  preview_text: string;
  job_title?: string;
  company?: string;
  visible_text?: string;
  invisible_injections?: Record<string, string>;
  invisible_keywords?: string[];
  error?: string;
}

export interface GenerateCVResponse {
  generations: GenerationResult[];
}

export const api = {
  async uploadCV(file: File): Promise<CVUploadResponse> {
    const formData = new FormData();
    formData.append('cv', file);

    const res = await fetch(`${API_URL}/api/upload-cv`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Error al subir el CV');
    }

    return res.json();
  },

  async analyzeJob(url: string): Promise<JobAnalysisResponse> {
    const res = await fetch(`${API_URL}/api/analyze-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) {
      throw new Error('Error al analizar la vacante');
    }

    return res.json();
  },

  async generateCV(cvId: string, jobIds: string[], preserveDesign: boolean = true): Promise<GenerateCVResponse> {
    const res = await fetch(`${API_URL}/api/generate-cv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cv_id: cvId, job_ids: jobIds, preserve_design: preserveDesign }),
    });

    if (!res.ok) {
      throw new Error('Error al generar los CVs optimizados');
    }

    return res.json();
  },

  async batchProcess(file: File, urls: string[]): Promise<GenerateCVResponse> {
    const formData = new FormData();
    formData.append('cv', file);
    urls.forEach(url => formData.append('urls[]', url));

    const res = await fetch(`${API_URL}/api/batch-process`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Error en el procesamiento por lotes');
    }

    return res.json();
  },

  getDownloadUrl(generationId: string): string {
    return `${API_URL}/api/download/${generationId}`;
  }
};