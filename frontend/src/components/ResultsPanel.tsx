import React from 'react';
import { Download, Eye, CheckCircle, Building2, Briefcase } from 'lucide-react';
import { api, type GenerationResult } from '../lib/api';

interface Props {
  results: GenerationResult[];
  onPreview: (result: GenerationResult) => void;
  onReset: () => void;
  onNewCV: () => void;
}

export default function ResultsPanel({ results, onPreview, onReset, onNewCV }: Props) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-success/20 text-success mb-4">
          <CheckCircle size={32} />
        </div>
        <h2 className="text-3xl font-bold mb-2">¡Inyección Completada!</h2>
        <p className="text-text/70">Tus CVs han sido optimizados y están listos para burlar al ATS.</p>
      </div>

      <div className="grid gap-6 mb-10">
        {results.map((result, index) => (
          <div key={index} className="bg-surface border border-white/10 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-primary/30 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-text/60 mb-2">
                <Briefcase size={14} />
                <span className="truncate">{result.job_title || 'Vacante Analizada'}</span>
                <span className="mx-2">•</span>
                <Building2 size={14} />
                <span className="truncate">{result.company || 'Empresa'}</span>
              </div>
              
              <div className="flex items-center gap-4 mt-4">
                <div className="flex-1 h-2 bg-background overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-success" 
                    style={{ width: `${result.match_score}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-success">{result.match_score}% Match</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => onPreview(result)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-surface-light hover:bg-white/10 text-text transition-colors border border-white/5"
              >
                <Eye size={18} />
                <span>Ver Inyección</span>
              </button>
              <a
                href={result.error ? '#' : api.getDownloadUrl(result.generation_id)}
                download
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 transition-colors border ${
                  result.error 
                    ? 'bg-surface-light text-text/40 border-white/5 cursor-not-allowed' 
                    : 'bg-primary/20 text-primary hover:bg-primary/30 border-primary/20'
                }`}
              >
                <Download size={18} />
                <span>Descargar PDF</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button
          onClick={onReset}
          className="px-6 py-3 bg-surface border border-white/10 hover:bg-surface-light transition-colors font-medium"
        >
          Procesar más vacantes
        </button>
        <button
          onClick={onNewCV}
          className="px-6 py-3 bg-background border border-white/10 hover:bg-surface transition-colors font-medium text-text/70"
        >
          Subir otro CV base
        </button>
      </div>
    </div>
  );
}