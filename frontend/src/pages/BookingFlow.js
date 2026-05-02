import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import bookingService from '../services/bookingService';
import { marketplaceService } from '../services/api';

const BookingFlow = () => {
    const { farmId } = useParams();
    const navigate = useNavigate();

    // Steps: 1=Date/Time, 2=Details/Activities, 3=Review, 4=Confirmation
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [farm, setFarm] = useState(null);

    // Selection State
    const [selectedDate, setSelectedDate] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null); // { startTime, endTime, availableSpots }

    const [guests, setGuests] = useState(1);
    const [specialRequests, setSpecialRequests] = useState('');
    const [farmActivities, setFarmActivities] = useState([]);
    const [selectedActivities, setSelectedActivities] = useState({}); // { activityId: quantity }

    const [bookingResult, setBookingResult] = useState(null);

    useEffect(() => {
        const fetchFarmInfo = async () => {
            // Fetch farm basic details
            try {
                const farmData = await marketplaceService.getFarmDetails(farmId);
                setFarm(farmData);

                const activities = await bookingService.getFarmActivities(farmId);
                setFarmActivities(activities);
            } catch (err) {
                console.error(err);
            }
        };
        fetchFarmInfo();
    }, [farmId]);

    // Fetch slots when date changes
    useEffect(() => {
        if (selectedDate) {
            const fetchSlots = async () => {
                try {
                    // Fetch for just the selected date to keep it simple or a range
                    const slots = await bookingService.getAvailableSlots(farmId, selectedDate, selectedDate);
                    setAvailableSlots(slots);
                    setSelectedSlot(null); // Reset slot selection
                } catch (err) {
                    console.error(err);
                }
            };
            fetchSlots();
        }
    }, [selectedDate, farmId]);

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    const handleActivityChange = (activityId, quantity) => {
        if (quantity < 0) return;
        setSelectedActivities(prev => ({
            ...prev,
            [activityId]: quantity
        }));
    };

    const calculateTotal = () => {
        let total = 0;
        Object.entries(selectedActivities).forEach(([actId, qty]) => {
            const act = farmActivities.find(a => a.id === actId);
            if (act && qty > 0) {
                total += Number(act.pricePerPerson) * qty;
            }
        });
        return total;
    };

    const handleSubmitBooking = async () => {
        setLoading(true);
        try {
            const activitiesPayload = Object.entries(selectedActivities)
                .filter(([_, qty]) => qty > 0)
                .map(([actId, qty]) => ({
                    activityId: actId,
                    quantity: qty
                }));

            const bookingData = {
                farmId,
                visitDate: selectedDate,
                visitTime: selectedSlot.startTime,
                numberOfGuests: guests,
                specialRequests,
                activities: activitiesPayload
            };

            const result = await bookingService.createBooking(bookingData);
            setBookingResult(result);
            setStep(4);
        } catch (err) {
            alert('Booking failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    if (!farm) return <div className="p-10 text-center">Loading booking details...</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="bg-green-600 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">Book a Visit to {farm.farmName}</h2>
                    <p className="text-green-100 text-sm">Step {step} of 4</p>
                </div>

                <div className="p-8">
                    {/* Step 1: Date & Time */}
                    {step === 1 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Select Date & Time</h3>
                            <div className="mb-6">
                                <label className="block text-gray-700 font-medium mb-2">Visit Date</label>
                                <input
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    className="w-full p-3 border rounded-lg focus:ring-green-500 focus:border-green-500"
                                />
                            </div>

                            {selectedDate && (
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-3">Available Time Slots</h4>
                                    {availableSlots.length === 0 ? (
                                        <p className="text-gray-500 italic">No available slots for this date.</p>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {availableSlots.map((slot, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`p-3 rounded border text-center transition ${selectedSlot === slot
                                                        ? 'bg-green-600 text-white border-green-600 shadow-md'
                                                        : 'hover:bg-green-50 border-gray-200'
                                                        }`}
                                                >
                                                    <div className="font-bold">{slot.startTime} - {slot.endTime}</div>
                                                    <div className="text-xs opacity-75">{slot.availableSpots} spots left</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-8 flex justify-end">
                                <button
                                    disabled={!selectedDate || !selectedSlot}
                                    onClick={() => setStep(2)}
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700"
                                >
                                    Next: Visit Details →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Details & Activities */}
                    {step === 2 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Visit Details</h3>

                            <div className="mb-6">
                                <label className="block text-gray-700 font-medium mb-2">Number of Guests</label>
                                <select
                                    value={guests}
                                    onChange={(e) => setGuests(parseInt(e.target.value))}
                                    className="w-full p-3 border rounded-lg"
                                >
                                    {[...Array(Math.min(10, selectedSlot?.availableSpots || 10)).keys()].map(i => (
                                        <option key={i + 1} value={i + 1}>{i + 1} Guest{(i + 1) > 1 ? 's' : ''}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-6">
                                <label className="block text-gray-700 font-medium mb-2">Special Requests</label>
                                <textarea
                                    value={specialRequests}
                                    onChange={(e) => setSpecialRequests(e.target.value)}
                                    placeholder="Any dietary restrictions or accessibility needs?"
                                    className="w-full p-3 border rounded-lg h-24"
                                />
                            </div>

                            {farmActivities.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-medium text-gray-700 mb-3">Add-on Activities (Optional)</h4>
                                    <div className="space-y-3">
                                        {farmActivities.map(activity => (
                                            <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                                <div>
                                                    <div className="font-bold text-gray-800">{activity.activityName}</div>
                                                    <div className="text-sm text-gray-500">{activity.description}</div>
                                                    <div className="text-green-600 font-medium">${activity.pricePerPerson} / person</div>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <button
                                                        onClick={() => handleActivityChange(activity.id, (selectedActivities[activity.id] || 0) - 1)}
                                                        className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300"
                                                    >-</button>
                                                    <span className="w-4 text-center">{selectedActivities[activity.id] || 0}</span>
                                                    <button
                                                        onClick={() => handleActivityChange(activity.id, (selectedActivities[activity.id] || 0) + 1)}
                                                        className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200"
                                                    >+</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-8 flex justify-between">
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-gray-600 hover:underline px-4"
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700"
                                >
                                    Next: Review →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {step === 3 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-6">Review Booking</h3>

                            <div className="bg-gray-50 p-6 rounded-lg space-y-4 mb-6">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">Farm</span>
                                    <span className="font-bold">{farm.farmName}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">Date</span>
                                    <span className="font-bold">{new Date(selectedDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">Time</span>
                                    <span className="font-bold">{selectedSlot?.startTime} - {selectedSlot?.endTime}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">Guests</span>
                                    <span className="font-bold">{guests}</span>
                                </div>

                                {Object.keys(selectedActivities).some(k => selectedActivities[k] > 0) && (
                                    <div className="pt-2">
                                        <div className="font-medium mb-2 text-gray-700">Selected Activities:</div>
                                        {Object.entries(selectedActivities).map(([id, qty]) => {
                                            if (qty <= 0) return null;
                                            const act = farmActivities.find(a => a.id === id);
                                            return (
                                                <div key={id} className="flex justify-between text-sm pl-4 mb-1">
                                                    <span>{act?.activityName} (x{qty})</span>
                                                    <span>${(Number(act?.pricePerPerson) * qty).toFixed(2)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="flex justify-between pt-4 border-t border-gray-300 text-lg font-bold">
                                    <span>Total Cost</span>
                                    <span className="text-green-700">${calculateTotal().toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-between">
                                <button
                                    onClick={() => setStep(2)}
                                    className="text-gray-600 hover:text-gray-800 px-4"
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={handleSubmitBooking}
                                    disabled={loading}
                                    className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 shadow-md flex items-center"
                                >
                                    {loading ? 'Processing...' : 'Confirm Booking'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Confirmation */}
                    {step === 4 && bookingResult && (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm">
                                ✓
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                            <p className="text-lg text-gray-600 mb-8">We've sent a confirmation email with your ticket details.</p>

                            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 max-w-sm mx-auto shadow-sm mb-10">
                                <p className="text-sm text-gray-500 uppercase tracking-widest font-semibold mb-2">Confirmation Code</p>
                                <p className="text-3xl font-mono font-black text-green-700 tracking-tighter mb-6">{bookingResult.confirmationCode}</p>

                                <div className="flex justify-center mb-6 bg-gray-50 p-4 rounded-xl">
                                    <img src={bookingResult.qrCodeUrl} alt="Booking QR Code" className="w-56 h-56" />
                                </div>
                                <p className="text-sm text-gray-500 leading-snug">Present this QR code at the farm entrance for a quick check-in.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto mb-8">
                                <button
                                    onClick={() => handleDownloadIcs(bookingResult)}
                                    className="flex items-center justify-center space-x-2 bg-white border-2 border-green-600 text-green-600 px-6 py-3 rounded-xl font-bold hover:bg-green-50 transition"
                                >
                                    <span>📅</span>
                                    <span>Add to Calendar</span>
                                </button>
                                <button
                                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(farm.land?.address || farm.farmName)}`, '_blank')}
                                    className="flex items-center justify-center space-x-2 bg-white border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition"
                                >
                                    <span>📍</span>
                                    <span>Get Directions</span>
                                </button>
                            </div>

                            <div className="flex flex-col space-y-3 max-w-xs mx-auto">
                                <button
                                    onClick={() => navigate('/investor/bookings')}
                                    className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 shadow-md transition"
                                >
                                    View My Bookings
                                </button>
                                <button
                                    onClick={() => navigate('/marketplace')}
                                    className="text-gray-500 font-medium hover:text-gray-700 transition"
                                >
                                    Back to Marketplace
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper for .ics download (Simplified client-side version)
const handleDownloadIcs = (booking) => {
    const date = new Date(booking.visitDate);
    const dateStr = date.toISOString().replace(/-|:|\.\d+/g, '');
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
URL:${window.location.origin}/bookings/${booking.id}
DTSTART:${dateStr}
SUMMARY:Farm Visit: ${booking.farm?.farmName || 'Farm'}
DESCRIPTION:Confirmation Code: ${booking.confirmationCode}\\nSpecial Requests: ${booking.specialRequests || 'None'}
LOCATION:${booking.farm?.land?.address || ''}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `farm-visit-${booking.confirmationCode}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export default BookingFlow;
