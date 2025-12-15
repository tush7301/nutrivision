import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Activity, Clock, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import StatsCards from '../components/StatsCards';
import CalorieTrendChart from '../components/CalorieTrendChart';
import StatusBadge from '../components/StatusBadge';

export default function Home() {
    const [todayMeals, setTodayMeals] = useState([]);
    const [todayCalories, setTodayCalories] = useState(0);
    const [recentMeals, setRecentMeals] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [stats, setStats] = useState({ totalCalories: 0, avgCalories: 0, count: 0 });

    useEffect(() => {
        // Fetch more meals to ensure we get all of today's logs (limit 50 covers a heavy day)
        api.get('/meals/?limit=50').then(res => {
            const data = res.data;

            // Show only the last 5 in the list
            setRecentMeals(data.slice(0, 5));

            // filtering specific to "Today" logic
            const now = new Date();
            const todays = data.filter(m => {
                const mDate = new Date(m.created_at);
                return mDate.getDate() === now.getDate() &&
                    mDate.getMonth() === now.getMonth() &&
                    mDate.getFullYear() === now.getFullYear();
            });

            setTodayMeals(todays);

            const total = todays.reduce((acc, curr) => acc + curr.calories, 0);
            setTodayCalories(Math.round(total));

            // Process data for charts
            processData(data);
        }).catch(err => console.error(err));
    }, []);

    const processData = (data) => {
        // Aggregate by date (YYYY-MM-DD)
        const agg = {};

        data.forEach(meal => {
            const dateObj = new Date(meal.created_at);
            const dateKey = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD for sorting

            if (!agg[dateKey]) {
                agg[dateKey] = {
                    calories: 0,
                    dateObj: dateObj
                };
            }
            agg[dateKey].calories += meal.calories;
        });

        // Convert to array and sort chronologically
        const sortedDays = Object.keys(agg).sort();

        // Take last 7 days
        const last7Days = sortedDays.slice(-7);

        // Format for chart
        const chart = last7Days.map(key => ({
            name: agg[key].dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
            calories: agg[key].calories
        }));

        // Calculate stats for the viewed period
        const weeklyTotal = last7Days.reduce((sum, key) => sum + agg[key].calories, 0);

        setChartData(chart);
        setStats({
            totalCalories: Math.round(weeklyTotal),
            count: data.length,
            avgCalories: data.length ? Math.round(data.reduce((acc, curr) => acc + curr.calories, 0) / data.length) : 0
        });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-main">Welcome back!</h1>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Recent Meals Card */}
                <div className="bg-card-bg p-6 rounded-2xl shadow-sm border border-border-base">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-text-main">
                        <Clock size={20} className="text-text-muted" />
                        Recent Meals
                    </h2>
                    {recentMeals.length > 0 ? (
                        <div className="space-y-4">
                            {recentMeals.map(meal => (
                                <ViewableMeal key={meal.id} meal={meal} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-text-muted text-sm italic">
                            No meals logged yet. <br />
                            <Link to="/upload" className="text-emerald-500 underline">Log your first meal!</Link>
                        </div>
                    )}
                </div>

                {/* Today's Progress Card */}
                <div className="bg-card-bg p-6 rounded-2xl shadow-sm border border-border-base">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-text-main">
                        <Activity size={20} className="text-emerald-500" />
                        Today's Progress
                    </h2>

                    <div className="flex flex-col items-center justify-center h-48">
                        <div className={`text-5xl font-bold mb-2 ${todayCalories >= 2000 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {todayCalories}
                        </div>
                        <div className="text-text-muted font-medium">Calories Consumed</div>
                        <div className="mt-4 w-full bg-gray-100 dark:bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
                            <div
                                className={`h-2.5 rounded-full ${todayCalories >= 2000 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min((todayCalories / 2000) * 100, 100)}%` }}
                            ></div>
                        </div>
                        <div className={clsx("text-xs mt-2 font-medium", todayCalories >= 2000 ? "text-red-500" : "text-text-muted")}>
                            {todayCalories >= 2000 ? "Over Limit!" : "Goal: 2000 kcal"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Weekly Insights Section */}
            <div className="space-y-6 pt-6 border-t border-border-base">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-text-main">Weekly Insights</h2>
                    <StatusBadge avgCalories={stats.avgCalories} />
                </div>

                {/* Stats Cards */}
                <StatsCards stats={stats} />

                {/* Chart */}
                <CalorieTrendChart data={chartData} />
            </div>
        </div>
    );
}

function ViewableMeal({ meal }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="border-b border-gray-100 dark:border-slate-700 last:border-0 pb-3 last:pb-0">
            <div
                className="flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div>
                    <div className="font-medium text-text-main capitalize flex items-center gap-2">
                        {meal.food_name}
                        {expanded ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
                    </div>
                    <div className="text-xs text-text-muted">{new Date(meal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className="font-semibold text-emerald-600 dark:text-emerald-500">{Math.round(meal.calories)} kcal</div>
            </div>

            {expanded && meal.analysis_text && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg text-sm text-text-main prose prose-sm prose-emerald dark:prose-invert max-w-none">
                    <ReactMarkdown>{meal.analysis_text}</ReactMarkdown>
                </div>
            )}
        </div>
    );
}
