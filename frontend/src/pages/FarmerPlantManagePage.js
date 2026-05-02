import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketplaceService, trackingService, plantService, farmerService, getMediaUrl } from '../services/api';
import { compressImage } from '../utils/imageUtils';

const FarmerPlantManagePage = () => {
    const { plantId, farmId } = useParams();
    const navigate = useNavigate();

    const isFarmMode = !!farmId;
    const contextId = isFarmMode ? farmId : plantId;

    // State
    const [itemDetails, setItemDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('growth');
    const [timeline, setTimeline] = useState([]);

    // Form States
    const [growthForm, setGrowthForm] = useState({ 
        growthStatus: 'growing', 
        locationInFarm: '', 
        plantDate: new Date().toISOString().split('T')[0],
        notes: '',
        photo: null
    });
    const [submitting, setSubmitting] = useState(false);

    // Form States
    const [activityForm, setActivityForm] = useState({ type: 'watering', description: '', date: new Date().toISOString().split('T')[0] });
    const [photoForm, setPhotoForm] = useState({ photo: null, caption: '', date: new Date().toISOString().split('T')[0], isMilestone: false });
    const [milestoneForm, setMilestoneForm] = useState({ type: 'planted', date: new Date().toISOString().split('T')[0], notes: '' });

    const fetchDetails = async () => {
        try {
            if (isFarmMode) {
                const data = await marketplaceService.getFarmDetails(farmId);
                setItemDetails(data);
            } else {
                const data = await marketplaceService.getPlantDetails(plantId);
                // Extract plant from wrapper if present
                setItemDetails(data.plant || data);
            }
        } catch (error) {
            console.error('Error fetching details', error);
        }
    };

    useEffect(() => {
        fetchDetails();
        fetchTimeline();
    }, [plantId, farmId]);

    const fetchTimeline = async () => {
        setLoading(true);
        try {
            const data = isFarmMode
                ? await trackingService.getFarmTimeline(farmId)
                : await trackingService.getTimeline(plantId);
            setTimeline(data);
        } catch (error) {
            console.error('Error fetching timeline', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (itemDetails && !isFarmMode) {
            setGrowthForm({
                growthStatus: itemDetails.growthStatus || 'growing',
                locationInFarm: itemDetails.locationInFarm || '',
                plantDate: itemDetails.plantDate ? new Date(itemDetails.plantDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                notes: '',
                photoUrl: ''
            });
        }
    }, [itemDetails, isFarmMode]);

    const handleUpdateGrowth = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('growthStatus', growthForm.growthStatus);
            formData.append('locationInFarm', growthForm.locationInFarm);
            formData.append('plantDate', growthForm.plantDate);
            formData.append('notes', growthForm.notes);
            if (growthForm.photo) {
                const compressedPhoto = await compressImage(growthForm.photo);
                formData.append('photo', compressedPhoto);
            }

            if (isFarmMode) {
                let dataToSend = {
                    activityType: 'growth_update',
                    description: `Logged Growth Status as "${growthForm.growthStatus.replace('_', ' ')}" for the farm.`,
                    activityDate: growthForm.plantDate || new Date().toISOString().split('T')[0],
                    notes: growthForm.notes,
                    growthStatus: growthForm.growthStatus,
                    locationInFarm: growthForm.locationInFarm,
                    plantDate: growthForm.plantDate
                };

                // If there's a photo, we need to send as FormData
                if (growthForm.photo) {
                    const farmFormData = new FormData();
                    Object.keys(dataToSend).forEach(key => farmFormData.append(key, dataToSend[key]));
                    const compressedPhoto = await compressImage(growthForm.photo);
                    farmFormData.append('photo', compressedPhoto);
                    await trackingService.logFarmActivity(farmId, farmFormData);
                } else {
                    await trackingService.logFarmActivity(farmId, dataToSend);
                }

                alert('Farm growth update logged to timeline');
                // Refresh details to update tree count and status
                fetchDetails();
            } else {
                await plantService.updateGrowth(plantId, formData);
                alert('Growth successfully updated and logged to timeline');
                // Refresh details
                fetchDetails();
            }
            fetchTimeline();
            setGrowthForm(prev => ({ ...prev, notes: '', photo: null }));
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogActivity = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            if (isFarmMode) {
                await trackingService.logFarmActivity(farmId, {
                    activityType: activityForm.type,
                    description: activityForm.description,
                    activityDate: activityForm.date,
                    notes: ''
                });
            } else {
                await trackingService.logActivity(plantId, {
                    activityType: activityForm.type,
                    description: activityForm.description,
                    activityDate: activityForm.date,
                    notes: ''
                });
            }
            alert('Activity logged');
            fetchTimeline();
            setActivityForm({ ...activityForm, description: '' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleUploadPhoto = async (e) => {
        e.preventDefault();
        if (submitting) return;
        if (!photoForm.photo) {
            alert('Please select a photo to upload');
            return;
        }
        setSubmitting(true);
        try {
            const formData = new FormData();
            const compressedPhoto = await compressImage(photoForm.photo);
            formData.append('photo', compressedPhoto);
            formData.append('caption', photoForm.caption);
            formData.append('takenDate', photoForm.date);
            formData.append('isMilestone', photoForm.isMilestone);

            if (isFarmMode) {
                await trackingService.uploadFarmPhoto(farmId, formData);
            } else {
                await trackingService.uploadPhoto(plantId, formData);
            }
            alert('Photo uploaded successfully');
            fetchTimeline();
            setPhotoForm({ ...photoForm, photo: null, caption: '' });
            // Reset the file input manually if needed, but the controlled state usually handles it
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateProfileImage = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const compressedFile = await compressImage(file);
            const formData = new FormData();
            formData.append('photos', compressedFile);
            await farmerService.uploadFarmPhotos(farmId, formData);
            alert('Farm profile image updated successfully!');
            fetchDetails(); // Refresh to catch the new photo
        } catch (err) {
            console.error('Update profile image error:', err);
            alert('Failed to update farm profile image.');
        } finally {
            e.target.value = null; // reset input
        }
    };

    const handleLogMilestone = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            if (isFarmMode) {
                await trackingService.logFarmMilestone(farmId, {
                    milestoneType: milestoneForm.type,
                    milestoneDate: milestoneForm.date,
                    notes: milestoneForm.notes
                });
            } else {
                await trackingService.logMilestone(plantId, {
                    milestoneType: milestoneForm.type,
                    milestoneDate: milestoneForm.date,
                    notes: milestoneForm.notes
                });
            }
            alert('Milestone logged');
            fetchTimeline();
            setMilestoneForm({ ...milestoneForm, notes: '' });
        } finally {
            setSubmitting(false);
        }
    };

    const renderGrowthUpdateForm = () => (
        <form onSubmit={handleUpdateGrowth} className="max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6 bg-green-50/30 p-8 rounded-3xl border border-green-100">
            <div className="col-span-full mb-2">
                <h3 className="text-xl font-bold text-green-800 flex items-center">
                    <span className="mr-2">🌱</span> Quick Growth Update
                </h3>
                <p className="text-sm text-green-600">Update current state and location for this plant.</p>
            </div>
            
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Current Growth Status</label>
                <select
                    className="w-full border-2 border-green-100 p-4 rounded-2xl focus:border-green-500 outline-none transition-all bg-white"
                    value={growthForm.growthStatus}
                    onChange={e => setGrowthForm({ ...growthForm, growthStatus: e.target.value })}
                >
                    <option value="planted">Planted</option>
                    <option value="growing">Growing</option>
                    <option value="healthy">Healthy</option>
                    <option value="needs attention">Needs Attention</option>
                    <option value="harvest_ready">Ready for Harvest</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Tree Location (in Farm)</label>
                <input
                    type="text"
                    className="w-full border-2 border-green-100 p-4 rounded-2xl focus:border-green-500 outline-none transition-all bg-white"
                    value={growthForm.locationInFarm}
                    onChange={e => setGrowthForm({ ...growthForm, locationInFarm: e.target.value })}
                    placeholder="e.g. Sector A, Row 4"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Planted Date</label>
                <input
                    type="date"
                    className="w-full border-2 border-green-100 p-4 rounded-2xl focus:border-green-500 outline-none transition-all bg-white"
                    value={growthForm.plantDate}
                    onChange={e => setGrowthForm({ ...growthForm, plantDate: e.target.value })}
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Progress Photo</label>
                <input
                    type="file"
                    accept="image/*"
                    className="w-full border-2 border-green-100 p-3 rounded-2xl focus:border-green-500 outline-none transition-all bg-white text-sm"
                    onChange={e => setGrowthForm({ ...growthForm, photo: e.target.files[0] })}
                />
                {growthForm.photo && <p className="text-[10px] text-green-600 font-bold ml-1">Selected: {growthForm.photo.name}</p>}
            </div>

            <div className="col-span-full space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Update Notes</label>
                <textarea
                    className="w-full border-2 border-green-100 p-4 rounded-2xl focus:border-green-500 outline-none transition-all bg-white h-32"
                    value={growthForm.notes}
                    onChange={e => setGrowthForm({ ...growthForm, notes: e.target.value })}
                    placeholder="Any specific details about the growth or health?"
                />
            </div>

            <button 
                type="submit" 
                disabled={submitting}
                className={`col-span-full font-bold py-4 rounded-2xl transition-all shadow-lg shadow-green-100 ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
            >
                {submitting ? 'Updating...' : 'Update Status & Log Progress'}
            </button>
        </form>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className={`px-4 py-1.5 rounded-2xl text-[10px] font-extrabold uppercase tracking-widest shadow-sm ${
                                isFarmMode ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                            }`}>
                                {isFarmMode ? (itemDetails?.isDirectPlanting ? '🌳 Plant Tree Project' : '🌾 Lease Land & Crops') : '🌳 Plant Investment'}
                            </div>
                            <div className="px-4 py-1.5 rounded-2xl bg-blue-100 text-blue-700 text-[10px] font-extrabold uppercase tracking-widest shadow-sm">
                                {itemDetails?.id ? `ID: ${itemDetails.id.split('-')[0]}` : 'LOADING...'}
                            </div>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                            {isFarmMode ? 'Farm Control Center' : 'Plant Growth Manager'}
                        </h1>
                        <p className="mt-3 text-lg lg:text-xl text-gray-500 font-medium">
                            Managing: <span className="text-green-600 font-bold uppercase tracking-wider">{itemDetails?.farmName || itemDetails?.cropType?.name || itemDetails?.name || '...'}</span>
                        </p>
                        {isFarmMode && (
                            <div className="mt-4">
                                <label className="cursor-pointer bg-white text-green-700 font-bold py-2 px-4 rounded-xl border border-green-200 hover:bg-green-50 shadow-sm transition inline-flex items-center gap-2">
                                    <span>📸 Update Farm Cover Photo</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleUpdateProfileImage} />
                                </label>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-white text-gray-700 font-extrabold py-3 px-8 rounded-2xl border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
                        >
                            <span>←</span> Back to Dashboard
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                        <p className={`text-xl font-black ${
                            itemDetails?.status === 'healthy' || itemDetails?.status === 'active' ? 'text-green-600' : 'text-orange-600'
                        } uppercase`}>
                            {itemDetails?.status || 'N/A'}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">
                            {isFarmMode ? 'Total Area' : 'Growth Height'}
                        </p>
                        <p className="text-xl font-black text-gray-900 leading-tight">
                            {isFarmMode 
                                ? `${itemDetails?.totalArea || 0} ${itemDetails?.areaUnit || 'Units'}`
                                : `${itemDetails?.currentHeight || 0} cm`
                            }
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">
                            {isFarmMode ? 'Plants/Trees' : 'Age'}
                        </p>
                        <p className="text-xl font-black text-gray-900 leading-tight">
                            {isFarmMode 
                                ? `${itemDetails?.plants?.length || 0} Count`
                                : `${itemDetails?.age || 0} Months`
                            }
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Investor</p>
                        <p className="text-xl font-black text-green-700 truncate leading-tight">
                            {itemDetails?.investor?.fullName || 'SELF'}
                        </p>
                    </div>
                </div>

                <div className="flex space-x-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-x-auto">
                    <button
                        className={`py-3 px-6 rounded-xl whitespace-nowrap transition-all font-bold ${activeTab === 'growth' ? 'bg-green-600 text-white shadow-md shadow-green-100' : 'text-gray-500 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('growth')}
                    >
                        Growth Plant
                    </button>
                    <button
                        className={`py-3 px-6 rounded-xl whitespace-nowrap transition-all font-bold ${activeTab === 'activity' ? 'bg-green-600 text-white shadow-md shadow-green-100' : 'text-gray-500 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('activity')}
                    >
                        Log Activity
                    </button>
                    <button
                        className={`py-3 px-6 rounded-xl whitespace-nowrap transition-all font-bold ${activeTab === 'photo' ? 'bg-green-600 text-white shadow-md shadow-green-100' : 'text-gray-500 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('photo')}
                    >
                        Photos
                    </button>
                    <button
                        className={`py-3 px-6 rounded-xl whitespace-nowrap transition-all font-bold ${activeTab === 'milestone' ? 'bg-green-600 text-white shadow-md shadow-green-100' : 'text-gray-500 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('milestone')}
                    >
                        Milestones
                    </button>
                    <button
                        className={`py-3 px-6 rounded-xl whitespace-nowrap transition-all font-bold ${activeTab === 'timeline' ? 'bg-green-600 text-white shadow-md shadow-green-100' : 'text-gray-500 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('timeline')}
                    >
                        History
                    </button>
                </div>

                <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
                    {activeTab === 'growth' && renderGrowthUpdateForm()}
                    
                    {activeTab === 'activity' && (
                        <form onSubmit={handleLogActivity} className="max-w-md">
                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-bold text-gray-700">Activity Type</label>
                                <select
                                    className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-green-500 outline-none transition-all"
                                    value={activityForm.type}
                                    onChange={e => setActivityForm({ ...activityForm, type: e.target.value })}
                                >
                                    <option value="watering">Watering</option>
                                    <option value="fertilizing">Fertilizing</option>
                                    <option value="pruning">Pruning</option>
                                    <option value="disease_treatment">Disease Treatment</option>
                                    {isFarmMode && <option value="land_prep">Land Preparation</option>}
                                    {isFarmMode && <option value="harvesting">Harvesting</option>}
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-bold text-gray-700">Date</label>
                                <input
                                    type="date"
                                    className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-green-500 outline-none transition-all"
                                    value={activityForm.date}
                                    onChange={e => setActivityForm({ ...activityForm, date: e.target.value })}
                                />
                            </div>

                            <div className="mb-8">
                                <label className="block mb-2 text-sm font-bold text-gray-700">Description</label>
                                <textarea
                                    className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-green-500 outline-none transition-all h-32"
                                    value={activityForm.description}
                                    onChange={e => setActivityForm({ ...activityForm, description: e.target.value })}
                                    placeholder="What did you do today?"
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={submitting}
                                className={`w-full font-bold py-4 rounded-2xl transition-all shadow-lg shadow-green-100 ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                            >
                                {submitting ? 'Logging...' : 'Log Activity'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'photo' && (
                        <form onSubmit={handleUploadPhoto} className="max-w-md">
                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-medium text-gray-700">Select Photo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                                    onChange={e => setPhotoForm({ ...photoForm, photo: e.target.files[0] })}
                                    required
                                />
                                {photoForm.photo && <p className="text-[10px] text-blue-600 font-bold mt-1">Ready to upload: {photoForm.photo.name}</p>}
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-medium text-gray-700">Caption</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    value={photoForm.caption}
                                    onChange={e => setPhotoForm({ ...photoForm, caption: e.target.value })}
                                    placeholder="A short description of the photo"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                        checked={photoForm.isMilestone}
                                        onChange={e => setPhotoForm({ ...photoForm, isMilestone: e.target.checked })}
                                    />
                                    <span className="ml-3 text-sm text-gray-700">Mark as a milestone update</span>
                                </label>
                            </div>
                            <button 
                                type="submit" 
                                disabled={submitting}
                                className={`w-full font-bold py-3 px-6 rounded-xl transition-colors shadow-lg ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'}`}
                            >
                                {submitting ? 'Uploading...' : 'Upload Photo Update'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'milestone' && (
                        <form onSubmit={handleLogMilestone} className="max-w-md">
                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-medium text-gray-700">Milestone Type</label>
                                <select
                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    value={milestoneForm.type}
                                    onChange={e => setMilestoneForm({ ...milestoneForm, type: e.target.value })}
                                >
                                    {!isFarmMode ? (
                                        <>
                                            <option value="planted">Planted</option>
                                            <option value="sprouted">Sprouted</option>
                                            <option value="flowering">Flowering</option>
                                            <option value="fruit_setting">Fruit Setting</option>
                                            <option value="ready_for_harvest">Ready for Harvest</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="lease_started">Lease Started</option>
                                            <option value="land_prepared">Land Prepared</option>
                                            <option value="sowing_completed">Sowing Completed</option>
                                            <option value="mid_crop_milestone">Mid-Crop Milestone</option>
                                            <option value="harvest_imminent">Harvest Imminent</option>
                                        </>
                                    )}
                                </select>
                            </div>
                            <div className="mb-6">
                                <label className="block mb-2 text-sm font-medium text-gray-700">Date</label>
                                <input
                                    type="date"
                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    value={milestoneForm.date}
                                    onChange={e => setMilestoneForm({ ...milestoneForm, date: e.target.value })}
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={submitting}
                                className={`w-full font-bold py-3 px-6 rounded-xl transition-colors shadow-lg ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-100'}`}
                            >
                                {submitting ? 'Logging...' : 'Log Milestone'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'timeline' && (
                        <div className="space-y-8">
                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
                                </div>
                            ) : timeline.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-gray-500">No updates yet.</p>
                                </div>
                            ) : (
                                timeline.map((item, index) => (
                                    <div key={index} className="flex gap-4 group">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md ${item.type === 'activity' ? 'bg-green-500' :
                                                item.type === 'milestone' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                                                {item.type === 'activity' ? '🔧' : item.type === 'milestone' ? '🏆' : '📸'}
                                            </div>
                                            {index !== timeline.length - 1 && <div className="w-0.5 h-full bg-gray-100 group-hover:bg-gray-200 transition-colors my-2"></div>}
                                        </div>
                                        <div className="flex-1 pb-8">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-gray-900 capitalize">
                                                    {item.type === 'activity' ? item.activityType :
                                                        item.type === 'milestone' ? `Milestone: ${item.milestoneType.replace(/_/g, ' ')}` : 'Photo Update'}
                                                </h4>
                                                <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded">
                                                    {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 leading-relaxed mb-3">
                                                {item.description || item.caption || item.notes}
                                            </p>
                                            {item.photoUrl && (
                                                <div className="mt-2 relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm inline-block">
                                                    <img 
                                                        src={getMediaUrl(item.photoUrl)} 
                                                        alt="Update" 
                                                        className="max-w-xs h-auto block" 
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FarmerPlantManagePage;
