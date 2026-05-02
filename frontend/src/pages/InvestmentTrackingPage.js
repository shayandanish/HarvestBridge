import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { trackingService } from '../services/api';

const InvestmentTrackingPage = () => {
    const { plantId } = useParams();
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTimeline = async () => {
            try {
                const data = await trackingService.getTimeline(plantId);
                setTimeline(data);
            } catch (error) {
                console.error('Error fetching timeline', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTimeline();
    }, [plantId]);

    if (loading) return <div className="text-center py-20">Loading Timeline...</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8 text-center">Growth Timeline</h1>

            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                <div className="space-y-8">
                    {timeline.map((item, index) => (
                        <div key={index} className="relative flex items-start pl-16">
                            {/* Dot */}
                            <div className={`absolute left-4 top-2 w-4 h-4 rounded-full border-2 border-white shadow 
                                ${item.type === 'milestone' ? 'bg-purple-600' :
                                    item.type === 'photo' ? 'bg-blue-500' : 'bg-green-500'}`}>
                            </div>

                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex-1 hover:shadow-md transition">
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded 
                                        ${item.type === 'milestone' ? 'bg-purple-100 text-purple-700' :
                                            item.type === 'photo' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                        {item.type === 'activity' ? item.activityType :
                                            item.type === 'milestone' ? item.milestoneType : 'New Photo'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {new Date(item.date).toLocaleDateString()}
                                    </span>
                                </div>

                                <p className="text-gray-700 mb-2">
                                    {item.description || item.caption || item.notes}
                                </p>

                                {item.photoUrl && (
                                    <img
                                        src={item.photoUrl}
                                        alt="Update"
                                        className="w-full h-48 object-cover rounded-lg mt-2"
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {timeline.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        No updates yet. Check back soon!
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvestmentTrackingPage;
