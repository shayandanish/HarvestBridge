import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/admin/login');
    };

    return (
        <aside className="admin-sidebar">
            <div className="sidebar-header">
                <h2>AgroControl</h2>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    <h3>Main</h3>
                    <a href="/" className="nav-item">
                        <i className="fas fa-home"></i>
                        <span>Back to Home</span>
                    </a>
                    <NavLink to="/admin/dashboard" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <i className="fas fa-th-large"></i>
                        <span>Dashboard</span>
                    </NavLink>
                </div>

                <div className="nav-section">
                    <h3>Management</h3>
                    <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <i className="fas fa-users"></i>
                        <span>User Management</span>
                    </NavLink>
                    <NavLink to="/admin/investments" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <i className="fas fa-seedling"></i>
                        <span>Investments</span>
                    </NavLink>
                    <NavLink to="/admin/posts" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <i className="fas fa-th-list"></i>
                        <span>Post Management</span>
                    </NavLink>
                    <NavLink to="/admin/payments" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <i className="fas fa-credit-card"></i>
                        <span>Payments</span>
                    </NavLink>
                    <NavLink to="/admin/trees" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <i className="fas fa-tree"></i>
                        <span>Trees Management</span>
                    </NavLink>
                    <NavLink to="/admin/plantations" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <i className="fas fa-leaf"></i>
                        <span>Plantation Requests</span>
                    </NavLink>
                </div>

                <div className="nav-section">
                    <h3>Communication</h3>
                    <NavLink to="/admin/campaigns" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <i className="fas fa-envelope"></i>
                        <span>Email Campaigns</span>
                    </NavLink>
                </div>

                <div className="nav-section">
                    <h3>System</h3>
                    <NavLink to="/admin/logs" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <i className="fas fa-history"></i>
                        <span>Activity Logs</span>
                    </NavLink>
                    <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <i className="fas fa-cog"></i>
                        <span>Settings</span>
                    </NavLink>
                </div>
            </nav>

            <div className="sidebar-footer">
                <button onClick={handleLogout} className="logout-btn">
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Log Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
