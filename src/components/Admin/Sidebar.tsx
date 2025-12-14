import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
    const { logout } = useAuth();
    
    const menuItems = [
        { path: 'routes', label: 'Manage Routes' },
        { path: 'students', label: 'Manage Students' },
        { path: 'drivers', label: 'Manage Drivers' },
        { path: 'vans', label: 'Manage Vans' },
        { path: 'tracking', label: 'Live Tracking' },
    ];

    return (
        <div className="w-full md:w-64 bg-slate-900 text-white shadow-xl p-4 flex flex-col justify-between h-full border-r border-slate-800">
            <div>
                <h1 className="text-xl font-bold mb-8 text-blue-400 pl-2">Admin Panel</h1>
                <nav className="space-y-2">
                    {menuItems.map((item) => (
                        <NavLink 
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => 
                                `block w-full text-left px-4 py-3 rounded-xl transition-all ${
                                    isActive 
                                    ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500 font-medium' 
                                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                                }`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>
            <button onClick={logout} className="mt-4 px-4 py-3 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 hover:border-red-500 w-full text-left transition-colors">
                Logout
            </button>
        </div>
    );
};

export default Sidebar;
