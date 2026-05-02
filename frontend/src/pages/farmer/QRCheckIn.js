import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from 'react-qr-scanner';
import bookingService from '../../services/bookingService';

const QRCheckIn = () => {
    const navigate = useNavigate();
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [manualCode, setManualCode] = useState('');

    const handleScan = async (data) => {
        if (data && !loading) {
            try {
                setLoading(true);
                const result = JSON.parse(data.text);
                setScanResult(result);
                // Automatically check in if scan successful
                await handleCheckIn(result.code);
            } catch (err) {
                console.error("Scan error:", err);
                setError("Invalid QR Code content");
                setLoading(false);
            }
        }
    };

    const handleCheckIn = async (code) => {
        setLoading(true);
        setError(null);
        try {
            // First find booking by code or id
            const booking = await bookingService.checkIn(null, code);
            alert(`Check-in Successful for ${booking.investor?.fullName || 'Guest'}!`);
            navigate('/farmer/bookings');
        } catch (err) {
            setError(err.response?.data?.message || "Check-in failed");
        } finally {
            setLoading(false);
        }
    };

    const handleError = (err) => {
        console.error(err);
        setError("Camera access denied or error occurred");
    };

    return (
        <div className="max-w-md mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Visitor Check-in</h2>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border border-gray-100">
                <div className="relative aspect-square bg-black">
                    {!scanResult && (
                        <QrScanner
                            delay={300}
                            onError={handleError}
                            onScan={handleScan}
                            style={{ width: '100%' }}
                        />
                    )}
                    <div className="absolute inset-0 border-2 border-green-500 border-dashed opacity-50 pointer-events-none m-12 rounded-xl"></div>
                </div>

                <div className="p-6 text-center">
                    <p className="text-gray-500 text-sm">Align the QR code within the frame to scan</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-4">Manual Entry</h3>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                        placeholder="ENTER CODE (E.G. A1B2C3D4)"
                        className="flex-1 p-3 border rounded-xl font-mono"
                    />
                    <button
                        onClick={() => handleCheckIn(manualCode)}
                        disabled={loading || !manualCode}
                        className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold disabled:opacity-50"
                    >
                        Check-in
                    </button>
                </div>
            </div>

            {error && (
                <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center">
                    {error}
                </div>
            )}

            <button
                onClick={() => navigate('/farmer/bookings')}
                className="w-full mt-8 text-gray-500 hover:text-gray-700 font-medium"
            >
                ← Back to Dashboard
            </button>
        </div>
    );
};

export default QRCheckIn;
