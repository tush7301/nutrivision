import { Activity, Calendar, ArrowUpRight } from 'lucide-react';

export default function StatsCards({ stats }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card-bg p-6 rounded-2xl shadow-sm border border-border-base">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                        <Activity size={24} />
                    </div>
                    <span className="text-xs font-medium text-text-muted uppercase">Total Logged</span>
                </div>
                <div className="text-3xl font-bold text-text-main">{stats.totalCalories}</div>
                <div className="text-sm text-text-muted mt-1">Calories this week</div>
            </div>

            <div className="bg-card-bg p-6 rounded-2xl shadow-sm border border-border-base">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
                        <Calendar size={24} />
                    </div>
                    <span className="text-xs font-medium text-text-muted uppercase">Avg. Daily</span>
                </div>
                <div className="text-3xl font-bold text-text-main">{stats.avgCalories}</div>
                <div className="text-sm text-text-muted mt-1">Calories / meal</div>
            </div>

            <div className="bg-card-bg p-6 rounded-2xl shadow-sm border border-border-base">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg">
                        <ArrowUpRight size={24} />
                    </div>
                    <span className="text-xs font-medium text-text-muted uppercase">Meals</span>
                </div>
                <div className="text-3xl font-bold text-text-main">{stats.count}</div>
                <div className="text-sm text-text-muted mt-1">Total meals logged</div>
            </div>
        </div>
    );
}
