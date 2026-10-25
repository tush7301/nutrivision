import { useState } from 'react';
import { Check, Loader, Pencil, Search, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import api from '../api/axios';

// Below this, the model's top pick is shown as a guess and the correction panel opens by default
const CONFIDENT = 0.7;

function parseGrams(portionSize) {
    const match = /(\d+(?:\.\d+)?)\s*g\b/.exec(portionSize || '');
    return match ? Math.round(parseFloat(match[1])) : null;
}

function confidenceLabel(confidence) {
    const pct = Math.round(confidence * 100);
    if (confidence >= CONFIDENT) return { text: `Likely match · ${pct}%`, className: 'text-emerald-700 dark:text-emerald-400' };
    if (confidence >= 0.4) return { text: `Best guess · ${pct}%`, className: 'text-amber-700 dark:text-amber-400' };
    return { text: `Low confidence · ${pct}%`, className: 'text-rose-700 dark:text-rose-400' };
}

/**
 * The scan result, framed as something to confirm or correct.
 * The meal is already logged; every change here is saved straight away.
 */
export default function MealReview({ meal, candidates = [], onMealChange, onDelete }) {
    const lowConfidence = meal.confidence < CONFIDENT;
    const [mode, setMode] = useState(lowConfidence ? 'editing' : 'asking'); // asking | editing | confirmed
    const [estimateG] = useState(() => parseGrams(meal.portion_size));
    const [customFood, setCustomFood] = useState('');
    const [customGrams, setCustomGrams] = useState('');
    const [saving, setSaving] = useState(null); // 'food' | 'portion' | null
    const [error, setError] = useState(null);

    const grams = parseGrams(meal.portion_size);
    // Once the user names a different food than the model's top pick, the model's score no longer applies
    const userPicked = candidates.length > 0 && meal.food_name.toLowerCase() !== candidates[0].food.toLowerCase();
    const confidence = userPicked
        ? { text: 'Set by you', className: 'text-text-muted' }
        : confidenceLabel(meal.confidence);

    const save = async (kind, body) => {
        setSaving(kind);
        setError(null);
        try {
            const { data } = await api.patch(`/meals/${meal.id}`, body);
            onMealChange(data.meal, data.advice);
            return true;
        } catch (err) {
            const detail = err.response?.data?.detail;
            setError(
                typeof detail === 'string' && err.response.status < 500
                    ? detail
                    : "Couldn't save that change. Check your connection and try again."
            );
            return false;
        } finally {
            setSaving(null);
        }
    };

    const chooseFood = (food) => {
        if (food.toLowerCase() === meal.food_name.toLowerCase()) return;
        save('food', { food_name: food });
    };

    const submitCustomFood = async (e) => {
        e.preventDefault();
        const food = customFood.trim();
        if (!food) return;
        if (await save('food', { food_name: food })) setCustomFood('');
    };

    const choosePortion = (g) => {
        if (!g || g === grams) return;
        save('portion', { weight_g: g });
    };

    const submitCustomGrams = async (e) => {
        e.preventDefault();
        const g = Math.round(Number(customGrams));
        if (!g || g < 1 || g > 5000) {
            setError('Enter a weight between 1 and 5000 grams.');
            return;
        }
        if (await save('portion', { weight_g: g })) setCustomGrams('');
    };

    const presets = estimateG
        ? [
            { label: 'Small', grams: Math.round(estimateG * 0.5) },
            { label: 'Regular', grams: estimateG },
            { label: 'Large', grams: Math.round(estimateG * 1.5) },
        ]
        : [];

    // The model's other guesses, plus whatever the user picked if it isn't one of them
    const foodOptions = candidates.map((c) => c.food);
    if (!foodOptions.some((f) => f.toLowerCase() === meal.food_name.toLowerCase())) {
        foodOptions.unshift(meal.food_name);
    }

    return (
        <section aria-labelledby="meal-review-heading" className="bg-card-bg rounded-3xl border border-border-base shadow-sm overflow-hidden">
            {/* Result */}
            <div className="p-6 flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm text-text-muted">Logged to today</p>
                    <h2 id="meal-review-heading" className="text-2xl font-bold text-text-main capitalize break-words">
                        {meal.food_name}
                    </h2>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm">
                        <span className="bg-gray-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-md font-medium text-gray-900 dark:text-gray-100 tabular-nums">
                            {grams ? `${grams} g` : meal.portion_size}
                        </span>
                        <span className={clsx('font-medium', confidence.className)}>{confidence.text}</span>
                    </p>
                </div>
                <div className="text-right shrink-0">
                    <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {Math.round(meal.calories)}
                    </div>
                    <div className="text-xs text-text-muted uppercase tracking-wide font-medium">kcal</div>
                </div>
            </div>

            {/* Confirm or correct */}
            <div className="border-t border-border-base px-6 py-4 bg-gray-50 dark:bg-slate-900/40">
                {mode === 'asking' && (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-medium text-text-main">Is this right?</p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setMode('confirmed')}
                                className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-2 px-4 rounded-full transition-colors"
                            >
                                <Check size={16} aria-hidden="true" /> Looks right
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('editing')}
                                className="inline-flex items-center gap-1.5 border border-border-base text-text-main hover:bg-white dark:hover:bg-slate-800 font-medium py-2 px-4 rounded-full transition-colors"
                            >
                                <Pencil size={16} aria-hidden="true" /> Fix it
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'confirmed' && (
                    <div className="flex items-center justify-between gap-3">
                        <p className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
                            <Check size={18} aria-hidden="true" /> Confirmed
                        </p>
                        <button
                            type="button"
                            onClick={() => setMode('editing')}
                            className="text-sm font-medium text-text-muted hover:text-text-main underline underline-offset-4"
                        >
                            Edit
                        </button>
                    </div>
                )}

                {mode === 'editing' && (
                    <div className="space-y-5">
                        {lowConfidence && (
                            <p className="text-sm text-text-main">
                                We're not sure about this one. Pick the right food or adjust the portion. Totals update as you go.
                            </p>
                        )}

                        <fieldset disabled={!!saving}>
                            <legend className="text-sm font-semibold text-text-main mb-2">What is it?</legend>
                            <div className="flex flex-wrap gap-2">
                                {foodOptions.map((food) => {
                                    const selected = food.toLowerCase() === meal.food_name.toLowerCase();
                                    return (
                                        <button
                                            key={food}
                                            type="button"
                                            aria-pressed={selected}
                                            onClick={() => chooseFood(food)}
                                            className={clsx(
                                                'py-1.5 px-3.5 rounded-full text-sm font-medium border transition-colors capitalize disabled:opacity-60',
                                                selected
                                                    ? 'bg-emerald-700 border-emerald-700 text-white'
                                                    : 'border-border-base text-text-main hover:border-emerald-600 bg-card-bg'
                                            )}
                                        >
                                            {food}
                                        </button>
                                    );
                                })}
                            </div>
                            <form onSubmit={submitCustomFood} className="flex gap-2 mt-3">
                                <label htmlFor="custom-food" className="sr-only">Something else</label>
                                <input
                                    id="custom-food"
                                    type="text"
                                    value={customFood}
                                    onChange={(e) => setCustomFood(e.target.value)}
                                    placeholder="Something else…"
                                    maxLength={100}
                                    autoComplete="off"
                                    className="flex-1 min-w-0 rounded-xl border border-border-base bg-card-bg px-3.5 py-2 text-base text-text-main placeholder:text-text-muted focus:outline-2 focus:outline-emerald-600"
                                />
                                <button
                                    type="submit"
                                    disabled={!customFood.trim()}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-border-base px-3.5 py-2 text-sm font-medium text-text-main hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Search size={16} aria-hidden="true" /> Look up
                                </button>
                            </form>
                        </fieldset>

                        <fieldset disabled={!!saving}>
                            <legend className="text-sm font-semibold text-text-main mb-2">How much?</legend>
                            {presets.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                    {presets.map((p) => {
                                        const selected = p.grams === grams;
                                        return (
                                            <button
                                                key={p.label}
                                                type="button"
                                                aria-pressed={selected}
                                                onClick={() => choosePortion(p.grams)}
                                                className={clsx(
                                                    'rounded-xl border py-2 text-sm transition-colors disabled:opacity-60',
                                                    selected
                                                        ? 'bg-emerald-700 border-emerald-700 text-white'
                                                        : 'border-border-base text-text-main hover:border-emerald-600 bg-card-bg'
                                                )}
                                            >
                                                <span className="block font-medium">{p.label}</span>
                                                <span className={clsx('block text-xs tabular-nums', selected ? 'text-emerald-50' : 'text-text-muted')}>
                                                    {p.grams} g
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            <form onSubmit={submitCustomGrams} className="flex items-center gap-2 mt-3">
                                <label htmlFor="custom-grams" className="text-sm text-text-muted shrink-0">Exact weight</label>
                                <input
                                    id="custom-grams"
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    max={5000}
                                    value={customGrams}
                                    onChange={(e) => setCustomGrams(e.target.value)}
                                    placeholder={grams ? String(grams) : 'grams'}
                                    className="w-24 rounded-xl border border-border-base bg-card-bg px-3 py-2 text-base text-text-main tabular-nums placeholder:text-text-muted focus:outline-2 focus:outline-emerald-600"
                                />
                                <span className="text-sm text-text-muted">g</span>
                                <button
                                    type="submit"
                                    disabled={!customGrams}
                                    className="rounded-xl border border-border-base px-3.5 py-2 text-sm font-medium text-text-main hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Set
                                </button>
                            </form>
                        </fieldset>

                        <div className="flex items-center justify-between gap-3 min-h-10">
                            <p role="status" className="text-sm text-text-muted flex items-center gap-2">
                                {saving === 'food' && (<><Loader size={16} className="animate-spin" aria-hidden="true" /> Looking up nutrition and updating your coach's notes…</>)}
                                {saving === 'portion' && (<><Loader size={16} className="animate-spin" aria-hidden="true" /> Updating portion…</>)}
                            </p>
                            <button
                                type="button"
                                onClick={() => { setMode('confirmed'); setError(null); }}
                                disabled={!!saving}
                                className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-medium py-2 px-5 rounded-full transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <p role="alert" className="mt-3 text-sm text-rose-700 dark:text-rose-400">{error}</p>
                )}
            </div>

            {/* Macros */}
            <div className="grid grid-cols-3 border-t border-border-base divide-x divide-border-base">
                {[
                    { label: 'Protein', value: meal.protein, color: 'text-blue-700 dark:text-blue-400' },
                    { label: 'Carbs', value: meal.carbs, color: 'text-amber-700 dark:text-amber-400' },
                    { label: 'Fats', value: meal.fats, color: 'text-rose-700 dark:text-rose-400' },
                ].map((macro) => (
                    <div key={macro.label} className="px-4 py-3 text-center">
                        <div className={clsx('text-lg font-bold tabular-nums', macro.color)}>{Math.round(macro.value)} g</div>
                        <div className="text-xs text-text-muted font-medium">{macro.label}</div>
                    </div>
                ))}
            </div>

            <div className="border-t border-border-base px-6 py-3 flex justify-end">
                <button
                    type="button"
                    onClick={onDelete}
                    disabled={!!saving}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg px-3 py-1.5 disabled:opacity-50 transition-colors"
                >
                    <Trash2 size={16} aria-hidden="true" /> Remove from log
                </button>
            </div>
        </section>
    );
}
