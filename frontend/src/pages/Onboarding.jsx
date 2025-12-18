import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Activity, Target, Ruler, Weight, User } from 'lucide-react';

export default function Onboarding() {
    const navigate = useNavigate();
    const { updateUser } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        age: '',
        gender: 'male',
        height: '',
        weight: '',
        activity_level: 'moderate',
        goal: 'maintain'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const calculatePreview = () => {
        // Mifflin-St Jeor Preview
        if (!formData.weight || !formData.height || !formData.age) return 0;
        let bmr = (10 * formData.weight) + (6.25 * formData.height) - (5 * formData.age);
        bmr += formData.gender === 'male' ? 5 : -161;

        const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
        const tdee = bmr * (multipliers[formData.activity_level] || 1.2);

        const adjustments = { lose: -500, maintain: 0, gain: 300, build_muscle: 200 };
        return Math.round(tdee + (adjustments[formData.goal] || 0));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { data } = await api.put('/users/me', {
                ...formData,
                age: Number(formData.age),
                height: Number(formData.height),
                weight: Number(formData.weight)
            });
            updateUser(data);
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4 font-sans">
            <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
                {/* Left Panel: Preview */}
                <div className="bg-emerald-600 p-8 text-white flex flex-col justify-center w-full md:w-1/3">
                    <h2 className="text-2xl font-bold mb-4">Your Plan</h2>
                    <div className="mb-6">
                        <p className="text-emerald-100 text-sm mb-1">Projected Daily Target</p>
                        <div className="text-4xl font-bold">{calculatePreview() || "---"}</div>
                        <div className="text-sm opacity-80">kcal / day</div>
                    </div>
                </div>

                {/* Right Panel: Form */}
                <div className="p-8 flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome! 👋</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">Let's verify your details to build your plan.</p>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                    <input type="number" name="age" value={formData.age} onChange={handleChange} className="pl-9 w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white h-[38px]">
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Height (cm)</label>
                                <div className="relative">
                                    <Ruler className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                    <input type="number" name="height" value={formData.height} onChange={handleChange} className="pl-9 w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Weight (kg)</label>
                                <div className="relative">
                                    <Weight className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                    <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="pl-9 w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Activity Level</label>
                            <div className="relative">
                                <Activity className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <select name="activity_level" value={formData.activity_level} onChange={handleChange} className="pl-9 w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white app-select-no-arrow">
                                    <option value="sedentary">Sedentary (Office Job)</option>
                                    <option value="light">Lightly Active (1-3 days/week)</option>
                                    <option value="moderate">Moderately Active (3-5 days/week)</option>
                                    <option value="active">Active (6-7 days/week)</option>
                                    <option value="very_active">Very Active (Physical Job)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Goal</label>
                            <div className="relative">
                                <Target className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <select name="goal" value={formData.goal} onChange={handleChange} className="pl-9 w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white app-select-no-arrow">
                                    <option value="lose">Lose Weight</option>
                                    <option value="maintain">Maintain Weight</option>
                                    <option value="build_muscle">Build Muscle</option>
                                    <option value="gain">Gain Weight</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading || !formData.age || !formData.weight || !formData.height}
                            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? "Calculating..." : <>Create Plan <ArrowRight size={18} /></>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
