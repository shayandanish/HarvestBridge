import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { landService } from '../../services/landService';
import { compressImage } from '../../utils/imageUtils';

// Lazily load Leaflet CSS
if (!document.querySelector('link[href*="leaflet"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STEPS = [
    { id: 1, title: 'Landowner Info', icon: '👤' },
    { id: 2, title: 'Location', icon: '📍' },
    { id: 3, title: 'Land Size', icon: '📐' },
    { id: 4, title: 'Land Rating', icon: '⭐' },
    { id: 5, title: 'Plants', icon: '🌱' },
    { id: 6, title: 'Documents', icon: '📄' },
    { id: 7, title: 'Rental Terms', icon: '💰' },
    { id: 8, title: 'Notes & Submit', icon: '📝' },
];

const AREA_UNITS = [
    { value: 'ACRES', label: 'Acres' },
    { value: 'HECTARES', label: 'Hectares' },
    { value: 'SQFT', label: 'Square Feet' },
    { value: 'KANAL', label: 'Kanal (Pakistan)' },
    { value: 'MARLA', label: 'Marla (Pakistan)' },
];

const PLANTS = [
    { value: 'MANGO', label: '🥭 Mango', category: 'Fruit Trees' },
    { value: 'ORANGE', label: '🍊 Orange', category: 'Fruit Trees' },
    { value: 'LEMON', label: '🍋 Lemon', category: 'Fruit Trees' },
    { value: 'APPLE', label: '🍎 Apple', category: 'Fruit Trees' },
    { value: 'GUAVA', label: '🍈 Guava', category: 'Fruit Trees' },
    { value: 'BANANA', label: '🍌 Banana', category: 'Fruit Trees' },
    { value: 'PAPAYA', label: '🧡 Papaya', category: 'Fruit Trees' },
    { value: 'POMEGRANATE', label: '❤️ Pomegranate', category: 'Fruit Trees' },
    { value: 'LITCHI', label: '🍒 Litchi', category: 'Fruit Trees' },
    { value: 'COCONUT', label: '🥥 Coconut', category: 'Fruit Trees' },
    { value: 'TOMATO', label: '🍅 Tomato', category: 'Vegetables' },
    { value: 'POTATO', label: '🥔 Potato', category: 'Vegetables' },
    { value: 'ONION', label: '🧅 Onion', category: 'Vegetables' },
    { value: 'CARROT', label: '🥕 Carrot', category: 'Vegetables' },
    { value: 'CABBAGE', label: '🥬 Cabbage', category: 'Vegetables' },
    { value: 'CAULIFLOWER', label: '🥦 Cauliflower', category: 'Vegetables' },
    { value: 'SPINACH', label: '🌿 Spinach', category: 'Vegetables' },
    { value: 'CUCUMBER', label: '🥒 Cucumber', category: 'Vegetables' },
    { value: 'MINT', label: '🌿 Mint', category: 'Herbs & Spices' },
    { value: 'CORIANDER', label: '🌱 Coriander', category: 'Herbs & Spices' },
    { value: 'BASIL', label: '🌿 Basil', category: 'Herbs & Spices' },
    { value: 'GINGER', label: '🫚 Ginger', category: 'Herbs & Spices' },
    { value: 'TURMERIC', label: '🟡 Turmeric', category: 'Herbs & Spices' },
    { value: 'CHILI', label: '🌶️ Chili', category: 'Herbs & Spices' },
    { value: 'WHEAT', label: '🌾 Wheat', category: 'Grains' },
    { value: 'RICE', label: '🌾 Rice', category: 'Grains' },
    { value: 'CORN', label: '🌽 Corn', category: 'Grains' },
    { value: 'SUGARCANE', label: '🎋 Sugarcane', category: 'Cash Crops' },
    { value: 'COTTON', label: '☁️ Cotton', category: 'Cash Crops' },
    { value: 'SUNFLOWER', label: '🌻 Sunflower', category: 'Oil Seeds' },
];

const RATING_LABELS = {
    soilQuality: {
        1: 'Poor – Sandy/Rocky',
        2: 'Below Average',
        3: 'Average – Good for most crops',
        4: 'Good – Fertile soil',
        5: 'Excellent – Highly fertile',
    },
    waterAvailability: {
        1: 'Very Limited – No reliable source',
        2: 'Limited – Seasonal availability',
        3: 'Moderate – Well or canal nearby',
        4: 'Good – Reliable water source',
        5: 'Excellent – Abundant water supply',
    },
    sunlightExposure: {
        1: 'Heavily Shaded',
        2: 'Partial Shade',
        3: 'Moderate Sun (4–6 hours)',
        4: 'Good Sun (6–8 hours)',
        5: 'Full Sun (8+ hours)',
    },
};

// ─── Plain Leaflet Map Component (no react-leaflet) ──────────────────────────
function LeafletMap({ onLocationSelect, lat, lng, hasError }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);

    useEffect(() => {
        // Guard against React StrictMode double-invoke AND already-initialized containers
        if (!mapRef.current || mapRef.current._leaflet_id) return;

        import('leaflet').then(L => {
            const Leaflet = L.default || L;

            // Guard again in case the async import resolved after an unmount
            if (!mapRef.current || mapRef.current._leaflet_id) return;

            // Fix default icon paths
            delete Leaflet.Icon.Default.prototype._getIconUrl;
            Leaflet.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            const map = Leaflet.map(mapRef.current).setView([30.3753, 69.3451], 6);
            Leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19,
            }).addTo(map);

            map.on('click', (e) => {
                const { lat, lng } = e.latlng;
                if (markerRef.current) {
                    markerRef.current.setLatLng([lat, lng]);
                } else {
                    markerRef.current = Leaflet.marker([lat, lng]).addTo(map);
                }
                onLocationSelect(lat, lng);
            });

            mapInstanceRef.current = { map, Leaflet };
        });

        const container = mapRef.current;
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.map.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
            }
            // Clear Leaflet's own flag so a future remount can re-initialize
            if (container) {
                delete container._leaflet_id;
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Update marker when lat/lng change externally
    useEffect(() => {
        if (!mapInstanceRef.current || !lat || !lng) return;
        const { map, Leaflet } = mapInstanceRef.current;
        if (markerRef.current) {
            markerRef.current.setLatLng([parseFloat(lat), parseFloat(lng)]);
        } else {
            markerRef.current = Leaflet.marker([parseFloat(lat), parseFloat(lng)]).addTo(map);
        }
    }, [lat, lng]);

    return (
        <div
            ref={mapRef}
            style={{
                height: 320, width: '100%',
                borderRadius: 12,
                border: hasError ? '2px solid #ef4444' : '2px solid rgba(255,255,255,0.1)',
            }}
        />
    );
}

