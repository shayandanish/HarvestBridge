import React, { useState, useEffect } from 'react';
import { cropTypeService } from '../services/cropTypeService';
import api from '../services/api'; // Using api directly for plant creation for now or add to farmerService

const AddPlantModal = ({ isOpen, onClose, farmId, onPlantAdded, cultivablePlants }) => {
    const [cropTypes, setCropTypes] = useState([]);
    const [filteredCropTypes, setFilteredCropTypes] = useState([]);
    const [formData, setFormData] = useState({
        cropTypeId: '',
        plantDate: new Date().toISOString().split('T')[0],
        locationInFarm: '',
        uniqueIdentifier: '' // Optional, maybe auto-generated or manual
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            const fetchCropTypes = async () => {
                try {
                    const data = await cropTypeService.getAllCropTypes();
                    console.log('All crop types:', data);
                    console.log('Cultivable plants:', cultivablePlants);
                    
                    setCropTypes(data);
                    
                    // For consistency, show all available crop types
                    // The farmer should be able to plant any crop type that's available
                    setFilteredCropTypes(data);
                    
                    console.log('Showing all available crop types for consistency:', data);
                } catch (err) {
                    console.error('Error fetching crop types:', err);
                    setError('Failed to load crop types.');
                }
            };
            fetchCropTypes();
        }
    }, [isOpen]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Check if we have a service for this
            // We'll use direct API call or farmerService if updated
            // Let's use api directly here for expediency or add to service
            await api.post(`/plants/farms/${farmId}/plants`, {
                ...formData,
                cropTypeId: formData.cropTypeId
            });
            onPlantAdded();
            onClose();
            setFormData({
                cropTypeId: '',
                plantDate: new Date().toISOString().split('T')[0],
                locationInFarm: '',
                uniqueIdentifier: ''
            });
        } catch (err) {
            console.error('Error adding plant:', err);
            setError(err.response?.data?.message || 'Failed to add plant.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">Add New Plant</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type</label>
                        <div className="text-xs text-gray-500 mb-2">
                            Select from all available crop types for planting
                        </div>
                        <select
                            name="cropTypeId"
                            value={formData.cropTypeId}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded p-2 focus:ring-green-500 focus:border-green-500"
                        >
                            <option value="">Select a crop...</option>
                            {Array.isArray(filteredCropTypes) && filteredCropTypes.map(ct => (
                                <option key={ct.id} value={ct.id}>
                                    {ct.name} {ct.variety ? `(${ct.variety})` : ''}
                                </option>
                            ))}
                        </select>
                        {filteredCropTypes.length === 0 && (
                            <p className="text-sm text-gray-500 mt-1">
                                No crop types available. Please contact administrator to add crop types.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Planting Date</label>
                        <input
                            type="date"
                            name="plantDate"
                            value={formData.plantDate}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded p-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location in Farm (Optional)</label>
                        <input
                            type="text"
                            name="locationInFarm"
                            value={formData.locationInFarm}
                            onChange={handleChange}
                            placeholder="e.g. Row 1, Block A"
                            className="w-full border border-gray-300 rounded p-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unique Identifier (Optional)</label>
                        <input
                            type="text"
                            name="uniqueIdentifier"
                            value={formData.uniqueIdentifier}
                            onChange={handleChange}
                            placeholder="e.g. #PLANT-001"
                            className="w-full border border-gray-300 rounded p-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 ${loading ? 'opacity-70' : ''}`}
                        >
                            {loading ? 'Adding...' : 'Add Plant'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPlantModal;
