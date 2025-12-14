import { useEffect, useState } from 'react';
import { vanService, routeService } from '../../services/db';
import type { Van, Route } from '../../types';

const VanManager = () => {
    const [vans, setVans] = useState<Van[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [editId, setEditId] = useState<string | null>(null);
    const [vanNumber, setVanNumber] = useState('');
    const [capacity, setCapacity] = useState('20');
    const [routeId, setRouteId] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [vansData, routesData] = await Promise.all([
            vanService.getAllVans(),
            routeService.getAllRoutes()
        ]);
        setVans(vansData);
        setRoutes(routesData);
        setLoading(false);
    };

    const handleSaveVan = async () => {
        if (!vanNumber) return;

        try {
            if (editId) {
                await vanService.updateVan(editId, { 
                    vanNumber, 
                    capacity: parseInt(capacity), 
                    routeId 
                });
            } else {
                await vanService.createVan(vanNumber, parseInt(capacity), routeId);
            }
            
            setVanNumber('');
            setCapacity('20');
            setRouteId('');
            setEditId(null);
            loadData();
        } catch (error) {
            console.error("Error saving van:", error);
            alert("Failed to save van");
        }
    };

    const handleDelete = async (id: string) => {
        console.log("Attempting to delete van with ID:", id);
        if (!window.confirm("Are you sure you want to delete this van?")) {
            console.log("Delete cancelled by user");
            return;
        }
        try {
            console.log("Calling deleteVan...");
            await vanService.deleteVan(id);
            console.log("DeleteVan completed. Reloading data...");
            loadData();
        } catch (error) {
            console.error("Error deleting van:", error);
            alert("Failed to delete van: " + (error as any).message);
        }
    };

    const handleEdit = (van: Van) => {
        setEditId(van.id);
        setVanNumber(van.vanNumber);
        setCapacity(van.capacity?.toString() || '20');
        setRouteId(van.routeId || '');
    };

    const handleCancel = () => {
        setEditId(null);
        setVanNumber('');
        setCapacity('20');
        setRouteId('');
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 p-6 overflow-hidden">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 tracking-tight">Van Management</h2>

            <div className="flex gap-6 h-full min-h-0">
                {/* List Section */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden flex flex-col">
                    <h3 className="font-semibold text-gray-700 mb-4 text-lg">All Vans</h3>
                    <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                        {loading ? <p className="text-gray-400">Loading...</p> : (
                            <table className="w-full text-left border-separate border-spacing-y-2">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider sticky top-0 z-10">
                                    <tr>
                                        <th className="p-3 font-semibold rounded-l-lg">Van Number</th>
                                        <th className="p-3 font-semibold">Capacity</th>
                                        <th className="p-3 font-semibold">Assigned Route</th>
                                        <th className="p-3 font-semibold rounded-r-lg">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vans.map(van => (
                                        <tr key={van.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="p-3 border-b border-gray-100 group-hover:border-transparent rounded-l-lg bg-white group-hover:bg-gray-50 font-medium text-gray-700">{van.vanNumber}</td>
                                            <td className="p-3 border-b border-gray-100 group-hover:border-transparent bg-white group-hover:bg-gray-50 text-gray-600">{van.capacity}</td>
                                            <td className="p-3 border-b border-gray-100 group-hover:border-transparent bg-white group-hover:bg-gray-50">
                                                <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                                    routes.find(r => r.id === van.routeId) 
                                                    ? 'bg-violet-50 text-violet-600' 
                                                    : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {routes.find(r => r.id === van.routeId)?.name || 'Unassigned'}
                                                </span>
                                            </td>
                                            <td className="p-3 border-b border-gray-100 group-hover:border-transparent rounded-r-lg bg-white group-hover:bg-gray-50">
                                                <button 
                                                    onClick={() => handleEdit(van)}
                                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm mr-3 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(van.id)}
                                                    className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Form Section */}
                <div className="w-96 bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit shrink-0">
                    <h3 className="font-bold text-gray-800 mb-6 text-lg">{editId ? 'Edit Van' : 'Add New Van'}</h3>
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Van Number / Plate</label>
                            <input 
                                className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                value={vanNumber}
                                onChange={e => setVanNumber(e.target.value)}
                                placeholder="e.g. KA-01-AB-1234"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Capacity</label>
                            <input 
                                type="number"
                                className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                value={capacity}
                                onChange={e => setCapacity(e.target.value)}
                            />
                        </div>
                         <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Assign Route</label>
                            <select 
                                className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                                value={routeId}
                                onChange={e => setRouteId(e.target.value)}
                            >
                                <option value="">Select Route</option>
                                {routes.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button 
                                onClick={handleSaveVan}
                                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium transition-all shadow-sm active:scale-95"
                            >
                                {editId ? 'Update Van' : 'Add Van'}
                            </button>
                            {editId && (
                                <button 
                                    onClick={handleCancel}
                                    className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium transition-all"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VanManager;
