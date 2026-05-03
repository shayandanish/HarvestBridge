import React, { useState, useEffect } from 'react';
import { treeService, plantationService } from '../services/api';
import { UNIT_CONVERSIONS } from '../utils/unitConverter';
import './PlantTreeModal.css';

const PlantTreeModal = ({ isOpen, onClose, onSuccess, leasedFarms, availableLands }) => {
    const [trees, setTrees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedFarmId, setSelectedFarmId] = useState('');
    const [selectedLandId, setSelectedLandId] = useState(''); // For unleased lands
    const [investmentName, setInvestmentName] = useState(''); // Custom investment/project name
    const [directPlantingData, setDirectPlantingData] = useState({
        farmName: ''
    });

    const navigate = require('react-router-dom').useNavigate();

    // Filter unique lands since one land might have multiple farm entries
    const uniqueLeasedFarms = React.useMemo(() => {
        if (!leasedFarms) return [];
        const seenLands = new Set();
        return leasedFarms.filter(farm => {
            if (!farm.land?.id) return true;
            if (seenLands.has(farm.land.id)) return false;
            seenLands.add(farm.land.id);
            return true;
        });
    }, [leasedFarms]);

    // Array of { tree: object, quantity: number }
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        if (isOpen) {
            fetchTrees();
            setSelectedItems([]);
            setSelectedFarmId('');
            setSelectedLandId('');
            setInvestmentName('');
            setDirectPlantingData({
                farmName: ''
            });
        }
    }, [isOpen]);

    const fetchTrees = async () => {
        try {
            setLoading(true);
            const response = await treeService.getAllTrees();
            setTrees(response.data || []);
        } catch (error) {
            console.error('Failed to fetch trees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = (tree) => {
        const existing = selectedItems.find(item => item.tree.id === tree.id);
        if (existing) {
            setSelectedItems(selectedItems.map(item =>
                item.tree.id === tree.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setSelectedItems([...selectedItems, { tree, quantity: 1 }]);
        }
    };

    const handleRemoveItem = (treeId) => {
        setSelectedItems(selectedItems.filter(item => item.tree.id !== treeId));
    };

    const handleQuantityChange = (treeId, quantity) => {
        const qty = parseInt(quantity);
        if (qty > 0) {
            setSelectedItems(selectedItems.map(item =>
                item.tree.id === treeId ? { ...item, quantity: qty } : item
            ));
        }
    };

    const calculateTotal = () => {
        return selectedItems.reduce((total, item) => total + (item.tree.price * item.quantity), 0);
    };

    const handleSubmit = async () => {
        if (selectedItems.length === 0) return;

        try {
            setSubmitting(true);

            const items = selectedItems.map(item => ({
                treeId: item.tree.id,
                quantity: item.quantity
            }));

            if (selectedLandId) {
                // Direct Planting Flow
                const projName = directPlantingData.farmName || investmentName;
                if (!projName) {
                    alert('Please provide a project name for your investment.');
                    return;
                }

                const response = await plantationService.createDirectRequest({
                    items,
                    landId: selectedLandId,
                    farmName: projName
                });

                alert('Success! Your plantation request has been submitted and is now pending.');
                onSuccess();
                onClose();
            } else {
                // Regular Plantation Flow
                if (!selectedFarmId) return;
                await plantationService.createRequest({ items, farmId: selectedFarmId, investmentName });
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Failed to submit plantation request:', error);
            const message = error.response?.data?.message || 'Failed to submit your request. Please try again.';
            alert(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 plant-modal-overlay flex items-center justify-center p-4 font-sans">
            <div className="plant-modal-container p-4 sm:p-6 w-full max-w-7xl rounded-2xl sm:rounded-[3rem] flex flex-col max-h-[95vh]">
                {/* Header - Compact */}
                <div className="flex justify-between items-center mb-6 shrink-0 border-b border-emerald-50 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                            <span className="text-2xl">🌱</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">Plant Your Legacy</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select trees and lease area to begin</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-500 rounded-full flex items-center justify-center transition-all duration-300 transform hover:rotate-90"
                    >
                        <span className="text-xl">×</span>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-6">
                    {/* Left Column: Configuration */}
                    <div className="flex-[2] flex flex-col min-h-0">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 shrink-0">
                            {/* Step 1: Land Selection */}
                            <div className="land-selector-group p-4 bg-emerald-50/50 border-emerald-100/50">
                                <span className="step-label mb-2">1. Choose Ground</span>
                                <select
                                    value={selectedLandId ? `land-${selectedLandId}` : selectedFarmId}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val.startsWith('land-')) {
                                            setSelectedLandId(val.replace('land-', ''));
                                            setSelectedFarmId('');
                                        } else {
                                            setSelectedFarmId(val);
                                            setSelectedLandId('');
                                        }
                                    }}
                                    className="w-full bg-white border-none shadow-sm rounded-xl px-4 py-3 font-bold text-gray-900 custom-select focus:ring-4 focus:ring-emerald-100 transition-all cursor-pointer text-sm"
                                >
                                    <option value="">-- Choose a location --</option>
                                    
                                    {uniqueLeasedFarms && uniqueLeasedFarms.length > 0 && (
                                        <optgroup label="Your Existing Projects">
                                            {uniqueLeasedFarms.map(farm => (
                                                <option key={farm.id} value={farm.id}>
                                                    {farm.farmName || 'Untitled Project'} (on {farm.land?.landName || 'Unknown Land'})
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}

                                    {availableLands && availableLands.length > 0 && (
                                        <optgroup label="Available Land for New Project">
                                            {availableLands.map(land => (
                                                <option key={land.id} value={`land-${land.id}`}>
                                                    {land.landName} ({land.remainingArea.toFixed(1)} {land.areaUnit} available)
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>
                            </div>

                            {/* Name input shown for BOTH flows after a location is chosen */}
                            {(selectedLandId || selectedFarmId) && (
                                <div className="land-selector-group p-4 bg-emerald-50/50 border-emerald-100/50 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <span className="step-label mb-2">Investment Name</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. My Cherry Orchard"
                                        value={selectedLandId ? directPlantingData.farmName : investmentName}
                                        onChange={(e) => {
                                            if (selectedLandId) {
                                                setDirectPlantingData({ ...directPlantingData, farmName: e.target.value });
                                            } else {
                                                setInvestmentName(e.target.value);
                                            }
                                        }}
                                        className="w-full bg-white border-none shadow-sm rounded-xl px-4 py-3 font-bold text-gray-900 focus:ring-4 focus:ring-emerald-100 transition-all outline-none text-sm"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Step 2: Tree Selection */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <span className="step-label">2. Select Your Trees</span>
                            <div className="botanical-catalog-wrapper custom-scrollbar pr-3 pb-6">
                                {loading ? (
                                    <div className="py-12 flex flex-col items-center justify-center gap-4">
                                        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Botanical Catalog...</p>
                                    </div>
                                ) : trees.length === 0 ? (
                                    <div className="empty-state-visual">
                                        <span className="empty-icon">🍂</span>
                                        <p className="empty-text">No trees available at the moment</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {trees.map((tree, idx) => (
                                            <div
                                                key={tree.id}
                                                className="tree-card p-4"
                                                style={{ animationDelay: `${idx * 0.05}s` }}
                                            >
                                                <div>
                                                    <div className="tree-icon-wrapper w-10 h-10 text-xl mb-2">🌳</div>
                                                    <h4 className="font-black text-gray-900 mb-0.5 leading-tight text-sm">{tree.name}</h4>
                                                    <p className="text-[10px] font-medium text-gray-500 mb-2 tracking-tight">Requires {tree.spaceRequired} {tree.spaceUnit || 'SQ FT'}</p>
                                                </div>
                                                <div className="flex items-center justify-between gap-2 mt-auto pt-2">
                                                    <span className="text-base font-black text-emerald-600">Rs {Number(tree.price).toLocaleString()}</span>
                                                    <button
                                                        onClick={() => handleAddItem(tree)}
                                                        className="w-8 h-8 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg flex items-center justify-center transition-all duration-300"
                                                    >
                                                        <span className="text-lg">+</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Checkout Sidebar */}
                    <div className="flex-1 md:max-w-sm flex flex-col min-h-0">
                        <div className="selection-sidebar flex-1 flex flex-col min-h-0">
                            <span className="step-label">3. Selection Summary</span>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-6">
                                {selectedItems.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center py-12">
                                        <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-3xl mb-4 grayscale opacity-40">
                                            🛒
                                        </div>
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center px-6">Your basket is waiting for some green</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {selectedItems.map((item) => (
                                            <div key={item.tree.id} className="selected-item-card">
                                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                                                    <span className="text-lg">🌿</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="font-bold text-gray-900 truncate leading-tight">{item.tree.name}</h5>
                                                    <p className="text-[10px] text-emerald-600 font-black tracking-tight">Rs {Number(item.tree.price).toLocaleString()}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 pr-1">
                                                    <div className="qty-pill">
                                                        <button
                                                            onClick={() => item.quantity > 1 ? handleQuantityChange(item.tree.id, item.quantity - 1) : handleRemoveItem(item.tree.id)}
                                                            className="qty-btn"
                                                        >-</button>
                                                        <span className="w-8 text-center text-xs font-black text-gray-900">{item.quantity}</span>
                                                        <button
                                                            onClick={() => handleQuantityChange(item.tree.id, item.quantity + 1)}
                                                            className="qty-btn"
                                                        >+</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="total-section">
                                <div className="flex justify-between items-end mb-6 bg-emerald-50 rounded-2xl p-4 border border-emerald-100/50">
                                    <div>
                                        <span className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none mb-1">Estimated Total</span>
                                        <span className="text-gray-400 text-[10px] font-medium leading-none">All inclusive est.</span>
                                    </div>
                                    <span className="text-2xl font-black text-emerald-700 leading-none">Rs {calculateTotal().toLocaleString()}</span>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={selectedItems.length === 0 || (!selectedFarmId && !selectedLandId) || submitting}
                                    className="w-full submit-btn-premium"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Initiate Plantation</span>
                                            <span className="text-xl">➔</span>
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-4">Transparent Pricing • Sustainable Investing</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlantTreeModal;

