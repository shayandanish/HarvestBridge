import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import Select from 'react-select';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register, isAuthenticated } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        role: 'investor',
        country: '',
    });
    const [countries, setCountries] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    // Fetch countries for the dropdown
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flags');
                const data = await response.json();
                const formattedCountries = data.map(country => ({
                    value: country.name.common,
                    label: country.name.common,
                    flag: country.flags.svg || country.flags.png,
                    code: country.cca2.toLowerCase()
                })).sort((a, b) => a.label.localeCompare(b.label));
                setCountries(formattedCountries);
            } catch (err) {
                console.error("Error fetching countries:", err);
            }
        };
        fetchCountries();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);

        const { confirmPassword, ...registrationData } = formData;
        const result = await register(registrationData);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error || 'Registration failed');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-4 py-8 md:py-12">
            <div className="card max-w-md w-full shadow-2xl border border-white/50 backdrop-blur-sm">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
                    <p className="text-gray-600">Join the HarvestBridge Platform</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-2xl mb-6 flex items-start gap-3 animate-shake">
                        <span className="text-xl">⚠️</span>
                        <div className="text-sm font-medium">{error}</div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name
                        </label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="your@email.com"
                            required
                        />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Country of Residence
                            </label>
                            <Select
                                options={countries}
                                value={selectedCountry}
                                onChange={(option) => {
                                    setSelectedCountry(option);
                                    setFormData({ ...formData, country: option.value });
                                }}
                                getOptionLabel={e => (
                                    <div className="flex items-center gap-3">
                                        <img src={e.flag} alt={e.label} className="w-6 h-4 object-cover rounded-sm" />
                                        <span className="text-gray-900">{e.label}</span>
                                    </div>
                                )}
                                placeholder="Search & select country..."
                                className="react-select-container"
                                classNamePrefix="react-select"
                                isSearchable={true}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number
                            </label>
                            <PhoneInput
                                country={selectedCountry?.code || 'pk'}
                                value={formData.phone}
                                onChange={(phone) => setFormData({ ...formData, phone })}
                                className="international-phone-input"
                                inputClassName="!w-full !h-[50px] !rounded-r-2xl !border-gray-300 !text-gray-700 !text-base focus:!ring-2 focus:!ring-primary-500 !pl-4"
                                countrySelectorStyleProps={{
                                    buttonClassName: "!h-[50px] !rounded-l-2xl !border-gray-300 !bg-white !px-3",
                                    flagClassName: "!w-8 !h-6 !rounded-sm"
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            I am a
                        </label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="input-field"
                            required
                        >
                            <option value="investor">Investor</option>
                            <option value="farmer">Farmer</option>
                            <option value="landowner">Landowner</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                            Login here
                        </Link>
                    </p>
                </div>

                <div className="mt-4 text-center">
                    <Link to="/" className="text-gray-500 hover:text-gray-700">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
