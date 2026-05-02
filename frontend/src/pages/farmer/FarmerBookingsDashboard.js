import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import bookingService from '../../services/bookingService';
import { farmerService } from '../../services/farmerService'; // Assuming this exists or use axios directly

const FarmerBookingsDashboard = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode] = useState('list'); // list or calendar

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const data = await bookingService.getMyBookings();
            setBookings(data);
        } catch (err) {
            console.error('Error fetching bookings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async (bookingId) => {
        try {
            await bookingService.confirmBooking(bookingId);
            alert('Booking confirmed!');
            fetchBookings();
        } catch (err) {
            alert('Confirmation failed');
        }
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const todaysBookings = bookings.filter(b => b.visitDate.startsWith(todayStr) && b.status !== 'cancelled');

    const filteredBookings = filterStatus === 'all'
        ? bookings
        : bookings.filter(b => b.status === filterStatus);

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Farm Bookings Dashboard</h1>
                    <p className="text-gray-500 font-medium">Manage visitor schedules and check-ins.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-white text-gray-700 font-extrabold py-2 px-6 rounded-xl border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
                    >
                        <span>←</span> Back
                    </button>
                    <button
                        onClick={() => navigate('/farmer/check-in')}
                        className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 shadow-md transition flex items-center"
                    >
                        <span className="mr-2">📷</span> Scan QR
                    </button>
                    <button
                        onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
                        className="bg-white border-2 border-gray-200 text-gray-700 px-6 py-2 rounded-xl font-bold hover:bg-gray-50 transition"
                    >
                        {viewMode === 'list' ? '🗓️ Calendar View' : '📋 List View'}
                    </button>
                </div>
            </div>

            {/* Today's Visitors Section */}
            {todaysBookings.length > 0 && (
                <div className="mb-10 bg-green-50 border border-green-100 rounded-3xl p-8 relative overflow-hidden shadow-sm">
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center">
                            <span className="mr-2">✨</span> Today's Visitors ({todaysBookings.length})
                        </h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {todaysBookings.map(b => (
                                <div key={b.id} className="bg-white p-4 rounded-2xl shadow-sm border border-green-200">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-gray-900">{b.investor?.fullName}</p>
                                            <p className="text-sm text-gray-600">{b.visitTime} • {b.numberOfGuests} Guests</p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${b.checkedInAt ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {b.checkedInAt ? 'Checked In' : 'Expected'}
                                        </span>
                                    </div>
                                    {!b.checkedInAt && (
                                        <button
                                            onClick={() => navigate('/farmer/check-in')}
                                            className="mt-3 w-full text-xs font-bold text-green-600 bg-green-50 py-2 rounded-lg hover:bg-green-100 transition"
                                        >
                                            Check-in Now
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex space-x-2 overflow-x-auto pb-2">
                    {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-5 py-2 rounded-xl capitalize font-bold transition whitespace-nowrap ${filterStatus === status
                                ? 'bg-gray-900 text-white shadow-lg'
                                : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
            ) : viewMode === 'list' ? (
                <div className="bg-white shadow-xl shadow-gray-100 rounded-3xl border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Date & Time</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Investor</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Guests & Total</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {filteredBookings.map(booking => (
                                <tr key={booking.id} className="hover:bg-gray-50 transition cursor-default">
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="font-bold text-gray-900">{new Date(booking.visitDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                        <div className="text-sm text-gray-500 font-medium">{booking.visitTime}</div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold mr-3">
                                                {booking.investor?.fullName?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">{booking.investor?.fullName}</div>
                                                <div className="text-xs text-gray-500">{booking.investor?.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">{booking.numberOfGuests} Guests</div>
                                        <div className="text-xs text-green-600 font-black">${booking.totalCost} USD</div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-black rounded-xl uppercase tracking-tighter ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            {booking.status === 'pending' && (
                                                <button
                                                    onClick={() => handleConfirm(booking.id)}
                                                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition"
                                                >
                                                    Confirm
                                                </button>
                                            )}
                                            <button
                                                onClick={() => navigate(`/farmer/bookings/${booking.id}`)}
                                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition"
                                            >
                                                Details
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center h-96 flex flex-col items-center justify-center">
                    <p className="text-4xl mb-4">📅</p>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Calendar View Details</h3>
                    <p className="text-gray-500 max-w-sm">Full calendar integration (Month/Week views) with color-coded booking density is being prepared.</p>
                </div>
            )}
        </div>
    );
};

export default FarmerBookingsDashboard;
