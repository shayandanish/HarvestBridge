import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { marketplaceService } from '../services/api';

const ComparisonPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlants = async () => {
            const ids = searchParams.get('ids');
            if (!ids) {
                setLoading(false);
                return;
            }

            try {
                const plantIds = ids.split(',');
                const data = await marketplaceService.comparePlants(plantIds);
                setPlants(data);
            } catch (error) {
                console.error('Error fetching comparison data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlants();
    }, [searchParams]);

    if (loading) return <div className="text-center py-20">Loading comparison...</div>;

    if (plants.length === 0) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold mb-4">No plants to compare</h2>
                <button
                    onClick={() => navigate('/marketplace')}
                    className="text-green-600 hover:underline"
                >
                    Browse Marketplace
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Investment Comparison</h1>
                <button
                    onClick={() => navigate('/marketplace')}
                    className="text-gray-600 hover:text-green-600"
                >
                    + Add more plants
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Feature</th>
                            {plants.map(plant => (
                                <th key={plant.id} className="py-4 px-6 text-center text-lg font-bold text-gray-800 min-w-[200px]">
                                    {plant.cropType?.name}
                                    <div className="text-xs font-normal text-gray-500 mt-1">{plant.farm?.farmName}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        <tr>
                            <td className="py-4 px-6 font-medium text-gray-900 bg-gray-50">Location</td>
                            {plants.map(plant => (
                                <td key={plant.id} className="py-4 px-6 text-center text-gray-600">
                                    {plant.farm?.land?.city}, {plant.farm?.land?.state}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="py-4 px-6 font-medium text-gray-900 bg-gray-50">Variety</td>
                            {plants.map(plant => (
                                <td key={plant.id} className="py-4 px-6 text-center text-gray-600">
                                    {plant.cropType?.variety}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="py-4 px-6 font-medium text-gray-900 bg-gray-50">Farmer Rating</td>
                            {plants.map(plant => (
                                <td key={plant.id} className="py-4 px-6 text-center text-yellow-500 font-bold">
                                    {plant.farm?.farmer?.rating || 'N/A'} ⭐
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="py-4 px-6 font-medium text-gray-900 bg-gray-50">Monthly Fee</td>
                            {plants.map(plant => (
                                <td key={plant.id} className="py-4 px-6 text-center text-green-700 font-bold">
                                    ${plant.maintenanceFeeMonthly || 'N/A'}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="py-4 px-6 font-medium text-gray-900 bg-gray-50">Exp. Harvest</td>
                            {plants.map(plant => (
                                <td key={plant.id} className="py-4 px-6 text-center text-gray-600">
                                    {new Date(plant.expectedHarvestDate).toLocaleDateString()}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="py-4 px-6 font-medium text-gray-900 bg-gray-50"></td>
                            {plants.map(plant => (
                                <td key={plant.id} className="py-4 px-6 text-center">
                                    <button
                                        onClick={() => navigate(`/marketplace/plants/${plant.id}`)}
                                        className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 w-full"
                                    >
                                        Invest
                                    </button>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ComparisonPage;
