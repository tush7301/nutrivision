import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatsCards from '../components/StatsCards';
import TrendChart from '../components/TrendChart'; // Updated import
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
    const { user } = useAuth();
    const [chartData, setChartData] = useState([]);
    const [stats, setStats] = useState({ totalCalories: 0, avgCalories: 0, count: 0 });

    useEffect(() => {
        // Fetch meals for stats
        api.get('/meals/?limit=100').then(res => {
            const data = res.data;
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
                    protein: 0,
                    fat: 0,
                    carbs: 0,
                    dateObj: dateObj
                };
            }
            agg[dateKey].calories += meal.calories;
            agg[dateKey].protein += (meal.protein || 0);
            agg[dateKey].fat += (meal.fats || 0);
            agg[dateKey].carbs += (meal.carbs || 0);
        });

        // Convert to array and sort chronologically
        const sortedDays = Object.keys(agg).sort();

        // Take last 7 days
        const last7Days = sortedDays.slice(-7);

        // Format for chart
        const chart = last7Days.map(key => ({
            name: agg[key].dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
            calories: Math.round(agg[key].calories),
            protein: Math.round(agg[key].protein),
            fat: Math.round(agg[key].fat),
            carbs: Math.round(agg[key].carbs)
        }));

        const weeklyTotal = last7Days.reduce((sum, key) => sum + agg[key].calories, 0);

        setChartData(chart);
        setStats({
            totalCalories: Math.round(weeklyTotal),
            count: data.length,
            avgCalories: data.length ? Math.round(data.reduce((acc, curr) => acc + curr.calories, 0) / data.length) : 0
        });
    };

    return (
        <div className="space-y-6 pb-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-text-main">Weekly Insights</h1>
                <StatusBadge avgCalories={stats.avgCalories} />
            </div>

            {/* Stats Cards */}
            <StatsCards stats={stats} />

            {/* Charts Grid */}
            <h2 className="text-xl font-bold text-text-main mt-8 mb-4">Macro Trends</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <TrendChart
                    title="Calories"
                    data={chartData}
                    dataKey="calories"
                    limit={user?.target_calories || 2000}
                    unit="kcal"
                />
                <TrendChart
                    title="Protein"
                    data={chartData}
                    dataKey="protein"
                    limit={user?.target_protein || 150}
                    unit="g"
                />
                <TrendChart
                    title="Carbohydrates"
                    data={chartData}
                    dataKey="carbs"
                    limit={user?.target_carbs || 200}
                    unit="g"
                />
                <TrendChart
                    title="Fats"
                    data={chartData}
                    dataKey="fat"
                    limit={user?.target_fat || 70}
                    unit="g"
                />
            </div>
        </div>
    );
}
