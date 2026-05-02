import React, { useState, useEffect } from 'react';
import { treeService } from '../../services/api';

const TreeManagement = () => {
    const [trees, setTrees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTree, setCurrentTree] = useState({ name: '', price: '', isActive: true });
    const [isEditing, setIsEditing] = useState(false);

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

    const handleOpenModal = (tree = null) => {
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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await treeService.updateTree(currentTree.id, currentTree);
            } else {
                await treeService.createTree(currentTree);
            }
            await fetchTrees();
            handleCloseModal();
            alert(`Tree ${isEditing ? 'updated' : 'created'} successfully!`);
        } catch (error) {
            console.error('Failed to save tree:', error);
            alert('Failed to save tree. Please check the console for details.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this tree?')) {
            try {
                await treeService.deleteTree(id);
                fetchTrees();
            } catch (error) {
                console.error('Failed to delete tree:', error);
            }
        }
    };

    const toggleStatus = async (tree) => {
        try {
            await treeService.updateTree(tree.id, { isActive: !tree.isActive });
            fetchTrees();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading trees...</div>;
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tree Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage the types of trees investors can plant.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wide text-sm shadow-lg transition-all"
                >
                    + Add New Tree
                </button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
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
                                <td colSpan="4" className="py-8 text-center text-gray-400 text-sm font-bold uppercase tracking-widest">
                                    No trees found. Create one to get started.
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
                                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${tree.isActive
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
                                            onClick={() => handleDelete(tree.id)}
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-2xl font-black text-gray-900 mb-6">
                            {isEditing ? 'Edit Tree' : 'Add New Tree'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-5">
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Tree Name</label>
                                <input
                                    type="text"
                                    value={currentTree.name}
                                    onChange={(e) => setCurrentTree({ ...currentTree, name: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                                    required
                                    placeholder="e.g. Mango Tree"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Price (Rs)</label>
                                <input
                                    type="number"
                                    value={currentTree.price}
                                    onChange={(e) => setCurrentTree({ ...currentTree, price: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                                    required
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 bg-gray-100 text-gray-600 hover:bg-gray-200 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors shadow-md shadow-green-600/20"
                                >
                                    {isEditing ? 'Save Changes' : 'Create Tree'}
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
