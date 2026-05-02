import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { farmerService } from '../services/farmerService';
import { landService } from '../services/landService'; // Reuse fetching if needed, or better, add to farmerService

const CreateFarmPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const landId = searchParams.get('landId');

    const [loading, setLoading] = useState(false);
    const [land, setLand] = useState(null);
    const [formData, setFormData] = useState({
        farmName: '',
        description: '',
        totalArea: '',
        areaUnit: 'acre',
        isOrganic: false
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!landId) {
            navigate('/lands/browse');
            return;
        }

        const fetchLand = async () => {
            try {
                // We should probably add getLandById to farmerService to keep contexts separate,
                // but landService.getLandById relies on /lands/:id which might be protected for landowners?
                // The backend route /lands/:id is for landowner. 
                // Farmer needs to use /farmer/lands/available or a public endpoint.
                // Let's assume for now we use the land data passed or fetch via a new endpoint if strict.
                // But wait, /lands/:id checks "land.landownerId === req.user.id". So Farmer CANNOT use it.
                // I need to add getLandDetails to farmerService using a public/farmer accessible endpoint.
                // Actually, `getAvailableLands` returns list. 
                // Creating a specific `getLandDetails` for farmer might be needed if not in list.
                // For now, let's assume the user selects from browse and we might not have a dedicated "get single land as farmer" endpoint yet
                // except maybe filtering getAvailableLands by ID?
                // Let's check backend... land.controller.js `getLands` is for landowner.
                // `farmer.controller.js` `getAvailableLands` is for farmer.
                // I should probably add `getLandById` to `farmer.controller.js` or modify `land.controller.js` public access.
                // For now, I will skip fetching land details here to avoid blocking, 
                // or just display "Land ID: {landId}" and trust the user comes from Browse page.

                // Better: I'll trust the user knows what they clicked. 
                // Ideally I'd fetch it. I'll stick to a simple form.
                setLand({ id: landId });
            } catch (err) {
                console.error(err);
            }
        };
        fetchLand();
    }, [landId, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await farmerService.createFarm({
                ...formData,
                landId: landId
            });
            navigate('/dashboard'); // Go back to dashboard to see new farm
        } catch (err) {
            console.error('Error creating farm:', err);
            setError(err.response?.data?.message || 'Failed to create farm.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-2xl">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Farm</h2>

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
                                placeholder="e.g. Green Valley Organic Farm"
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
                                placeholder="Describe your farming methods and goals..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Area Allocation</label>
                                <input
                                    type="number"
                                    name="totalArea"
                                    value={formData.totalArea}
                                    onChange={handleChange}
                                    required
                                    step="0.1"
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

                        <div className="flex justify-end space-x-4 pt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/lands/browse')}
                                className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-6 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 ${loading ? 'opacity-70' : ''}`}
                            >
                                {loading ? 'Creating...' : 'Create Farm'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateFarmPage;
