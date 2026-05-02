import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { farmerService } from '../../services/farmerService';

const EditFarmPage = () => {
    const { farmId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        farmName: '',
        description: '',
        totalArea: '',
        areaUnit: 'acre',
        isOrganic: false
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFarm = async () => {
            try {
                setLoading(true);
                const data = await farmerService.getFarmById(farmId);
                if (data) {
                    setFormData({
                        farmName: data.farmName || '',
                        description: data.description || '',
                        totalArea: data.totalArea || '',
                        areaUnit: data.areaUnit || 'acre',
                        isOrganic: data.isOrganic || false
                    });
                }
                setError(null);
            } catch (err) {
                console.error('Error fetching farm:', err);
                setError('Failed to load farm details.');
            } finally {
                setLoading(false);
            }
        };

        if (farmId) {
            fetchFarm();
        }
    }, [farmId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            await farmerService.updateFarm(farmId, {
                ...formData,
                totalArea: formData.totalArea ? parseFloat(formData.totalArea) : null
            });
            navigate(`/farms/${farmId}`);
        } catch (err) {
            console.error('Error updating farm:', err);
            setError(err.response?.data?.message || 'Failed to update farm.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center py-12">Loading farm details...</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-2xl">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Edit Farm Details</h2>
                        <button
                            onClick={() => navigate(-1)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            Cancel
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name</label>
                            <input
                                type="text"
                                name="farmName"
                                value={formData.farmName}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded p-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                className="w-full border border-gray-300 rounded p-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Area</label>
                                <input
                                    type="number"
                                    name="totalArea"
                                    value={formData.totalArea}
                                    onChange={handleChange}
                                    required
                                    step="0.01"
                                    className="w-full border border-gray-300 rounded p-2 focus:ring-green-500 focus:border-green-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                <select
                                    name="areaUnit"
                                    value={formData.areaUnit}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded p-2 focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="acre">Acre</option>
                                    <option value="hectare">Hectare</option>
                                    <option value="sqft">Sq Ft</option>
                                    <option value="sqm">Sq M</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="isOrganic"
                                id="isOrganic"
                                checked={formData.isOrganic}
                                onChange={handleChange}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isOrganic" className="ml-2 block text-sm text-gray-900">
                                This farm follows organic practices
                            </label>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className={`px-6 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 ${saving ? 'opacity-70' : ''}`}
                            >
                                {saving ? 'Saving...' : 'Update Farm'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditFarmPage;
