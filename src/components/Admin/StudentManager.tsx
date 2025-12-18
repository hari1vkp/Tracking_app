import { useEffect, useState } from 'react';
import { userService, vanService } from '../../services/db';
import type { UserProfile, Van } from '../../types';

const StudentManager = () => {
    const [students, setStudents] = useState<UserProfile[]>([]);
    const [vans, setVans] = useState<Van[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<UserProfile>>({
        email: '',
        name: '',
        role: 'student',
        vanId: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [studentsData, vansData] = await Promise.all([
            userService.getUsersByRole('student'),
            vanService.getAllVans()
        ]);
        setStudents(studentsData);
        setVans(vansData);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!formData.email || !formData.name) return;

        try {
            if (isEditing && editId) {
                await userService.updateUserProfile(editId, formData);
            } else {
                await userService.createUserProfile(formData as UserProfile);
            }
            
            // Reset and reload
            setIsEditing(false);
            setEditId(null);
            setFormData({ email: '', name: '', role: 'student', vanId: '' });
            loadData();
        } catch (error) {
            console.error("Error saving student:", error);
            alert("Failed to save student");
        }
    };

    const handleDelete = async (uid: string) => {
        console.log("Attempting to delete student with UID:", uid);
        if (!window.confirm("Are you sure you want to delete this student?")) {
            console.log("Delete cancelled by user");
            return;
        }
        try {
            console.log("Calling deleteUser...");
            await userService.deleteUser(uid);
            console.log("DeleteUser completed. Reloading data...");
            loadData();
        } catch (error) {
            console.error("Error deleting student:", error);
            alert("Failed to delete student: " + (error as any).message);
        }
    };

    const startEdit = (student: UserProfile) => {
        setIsEditing(true);
        setEditId(student.uid);
        setFormData({
            email: student.email,
            name: student.name,
            vanId: student.vanId || '',
            role: 'student'
        });
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 p-6 overflow-hidden">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 tracking-tight">Student Management</h2>

            <div className="flex gap-6 h-full min-h-0">
                {/* List Section */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden flex flex-col">
                    <h3 className="font-semibold text-gray-700 mb-4 text-lg">All Students</h3>
                    <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                        {loading ? <p className="text-gray-400">Loading...</p> : (
                            <table className="w-full text-left border-separate border-spacing-y-2">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider sticky top-0 z-10">
                                    <tr>
                                        <th className="p-3 font-semibold rounded-l-lg">Name</th>
                                        <th className="p-3 font-semibold">ID</th>
                                        <th className="p-3 font-semibold">Assigned Van</th>
                                        <th className="p-3 font-semibold rounded-r-lg">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(student => (
                                        <tr key={student.uid} className="hover:bg-gray-50 transition-colors group">
                                            <td className="p-3 border-b border-gray-100 group-hover:border-transparent rounded-l-lg bg-white group-hover:bg-gray-50">{student.name}</td>
                                            <td className="p-3 border-b border-gray-100 group-hover:border-transparent bg-white group-hover:bg-gray-50 text-gray-600">{student.email}</td>
                                            <td className="p-3 border-b border-gray-100 group-hover:border-transparent bg-white group-hover:bg-gray-50">
                                                <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                                    vans.find(v => v.id === student.vanId) 
                                                    ? 'bg-blue-50 text-blue-600' 
                                                    : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {vans.find(v => v.id === student.vanId)?.vanNumber || 'Unassigned'}
                                                </span>
                                            </td>
                                            <td className="p-3 border-b border-gray-100 group-hover:border-transparent rounded-r-lg bg-white group-hover:bg-gray-50">
                                                <button 
                                                    onClick={() => startEdit(student)}
                                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm mr-3 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(student.uid)}
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
                    <h3 className="font-bold text-gray-800 mb-6 text-lg">{isEditing ? 'Edit Student' : 'Add New Student'}</h3>
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input 
                                className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                value={formData.name || ''}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="Enter student name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">ID</label>
                            <input 
                                className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
                                value={formData.email || ''}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                disabled={isEditing} 
                                placeholder="Enter ID"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Assigned Van</label>
                            <select 
                                className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                                value={formData.vanId || ''}
                                onChange={e => setFormData({...formData, vanId: e.target.value})}
                            >
                                <option value="">Select Van</option>
                                {vans.map(v => (
                                    <option key={v.id} value={v.id}>{v.vanNumber}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button 
                                onClick={handleSave}
                                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium transition-all shadow-sm active:scale-95"
                            >
                                {isEditing ? 'Update Student' : 'Add Student'}
                            </button>
                            {isEditing && (
                                <button 
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditId(null);
                                        setFormData({ email: '', name: '', role: 'student', vanId: '' });
                                    }}
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

export default StudentManager;
