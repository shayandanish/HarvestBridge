import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import harvestService from '../services/harvestService';

const HarvestReviewForm = () => {
    const { harvestId } = useParams();
    const navigate = useNavigate();
    const [harvest, setHarvest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [reviewData, setReviewData] = useState({
        rating: 5,
        reviewText: '',
        yieldSatisfaction: 5,
        qualitySatisfaction: 5,
        experienceSatisfaction: 5,
        wouldInvestAgain: true,
        photos: []
    });

    useEffect(() => {
        fetchHarvestDetails();
    }, [harvestId]);

    const fetchHarvestDetails = async () => {
        try {
            // Need an endpoint for single harvest details or get from investor harvests
            const data = await harvestService.getInvestorHarvests();
            const current = data.data.find(h => h.id === harvestId);
            if (current) {
                setHarvest(current);
            } else {
                alert('Harvest not found');
                navigate('/investor/harvests');
            }
        } catch (err) {
            console.error('Error fetching harvest details:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRatingChange = (field, value) => {
        setReviewData({ ...reviewData, [field]: value });
    };

    const handlePhotoChange = (e) => {
        setReviewData({ ...reviewData, photos: Array.from(e.target.files) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await harvestService.submitReview(harvestId, reviewData);
            alert('Thank you for your feedback! Your review has been submitted for approval.');
            navigate('/investor/harvests');
        } catch (err) {
            alert('Failed to submit review: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-12 w-12 border-b-2 border-green-500 rounded-full"></div></div>;
    if (!harvest) return null;

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Share Your Experience</h1>
            <p className="text-gray-600 mb-8">Your feedback helps {harvest.plant.farm.farmName} and our community grow better.</p>

            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
                {/* Overall Rating */}
                <div>
                    <label className="block text-lg font-bold text-gray-800 mb-4">Overall Experience</label>
                    <div className="flex gap-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => handleRatingChange('rating', star)}
                                className={`text-4xl transition-all hover:scale-125 ${reviewData.rating >= star ? 'text-yellow-400' : 'text-gray-200'
                                    }`}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                </div>

                {/* Specific Satisfactions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Yield Satisfaction</label>
                        <select
                            className="w-full p-3 bg-gray-50 border rounded-xl"
                            value={reviewData.yieldSatisfaction}
                            onChange={(e) => handleRatingChange('yieldSatisfaction', parseInt(e.target.value))}
                        >
                            {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} Stars</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Quality Satisfaction</label>
                        <select
                            className="w-full p-3 bg-gray-50 border rounded-xl"
                            value={reviewData.qualitySatisfaction}
                            onChange={(e) => handleRatingChange('qualitySatisfaction', parseInt(e.target.value))}
                        >
                            {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} Stars</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Process Experience</label>
                        <select
                            className="w-full p-3 bg-gray-50 border rounded-xl"
                            value={reviewData.experienceSatisfaction}
                            onChange={(e) => handleRatingChange('experienceSatisfaction', parseInt(e.target.value))}
                        >
                            {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} Stars</option>)}
                        </select>
                    </div>
                </div>

                {/* Review Text */}
                <div>
                    <label className="block text-lg font-bold text-gray-800 mb-2">Tell us more</label>
                    <textarea
                        required
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl h-32 focus:ring-2 focus:ring-green-500 transition-all"
                        placeholder="What did you like about the produce or the process? Any suggestions for the farmer?"
                        value={reviewData.reviewText}
                        onChange={(e) => setReviewData({ ...reviewData, reviewText: e.target.value })}
                    ></textarea>
                </div>

                {/* Photos */}
                <div>
                    <label className="block text-lg font-bold text-gray-800 mb-2">Upload Photos</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-200 border-dashed rounded-2xl hover:border-green-400 transition-colors">
                        <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex text-sm text-gray-600">
                                <label className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500">
                                    <span>Upload images of your harvest</span>
                                    <input type="file" multiple className="sr-only" onChange={handlePhotoChange} />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            {reviewData.photos.length > 0 && (
                                <p className="text-sm font-bold text-green-600">{reviewData.photos.length} files selected</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Would Invest Again */}
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="investAgain"
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        checked={reviewData.wouldInvestAgain}
                        onChange={(e) => setReviewData({ ...reviewData, wouldInvestAgain: e.target.checked })}
                    />
                    <label htmlFor="investAgain" className="ml-3 text-gray-700 font-medium">
                        I would invest with this farmer again
                    </label>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-xl transition-all shadow-xl shadow-green-100 disabled:bg-gray-400"
                >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
            </form>
        </div>
    );
};

export default HarvestReviewForm;
