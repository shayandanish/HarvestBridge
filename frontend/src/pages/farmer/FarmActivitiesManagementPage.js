import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { farmerService } from '../../services/farmerService';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const FarmActivitiesManagementPage = () => {
    const navigate = useNavigate();
    const [farms, setFarms] = useState([]);
    const [selectedFarmId, setSelectedFarmId] = useState('');
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [activityName, setActivityName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState(0);
    const [isActive, setIsActive] = useState(true);

    const token = JSON.parse(localStorage.getItem('user'))?.token;

    useEffect(() => {
        const fetchFarms = async () => {
            try {
                const data = await farmerService.getFarms();
                setFarms(data);
                if (data.length > 0) {
                    setSelectedFarmId(data[0].id);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFarms();
    }, []);

    useEffect(() => {
        if (selectedFarmId) {
            fetchActivities();
        }
    }, [selectedFarmId]);

    const fetchActivities = async () => {
        try {
            const response = await axios.get(`${API_URL}/farms/${selectedFarmId}/activities`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setActivities(response.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/farms/${selectedFarmId}/activities`, {
                activityName,
                description,
                price,
                isActive
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setActivityName('');
            setDescription('');
            setPrice(0);
            fetchActivities();
            alert('Activity added successfully!');
        } catch (err) {
            alert('Failed to add activity');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await axios.delete(`${API_URL}/farms/${selectedFarmId}/activities/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchActivities();
        } catch (err) {
            alert('Failed to delete');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Farm Activities</h1>
                    <p className="text-gray-500 font-medium">Create and manage additional experiences for your visitors.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-white text-gray-700 font-extrabold py-3 px-8 rounded-2xl border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
                    >
                        <span>←</span> Back
                    </button>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 mb-10">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Active Farm</label>
                <select
                    value={selectedFarmId}
                    onChange={(e) => setSelectedFarmId(e.target.value)}
                    className="w-full md:w-1/2 p-4 border-2 border-gray-100 rounded-2xl bg-gray-50 font-bold text-gray-900 focus:border-green-500 focus:bg-white transition"
                >
                    {farms.map(farm => (
                        <option key={farm.id} value={farm.id}>{farm.farmName}</option>
                    ))}
                </select>
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1">
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 sticky top-8">
                        <h2 className="text-xl font-black text-gray-900 mb-8">Add New Activity</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Activity Name</label>
                                <input
                                    type="text"
                                    value={activityName}
                                    onChange={(e) => setActivityName(e.target.value)}
                                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition font-medium"
                                    placeholder="e.g. Organic Fruit Picking"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition font-medium h-32"
                                    placeholder="What will guests do?"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Price (USD)</label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(Number(e.target.value))}
                                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition font-bold"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-gray-900 text-white p-4 rounded-2xl font-black hover:bg-black transition shadow-lg"
                            >
                                Create Activity
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="grid gap-6">
                        {activities.length === 0 ? (
                            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl py-20 text-center">
                                <p className="text-gray-400 font-black uppercase tracking-widest">No activities added yet</p>
                            </div>
                        ) : (
                            activities.map(activity => (
                                <div key={activity.id} className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 flex flex-col md:flex-row justify-between items-center group">
                                    <div className="mb-4 md:mb-0">
                                        <div className="flex items-center mb-1">
                                            <h3 className="text-xl font-black text-gray-900 mr-3">{activity.activityName}</h3>
                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter">
                                                ${activity.price}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-sm font-medium pr-8">{activity.description}</p>
                                    </div>
                                    <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                            onClick={() => handleDelete(activity.id)}
                                            className="bg-red-50 text-red-500 p-3 rounded-xl hover:bg-red-100 transition"
                                        >
                                            <span className="text-sm font-black uppercase tracking-widest px-2">Delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FarmActivitiesManagementPage;
