import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api/axios';

export const UNDO_WINDOW_MS = 6000;

// Deletes a meal after a short undo window instead of immediately.
// The caller hides the meal right away; undo() puts it back, and the
// DELETE request only goes out once the window closes (or the page unmounts).
export function useUndoableDelete() {
    const [pendingMeal, setPendingMeal] = useState(null);
    const pendingRef = useRef(null);

    const commit = (entry) => {
        api.delete(`/meals/${entry.meal.id}`).catch((err) => {
            console.error(err);
            entry.onError?.();
        });
    };

    const remove = useCallback((meal, { onUndo, onError } = {}) => {
        // Only one pending delete at a time: flush the previous one now
        if (pendingRef.current) {
            clearTimeout(pendingRef.current.timer);
            commit(pendingRef.current);
        }
        const entry = { meal, onUndo, onError };
        entry.timer = setTimeout(() => {
            commit(entry);
            pendingRef.current = null;
            setPendingMeal(null);
        }, UNDO_WINDOW_MS);
        pendingRef.current = entry;
        setPendingMeal(meal);
    }, []);

    const undo = useCallback(() => {
        const entry = pendingRef.current;
        if (!entry) return;
        clearTimeout(entry.timer);
        pendingRef.current = null;
        setPendingMeal(null);
        entry.onUndo?.();
    }, []);

    // Leaving the page doesn't cancel the delete, it just stops waiting
    useEffect(() => () => {
        const entry = pendingRef.current;
        if (entry) {
            clearTimeout(entry.timer);
            commit(entry);
            pendingRef.current = null;
        }
    }, []);

    return { pendingMeal, remove, undo };
}
