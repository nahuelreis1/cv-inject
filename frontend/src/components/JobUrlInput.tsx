import React, { useState } from 'react';
import { Plus, X, Link as LinkIcon, AlertCircle, Play } from 'lucide-react';

interface Props {
  onProcess: (urls: string[]) => void;
  preserveDesign: boolean;
  onPreserveDesignChange: (value: boolean) => void;
}

export default function JobUrlInput({ onProcess, preserveDesign, onPreserveDesignChange }: Props) {
  const [urls, setUrls] = useState<string[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUrl.trim()) return;

    if (!currentUrl.includes('linkedin.com/jobs')) {
      setError('Por favor ingresa una URL válida de LinkedIn Jobs.');
      return;
    }

    if (urls.includes(currentUrl)) {
      setError('Esta URL ya fue agregada.');
      return;
    }

    setUrls([...urls, currentUrl]);
    setCurrentUrl('');
  };

  const handleRemove = (indexToRemove: number) => {
    setUrls(urls.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-surface p-6 md:p-8 border border-white/5 shadow-xl">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">Agrega las vacantes</h3>
        <p className="text-text/60 text-sm">
          Pega los enlaces de LinkedIn Jobs. Generaremos un CV optimizado para cada una.
        </p>
      </div>

      <form onSubmit={handleAdd} className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <LinkIcon size={18} className="text-text/40" />
        </div>
        <input
          type="url"
          value={currentUrl}
          onChange={(e) => setCurrentUrl(e.target.value)}
          placeholder="https://www.linkedin.com/jobs/view/..."
          className="w-full bg-background border border-white/10 py-3 pl-11 pr-24 text-text placeholder:text-text/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
        />
        <button
          type="submit"
          disabled={!currentUrl.trim()}
          className="absolute inset-y-1.5 right-1.5 px-4 bg-primary/20 text-primary font-medium hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Agregar</span>
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 text-error text-sm mb-4 bg-error/10 p-3">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3 mb-8">
        {urls.map((url, index) => (
          <div key={index} className="flex items-center justify-between bg-background/50 border border-white/5 p-3 group">
            <div className="truncate pr-4 text-sm text-text/80">
              {url}
            </div>
            <button
              onClick={() => handleRemove(index)}
              className="text-text/40 hover:text-error transition-colors p-1 hover:bg-error/10"
              title="Eliminar"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        {urls.length === 0 && (
          <div className="text-center py-8 text-text/40 text-sm border border-dashed border-white/10">
            Aún no has agregado ninguna vacante.
          </div>
        )}
      </div>

      {/* Toggle: Preservar diseño original */}
      <div className="mb-6 p-4 bg-background/50 border border-white/5">
        <label className="flex items-center gap-4 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={preserveDesign}
              onChange={(e) => onPreserveDesignChange(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-12 h-6 transition-colors ${preserveDesign ? 'bg-primary' : 'bg-white/10'}`}>
              <div className={`w-5 h-5 bg-white shadow-md transform transition-transform mt-0.5 ${preserveDesign ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-text group-hover:text-primary transition-colors">
              Preservar el diseño original de mi CV
            </p>
            <p className="text-xs text-text/50 mt-0.5">
              Las keywords se inyectan en los márgenes de tu CV (microscópicas, invisibles al ojo humano).
            </p>
          </div>
        </label>
      </div>

      <button
        onClick={() => onProcess(urls)}
        disabled={urls.length === 0}
        className="w-full py-4 bg-primary text-background font-bold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,245,212,0.2)] disabled:shadow-none"
      >
        <Play size={20} />
        Procesar {urls.length > 0 ? `${urls.length} vacante${urls.length > 1 ? 's' : ''}` : ''}
      </button>
    </div>
  );
}