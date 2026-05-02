import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { farmerService } from '../../services/farmerService';
import bookingService from '../../services/bookingService';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const FarmerAvailabilitySettings = () => {
    const navigate = useNavigate();
    const [farms, setFarms] = useState([]);
    const [selectedFarmId, setSelectedFarmId] = useState('');
    const [availability, setAvailability] = useState({});
    const [loading, setLoading] = useState(true);

    // New slot form state
    const [day, setDay] = useState('monday');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [maxVisitors, setMaxVisitors] = useState(10);

    const token = JSON.parse(localStorage.getItem('user'))?.token;

    // Blackout dates state
    const [blackoutDates, setBlackoutDates] = useState([]);
    const [blackoutDate, setBlackoutDate] = useState('');
    const [blackoutReason, setBlackoutReason] = useState('');

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
            fetchAvailability();
            fetchBlackoutDates();
        }
    }, [selectedFarmId]);

    const fetchAvailability = async () => {
        try {
            const response = await axios.get(`${API_URL}/farms/${selectedFarmId}/availability`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAvailability(response.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchBlackoutDates = async () => {
        try {
            const response = await axios.get(`${API_URL}/farms/${selectedFarmId}/blackout-dates`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBlackoutDates(response.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddSlot = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/farms/${selectedFarmId}/availability`, {
                dayOfWeek: day,
                startTime,
                endTime,
                maxVisitorsPerSlot: maxVisitors,
                slotDurationMinutes: 120 // Default 2 hours
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAvailability();
            alert('Availability slot added!');
        } catch (err) {
            alert('Failed to add slot: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteSlot = async (slotId) => {
        if (!window.confirm('Are you sure you want to delete this slot?')) return;
        try {
            await axios.delete(`${API_URL}/farms/${selectedFarmId}/availability/${slotId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAvailability();
        } catch (err) {
            alert('Failed to delete slot');
        }
    };

    const handleAddBlackoutDate = async (e) => {
        e.preventDefault();
        if (!blackoutDate) return alert('Select a date');
        try {
            await axios.post(`${API_URL}/farms/${selectedFarmId}/blackout-dates`, {
                blackoutDate,
                reason: blackoutReason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBlackoutDate('');
            setBlackoutReason('');
            fetchBlackoutDates();
            alert('Blackout date added!');
        } catch (err) {
            alert('Failed to add blackout date');
        }
    };

    const handleDeleteBlackoutDate = async (id) => {
        if (!window.confirm('Delete this blackout date?')) return;
        try {
            await axios.delete(`${API_URL}/farms/${selectedFarmId}/blackout-dates/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchBlackoutDates();
        } catch (err) {
            alert('Failed to delete');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        // ... rest of the file ...
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Manage Farm Availability</h1>
                    <p className="text-gray-500 font-medium">Set your visiting hours and capacity for investors.</p>
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

            <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Select Farm</label>
                <select
                    value={selectedFarmId}
                    onChange={(e) => setSelectedFarmId(e.target.value)}
                    className="p-2 border rounded w-full md:w-1/3"
                >
                    {farms.map(farm => (
                        <option key={farm.id} value={farm.id}>{farm.farmName}</option>
                    ))}
                </select>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Form to add availability */}
                <div className="bg-white p-6 rounded shadow max-h-fit">
                    <h2 className="text-lg font-bold mb-4">Add Availability Slot</h2>
                    <form onSubmit={handleAddSlot}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Day of Week</label>
                            <select
                                value={day}
                                onChange={(e) => setDay(e.target.value)}
                                className="w-full p-2 border rounded"
                            >
                                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(d => (
                                    <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Start Time</label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">End Time</label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Max Visitors</label>
                            <input
                                type="number"
                                min="1"
                                value={maxVisitors}
                                onChange={(e) => setMaxVisitors(e.target.value)}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 font-bold">
                            Add Slot
                        </button>
                    </form>
                </div>

                {/* Display Current Schedule */}
                <div className="md:col-span-2 space-y-8">
                    <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-50">
                        <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center">
                            <span className="mr-2">📅</span> Weekly Schedule
                        </h2>
                        {Object.keys(availability).length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <p className="text-gray-400 font-bold">No availability set yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(d => {
                                    const slots = availability[d];
                                    if (!slots || slots.length === 0) return null;

                                    return (
                                        <div key={d} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                                            <h3 className="font-black text-gray-800 capitalize mb-3 text-sm tracking-widest">{d}</h3>
                                            <div className="grid gap-3">
                                                {slots.map(slot => (
                                                    <div key={slot.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-green-200 transition">
                                                        <div>
                                                            <span className="font-bold text-gray-900">{slot.startTime} - {slot.endTime}</span>
                                                            <span className="text-xs text-gray-400 uppercase font-black ml-4 tracking-tighter">
                                                                Capacity: {slot.maxVisitorsPerSlot}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteSlot(slot.id)}
                                                            className="text-red-400 hover:text-red-600 font-black text-xs uppercase tracking-widest"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Blackout Dates Section */}
                    <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-50">
                        <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center">
                            <span className="mr-2">🚫</span> Blackout Dates
                        </h2>

                        <form onSubmit={handleAddBlackoutDate} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-red-50 p-6 rounded-2xl border border-red-100">
                            <div className="md:col-span-1">
                                <label className="block text-xs font-black text-red-800 uppercase tracking-widest mb-2">Date</label>
                                <input
                                    type="date"
                                    value={blackoutDate}
                                    onChange={(e) => setBlackoutDate(e.target.value)}
                                    className="w-full p-3 border-none rounded-xl bg-white shadow-sm ring-1 ring-red-200 focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-xs font-black text-red-800 uppercase tracking-widest mb-2">Reason</label>
                                <input
                                    type="text"
                                    value={blackoutReason}
                                    onChange={(e) => setBlackoutReason(e.target.value)}
                                    placeholder="Maintenance, Holiday..."
                                    className="w-full p-3 border-none rounded-xl bg-white shadow-sm ring-1 ring-red-200 focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                            <div className="flex items-end">
                                <button type="submit" className="w-full bg-red-600 text-white p-3 rounded-xl font-black hover:bg-red-700 transition shadow-lg shadow-red-100 uppercase tracking-widest text-xs">
                                    Add Exclusion
                                </button>
                            </div>
                        </form>

                        {blackoutDates.length > 0 ? (
                            <div className="grid gap-3">
                                {blackoutDates.map(b => (
                                    <div key={b.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <div>
                                            <span className="font-bold text-gray-900">{new Date(b.blackoutDate).toLocaleDateString()}</span>
                                            <span className="text-sm text-gray-500 ml-4 font-medium italic">"{b.reason}"</span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteBlackoutDate(b.id)}
                                            className="text-gray-400 hover:text-red-600 font-bold"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-400 font-medium">No blackout dates scheduled.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FarmerAvailabilitySettings;
