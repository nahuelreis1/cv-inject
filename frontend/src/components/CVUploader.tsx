import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { api, type CVUploadResponse } from '../lib/api';

interface Props {
  onUploadComplete: (data: CVUploadResponse) => void;
}

export default function CVUploader({ onUploadComplete }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await processFile(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const processFile = async (file: File) => {
    setError(null);
    if (file.type !== 'application/pdf') {
      setError('Por favor, sube un archivo PDF válido.');
      return;
    }

    setIsUploading(true);
    try {
      const data = await api.uploadCV(file);
      onUploadComplete(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al subir el CV');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`relative border-2 border-dashed p-12 text-center transition-all duration-300 ${
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-surface-light bg-surface hover:border-primary/50 hover:bg-surface/80'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={`p-4 ${isDragging ? 'bg-primary/20 text-primary' : 'bg-surface-light text-text/60'}`}>
            {isUploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            ) : (
              <UploadCloud size={32} />
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold mb-2">
              {isUploading ? 'Procesando CV...' : 'Sube tu CV base'}
            </h3>
            <p className="text-text/60 text-sm max-w-sm mx-auto">
              Arrastra y suelta tu PDF aquí, o haz clic para seleccionar. Solo aceptamos formato PDF.
            </p>
          </div>

          {!isUploading && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-6 py-2 bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
            >
              Seleccionar Archivo
            </button>
          )}
        </div>

        {error && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-error text-sm bg-error/10 px-4 py-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}