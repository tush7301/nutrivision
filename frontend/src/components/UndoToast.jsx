// Bottom-of-screen notice with an Undo action. Sits in the thumb zone on mobile.
export default function UndoToast({ message, onUndo }) {
    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-sm flex items-center justify-between gap-4 rounded-xl bg-gray-900 dark:bg-slate-100 py-3 pl-4 pr-2 text-sm text-white dark:text-gray-900 shadow-lg shadow-black/20"
        >
            <span className="truncate">{message}</span>
            <button
                type="button"
                onClick={onUndo}
                className="shrink-0 rounded-lg px-3 py-1.5 font-semibold text-emerald-300 dark:text-emerald-800 hover:bg-white/10 dark:hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-emerald-300 transition-colors"
            >
                Undo
            </button>
        </div>
    );
}
