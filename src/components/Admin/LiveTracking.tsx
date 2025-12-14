import { useEffect, useState } from 'react';
import { locationService, vanService, routeService } from '../../services/db';
import type { BusLocation, Van, Route } from '../../types';
import MapComponent from '../Map/MapComponent';
import { Bus, MapPin, Navigation, Clock } from 'lucide-react';

const LiveTracking = () => {
    const [activeBuses, setActiveBuses] = useState<BusLocation[]>([]);
    const [vans, setVans] = useState<Van[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBusId, setSelectedBusId] = useState<string | null>(null);

    // Initial Data Load
    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const [vansData, routesData] = await Promise.all([
                    vanService.getAllVans(),
                    routeService.getAllRoutes()
                ]);
                setVans(vansData);
                setRoutes(routesData);
            } catch (error) {
                console.error("Error loading metadata:", error);
            } finally {
                setLoading(false);
            }
        };
        loadMetadata();
    }, []);

    // Realtable Subscription
    useEffect(() => {
        const unsubscribe = locationService.subscribeToAllBuses((locations) => {
            console.log("LiveTracking: All Buses", locations);
            // Only show buses that are online
            const onlineBuses = locations.filter(bus => bus.isOnline !== false); 
            // Note: Checking !== false because older data might not have the flag, defaulting to true or check strictly if we added it everywhere. 
            // Better: bus.isOnline === true. But let's check the type definition.
            setActiveBuses(onlineBuses);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        console.log("LiveTracking: Vans Loaded", vans);
    }, [vans]);

    const getVanDetails = (vanId?: string) => {
        if (!vanId) return { number: 'Unknown Van (No ID)', capacity: 0 };
        const van = vans.find(v => v.id === vanId);
        return van ? { number: van.vanNumber, capacity: van.capacity } : { number: `Unknown Van (${vanId})`, capacity: 0 };
    };

    const getRouteDetails = (routeId?: string) => {
        if (!routeId) return { name: 'Unknown Route' };
        const route = routes.find(r => r.id === routeId);
        return route ? { name: route.name, route } : { name: 'Unknown Route' };
    };

    if (loading) return <div className="p-8">Loading Fleet Data...</div>;

    const selectedBus = activeBuses.find(b => b.busId === selectedBusId);
    const selectedRoute = selectedBus ? getRouteDetails(selectedBus.routeId).route : undefined;

    return (
        <div className="relative w-full h-full bg-slate-900 overflow-hidden">
            
            {/* Map Background - Full Screen */}
            <div className="absolute inset-0 z-0">
                 <MapComponent 
                    // If selected bus exists, center on it. Else center on default.
                    center={selectedBus ? [selectedBus.lat, selectedBus.lng] : undefined}
                    zoom={selectedBus ? 15 : 12}
                    buses={activeBuses}
                    stops={selectedRoute?.stops} // Show stops only for selected route
                    onBusClick={(bus: BusLocation) => setSelectedBusId(bus.busId)}
                 />
            </div>

            {/* Floating Left Panel - Controls & List */}
            <div className="absolute top-4 left-4 bottom-4 w-96 z-10 flex flex-col gap-4 pointer-events-none">
                
                {/* Header Card */}
                <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-6 pointer-events-auto">
                    <h2 className="font-bold text-xl text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-600/20 rounded-lg">
                            <MapPin className="text-blue-400" size={20} />
                        </div>
                        Live Fleet
                    </h2>
                    <p className="text-sm text-slate-400 mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {activeBuses.length} Active Vehicles
                    </p>
                </div>

                {/* List Container */}
                <div className="flex-1 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col">
                    <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar h-full">
                        {activeBuses.length === 0 && (
                            <div className="text-center text-slate-500 mt-10 p-4">
                                <Bus size={40} className="mx-auto mb-4 opacity-50" />
                                <p>No active vehicles found.</p>
                            </div>
                        )}
                        
                        {activeBuses.map(bus => {
                            const van = getVanDetails(bus.vanId);
                            const route = getRouteDetails(bus.routeId);
                            const isSelected = selectedBusId === bus.busId;

                            return (
                                <div 
                                    key={bus.busId}
                                    onClick={() => setSelectedBusId(bus.busId)}
                                    className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                                        isSelected 
                                        ? 'bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-900/20' 
                                        : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className={`font-bold text-base ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                                                {van.number}
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-1">{route.name}</p>
                                        </div>
                                        <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                            bus.arrivalStatus === 'arriving' ? 'bg-orange-500/20 text-orange-400' :
                                            bus.arrivalStatus === 'arrived' ? 'bg-red-500/20 text-red-400' :
                                            'bg-emerald-500/20 text-emerald-400'
                                        }`}>
                                            {bus.arrivalStatus?.replace('_', ' ') || 'EN ROUTE'}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                        <div className="flex items-center gap-1.5" title="Speed">
                                            <Navigation size={12} />
                                            {Math.round((bus.speed || 0) * 3.6)} km/h
                                        </div>
                                        {bus.nextStopName && (
                                            <div className="flex items-center gap-1.5 truncate max-w-[140px]" title="Next Stop">
                                                <MapPin size={12} />
                                                {bus.nextStopName}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-slate-600 mt-3 pt-3 border-t border-slate-700/50 text-right flex items-center justify-end gap-1.5">
                                        <Clock size={10} />
                                        Updated {Math.floor((Date.now() - bus.updatedAt)/1000)}s ago
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Floating Selection Detail Card (Bottom Center) */}
            {selectedBus && (
                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-5 rounded-2xl shadow-2xl z-20 min-w-[500px] flex gap-6 items-center animate-up-fade">
                     <div className="bg-blue-600/20 p-4 rounded-full border border-blue-500/30">
                         <Bus className="text-blue-400" size={28} />
                     </div>
                     <div className="flex-1 border-r border-slate-700 pr-6">
                         <h3 className="font-bold text-xl text-white">{getVanDetails(selectedBus.vanId).number}</h3>
                         <p className="text-slate-400 text-sm">{getRouteDetails(selectedBus.routeId).name}</p>
                     </div>
                     <div className="flex-1 pl-2">
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Next Stop</p>
                          <p className="font-semibold text-slate-200">{selectedBus.nextStopName || 'N/A'}</p>
                     </div>
                     <div className="flex-1">
                         <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Status</p>
                         <p className={`font-semibold ${
                             selectedBus.arrivalStatus === 'arriving' ? 'text-orange-400' : 'text-emerald-400'
                         }`}>
                             {selectedBus.arrivalStatus?.toUpperCase().replace('_', ' ') || 'On Track'}
                         </p>
                     </div>
                 </div>
            )}
        </div>
    );
};

export default LiveTracking;
