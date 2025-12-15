import { TrendingUp, AlertCircle } from 'lucide-react';

export default function StatusBadge({ avgCalories }) {
    const isOverLimit = avgCalories > 2000;

    if (isOverLimit) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                <AlertCircle size={16} />
                Needs Attention
            </div>
        );
    }

    return (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
            <TrendingUp size={16} />
            On Track
        </div>
    );
}
