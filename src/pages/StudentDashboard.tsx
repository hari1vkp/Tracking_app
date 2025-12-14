import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { routeService, locationService, vanService, userService } from '../services/db';
import type { Route, BusLocation, Van } from '../types';
import { MapPin, Bus } from 'lucide-react';
import MapComponent from '../components/Map/MapComponent';

const StudentDashboard = () => {
    const { user, userProfile, logout } = useAuth();
    const [routes, setRoutes] = useState<Route[]>([]); // Keep routes for map display if needed
    const [buses, setBuses] = useState<BusLocation[]>([]);
    
    // Setup Modal State
    const [vans, setVans] = useState<Van[]>([]);
    const [showSetup, setShowSetup] = useState(false);
    const [setupName, setSetupName] = useState('');
    const [setupStudentId, setSetupStudentId] = useState('');
    const [setupVanId, setSetupVanId] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Initial Data Load
    useEffect(() => {
        const fetchMetadata = async () => {
            const [allVans, allRoutes] = await Promise.all([
                vanService.getAllVans(),
                routeService.getAllRoutes()
            ]);
            setVans(allVans);
            setRoutes(allRoutes);
        };
        fetchMetadata();
    }, []);

    // Check if setup is required
    useEffect(() => {
        if (userProfile && (!userProfile.studentName || !userProfile.vanId)) {
            setShowSetup(true);
        } else {
            setShowSetup(false);
        }
    }, [userProfile]);

    // Subscribe to buses
    useEffect(() => {
        const unsubscribe = locationService.subscribeToAllBuses((allBuses) => {
            // Filter only the assigned bus if setup is complete
            if (userProfile?.vanId) {
                setBuses(allBuses.filter(b => b.vanId === userProfile.vanId && b.isOnline));
            } else {
                setBuses([]);
            }
        });
        return () => unsubscribe();
    }, [userProfile?.vanId]);

    const handleSaveSetup = async () => {
        if (!user || !setupName || !setupStudentId || !setupVanId) {
            alert("Please fill all fields");
            return;
        }

        setIsSaving(true);
        try {
            await userService.updateUserProfile(user.uid, {
                studentName: setupName,
                studentId: setupStudentId,
                vanId: setupVanId
            });
            // AuthContext will auto-update userProfile via onSnapshot
        } catch (error) {
            console.error("Setup failed:", error);
            alert("Failed to save profile. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const assignedVan = vans.find(v => v.id === userProfile?.vanId);
    // Find route from van if possible, or from bus location
    const currentBus = buses[0];
    const assignedRoute = routes.find(r => r.id === currentBus?.routeId || r.id === assignedVan?.routeId);

    // Calculate nearest bus ETA (Mock)
    const getETA = () => {
        if (!currentBus) return 'Waiting for bus...';
        if (currentBus.arrivalStatus === 'arriving') return 'Arriving Now!';
        if (currentBus.arrivalStatus === 'arrived') return 'Arrived at Stop';
        return 'En Route';
    };

    if (showSetup) {
        return (
            <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-[1000] p-4">
                <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-700">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <div className="bg-blue-600/20 p-2 rounded-lg">
                            <MapPin className="text-blue-500" />
                        </div>
                        Setup Child Profile
                    </h2>
                    <p className="text-slate-400 mb-8 border-l-4 border-blue-600 pl-4 py-1">
                        Please provide your child's details to sync with the correct school bus.
                    </p>

                    <div className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Student Name</label>
                            <input 
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                                placeholder="Enter Full Name"
                                value={setupName}
                                onChange={e => setSetupName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                             <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Student ID</label>
                            <input 
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                                placeholder="Enter School ID"
                                value={setupStudentId}
                                onChange={e => setSetupStudentId(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                             <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Assigned Bus</label>
                            <select 
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                                value={setupVanId}
                                onChange={e => setSetupVanId(e.target.value)}
                            >
                                <option value="" className="text-slate-500">-- Select Bus --</option>
                                {vans.map(v => (
                                    <option key={v.id} value={v.id}>{v.vanNumber} {v.routeId ? '(Allocated)' : ''}</option>
                                ))}
                            </select>
                        </div>
                        
                        <button 
                            onClick={handleSaveSetup}
                            disabled={isSaving}
                            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98] ${isSaving ? 'bg-slate-700 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40'}`}
                        >
                            {isSaving ? 'Saving Profile...' : 'Start Tracking'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen bg-slate-900 overflow-hidden">
             {/* Header */}
             <div className="absolute top-0 left-0 w-full p-4 z-20 flex justify-between items-start pointer-events-none">
                <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-700 shadow-xl pointer-events-auto flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-600/20 rounded-lg">
                            <Bus className="text-blue-500 w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white leading-tight">Student Tracker</h1>
                             <p className="text-xs text-slate-400">
                                Tracking: <span className="font-semibold text-blue-400">{userProfile?.studentName}</span>
                            </p>
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={logout} 
                    className="pointer-events-auto bg-slate-900/90 backdrop-blur-md hover:bg-red-500/90 hover:border-red-500 border border-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg"
                >
                    Logout
                </button>
            </div>

            {/* Main Content */}
            <div className="absolute inset-0 z-0">
                {/* Status Card */}
                <div className="absolute bottom-6 left-6 right-6 z-[500] flex justify-center pointer-events-none">
                    <div className="bg-slate-900/95 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-slate-700 w-full max-w-md pointer-events-auto">
                         {currentBus ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Estimated Arrival</p>
                                        <p className={`text-2xl font-bold ${currentBus.arrivalStatus === 'arriving' ? 'text-green-400' : 'text-white'}`}>
                                            {getETA()}
                                        </p>
                                    </div>
                                    <div className={`p-3 rounded-full ${currentBus.arrivalStatus === 'arriving' ? 'bg-green-500/20 animate-pulse' : 'bg-slate-800'}`}>
                                         <Bus className={`w-8 h-8 ${currentBus.arrivalStatus === 'arriving' ? 'text-green-500' : 'text-slate-500'}`} />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-slate-500 text-xs mb-1">Current Stop</p>
                                        <p className="text-slate-300 font-medium truncate">{currentBus.nextStopName || 'En route'}</p>
                                    </div>
                                    <div className="text-right">
                                         <p className="text-slate-500 text-xs mb-1">Bus Number</p>
                                         <p className="text-slate-300 font-medium">{assignedVan?.vanNumber || 'Unknown'}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                             <div className="text-center py-6">
                                <div className="inline-block p-4 rounded-full bg-slate-800 mb-4 animate-pulse">
                                    <Bus className="w-8 h-8 text-slate-600" />
                                </div>
                                <p className="text-slate-300 font-bold mb-1">Bus is currently offline</p>
                                <p className="text-slate-500 text-sm">The driver has not started the trip yet.</p>
                             </div>
                        )}
                    </div>
                </div>

                <MapComponent 
                    center={[12.9716, 77.5946]}
                    zoom={13}
                    stops={assignedRoute?.stops || []}
                    buses={buses}
                />
            </div>
            
            {/* Top Gradient */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-900/90 to-transparent pointer-events-none z-10"></div>
        </div>
    );
};

export default StudentDashboard;
