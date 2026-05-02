import React, { useState } from 'react';
import { reviewService } from '../services/reviewService';

const RatingModal = ({ isOpen, onClose, farmerId, farmerName, investmentId, farmId, onReviewSubmitted }) => {
    const [rating, setRating] = useState(5);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await reviewService.submitFarmerReview({
                farmerId,
                investmentId,
                farmId,
                rating,
                comment
            });
            if (onReviewSubmitted) onReviewSubmitted();
            onClose();
        } catch (err) {
            alert('Failed to submit review: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-emerald-50">
                {/* Header */}
                <div className="relative h-32 bg-emerald-600 flex items-center justify-center text-center px-6">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="text-white">
                        <h3 className="text-2xl font-bold">Rate Your Experience</h3>
                        <p className="text-emerald-100 opacity-90">How was your collaboration with {farmerName}?</p>
                    </div>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Star Rating */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        onClick={() => setRating(star)}
                                        className={`text-5xl transition-all duration-200 hover:scale-125 focus:outline-none ${
                                            (hoveredRating || rating) >= star 
                                            ? 'text-yellow-400 drop-shadow-sm' 
                                            : 'text-gray-200'
                                        }`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                {['Very Poor', 'Poor', 'Good', 'Very Good', 'Amazing'][rating - 1]}
                            </span>
                        </div>

                        {/* Comment */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Your Feedback</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="What was it like working with this farmer? Your feedback helps the entire community."
                                className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all resize-none text-gray-700"
                                required
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-4 px-6 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold rounded-2xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-[2] py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:bg-gray-300 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    <span>Send Review</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RatingModal;