// ─── Star Rating Component ────────────────────────────────────────────────────
function StarRating({ value, onChange, readOnly = false, size = 'lg' }) {
    const [hovered, setHovered] = useState(0);
    const stars = [1, 2, 3, 4, 5];
    const sz = size === 'lg' ? 'text-3xl' : 'text-xl';
    return (
        <div className="flex gap-1">
            {stars.map(star => (
                <button
                    key={star}
                    type="button"
                    disabled={readOnly}
                    onClick={() => !readOnly && onChange(star)}
                    onMouseEnter={() => !readOnly && setHovered(star)}
                    onMouseLeave={() => !readOnly && setHovered(0)}
                    className={`${sz} transition-transform duration-100 ${!readOnly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
                    style={{ filter: star <= (hovered || value) ? 'none' : 'grayscale(1) opacity(0.4)' }}
                >
                    ⭐
                </button>
            ))}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AddLandPage() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState(null);
    const [plantSearch, setPlantSearch] = useState('');
    const [customPlantInput, setCustomPlantInput] = useState('');
    // eslint-disable-next-line no-unused-vars
    const [hoveredCategory, setHoveredCategory] = useState(null);
    const [ownershipPreview, setOwnershipPreview] = useState(null);
    const [photosPreviews, setPhotosPreviews] = useState([]);

    const [form, setForm] = useState({
        // Step 1
        landownerName: '',
        // Step 2
        city: '',
        state: '',
        specificLocation: '',
        latitude: '',
        longitude: '',
        country: 'Pakistan',
        // Step 3
        totalArea: '',
        areaUnit: 'ACRES',
        // Step 4
        soilQuality: 0,
        waterAvailability: 0,
        sunlightExposure: 0,
        // Step 5
        cultivablePlants: [],
        // Step 6
        ownershipDocument: null,
        landPhotos: [],
        // Step 7
        rentalFeeMonthly: '',
        minimumRentalPeriod: 12,
        // Step 8
        additionalNotes: '',
    });

    const overallRating =
        form.soilQuality && form.waterAvailability && form.sunlightExposure
            ? ((form.soilQuality + form.waterAvailability + form.sunlightExposure) / 3).toFixed(1)
            : null;

    // Show toast helper
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Field updater
    const setField = (key, value) => {
        setForm(f => ({ ...f, [key]: value }));
        setErrors(e => ({ ...e, [key]: undefined }));
    };

    // Map location select
    const handleLocationSelect = useCallback((lat, lng) => {
        setField('latitude', lat.toFixed(6));
        setField('longitude', lng.toFixed(6));
    }, []);

    // ── Step validation ────────────────────────────────────────────────────────
    const validate = () => {
        const errs = {};
        if (currentStep === 1) {
            if (!form.landownerName.trim() || form.landownerName.trim().length < 3)
                errs.landownerName = 'Enter your full name (min 3 characters)';
        }
        if (currentStep === 2) {
            if (!form.city.trim()) errs.city = 'City is required';
            if (!form.state.trim()) errs.state = 'State/Province is required';
            if (!form.specificLocation.trim()) errs.specificLocation = 'Specific location is required';
            if (!form.latitude || !form.longitude) errs.map = 'Please click on the map to pin your land location';
        }
        if (currentStep === 3) {
            if (!form.totalArea || parseFloat(form.totalArea) <= 0) errs.totalArea = 'Enter a valid land size';
        }
        if (currentStep === 4) {
            if (!form.soilQuality) errs.soilQuality = 'Please rate soil quality';
            if (!form.waterAvailability) errs.waterAvailability = 'Please rate water availability';
            if (!form.sunlightExposure) errs.sunlightExposure = 'Please rate sunlight exposure';
        }
        if (currentStep === 5) {
            if (form.cultivablePlants.length === 0) errs.cultivablePlants = 'Select at least one plant';
        }
        if (currentStep === 6) {
            if (!form.ownershipDocument) errs.ownershipDocument = 'Ownership document is required';
        }
        if (currentStep === 7) {
            if (!form.rentalFeeMonthly || parseFloat(form.rentalFeeMonthly) < 0) errs.rentalFeeMonthly = 'Enter a valid rental fee';
            if (!form.minimumRentalPeriod || form.minimumRentalPeriod < 1) errs.minimumRentalPeriod = 'Minimum period must be at least 1 month';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const goNext = () => { if (validate()) setCurrentStep(s => s + 1); };
    const goBack = () => setCurrentStep(s => s - 1);

    // ── Plant selection ────────────────────────────────────────────────────────
    const togglePlant = (value) => {
        setForm(f => ({
            ...f,
            cultivablePlants: f.cultivablePlants.includes(value)
                ? f.cultivablePlants.filter(p => p !== value)
                : f.cultivablePlants.length < 20 ? [...f.cultivablePlants, value] : f.cultivablePlants,
        }));
        setErrors(e => ({ ...e, cultivablePlants: undefined }));
    };

    const addCustomPlant = () => {
        const val = customPlantInput.trim();
        if (val.length >= 2 && val.length <= 50 && !form.cultivablePlants.includes(val.toUpperCase())) {
            setForm(f => ({ ...f, cultivablePlants: [...f.cultivablePlants, val.toUpperCase()] }));
            setCustomPlantInput('');
            setErrors(e => ({ ...e, cultivablePlants: undefined }));
        }
    };

    // ── File handlers ──────────────────────────────────────────────────────────
    const handleOwnershipDoc = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { showToast('File too large (max 10MB)', 'error'); return; }
        setField('ownershipDocument', file);
        if (file.type.startsWith('image/')) {
            setOwnershipPreview(URL.createObjectURL(file));
        } else {
            setOwnershipPreview('pdf');
        }
    };

    const handleLandPhotos = (e) => {
        const files = Array.from(e.target.files);
        const remaining = 8 - form.landPhotos.length;
        const toAdd = files.slice(0, remaining).filter(f => f.size <= 5 * 1024 * 1024);
        if (toAdd.length < files.length) showToast('Some photos skipped (max 5MB each or 8 total)', 'error');
        setForm(f => ({ ...f, landPhotos: [...f.landPhotos, ...toAdd] }));
        const previews = toAdd.map(f => URL.createObjectURL(f));
        setPhotosPreviews(p => [...p, ...previews]);
    };

    const removePhoto = (idx) => {
        setForm(f => ({ ...f, landPhotos: f.landPhotos.filter((_, i) => i !== idx) }));
        setPhotosPreviews(p => p.filter((_, i) => i !== idx));
    };

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('landName', form.specificLocation || `${form.city} Land`);
            formData.append('city', form.city);
            formData.append('state', form.state);
            formData.append('country', form.country);
            formData.append('specificLocation', form.specificLocation);
            formData.append('latitude', form.latitude);
            formData.append('longitude', form.longitude);
            formData.append('totalArea', form.totalArea);
            formData.append('areaUnit', form.areaUnit);
            formData.append('soilQuality', form.soilQuality);
            formData.append('waterAvailability', form.waterAvailability);
            formData.append('sunlightExposure', form.sunlightExposure);
            formData.append('cultivablePlants', JSON.stringify(form.cultivablePlants));
            formData.append('rentalFeeMonthly', form.rentalFeeMonthly);
            formData.append('minimumRentalPeriod', form.minimumRentalPeriod);
            if (form.additionalNotes) formData.append('additionalNotes', form.additionalNotes);
            if (form.ownershipDocument && form.ownershipDocument.type.startsWith('image/')) {
                const compressedDoc = await compressImage(form.ownershipDocument);
                formData.append('ownershipDocument', compressedDoc);
            } else if (form.ownershipDocument) {
                formData.append('ownershipDocument', form.ownershipDocument);
            }

            for (const photo of form.landPhotos) {
                const compressedPhoto = await compressImage(photo);
                formData.append('landPhotos', compressedPhoto);
            }

            await landService.createLandFormData(formData);
            showToast('Land registered successfully! The land will be added after an admin approves it.', 'success');
            setTimeout(() => navigate('/landowner/my-lands'), 1500);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to register land. Please try again.';
            showToast(msg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Grouped plants for display ─────────────────────────────────────────────
    const categories = [...new Set(PLANTS.map(p => p.category))];
    const filteredPlants = PLANTS.filter(p =>
        !plantSearch || p.label.toLowerCase().includes(plantSearch.toLowerCase())
    );

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', fontFamily: "'Inter', sans-serif" }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 24, right: 24, zIndex: 9999,
                    background: toast.type === 'success' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#fff', padding: '14px 24px', borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)', fontWeight: 600, fontSize: 15,
                    animation: 'slideIn 0.3s ease',
                }}>
                    {toast.type === 'success' ? '✅ ' : '❌ '}{toast.msg}
                </div>
            )}

            <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px', position: 'relative' }}>
                {/* Back Button */}
                <button onClick={() => navigate('/landowner/my-lands')}
                    style={{
                        position: 'absolute', top: 30, left: 20,
                        background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                        borderRadius: '50%', width: 44, height: 44,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.3s ease', fontSize: 20,
                        zIndex: 10,
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.transform = 'translateX(-4px)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.transform = 'none';
                    }}>
                    ←
                </button>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{ fontSize: 56, marginBottom: 12 }}>🌾</div>
                    <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 800, margin: 0 }}>Register Your Land</h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 8, fontSize: 16 }}>
                        Connect your land with investors and farmers on PlantTree
                    </p>
                </div>

                {/* Step Progress */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 40, flexWrap: 'wrap' }}>
                    {STEPS.map(step => (
                        <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: currentStep === step.id
                                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                                    : currentStep > step.id
                                        ? 'rgba(34,197,94,0.3)'
                                        : 'rgba(255,255,255,0.1)',
                                border: currentStep === step.id ? '2px solid #22c55e' : '2px solid transparent',
                                fontSize: 18, transition: 'all 0.3s ease',
                                boxShadow: currentStep === step.id ? '0 0 20px rgba(34,197,94,0.4)' : 'none',
                            }}>
                                {currentStep > step.id ? '✓' : step.icon}
                            </div>
                            <span style={{ color: currentStep >= step.id ? '#22c55e' : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {step.title}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <div style={{
                    background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
                    borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)',
                    padding: '40px', boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
                }}>
                    {/* ── STEP 1: Landowner Info ── */}
                    {currentStep === 1 && (
                        <StepSection icon="👤" title="Landowner Information">
                            <FormField label="Landowner Name" required helpText="Your name as it appears on ownership documents" error={errors.landownerName}>
                                <input
                                    type="text" placeholder="Enter your full name"
                                    value={form.landownerName} onChange={e => setField('landownerName', e.target.value)}
                                    maxLength={100} style={inputStyle(errors.landownerName)}
                                />
                            </FormField>
                        </StepSection>
                    )}

                    {/* ── STEP 2: Location ── */}
                    {currentStep === 2 && (
                        <StepSection icon="📍" title="Place of Land">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <FormField label="City" required error={errors.city}>
                                    <input type="text" placeholder="e.g., Rawalpindi" value={form.city}
                                        onChange={e => setField('city', e.target.value)} maxLength={100} style={inputStyle(errors.city)} />
                                </FormField>
                                <FormField label="State / Province" required error={errors.state}>
                                    <input type="text" placeholder="e.g., Punjab" value={form.state}
                                        onChange={e => setField('state', e.target.value)} maxLength={100} style={inputStyle(errors.state)} />
                                </FormField>
                            </div>
                            <FormField label="Specific Location" required helpText='e.g., "Village Chak 123, Near GT Road"' error={errors.specificLocation}>
                                <input type="text" placeholder="Village, area, or neighborhood name"
                                    value={form.specificLocation} onChange={e => setField('specificLocation', e.target.value)}
                                    maxLength={200} style={inputStyle(errors.specificLocation)} />
                            </FormField>

                            <FormField label="Pin Location on Map" required helpText="Click on the map to mark your land location" error={errors.map}>
                                <LeafletMap
                                    onLocationSelect={handleLocationSelect}
                                    lat={form.latitude}
                                    lng={form.longitude}
                                    hasError={!!errors.map}
                                />
                            </FormField>

                            {form.latitude && form.longitude && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: -8 }}>
                                    <FormField label="Latitude (auto-filled)">
                                        <input type="text" readOnly value={form.latitude} style={{ ...inputStyle(), opacity: 0.6, cursor: 'not-allowed' }} />
                                    </FormField>
                                    <FormField label="Longitude (auto-filled)">
                                        <input type="text" readOnly value={form.longitude} style={{ ...inputStyle(), opacity: 0.6, cursor: 'not-allowed' }} />
                                    </FormField>
                                </div>
                            )}
                        </StepSection>
                    )}

                    {/* ── STEP 3: Land Size ── */}
                    {currentStep === 3 && (
                        <StepSection icon="📐" title="Size Available for Plantation">
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
                                <FormField label="Land Size" required helpText="Total area available for planting trees/crops" error={errors.totalArea}>
                                    <input type="number" placeholder="0.00" value={form.totalArea}
                                        onChange={e => setField('totalArea', e.target.value)}
                                        min="0.01" max="10000" step="0.01" style={inputStyle(errors.totalArea)} />
                                </FormField>
                                <FormField label="Unit" required>
                                    <select value={form.areaUnit} onChange={e => setField('areaUnit', e.target.value)} style={inputStyle()}>
                                        {AREA_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                                    </select>
                                </FormField>
                            </div>
                            {form.totalArea && (
                                <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: 16, marginTop: 8 }}>
                                    <span style={{ color: '#22c55e', fontWeight: 600 }}>
                                        📊 Selected: {form.totalArea} {AREA_UNITS.find(u => u.value === form.areaUnit)?.label}
                                    </span>
                                </div>
                            )}
                        </StepSection>
                    )}

                    {/* ── STEP 4: Land Rating ── */}
                    {currentStep === 4 && (
                        <StepSection icon="⭐" title="Land Quality Rating">
                            {[
                                { key: 'soilQuality', label: 'Soil Quality', emoji: '🌱' },
                                { key: 'waterAvailability', label: 'Water Availability', emoji: '💧' },
                                { key: 'sunlightExposure', label: 'Sunlight Exposure', emoji: '☀️' },
                            ].map(item => (
                                <div key={item.key} style={{ marginBottom: 28 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                        <span style={{ fontSize: 24 }}>{item.emoji}</span>
                                        <label style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
                                            {item.label} <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                    </div>
                                    <StarRating value={form[item.key]} onChange={v => setField(item.key, v)} />
                                    {form[item.key] > 0 && (
                                        <div style={{ marginTop: 8, color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>
                                            {RATING_LABELS[item.key][form[item.key]]}
                                        </div>
                                    )}
                                    {errors[item.key] && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 4 }}>{errors[item.key]}</p>}
                                </div>
                            ))}

                            {overallRating && (
                                <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1))', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 16, padding: '20px 24px', marginTop: 8 }}>
                                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 8px' }}>Overall Land Rating (Auto-calculated)</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <StarRating value={Math.round(overallRating)} onChange={() => { }} readOnly size="md" />
                                        <span style={{ color: '#22c55e', fontSize: 28, fontWeight: 800 }}>{overallRating}</span>
                                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>/ 5.0</span>
                                    </div>
                                </div>
                            )}
                        </StepSection>
                    )}

                    {/* ── STEP 5: Cultivable Plants ── */}
                    {currentStep === 5 && (
                        <StepSection icon="🌱" title="Cultivable Plants">
                            {/* Search */}
                            <div style={{ marginBottom: 16 }}>
                                <input type="text" placeholder="🔍 Search plants..." value={plantSearch}
                                    onChange={e => setPlantSearch(e.target.value)} style={inputStyle()} />
                            </div>

                            {/* Selected count */}
                            {form.cultivablePlants.length > 0 && (
                                <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                                    <span style={{ color: '#22c55e', fontWeight: 600, fontSize: 13 }}>Selected ({form.cultivablePlants.length}/20):</span>
                                    {form.cultivablePlants.map(p => {
                                        const found = PLANTS.find(pl => pl.value === p);
                                        return (
                                            <span key={p} style={{ background: 'rgba(34,197,94,0.2)', color: '#86efac', borderRadius: 20, padding: '3px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                {found ? found.label : p}
                                                <button onClick={() => togglePlant(p)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, fontSize: 14 }}>×</button>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Plant grid by category */}
                            {categories.map(cat => {
                                const catPlants = filteredPlants.filter(p => p.category === cat);
                                if (catPlants.length === 0) return null;
                                return (
                                    <div key={cat} style={{ marginBottom: 20 }}>
                                        <h4 style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{cat}</h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            {catPlants.map(plant => {
                                                const selected = form.cultivablePlants.includes(plant.value);
                                                return (
                                                    <button key={plant.value} type="button" onClick={() => togglePlant(plant.value)}
                                                        style={{
                                                            padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                                                            background: selected ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(255,255,255,0.07)',
                                                            color: selected ? '#fff' : 'rgba(255,255,255,0.7)',
                                                            border: selected ? 'none' : '1px solid rgba(255,255,255,0.12)',
                                                            transition: 'all 0.2s ease', transform: selected ? 'scale(1.03)' : 'scale(1)',
                                                        }}>
                                                        {plant.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Custom plant */}
                            <div style={{ marginTop: 8 }}>
                                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 6, display: 'block' }}>+ Add custom plant</label>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <input type="text" placeholder="Type plant name and press Enter or Add"
                                        value={customPlantInput} onChange={e => setCustomPlantInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomPlant())}
                                        maxLength={50} style={{ ...inputStyle(), flex: 1 }} />
                                    <button type="button" onClick={addCustomPlant}
                                        style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
                                        Add
                                    </button>
                                </div>
                            </div>
                            {errors.cultivablePlants && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{errors.cultivablePlants}</p>}
                        </StepSection>
                    )}

                    {/* ── STEP 6: Documents ── */}
                    {currentStep === 6 && (
                        <StepSection icon="📄" title="Verification Documents">
                            {/* Ownership Doc */}
                            <FormField label="Ownership Document" required helpText="Upload proof of ownership (Title deed, Registry, etc.) — PDF or image, max 10MB" error={errors.ownershipDocument}>
                                <label style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    padding: 32, border: `2px dashed ${errors.ownershipDocument ? '#ef4444' : 'rgba(255,255,255,0.2)'}`,
                                    borderRadius: 12, cursor: 'pointer', gap: 10, background: 'rgba(255,255,255,0.03)',
                                    transition: 'all 0.2s',
                                }}>
                                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleOwnershipDoc} style={{ display: 'none' }} />
                                    {ownershipPreview ? (
                                        ownershipPreview === 'pdf' ? (
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: 40 }}>📄</div>
                                                <p style={{ color: '#22c55e', marginTop: 8, fontWeight: 600 }}>{form.ownershipDocument?.name}</p>
                                            </div>
                                        ) : (
                                            <img src={ownershipPreview} alt="preview" style={{ maxHeight: 160, borderRadius: 8, objectFit: 'cover' }} />
                                        )
                                    ) : (
                                        <>
                                            <div style={{ fontSize: 40 }}>📁</div>
                                            <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>Click to upload ownership document</p>
                                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: 0 }}>PDF, JPG, PNG • Max 10MB</p>
                                        </>
                                    )}
                                </label>
                            </FormField>

                            {/* Land Photos */}
                            <FormField label={`Land / Farm Photos (${form.landPhotos.length}/8)`} helpText="Upload photos of your land — up to 8 images, max 5MB each">
                                <label style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    padding: 24, border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 12, cursor: 'pointer',
                                    gap: 8, background: 'rgba(255,255,255,0.03)', transition: 'all 0.2s',
                                }}>
                                    <input type="file" accept=".jpg,.jpeg,.png" multiple onChange={handleLandPhotos}
                                        disabled={form.landPhotos.length >= 8} style={{ display: 'none' }} />
                                    <div style={{ fontSize: 36 }}>🏞️</div>
                                    <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                                        {form.landPhotos.length >= 8 ? 'Maximum 8 photos reached' : 'Click to add land photos'}
                                    </p>
                                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: 0 }}>JPG, PNG • Max 5MB each • Up to 8 photos</p>
                                </label>

                                {form.landPhotos.length > 0 && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 16 }}>
                                        {photosPreviews.map((src, idx) => (
                                            <div key={idx} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1' }}>
                                                <img src={src} alt={`Land preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button type="button" onClick={() => removePhoto(idx)}
                                                    style={{
                                                        position: 'absolute', top: 4, right: 4, width: 22, height: 22,
                                                        background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none',
                                                        borderRadius: '50%', cursor: 'pointer', fontSize: 14, lineHeight: 1,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </FormField>
                        </StepSection>
                    )}

                    {/* ── STEP 7: Rental Terms ── */}
                    {currentStep === 7 && (
                        <StepSection icon="💰" title="Rental Terms">
                            <FormField label="Land Rental Fee (PKR per month)" required helpText="Monthly fee farmers will pay to use your land" error={errors.rentalFeeMonthly}>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>₨</span>
                                    <input type="number" placeholder="e.g., 5000" value={form.rentalFeeMonthly}
                                        onChange={e => setField('rentalFeeMonthly', e.target.value)}
                                        min="0" step="100" style={{ ...inputStyle(errors.rentalFeeMonthly), paddingLeft: 36 }} />
                                </div>
                            </FormField>
                            <FormField label="Minimum Rental Period (months)" required helpText="Minimum duration for land rental" error={errors.minimumRentalPeriod}>
                                <input type="number" placeholder="12" value={form.minimumRentalPeriod}
                                    onChange={e => setField('minimumRentalPeriod', parseInt(e.target.value))}
                                    min="1" max="60" style={inputStyle(errors.minimumRentalPeriod)} />
                            </FormField>
                            {form.rentalFeeMonthly && form.minimumRentalPeriod && (
                                <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 16, padding: '20px 24px' }}>
                                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 8px' }}>💡 Summary</p>
                                    <p style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: 0 }}>
                                        Total for minimum period: ₨ {(parseFloat(form.rentalFeeMonthly) * form.minimumRentalPeriod).toLocaleString()}
                                    </p>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '4px 0 0' }}>
                                        {form.minimumRentalPeriod} months × ₨ {parseFloat(form.rentalFeeMonthly).toLocaleString()}/month
                                    </p>
                                </div>
                            )}
                        </StepSection>
                    )}

                    {/* ── STEP 8: Notes & Review ── */}
                    {currentStep === 8 && (
                        <StepSection icon="📝" title="Additional Information & Review">
                            <FormField label="Additional Notes (Optional)" helpText="Any special features, restrictions, or important details about your land">
                                <textarea placeholder="e.g., Land has a natural spring, accessible via paved road, suitable for fruit orchards..."
                                    value={form.additionalNotes} onChange={e => setField('additionalNotes', e.target.value)}
                                    maxLength={500} rows={4} style={{ ...inputStyle(), resize: 'vertical', minHeight: 100 }} />
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'right', marginTop: 4 }}>
                                    {form.additionalNotes.length}/500
                                </p>
                            </FormField>

                            {/* Summary Review */}
                            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 24, marginTop: 8 }}>
                                <h3 style={{ color: '#22c55e', fontWeight: 700, margin: '0 0 16px' }}>📋 Registration Summary</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <SummaryItem label="Name" value={form.landownerName} />
                                    <SummaryItem label="Location" value={`${form.city}, ${form.state}`} />
                                    <SummaryItem label="Area" value={`${form.totalArea} ${form.areaUnit}`} />
                                    <SummaryItem label="Overall Rating" value={overallRating ? `${overallRating}/5.0 ⭐` : 'N/A'} />
                                    <SummaryItem label="Plants" value={`${form.cultivablePlants.length} selected`} />
                                    <SummaryItem label="Monthly Rent" value={form.rentalFeeMonthly ? `₨ ${parseFloat(form.rentalFeeMonthly).toLocaleString()}` : '-'} />
                                    <SummaryItem label="Min. Period" value={`${form.minimumRentalPeriod} months`} />
                                    <SummaryItem label="Photos" value={`${form.landPhotos.length} uploaded`} />
                                </div>
                            </div>
                        </StepSection>
                    )}

                    {/* Navigation Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, gap: 16 }}>
                        {currentStep > 1 ? (
                            <button type="button" onClick={goBack}
                                style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, fontWeight: 600, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s' }}>
                                ← Back
                            </button>
                        ) : (
                            <button type="button" onClick={() => navigate('/landowner/my-lands')}
                                style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                                Cancel
                            </button>
                        )}

                        {currentStep < STEPS.length ? (
                            <button type="button" onClick={goNext}
                                style={{ padding: '14px 36px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 20px rgba(34,197,94,0.3)', transition: 'all 0.2s' }}>
                                Next Step →
                            </button>
                        ) : (
                            <button type="button" onClick={handleSubmit} disabled={submitting}
                                style={{ padding: '14px 36px', background: submitting ? 'rgba(34,197,94,0.5)' : 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px rgba(34,197,94,0.3)', transition: 'all 0.2s' }}>
                                {submitting ? '⏳ Registering...' : '🌾 Register Land'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; }
                input:focus, select:focus, textarea:focus { outline: none; border-color: #22c55e !important; box-shadow: 0 0 0 3px rgba(34,197,94,0.15); }
                input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.3); }
                input, select, textarea { color-scheme: dark; }
                select option { background: #1e293b; color: #fff; }
                @keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            `}</style>
        </div>
    );
}

// ── Helper Sub-components ─────────────────────────────────────────────────────
function StepSection({ icon, title, children }) {
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                <span style={{ fontSize: 32 }}>{icon}</span>
                <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0 }}>{title}</h2>
            </div>
            {children}
        </div>
    );
}

function FormField({ label, required, helpText, error, children }) {
    return (
        <div style={{ marginBottom: 24 }}>
            {label && (
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                    {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
            )}
            {children}
            {helpText && !error && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 6, margin: '6px 0 0' }}>{helpText}</p>}
            {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 6, margin: '6px 0 0' }}>⚠ {error}</p>}
        </div>
    );
}

function SummaryItem({ label, value }) {
    return (
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 16px' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px' }}>{label}</p>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, margin: 0 }}>{value || '—'}</p>
        </div>
    );
}

function inputStyle(hasError) {
    return {
        width: '100%', padding: '13px 16px',
        background: 'rgba(255,255,255,0.07)',
        border: `1.5px solid ${hasError ? '#ef4444' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: 10, color: '#fff', fontSize: 15,
        transition: 'border-color 0.2s, box-shadow 0.2s',
    };
}
