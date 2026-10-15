import { useEffect, useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/**
 * Renderiza una página de PDF en un canvas.
 * Recibe el ArrayBuffer del PDF y el número de página (1-based).
 */
export default function PdfPageRenderer({ arrayBuffer, pageNumber, width = 120, className = '' }) {
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!arrayBuffer || !canvasRef.current) return;

    let cancelled = false;

    const render = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(pageNumber);

        const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        if (!cancelled) {
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [arrayBuffer, pageNumber, width]);

  if (error) {
    return (
      <div className={cn('aspect-[3/4] bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center', className)}>
        <span className="text-xs text-slate-500">Error al renderizar</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-[3/4] bg-slate-100 border border-slate-200 rounded-lg overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
          <span className="text-xs text-slate-400 animate-pulse">Cargando…</span>
        </div>
      )}
    </div>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
