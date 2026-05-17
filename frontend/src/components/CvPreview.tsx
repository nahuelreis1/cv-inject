import React, { useState } from 'react';
import { X, Eye, EyeOff, Info, Target, Key, FileText } from 'lucide-react';
import type { GenerationResult } from '../lib/api';

interface Props {
  result: GenerationResult;
  onClose: () => void;
}

export default function CvPreview({ result, onClose }: Props) {
  const [showInvisible, setShowInvisible] = useState(true);
  const [tab, setTab] = useState<'visible' | 'invisible' | 'keywords'>('visible');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-background/95" onClick={onClose}></div>
      
      <div className="relative w-full max-w-4xl bg-surface border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-surface z-10">
          <div>
            <h3 className="text-xl font-bold">CV Optimizado</h3>
            <p className="text-sm text-text/60">
              {result.job_title || 'Vacante'} · {result.company || 'Empresa'} · Match: {result.match_score}%
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 text-text/60 hover:text-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(['visible', 'invisible', 'keywords'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === t
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-text/50 hover:text-text'
              }`}
            >
              {t === 'visible' && <FileText size={14} />}
              {t === 'invisible' && <EyeOff size={14} />}
              {t === 'keywords' && <Key size={14} />}
              {t === 'visible' ? 'CV Visible' : t === 'invisible' ? 'Justificaciones IA' : 'Keywords ATS'}
            </button>
          ))}
          <button
            onClick={() => setShowInvisible(!showInvisible)}
            className={`ml-auto flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              showInvisible 
                ? 'text-success' 
                : 'text-text/50'
            }`}
          >
            {showInvisible ? <Eye size={14} /> : <EyeOff size={14} />}
            {showInvisible ? 'Inyección ON' : 'Inyección OFF'}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background/50">
          {tab === 'visible' && (
            <div
              className="bg-white shadow-lg p-8 text-gray-800 font-sans text-sm leading-relaxed whitespace-pre-wrap"
              style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 500px' }}
            >
              {result.visible_text || result.preview_text || 'CV visible no disponible.'}
            </div>
          )}

          {tab === 'invisible' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-text/60 mb-4">
                <Info size={14} className="text-primary" />
                <span>Estas justificaciones se inyectan como texto blanco 1pt en los márgenes. Invisibles al ojo humano, legibles por ATS.</span>
              </div>
              {result.invisible_injections && Object.keys(result.invisible_injections).length > 0 ? (
                Object.entries(result.invisible_injections).map(([key, text]) => (
                  <div key={key} className={`p-4 border transition-all ${
                    showInvisible 
                      ? 'bg-primary/5 border-primary/20 text-primary' 
                      : 'bg-white/5 border-white/5 text-white/10'
                  }`}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Target size={12} />
                      {key}
                    </p>
                    <p className="text-sm leading-relaxed">{text}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-text/40">
                  <EyeOff size={32} className="mx-auto mb-3 opacity-30" />
                  <p>No se generaron justificaciones para esta vacante.</p>
                  <p className="text-xs mt-1">Probá con otra vacante que tenga requisitos más específicos.</p>
                </div>
              )}
            </div>
          )}

          {tab === 'keywords' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-text/60 mb-4">
                <Key size={14} className="text-primary" />
                <span>Keywords inyectadas para burlar filtros regex y búsquedas ATS.</span>
              </div>
              {result.invisible_keywords && result.invisible_keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.invisible_keywords.map((kw, i) => (
                    <span key={i} className={`px-3 py-1.5 text-xs font-mono font-medium transition-all ${
                      showInvisible
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-white/5 text-white/10 border border-white/5'
                    }`}>
                      {kw}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-text/40">
                  <Key size={32} className="mx-auto mb-3 opacity-30" />
                  <p>No se extrajeron keywords.</p>
                </div>
              )}
              {showInvisible && result.invisible_keywords && (
                <div className="mt-4 p-3 bg-success/5 border border-success/20 text-xs text-success font-mono">
                  ✅ {result.invisible_keywords.length} keywords serán detectadas por el ATS
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}