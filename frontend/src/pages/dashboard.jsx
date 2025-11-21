import { useState, useEffect } from "react";
import {
  FaUsers,
  FaUserCircle,
  FaSignOutAlt,
  FaTachometerAlt,
  FaBars,
  FaShieldAlt,
  FaBan,
  FaExclamationTriangle,
  FaChartLine,
  FaBell,
} from "react-icons/fa";
import { useUser } from "@clerk/clerk-react";
import toast, { Toaster } from "react-hot-toast";

// Import des pages
import UsersPage from "./UsersPage";
import IPsPage from "./IPsPage";
import AutomaticBlocksPage from "./AutomaticBlocksPage";
import AlertsPage from "./AlertsPage";
import ReportsPage from "./ReportsPage";
import AuthMethodsDashboard from "./AuthMethodsDashboard";

export default function Dashboard() {
  const { user } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState("overview");

  // --- Overview state ---
  const [allUsers, setAllUsers] = useState([]);
  const [allIps, setAllIps] = useState([]);
  const [allReports, setAllReports] = useState([]);

  // --- Security Alerts ---
  const [securityAlerts, setSecurityAlerts] = useState({
    suspiciousIPs: [],
    recentBlocks: [],
    criticalReports: [],
    totalAlerts: 0
  });

  // Fetch security alerts every 30 seconds
  useEffect(() => {
    const fetchAlerts = () => {
      fetch("http://localhost:3000/api/security/alerts")
        .then(res => res.json())
        .then(data => {
          setSecurityAlerts(data);
          
          if (data.totalAlerts > 0) {
            if (data.suspiciousIPs.length > 0) {
              toast.error(`⚠️ ${data.suspiciousIPs.length} suspicious IP(s) detected!`, {
                duration: 6000,
              });
            }
            if (data.criticalReports.length > 0) {
              toast.error(`🚨 ${data.criticalReports.length} critical report(s) need attention!`, {
                duration: 6000,
              });
            }
          }
        })
        .catch(err => console.error("Error fetching alerts:", err));
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch ALL data for overview statistics
  useEffect(() => {
    fetch("http://localhost:3000/api/auth/usersTable?page=1&limit=1000")
      .then(res => res.json())
      .then(data => setAllUsers(data.users || []))
      .catch(err => console.error("Error fetching all users:", err));

    fetch("http://localhost:3000/api/ip/ipsTable?page=1&limit=1000")
      .then(res => res.json())
      .then(data => setAllIps(data.ips || []))
      .catch(err => console.error("Error fetching all IPs:", err));

    fetch("http://localhost:3000/api/reports/all")
      .then(res => res.json())
      .then(data => setAllReports(data.reports || []))
      .catch(err => console.error("Error fetching all reports:", err));
  }, []);

  const totalUsers = allUsers.length;
  const activeUsers = allUsers.filter(u => u.status).length;
  const blockedIPs = allIps.filter(ip => !ip.status).length;
  const pendingReports = allReports.filter(r => r.status === "pending").length;

  return (
    <>
      <Toaster 
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <div className="drawer lg:drawer-open min-h-screen bg-base-200 text-base-content">
        <input
          id="my-drawer"
          type="checkbox"
          className="drawer-toggle"
          checked={isSidebarOpen}
          onChange={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        
        <div className="drawer-content flex flex-col">
          <div className="flex items-center justify-between p-4 bg-base-100 border-b border-base-300 lg:hidden">
            <label htmlFor="my-drawer" className="btn btn-ghost btn-circle">
              <FaBars />
            </label>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>

          <main className="p-6 flex-1 space-y-6">
            {/* OVERVIEW PAGE */}
            {activePage === "overview" && (
              <>
                <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                  <div className="stat bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl rounded-2xl">
                    <div className="stat-figure text-white opacity-80">
                      <FaUsers className="text-4xl" />
                    </div>
                    <div className="stat-title text-blue-100">Total Users</div>
                    <div className="stat-value">{totalUsers}</div>
                    <div className="stat-desc text-blue-100">Registered accounts</div>
                  </div>

                  <div className="stat bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl rounded-2xl">
                    <div className="stat-figure text-white opacity-80">
                      <FaUserCircle className="text-4xl" />
                    </div>
                    <div className="stat-title text-green-100">Active Users</div>
                    <div className="stat-value">{activeUsers}</div>
                    <div className="stat-desc text-green-100">Currently active</div>
                  </div>

                  <div className="stat bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xl rounded-2xl">
                    <div className="stat-figure text-white opacity-80">
                      <FaBan className="text-4xl" />
                    </div>
                    <div className="stat-title text-red-100">Blocked IPs</div>
                    <div className="stat-value">{blockedIPs}</div>
                    <div className="stat-desc text-red-100">Security blocks</div>
                  </div>

                  <div className="stat bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl rounded-2xl">
                    <div className="stat-figure text-white opacity-80">
                      <FaExclamationTriangle className="text-4xl" />
                    </div>
                    <div className="stat-title text-orange-100">Pending Reports</div>
                    <div className="stat-value">{pendingReports}</div>
                    <div className="stat-desc text-orange-100">Need attention</div>
                  </div>
                </div>

                {securityAlerts.totalAlerts > 0 && (
                  <div className="alert alert-error shadow-lg">
                    <FaBell className="text-2xl" />
                    <div>
                      <h3 className="font-bold">Security Alerts</h3>
                      <div className="text-xs">
                        {securityAlerts.suspiciousIPs.length > 0 && (
                          <p>• {securityAlerts.suspiciousIPs.length} suspicious IP(s) detected</p>
                        )}
                        {securityAlerts.recentBlocks.length > 0 && (
                          <p>• {securityAlerts.recentBlocks.length} recent IP block(s)</p>
                        )}
                        {securityAlerts.criticalReports.length > 0 && (
                          <p>• {securityAlerts.criticalReports.length} critical report(s)</p>
                        )}
                      </div>
                    </div>
                    <button 
                      className="btn btn-sm"
                      onClick={() => setActivePage("alerts")}
                    >
                      View Details
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                  <div className="card bg-base-100 shadow-xl p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <FaChartLine className="text-primary" />
                      User Activity
                    </h2>
                    <div className="h-64 flex items-center justify-center bg-base-200 rounded-lg">
                      <p className="text-base-content/50">Activity chart visualization</p>
                    </div>
                  </div>

                  <div className="card bg-base-100 shadow-xl p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <FaShieldAlt className="text-error" />
                      Security Overview
                    </h2>
                    <div className="h-64 flex items-center justify-center bg-base-200 rounded-lg">
                      <p className="text-base-content/50">Security metrics visualization</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* AUTRES PAGES */}
            {activePage === "users" && <UsersPage />}
            {activePage === "ips" && <IPsPage />}
            {activePage === "automatic" && <AutomaticBlocksPage />}
            {activePage === "alerts" && <AlertsPage securityAlerts={securityAlerts} />}
            {activePage === "reports" && <ReportsPage />}
            {activePage === "auth-methods" && <AuthMethodsDashboard />}
          </main>
        </div>

        {/* SIDEBAR */}
        <div className="drawer-side">
          <label htmlFor="my-drawer" className="drawer-overlay"></label>
          <aside className="bg-base-100 w-64 h-full shadow-xl flex flex-col justify-between">
            <div>
              <div className="p-4 flex items-center gap-2 border-b border-base-300">
                <FaTachometerAlt className="text-primary text-xl"/>
                <span className="font-bold text-lg">Admin Panel</span>
              </div>
              <ul className="menu p-4 space-y-2">
                <li>
                  <button 
                    className={`w-full text-left ${activePage === "overview" ? "active bg-primary text-white" : ""}`}
                    onClick={() => setActivePage("overview")}
                  >
                    <FaTachometerAlt /> Overview
                  </button>
                </li>
                <li>
                  <button 
                    className={`w-full text-left ${activePage === "users" ? "active bg-primary text-white" : ""}`}
                    onClick={() => setActivePage("users")}
                  >
                    <FaUsers /> Users
                  </button>
                </li>
                <li>
                  <button 
                    className={`w-full text-left ${activePage === "ips" ? "active bg-primary text-white" : ""}`}
                    onClick={() => setActivePage("ips")}
                  >
                    <FaBan /> Blocked IPs
                  </button>
                </li>
                <li>
                  <button 
                    className={`w-full text-left ${activePage === "automatic" ? "active bg-primary text-white" : ""}`}
                    onClick={() => setActivePage("automatic")}
                  >
                    <FaShieldAlt /> Automatic Blocks
                  </button>
                </li>
                <li>
                  <button 
                    className={`w-full text-left ${activePage === "alerts" ? "active bg-primary text-white" : ""}`}
                    onClick={() => setActivePage("alerts")}
                  >
                    <div className="flex items-center gap-2">
                      <FaBell />
                      {securityAlerts.totalAlerts > 0 && (
                        <span className="badge badge-error badge-sm">
                          {securityAlerts.totalAlerts}
                        </span>
                      )}
                      <span>Alerts</span>
                    </div>
                  </button>
                </li>
                <li>
                  <button 
                    className={`w-full text-left ${activePage === "reports" ? "active bg-primary text-white" : ""}`}
                    onClick={() => setActivePage("reports")}
                  >
                    <FaExclamationTriangle /> Reports
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full text-left ${activePage === "auth-methods" ? "active bg-primary text-white" : ""}`}
                    onClick={() => setActivePage("auth-methods")}
                  >
                    <FaShieldAlt /> Auth Methods
                  </button>
                </li>
              </ul>
            </div>
            <div className="p-4 border-t border-base-300 space-y-3">
              <div className="flex items-center gap-2">
                <img src={user?.imageUrl} alt="Admin" className="rounded-full w-8 h-8"/>
                <span className="text-sm font-medium">{user?.fullName || "Admin"}</span>
              </div>
              <button className="btn btn-outline btn-error btn-sm w-full">
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}