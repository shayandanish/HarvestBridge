import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import NotificationInboxPage from './pages/NotificationInboxPage';
import MessagesPage from './pages/MessagesPage';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BrowseLandsPage from './pages/BrowseLandsPage';
import CreateFarmPage from './pages/CreateFarmPage';
import FarmDetailPage from './pages/FarmDetailPage';
import MarketplacePage from './pages/MarketplacePage';
import FarmPublicPage from './pages/FarmPublicPage';
import PlantPublicPage from './pages/PlantPublicPage';
import ComparisonPage from './pages/ComparisonPage';
import InvestorDashboard from './components/InvestorDashboard';
import InvestFlow from './pages/InvestFlow';
import MyInvestmentsPage from './pages/MyInvestmentsPage';
import BookingFlow from './pages/BookingFlow';
import MyBookingsPage from './pages/MyBookingsPage';
import InvestorHarvestDashboard from './pages/InvestorHarvestDashboard';
import FarmerAvailabilitySettings from './pages/farmer/FarmerAvailabilitySettings';
import FarmerBookingsDashboard from './pages/farmer/FarmerBookingsDashboard';
import FarmActivitiesManagementPage from './pages/farmer/FarmActivitiesManagementPage';
import QRCheckIn from './pages/farmer/QRCheckIn';
import FarmerHarvestManagement from './pages/farmer/FarmerHarvestManagement';
import FarmerProfilePage from './pages/farmer/FarmerProfilePage';
import EditFarmPage from './pages/farmer/EditFarmPage';
import FarmersDirectoryPage from './pages/FarmersDirectoryPage';
import FarmerPublicProfilePage from './pages/FarmerPublicProfilePage';
import HarvestReviewForm from './pages/HarvestReviewForm';
import LandLeasePage from './pages/LandLeasePage';
import LeasePaymentPage from './pages/LeasePaymentPage';
import InvestmentTrackingPage from './pages/InvestmentTrackingPage';
import HiringPaymentPage from './pages/HiringPaymentPage';
import FarmerEarningsPage from './pages/farmer/FarmerEarningsPage';
import FarmerPlantManagePage from './pages/FarmerPlantManagePage';
import FarmerFarmsDashboard from './pages/farmer/FarmerFarmsDashboard';

