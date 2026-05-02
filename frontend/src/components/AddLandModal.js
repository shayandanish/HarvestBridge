import React, { useState } from 'react';
import { landService } from '../services/landService';
import { compressImage } from '../utils/imageUtils';

const AddLandModal = ({ isOpen, onClose, onLandAdded }) => {
    const [formData, setFormData] = useState({
        totalArea: '',
        areaUnit: 'acre',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        addressLine1: '',
        addressLine2: '',
        locationName: '', // Optional name/identifier
        ownershipDocument: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, ownershipDocument: e.target.files[0] }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let dataToSubmit = { ...formData };
            if (formData.ownershipDocument && formData.ownershipDocument.type.startsWith('image/')) {
                dataToSubmit.ownershipDocument = await compressImage(formData.ownershipDocument);
            }
            await landService.createLand(dataToSubmit);
            onLandAdded(); // Refresh list
            onClose();
            // Reset form
            setFormData({
                totalArea: '',
                areaUnit: 'acre',
                city: '',
                state: '',
                country: '',
                zipCode: '',
                addressLine1: '',
                addressLine2: '',
                locationName: '',
                ownershipDocument: null
            });
        } catch (err) {
            console.error('Error creating land:', err);
            setError(err.response?.data?.message || 'Failed to add land. Please check your inputs.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">Register New Land</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Area</label>
                            <input
                                type="number"
                                name="totalArea"
                                value={formData.totalArea}
                                onChange={handleChange}
                                required
                                min="0.1"
                                step="0.1"
                                className="w-full border border-gray-300 rounded md-2 p-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                            <select
                                name="areaUnit"
                                value={formData.areaUnit}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded md-2 p-2 focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="acre">Acre</option>
                                <option value="hectare">Hectare</option>
                                <option value="sqft">Sq Ft</option>
                                <option value="sqm">Sq Meter</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location Name (Optional)</label>
                        <input
                            type="text"
                            name="locationName"
                            value={formData.locationName}
                            onChange={handleChange}
                            placeholder="e.g. North Side Plot"
                            className="w-full border border-gray-300 rounded p-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded p-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded p-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                            <input
                                type="text"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded p-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP/Postal Code</label>
                            <input
                                type="text"
                                name="zipCode"
                                value={formData.zipCode}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded p-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                        <input
                            type="text"
                            name="addressLine1"
                            value={formData.addressLine1}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded p-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ownership Document</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition-colors">
                            <input
                                type="file"
                                name="ownershipDocument"
                                onChange={handleFileChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                id="doc-upload"
                            />
                            <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center">
                                <span className="text-gray-600 mb-1">
                                    {formData.ownershipDocument ? formData.ownershipDocument.name : "Click to upload document"}
                                </span>
                                <span className="text-xs text-gray-400">PDF, JPG, PNG (Max 5MB)</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Registering...' : 'Register Land'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddLandModal;
