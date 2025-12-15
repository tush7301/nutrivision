import { useEffect, useState } from 'react';
import api from '../api/axios';
import { TrendingUp } from 'lucide-react';
import StatsCards from '../components/StatsCards';
import CalorieTrendChart from '../components/CalorieTrendChart';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
    const [meals, setMeals] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [stats, setStats] = useState({ totalCalories: 0, avgCalories: 0, count: 0 });

    useEffect(() => {
        // Fetch meals for stats
        api.get('/meals/?limit=100').then(res => {
            const data = res.data;
            setMeals(data);
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

        // Calculate stats for the viewed period (or total available?)
        // Let's keep total based on fetched data for now, but maybe "Calories this week" means chart sum
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
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-text-main">Weekly Insights</h1>
                <StatusBadge avgCalories={stats.avgCalories} />
            </div>

            {/* Stats Cards */}
            <StatsCards stats={stats} />

            {/* Chart */}
            <CalorieTrendChart data={chartData} />
        </div>
    );
}
