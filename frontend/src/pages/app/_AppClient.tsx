import React, { useState } from 'react';
import CVUploader from '../../components/CVUploader';
import JobUrlInput from '../../components/JobUrlInput';
import ResultsPanel from '../../components/ResultsPanel';
import CvPreview from '../../components/CvPreview';
import { api, type CVUploadResponse, type GenerationResult } from '../../lib/api';
import { FileText, Loader2 } from 'lucide-react';

type AppState = 'IDLE' | 'CV_UPLOADED' | 'PROCESSING' | 'COMPLETED';

export default function AppClient() {
  const [state, setState] = useState<AppState>('IDLE');
  const [cvData, setCvData] = useState<CVUploadResponse | null>(null);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [previewResult, setPreviewResult] = useState<GenerationResult | null>(null);
  const [progressText, setProgressText] = useState('Analizando vacantes...');
  const [preserveDesign, setPreserveDesign] = useState(true);

  const handleUploadComplete = (data: CVUploadResponse) => {
    setCvData(data);
    setState('CV_UPLOADED');
  };

  const handleProcessUrls = async (urls: string[]) => {
    if (!cvData) return;
    
    setState('PROCESSING');
    try {
      // In a real scenario, we might want to show progress per URL
      setProgressText('Analizando vacantes y generando prompt injection...');
      
      // We can use batchProcess if we had the file, but since we already uploaded the CV,
      // we use generateCV with the cvId and jobIds.
      // Wait, the API says: POST /api/analyze-job returns job_id.
      // So first we analyze all URLs to get job_ids.
      
      const jobIds: string[] = [];
      for (let i = 0; i < urls.length; i++) {
        setProgressText(`Analizando vacante ${i + 1} de ${urls.length}...`);
        const analysis = await api.analyzeJob(urls[i]);
        jobIds.push(analysis.job_id);
      }

      setProgressText('Optimizando CV e inyectando keywords ocultas...');
      const generateRes = await api.generateCV(cvData.cv_id, jobIds, preserveDesign);
      
      setResults(generateRes.generations);
      setState('COMPLETED');
    } catch (error) {
      console.error(error);
      alert('Hubo un error al procesar las vacantes. Por favor intenta de nuevo.');
      setState('CV_UPLOADED');
    }
  };

  const resetToUrls = () => {
    setResults([]);
    setState('CV_UPLOADED');
  };

  const resetAll = () => {
    setCvData(null);
    setResults([]);
    setState('IDLE');
  };

  return (
    <div className="w-full">
      {state === 'IDLE' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CVUploader onUploadComplete={handleUploadComplete} />
        </div>
      )}

      {state === 'CV_UPLOADED' && cvData && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
          <div className="bg-surface/50 border border-white/5 p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary">
                <FileText size={20} />
              </div>
              <div>
                <p className="font-medium text-sm">{cvData.filename}</p>
                <p className="text-xs text-text/50">{cvData.pages} página(s)</p>
              </div>
            </div>
            <button 
              onClick={resetAll}
              className="text-xs text-text/50 hover:text-text transition-colors underline"
            >
              Cambiar CV
            </button>
          </div>
          
          <JobUrlInput 
            onProcess={handleProcessUrls} 
            preserveDesign={preserveDesign}
            onPreserveDesignChange={setPreserveDesign}
          />
        </div>
      )}

      {state === 'PROCESSING' && (
        <div className="animate-in fade-in duration-500 flex flex-col items-center justify-center py-20">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
            <Loader2 size={64} className="text-primary animate-spin relative z-10" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Hackeando el ATS</h3>
          <p className="text-text/60 animate-pulse">{progressText}</p>
        </div>
      )}

      {state === 'COMPLETED' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ResultsPanel 
            results={results} 
            onPreview={setPreviewResult}
            onReset={resetToUrls}
            onNewCV={resetAll}
          />
        </div>
      )}

      {previewResult && (
        <CvPreview 
          result={previewResult} 
          onClose={() => setPreviewResult(null)} 
        />
      )}
    </div>
  );
}