import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Upload as UploadIcon, X, Loader, Camera, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import api from '../api/axios';
import clsx from 'clsx';

export default function UploadPage() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setResult(null);
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/meals/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setResult(response.data);
        } catch (err) {
            setError('Failed to analyze meal. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setFile(null);
        setPreview(null);
        setResult(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-text-main">Log a Meal</h1>
                <p className="text-text-muted">Snap a photo to get instant nutritional insights.</p>
            </div>

            {/* Upload Card */}
            <div className="bg-card-bg rounded-3xl shadow-sm border border-border-base overflow-hidden">
                {!preview ? (
                    <div
                        className="p-12 flex flex-col items-center justify-center border-2 border-dashed border-border-base m-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
                            <Camera size={32} />
                        </div>
                        <p className="text-lg font-medium text-text-main">Click to upload photo</p>
                        <p className="text-sm text-text-muted mt-1">or drag and drop</p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>
                ) : (
                    <div className="relative">
                        <img src={preview} alt="Meal preview" className="w-full h-64 md:h-80 object-cover" />
                        <button
                            onClick={handleClear}
                            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                        {!result && !loading && (
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center pb-8">
                                <button
                                    onClick={handleAnalyze}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg transform transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                >
                                    Analyze Meal
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {loading && (
                    <div className="p-12 flex flex-col items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Loader className="animate-spin mb-4" size={40} />
                        <p className="font-medium animate-pulse">Analyzing dietary content...</p>
                        <p className="text-xs text-text-muted mt-2">Identifying food • Estimating portions • Calculating macros</p>
                    </div>
                )}

                {error && (
                    <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-3">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}
            </div>

            {/* Results */}
            {result && (
                <div className="grid gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Main Info */}
                    <div className="bg-card-bg p-6 rounded-3xl shadow-sm border border-border-base flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-text-main capitalize">{result.meal.food_name}</h2>
                            <p className="text-text-muted flex items-center gap-2 mt-1">
                                <span className="bg-gray-200 dark:bg-slate-700 px-2.5 py-0.5 rounded-md text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{result.meal.portion_size} portion</span>
                                <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">({Math.round(result.meal.confidence * 100)}% confidence)</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">{Math.round(result.meal.calories)}</div>
                            <div className="text-xs text-text-muted uppercase tracking-wide font-medium">Calories</div>
                        </div>
                    </div>

                    {/* Macros */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Protein', value: result.meal.protein, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30' },
                            { label: 'Carbs', value: result.meal.carbs, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30' },
                            { label: 'Fats', value: result.meal.fats, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30' },
                        ].map((macro) => (
                            <div key={macro.label} className={`rounded-2xl p-4 border ${macro.bg}`}>
                                <div className={`text-xl font-bold ${macro.color}`}>{macro.value}g</div>
                                <div className="text-xs text-text-muted font-medium">{macro.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* AI Analysis */}
                    <div className="bg-card-bg p-6 rounded-3xl border border-border-base shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
                                <MessageSquare size={20} />
                            </div>
                            <h3 className="font-semibold text-text-main">Coach's Insight</h3>
                        </div>
                        <div className="prose prose-sm prose-emerald dark:prose-invert max-w-none text-text-main prose-headings:text-text-main prose-strong:text-text-main leading-relaxed">
                            <ReactMarkdown>{result.advice}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
