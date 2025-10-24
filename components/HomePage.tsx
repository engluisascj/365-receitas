import React, { useState, useCallback } from 'react';
import { analyzeImageForCalories } from '../services/geminiService';
import { AnalysisResult } from '../types';
import { UploadIcon, LeafIcon, LogoutIcon, SparklesIcon, XCircleIcon } from './icons/Icons';

interface HomePageProps {
  onLogout: () => void;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error("Falha ao ler o blob como string base64."));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const HomePage: React.FC<HomePageProps> = ({ onLogout }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
          setError("O tamanho da imagem excede 4MB. Por favor, escolha um arquivo menor.");
          return;
      }
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setAnalysisResult(null);
      setError(null);
    }
  };
  
  const handleAnalyzeClick = useCallback(async () => {
    if (!imageFile) return;

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
        const base64Image = await blobToBase64(imageFile);
        const result = await analyzeImageForCalories(base64Image, imageFile.type);
        setAnalysisResult(result);
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("Ocorreu um erro inesperado.");
        }
    } finally {
        setIsLoading(false);
    }
  }, [imageFile]);
  
  const clearSelection = () => {
      setImageFile(null);
      setImagePreview(null);
      setAnalysisResult(null);
      setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <LeafIcon className="w-8 h-8 text-emerald-600" />
                    <h1 className="text-2xl font-bold text-gray-800">Contador de Calorias</h1>
                </div>
                <button 
                    onClick={onLogout}
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
                >
                    <LogoutIcon className="w-5 h-5"/>
                    Sair
                </button>
            </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
                <div className="text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Analise Sua Refeição</h2>
                    <p className="mt-2 text-md text-gray-600">Envie uma foto da sua refeição para obter uma estimativa de calorias com IA.</p>
                </div>
                
                <div className="mt-8">
                    {!imagePreview ? (
                        <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadIcon className="w-10 h-10 mb-3 text-gray-400"/>
                                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Clique para enviar</span> ou arraste e solte</p>
                                <p className="text-xs text-gray-500">PNG, JPG ou WEBP (MÁX. 4MB)</p>
                            </div>
                            <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} />
                        </label>
                    ) : (
                        <div className="relative group">
                            <img src={imagePreview} alt="Pré-visualização da refeição" className="w-full h-auto max-h-[50vh] object-contain rounded-lg shadow-md" />
                            <button onClick={clearSelection} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/75 transition-opacity opacity-0 group-hover:opacity-100">
                                <XCircleIcon className="w-6 h-6"/>
                            </button>
                        </div>
                    )}
                </div>

                {imageFile && (
                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={handleAnalyzeClick}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300"
                        >
                           {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Analisando...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-5 h-5"/>
                                    Analisar Refeição
                                </>
                            )}
                        </button>
                    </div>
                )}
                
                {error && (
                    <div className="mt-6 p-4 bg-red-100 border border-red-200 text-red-800 rounded-lg text-center">
                        <strong>Erro:</strong> {error}
                    </div>
                )}

                {analysisResult && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <h3 className="text-xl font-bold text-center text-gray-800 mb-4">Resultados da Análise</h3>
                        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 text-center mb-6">
                            <p className="text-lg text-emerald-800 font-medium">Total de Calorias Estimadas</p>
                            <p className="text-5xl font-bold text-emerald-600">{Math.round(analysisResult.totalCalories)}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-lg text-gray-700 mb-3">Detalhamento dos Itens:</h4>
                            <ul className="space-y-2">
                                {analysisResult.items.map((item, index) => (
                                    <li key={index} className="flex justify-between items-center p-3 bg-gray-100 rounded-md">
                                        <span className="text-gray-800 capitalize">{item.name}</span>
                                        <span className="font-semibold text-gray-600">{Math.round(item.calories)} kcal</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                         <p className="text-xs text-gray-500 mt-6 text-center italic">Aviso: Esta é uma estimativa gerada por IA e não deve ser usada para fins médicos.</p>
                    </div>
                )}
            </div>
        </main>
    </div>
  );
};

export default HomePage;