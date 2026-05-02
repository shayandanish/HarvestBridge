import React, { useState, useEffect } from 'react';
import bookingService from '../services/bookingService';
import { useNavigate } from 'react-router-dom';

const MyBookingsPage = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const data = await bookingService.getMyBookings();
                setBookings(data);
            } catch (err) {
                console.error('Error fetching bookings:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const upcomingBookings = bookings.filter(b => new Date(b.visitDate) >= new Date() && b.status !== 'cancelled');
    const pastBookings = bookings.filter(b => new Date(b.visitDate) < new Date() && b.status !== 'cancelled');
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

    if (loading) return <div className="p-8 text-center">Loading bookings...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Upcoming Visits</h2>
                {upcomingBookings.length === 0 ? (
                    <p className="text-gray-500 italic">No upcoming visits scheduled.</p>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upcomingBookings.map(booking => (
                            <BookingCard key={booking.id} booking={booking} />
                        ))}
                    </div>
                )}
            </div>

            {pastBookings.length > 0 && (
                <div className="mb-8 opacity-75">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Past Visits</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pastBookings.map(booking => (
                            <BookingCard key={booking.id} booking={booking} />
                        ))}
                    </div>
                </div>
            )}

            {cancelledBookings.length > 0 && (
                <div className="mb-8 opacity-50">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Cancelled</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cancelledBookings.map(booking => (
                            <BookingCard key={booking.id} booking={booking} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const BookingCard = ({ booking, onUpdate }) => {
    const handleCancel = async () => {
        if (window.confirm('Are you sure you want to cancel this booking?')) {
            try {
                await bookingService.cancelBooking(booking.id, 'Cancelled by user');
                onUpdate();
            } catch (err) {
                alert('Cancellation failed');
            }
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden transform hover:-translate-y-1 transition duration-300">
            <div className="h-48 bg-gray-200 relative">
                {booking.farm?.photos && booking.farm.photos.length > 0 ? (
                    <img src={booking.farm.photos[0].url} alt={booking.farm.farmName} className="w-full h-full object-cover" />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 font-bold">No Cover Image</div>
                )}
                <div className={`absolute top-4 right-4 px-4 py-1.5 text-xs font-black rounded-xl uppercase tracking-widest shadow-lg ${booking.status === 'confirmed' ? 'bg-green-600 text-white' :
                        booking.status === 'pending' ? 'bg-yellow-500 text-white' :
                            booking.status === 'cancelled' ? 'bg-red-600 text-white' :
                                'bg-gray-600 text-white'
                    }`}>
                    {booking.status}
                </div>
            </div>

            <div className="p-6">
                <h3 className="font-black text-xl mb-4 text-gray-900 leading-tight">{booking.farm?.farmName}</h3>

                <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-gray-400">📅 Date</span>
                        <span className="text-gray-900 font-bold">{new Date(booking.visitDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-gray-400">⏰ Time</span>
                        <span className="text-gray-900 font-bold">{booking.visitTime}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-gray-400">👥 Guests</span>
                        <span className="text-gray-900 font-bold">{booking.numberOfGuests} Persons</span>
                    </div>
                </div>

                {booking.activities?.length > 0 && (
                    <div className="mb-6 pt-4 border-t border-gray-50">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Add-on Activities</p>
                        <div className="flex flex-wrap gap-2">
                            {booking.activities.map(act => (
                                <span key={act.id} className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-xs font-bold">
                                    {act.activityName} (x{act.quantity})
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-6">
                    {(booking.status === 'confirmed' || booking.status === 'pending') && (
                        <>
                            <button
                                onClick={() => handleCancel()}
                                className="bg-white border-2 border-red-100 text-red-500 px-4 py-3 rounded-2xl text-sm font-black hover:bg-red-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.farm?.land?.address || booking.farm?.farmName)}`, '_blank')}
                                className="bg-blue-600 text-white px-4 py-3 rounded-2xl text-sm font-black hover:bg-blue-700 shadow-md transition"
                            >
                                Directions
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyBookingsPage;