// Landowner Pages
import AddLandPage from './pages/landowner/AddLandPage';
import MyLandsPage from './pages/landowner/MyLandsPage';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import UserManagement from './pages/admin/UserManagement';
import PostManagement from './pages/admin/PostManagement';
import ApprovalsCenter from './pages/admin/ApprovalsCenter';
import DisputeCenter from './pages/admin/DisputeCenter';
import SettingsPanel from './pages/admin/SettingsPanel';
import ActivityLogs from './pages/admin/ActivityLogs';
import CampaignCenter from './pages/admin/CampaignCenter';
import InvestmentMonitoring from './pages/admin/InvestmentMonitoring';
import PaymentMonitoring from './pages/admin/PaymentMonitoring';
import TreeManagement from './pages/admin/TreeManagement';
import PlantationRequests from './pages/admin/PlantationRequests';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl text-gray-600">Loading...</div>
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <NotificationProvider>
                <div className="App">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />

                        {/* Marketplace Routes */}
                        <Route path="/marketplace" element={<MarketplacePage />} />
                        <Route
                            path="/marketplace/farms/:id"
                            element={<FarmPublicPage />}
                        />
                        <Route path="/marketplace/plants/:id" element={<PlantPublicPage />} />
                        <Route path="/marketplace/compare" element={<ComparisonPage />} />
                        {/* Public Farmer Directory */}
                        <Route path="/farmers" element={<FarmersDirectoryPage />} />
                        <Route path="/farmers/:id" element={<FarmerPublicProfilePage />} />
                        <Route
                            path="/farms/:farmId/book"
                            element={
                                <ProtectedRoute>
                                    <BookingFlow />
                                </ProtectedRoute>
                            }
                        />

                        {/* Protected Routes */}
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <DashboardPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/investor/dashboard"
                            element={
                                <ProtectedRoute>
                                    <InvestorDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/investor/investments"
                            element={
                                <ProtectedRoute>
                                    <MyInvestmentsPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/investor/investments/:plantId/track"
                            element={
                                <ProtectedRoute>
                                    <InvestmentTrackingPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/investor/pay-farmer"
                            element={
                                <ProtectedRoute>
                                    <HiringPaymentPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/investor/checkout/lease/:farmId"
                            element={
                                <ProtectedRoute>
                                    <LeasePaymentPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/investor/lease/:landId"
                            element={
                                <ProtectedRoute>
                                    <LandLeasePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/invest/:plantId"
                            element={
                                <ProtectedRoute>
                                    <InvestFlow />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/lands/browse"
                            element={
                                <ProtectedRoute>
                                    <BrowseLandsPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/farms/create"
                            element={
                                <ProtectedRoute>
                                    <CreateFarmPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/farms/:farmId"
                            element={
                                <ProtectedRoute>
                                    <FarmDetailPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/my-bookings"
                            element={
                                <ProtectedRoute>
                                    <MyBookingsPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/investor/harvests"
                            element={
                                <ProtectedRoute>
                                    <InvestorHarvestDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/harvests/:harvestId/review"
                            element={
                                <ProtectedRoute>
                                    <HarvestReviewForm />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/farmer/availability"
                            element={
                                <ProtectedRoute>
                                    <FarmerAvailabilitySettings />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/farmer/bookings"
                            element={
                                <ProtectedRoute>
                                    <FarmerBookingsDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/farmer/activities"
                            element={
                                <ProtectedRoute>
                                    <FarmActivitiesManagementPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/farmer/check-in"
                            element={
                                <ProtectedRoute>
                                    <QRCheckIn />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/farmer/harvests"
                            element={
                                <ProtectedRoute>
                                    <FarmerHarvestManagement />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/farmer/profile"
                            element={
                                <ProtectedRoute>
                                    <FarmerProfilePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/farmer/earnings"
                            element={
                                <ProtectedRoute>
                                    <FarmerEarningsPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/farms/:farmId/edit"
                            element={
                                <ProtectedRoute>
                                    <EditFarmPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/farmer/plants/:plantId/manage"
                            element={
                                <ProtectedRoute>
                                    <FarmerPlantManagePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/farmer/managed-farms"
                            element={
                                <ProtectedRoute>
                                    <FarmerFarmsDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/farmer/manage/plant/:plantId"
                            element={
                                <ProtectedRoute>
                                    <FarmerPlantManagePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/farmer/farm/:farmId/manage"
                            element={
                                <ProtectedRoute>
                                    <FarmerPlantManagePage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Notification & Message Routes */}
                        <Route
                            path="/notifications"
                            element={
                                <ProtectedRoute>
                                    <NotificationInboxPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/messages"
                            element={
                                <ProtectedRoute>
                                    <MessagesPage />
                                </ProtectedRoute>
                            }
                        />
                        {/* Landowner Routes */}
                        <Route
                            path="/landowner/add-land"
                            element={
                                <ProtectedRoute>
                                    <AddLandPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/landowner/my-lands"
                            element={
                                <ProtectedRoute>
                                    <MyLandsPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Admin Routes */}
                        <Route path="/admin/login" element={<AdminLogin />} />
                        <Route path="/admin" element={<AdminLayout />}>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<AdminOverview />} />
                            <Route path="users" element={<UserManagement />} />
                            <Route path="posts" element={<PostManagement />} />
                            <Route path="approvals" element={<ApprovalsCenter />} />
                            <Route path="disputes" element={<DisputeCenter />} />
                            <Route path="investments" element={<InvestmentMonitoring />} />
                            <Route path="payments" element={<PaymentMonitoring />} />
                            <Route path="campaigns" element={<CampaignCenter />} />
                            <Route path="settings" element={<SettingsPanel />} />
                            <Route path="logs" element={<ActivityLogs />} />
                            <Route path="trees" element={<TreeManagement />} />
                            <Route path="plantations" element={<PlantationRequests />} />
                        </Route>
                    </Routes>
                </div>
                </NotificationProvider>
            </Router>
        </AuthProvider >
    );
}

export default App;
