import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Activity, Clock, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import StatsCards from '../components/StatsCards';
import CalorieTrendChart from '../components/CalorieTrendChart';
import StatusBadge from '../components/StatusBadge';

export default function Home() {
    const { user } = useAuth();
    const [todayMeals, setTodayMeals] = useState([]);
    const [todayStats, setTodayStats] = useState({ calories: 0, protein: 0, fat: 0, carbs: 0 });
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

            setTodayMeals(todays);

            const totalCals = todays.reduce((acc, curr) => acc + curr.calories, 0);
            const totalProt = todays.reduce((acc, curr) => acc + (curr.protein || 0), 0);
            const totalFat = todays.reduce((acc, curr) => acc + (curr.fats || 0), 0);
            const totalCarb = todays.reduce((acc, curr) => acc + (curr.carbs || 0), 0);

            setTodayStats({
                calories: Math.round(totalCals),
                protein: Math.round(totalProt),
                fat: Math.round(totalFat),
                carbs: Math.round(totalCarb)
            });

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
                    <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-text-main">
                        <Activity size={20} className="text-emerald-500" />
                        Today's Progress
                    </h2>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Calories */}
                        <MacroCard
                            title="Calories"
                            current={todayStats.calories}
                            target={user?.target_calories || 2000}
                            unit=""
                        />
                        {/* Protein */}
                        <MacroCard
                            title="Protein"
                            current={todayStats.protein}
                            target={user?.target_protein || 150}
                            unit="g"
                        />
                        {/* Carbs */}
                        <MacroCard
                            title="Carbs"
                            current={todayStats.carbs}
                            target={user?.target_carbs || 200}
                            unit="g"
                        />
                        {/* Fat */}
                        <MacroCard
                            title="Fat"
                            current={todayStats.fat}
                            target={user?.target_fat || 70}
                            unit="g"
                        />
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

function MacroCard({ title, current, target, unit }) {
    const percentage = Math.min((current / target) * 100, 100);
    const isExceeded = current > target;
    const remaining = Math.max(0, target - current);

    return (
        <div className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
            <div className="text-sm font-medium text-text-muted mb-1">{title}</div>
            <div className="text-2xl font-bold text-text-main mb-3">
                {current}
                <span className="text-xs text-text-muted font-normal ml-1">/ {target} {unit}</span>
            </div>

            <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2 mb-2 overflow-hidden">
                <div
                    className={clsx("h-2 rounded-full transition-all duration-500", isExceeded ? "bg-red-500" : "bg-emerald-500")}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            <div className={clsx("text-xs font-medium", isExceeded ? "text-red-500" : "text-emerald-500")}>
                {isExceeded
                    ? `Over by ${current - target} ${unit}`
                    : `${remaining} ${unit} left`
                }
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
