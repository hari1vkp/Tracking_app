import { useEffect, useState } from 'react';
import { routeService } from '../../services/db';
import type { Route, Stop } from '../../types';
import MapComponent from '../Map/MapComponent';

const RouteManager = () => {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'create'>('list');

    // Form state
    const [editId, setEditId] = useState<string | null>(null);
    const [routeName, setRouteName] = useState('');
    const [stops, setStops] = useState<Stop[]>([]);
    
    // Stop form
    const [stopName, setStopName] = useState('');
    const [stopLat, setStopLat] = useState('');
    const [stopLng, setStopLng] = useState('');
    const [tempMarker, setTempMarker] = useState<[number, number] | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [mapCenter, setMapCenter] = useState<[number, number]>([12.9716, 77.5946]);

    useEffect(() => {
        loadRoutes();
    }, []);

    const loadRoutes = async () => {
        setLoading(true);
        const data = await routeService.getAllRoutes();
        setRoutes(data);
        setLoading(false);
    }

    const handleAddStop = () => {
        if (!stopName || !stopLat || !stopLng) return;
        const newStop: Stop = {
            id: Date.now().toString(), // Helper ID for client-side
            name: stopName,
            lat: parseFloat(stopLat),
            lng: parseFloat(stopLng),
        };
        setStops([...stops, newStop]);
        setStopName('');
        setTempMarker(null);
        // Keep lat/lng for potentially adding nearby stop or clear them? 
        // User requested: "Prevent adding a stop if the map is not clicked." -> implicitly suggesting reset or explicit check.
        // Let's reset them to force click for next stop as per "Prevent adding... if map is not clicked" spirit.
        setStopLat('');
        setStopLng('');
    };

    const handleMapClick = (lat: number, lng: number) => {
        setStopLat(lat.toFixed(6));
        setStopLng(lng.toFixed(6));
        setTempMarker([lat, lng]);
    };

    const handleSearch = async () => {
        if (!searchQuery) return;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon, display_name, name } = data[0];
                const newLat = parseFloat(lat);
                const newLng = parseFloat(lon);
                setMapCenter([newLat, newLng]);
                setTempMarker([newLat, newLng]);
                setStopLat(newLat.toFixed(6));
                setStopLng(newLng.toFixed(6));
                
                // Content strategy: Use specific name if available, else first part of display_name
                const placeName = name || display_name.split(',')[0];
                setStopName(placeName);
            } else {
                alert('Location not found');
            }
        } catch (error) {
            console.error("Search error:", error);
            alert('Error searching for location');
        }
    };

    const handleSaveRoute = async () => {
        if (!routeName || stops.length === 0) return;
        try {
            if (editId) {
                await routeService.updateRoute(editId, { name: routeName, stops });
            } else {
                await routeService.createRoute(routeName, stops);
            }
            
            setRouteName('');
            setStops([]);
            setEditId(null);
            setTempMarker(null);
            setStopLat('');
            setStopLng('');
            setView('list');
            loadRoutes();
        } catch (e) {
            console.error("Error saving route", e);
            alert("Failed to save route");
        }
    };

    const handleEdit = (route: Route) => {
        setEditId(route.id);
        setRouteName(route.name);
        setStops(route.stops);
        setTempMarker(null);
        setStopLat('');
        setStopLng('');
        setView('create');
    };

    const handleCancel = () => {
        setEditId(null);
        setRouteName('');
        setStops([]);
        setTempMarker(null);
        setStopLat('');
        setStopLng('');
        setView('list');
    };

    // VIEW 1: LIST DASHBOARD
    if (view === 'list') {
        return (
            <div className="h-full flex flex-col bg-gray-50 p-6 overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Route Management</h2>
                    <button 
                        onClick={() => {
                            setEditId(null);
                            setRouteName('');
                            setStops([]);
                            setTempMarker(null);
                            setStopLat('');
                            setStopLng('');
                            setView('create');
                        }}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 font-medium transition-all shadow-sm active:scale-95 flex items-center gap-2"
                    >
                        <span>+</span> Create New Route
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? <p className="text-gray-400">Loading routes...</p> : routes.map(route => (
                            <div key={route.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-xl text-gray-800">{route.name}</h3>
                                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                        {route.stops.length} Stops
                                    </span>
                                </div>
                                <div className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">
                                    {route.stops.map(s => s.name).join(' → ')}
                                </div>
                                <div className="mt-6 pt-4 border-t border-gray-50 flex justify-end">
                                    <button 
                                        onClick={() => handleEdit(route)}
                                        className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors"
                                    >
                                        Edit Details &rarr;
                                    </button>
                                </div>
                            </div>
                        ))}
                        {routes.length === 0 && !loading && (
                            <div className="col-span-full text-center py-20 text-gray-400">
                                <p>No routes found. Create your first route!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // VIEW 2: MAP EDITOR (CREATE/EDIT)
    return (
        <div className="relative w-full h-full bg-slate-900 overflow-hidden">
            {/* Full Screen Map */}
            <div className="absolute inset-0 z-0">
                 <MapComponent 
                    stops={stops} 
                    center={mapCenter} 
                    tempMarker={tempMarker}
                    onMapClick={handleMapClick}
                 />
            </div>

            {/* Floating Left Panel - Editor Form */}
            <div className="absolute top-4 left-4 bottom-4 w-[450px] z-10 flex flex-col pointer-events-none">
                <div className="flex-1 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col">
                    
                    {/* Header */}
                    <div className="p-6 border-b border-slate-700 shrink-0">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">{editId ? 'Edit Route' : 'New Route Plan'}</h2>
                            <button onClick={handleCancel} className="text-slate-400 hover:text-white px-3 py-1 rounded hover:bg-white/10 text-sm transition-colors">
                                Cancel
                            </button>
                        </div>
                        <input 
                            className="w-full bg-slate-800 border border-slate-600 p-3 rounded-xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500 transition-all font-medium text-lg" 
                            value={routeName} 
                            onChange={e => setRouteName(e.target.value)} 
                            placeholder="Route Name (e.g. Route 5)"
                        />
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        
                        {/* Search & Add Section */}
                        <div className="space-y-4">
                             <div className="flex gap-2">
                                <input 
                                    className="flex-1 bg-slate-800 border border-slate-600 p-2.5 rounded-lg text-sm text-white focus:border-blue-500 outline-none"
                                    placeholder="Search location..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                />
                                <button 
                                    onClick={handleSearch}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 font-medium"
                                >
                                    Search
                                </button>
                            </div>

                            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-3">
                                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Add Stop</h3>
                                <input 
                                    className="w-full bg-slate-800 border border-slate-600 p-2.5 rounded-lg text-white text-sm outline-none focus:border-blue-500" 
                                    value={stopName} 
                                    onChange={e => setStopName(e.target.value)} 
                                    placeholder="Stop Name (Auto-fills)"
                                />
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-slate-900 border border-slate-700 p-2 rounded text-slate-400 truncate">
                                        Lat: {stopLat || 'Click Map'}
                                    </div>
                                    <div className="bg-slate-900 border border-slate-700 p-2 rounded text-slate-400 truncate">
                                        Lng: {stopLng || 'Click Map'}
                                    </div>
                                </div>
                                <button 
                                    onClick={handleAddStop} 
                                    disabled={!stopName || !stopLat}
                                    className="w-full bg-violet-600 disabled:bg-slate-700 disabled:text-slate-500 text-white py-2.5 rounded-lg font-medium hover:bg-violet-700 transition-all shadow-lg shadow-violet-900/20"
                                >
                                    + Add to Route
                                </button>
                            </div>
                        </div>

                        {/* Sequence List */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Stops Sequence</h3>
                                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{stops.length} Stops</span>
                            </div>
                            
                            <div className="space-y-2">
                                {stops.length === 0 && (
                                    <div className="text-center py-8 text-slate-600 text-sm border-2 border-dashed border-slate-700 rounded-xl">
                                        No stops added yet.
                                    </div>
                                )}
                                {stops.map((s, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-slate-800 rounded-lg border border-slate-700 group hover:border-slate-600 transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold border border-slate-600">
                                                {i + 1}
                                            </div>
                                            <span className="text-slate-200 text-sm truncate">{s.name}</span>
                                        </div>
                                        <button 
                                            onClick={() => setStops(stops.filter((_, idx) => idx !== i))}
                                            className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-slate-700 shrink-0 bg-slate-900/50">
                        <button 
                            onClick={handleSaveRoute} 
                            disabled={!routeName || stops.length === 0}
                            className="w-full bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 text-white py-3 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg active:scale-95"
                        >
                            {editId ? 'Update Route Plan' : 'Save New Route'}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Helper Toast/Overlay (Optional) */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-0 pointer-events-none">
                 <div className="bg-slate-900/80 backdrop-blur text-white px-4 py-2 rounded-full text-xs font-medium shadow-xl border border-white/10">
                    Click on the map to add stops accurately
                 </div>
            </div>
        </div>
    );
};

export default RouteManager;
