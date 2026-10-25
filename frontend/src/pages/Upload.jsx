import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Loader, Camera, AlertCircle, MessageSquare, ImageOff } from 'lucide-react';
import api from '../api/axios';
import MealReview from '../components/MealReview';
import UndoToast from '../components/UndoToast';
import { useUndoableDelete } from '../hooks/useUndoableDelete';

export default function UploadPage() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const { pendingMeal, remove, undo } = useUndoableDelete();

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
            console.error(err);
            setError(
                err.response
                    ? "We couldn't analyze that photo. Try again, or use a clearer, well-lit shot of the plate."
                    : "Couldn't reach NutriVision. Check your connection and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleMealChange = (meal, advice) => {
        setResult((prev) => ({ ...prev, meal, advice }));
    };

    const handleDelete = () => {
        const snapshot = { file, preview, result };
        remove(result.meal, {
            onUndo: () => {
                setFile(snapshot.file);
                setPreview(snapshot.preview);
                setResult(snapshot.result);
            },
            onError: () => setError("Couldn't remove that meal. It's still in your log."),
        });
        handleClear();
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
                            type="button"
                            onClick={handleClear}
                            aria-label={result?.meal ? 'Close and log another meal' : 'Remove photo'}
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

            {/* Not food: the gatekeeper rejected the photo, nothing was logged */}
            {result && result.is_food === false && (
                <div role="alert" className="bg-card-bg p-6 rounded-3xl border border-border-base shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
                    <ImageOff size={28} className="text-amber-700 dark:text-amber-400 shrink-0" aria-hidden="true" />
                    <div className="flex-1">
                        <h2 className="font-semibold text-text-main">That doesn't look like food</h2>
                        <p className="text-text-muted text-sm mt-1">Nothing was logged. Try a photo where the meal fills most of the frame.</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-2 px-5 rounded-full transition-colors self-start sm:self-auto"
                    >
                        Try another photo
                    </button>
                </div>
            )}

            {/* Results */}
            {result?.meal && (
                <div className="grid gap-6">
                    <MealReview
                        key={result.meal.id}
                        meal={result.meal}
                        candidates={result.candidates}
                        onMealChange={handleMealChange}
                        onDelete={handleDelete}
                    />

                    {/* AI Analysis */}
                    {result.advice && (
                        <div className="bg-card-bg p-6 rounded-3xl border border-border-base shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
                                    <MessageSquare size={20} aria-hidden="true" />
                                </div>
                                <h3 className="font-semibold text-text-main">Coach's Insight</h3>
                            </div>
                            <div className="prose prose-sm prose-emerald dark:prose-invert max-w-none text-text-main prose-headings:text-text-main prose-strong:text-text-main leading-relaxed">
                                <ReactMarkdown>{result.advice}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {pendingMeal && (
                <UndoToast message={`Removed ${pendingMeal.food_name} from your log`} onUndo={undo} />
            )}
        </div>
    );
}
