import React, { useState, useEffect } from 'react';
import { treeService } from '../../services/api';

const TreeManagement = () => {
    const [trees, setTrees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTree, setCurrentTree] = useState({ name: '', price: '', isActive: true });
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // In-modal message state: { type: 'success' | 'error', text: string }
    const [modalMsg, setModalMsg] = useState(null);

    // Page-level delete message
    const [pageMsg, setPageMsg] = useState(null);

    useEffect(() => {
        fetchTrees();
    }, []);

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

    const showPageMsg = (type, text) => {
        setPageMsg({ type, text });
        setTimeout(() => setPageMsg(null), 4000);
    };

    const handleOpenModal = (tree = null) => {
        setModalMsg(null);
        if (tree) {
            setCurrentTree({ ...tree, price: tree.price.toString() });
            setIsEditing(true);
        } else {
            setCurrentTree({ name: '', price: '', isActive: true });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalMsg(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setModalMsg(null);
        try {
            if (isEditing) {
                await treeService.updateTree(currentTree.id, currentTree);
            } else {
                await treeService.createTree(currentTree);
            }
            await fetchTrees();

            // Show success inside modal, then close after 1.5s
            setModalMsg({
                type: 'success',
                text: isEditing
                    ? `"${currentTree.name}" has been updated successfully!`
                    : `"${currentTree.name}" has been added to the tree catalogue!`,
            });
            setTimeout(() => handleCloseModal(), 1800);
        } catch (error) {
            console.error('Failed to save tree:', error);
            const msg = error?.response?.data?.message || 'Failed to save tree. Please try again.';
            setModalMsg({ type: 'error', text: msg });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
        try {
            await treeService.deleteTree(id);
            fetchTrees();
            showPageMsg('success', `"${name}" has been deleted.`);
        } catch (error) {
            console.error('Failed to delete tree:', error);
            showPageMsg('error', 'Failed to delete tree. Please try again.');
        }
    };

    const toggleStatus = async (tree) => {
        try {
            await treeService.updateTree(tree.id, { isActive: !tree.isActive });
            fetchTrees();
        } catch (error) {
            console.error('Failed to update status:', error);
            showPageMsg('error', 'Failed to update tree status.');
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
                Loading trees...
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">

            {/* Page-level message toast */}
            {pageMsg && (
                <div className={`mb-6 px-5 py-4 rounded-xl font-semibold text-sm flex items-center gap-3 shadow-sm transition-all ${
                    pageMsg.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                    <span className="text-lg">{pageMsg.type === 'success' ? '✅' : '❌'}</span>
                    {pageMsg.text}
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tree Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage the types of trees investors can plant.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wide text-xs sm:text-sm shadow-lg transition-all"
                >
                    + Add New Tree
                </button>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Tree Name</th>
                                <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Price (Rs)</th>
                                <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trees.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-16 text-center text-gray-400 text-sm font-bold uppercase tracking-widest">
                                        🌱 No trees found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                trees.map((tree) => (
                                    <tr key={tree.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-6 font-bold text-gray-900">{tree.name}</td>
                                        <td className="py-4 px-6 text-gray-600 font-medium">Rs. {Number(tree.price).toLocaleString()}</td>
                                        <td className="py-4 px-6">
                                            <button
                                                onClick={() => toggleStatus(tree)}
                                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                    tree.isActive
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                } transition-colors`}
                                            >
                                                {tree.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button
                                                onClick={() => handleOpenModal(tree)}
                                                className="text-blue-500 hover:text-blue-700 font-bold text-sm mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(tree.id, tree.name)}
                                                className="text-red-500 hover:text-red-700 font-bold text-sm"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ===== MODAL ===== */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden">

                        {/* Modal Header */}
                        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-900">
                                {isEditing ? '✏️ Edit Tree' : '🌳 Add New Tree'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-700 text-2xl leading-none transition-colors"
                                aria-label="Close"
                            >
                                &times;
                            </button>
                        </div>

                        {/* ===== IN-MODAL MESSAGE ===== */}
                        {modalMsg && (
                            <div className={`mx-8 mb-4 px-4 py-3 rounded-xl text-sm font-semibold flex items-start gap-3 ${
                                modalMsg.type === 'success'
                                    ? 'bg-green-50 text-green-800 border border-green-200'
                                    : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                                <span className="text-base mt-0.5 flex-shrink-0">
                                    {modalMsg.type === 'success' ? '✅' : '⚠️'}
                                </span>
                                <span>{modalMsg.text}</span>
                            </div>
                        )}

                        {/* Modal Form */}
                        <form onSubmit={handleSubmit} className="px-8 pb-8">
                            <div className="mb-5">
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                    Tree Name
                                </label>
                                <input
                                    type="text"
                                    value={currentTree.name}
                                    onChange={(e) => setCurrentTree({ ...currentTree, name: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                                    required
                                    placeholder="e.g. Mango Tree"
                                    disabled={submitting}
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                    Price (Rs)
                                </label>
                                <input
                                    type="number"
                                    value={currentTree.price}
                                    onChange={(e) => setCurrentTree({ ...currentTree, price: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                                    required
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    disabled={submitting}
                                />
                            </div>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    disabled={submitting}
                                    className="flex-1 bg-gray-100 text-gray-600 hover:bg-gray-200 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors shadow-md shadow-green-600/20 disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {isEditing ? 'Saving...' : 'Creating...'}
                                        </>
                                    ) : (
                                        isEditing ? 'Save Changes' : 'Create Tree'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TreeManagement;
