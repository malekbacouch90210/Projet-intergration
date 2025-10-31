import { useState, useEffect } from "react";
import {
  FaUsers,
  FaUserCircle,
  FaSignOutAlt,
  FaTachometerAlt,
  FaBars,
  FaFileExport,
  FaFileImport,
  FaShieldAlt,
  FaBan,
  FaExclamationTriangle,
  FaChartLine,
  FaComments,
  FaBell,
} from "react-icons/fa";
import { useUser } from "@clerk/clerk-react";
import toast, { Toaster } from "react-hot-toast";

export default function Dashboard() {
  const { user } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState("overview");

  // --- Users state ---
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [suspendedReason, setSuspendedReason] = useState({});
  const [suspendedUntil, setSuspendedUntil] = useState({});
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);

  // --- IPs state ---
  const [ips, setIps] = useState([]);
  const [allIps, setAllIps] = useState([]);
  const [ipPage, setIpPage] = useState(1);
  const [ipTotalPages, setIpTotalPages] = useState(1);

  // --- Automatic blocks ---
  const [loginAttempts, setLoginAttempts] = useState([]);

  // --- Reports ---
  const [reports, setReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [replies, setReplies] = useState({});
  const [selectedReplies, setSelectedReplies] = useState(null);

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

  // Fetch data based on active page
  useEffect(() => {
    if (activePage === "users") {
      fetch(`http://localhost:3000/api/auth/usersTable?page=${userPage}`)
        .then(res => res.json())
        .then(data => {
          setUsers(data.users || []);
          setUserTotalPages(data.totalPages || 1);
        })
        .catch(err => console.error("Error fetching users:", err));
    }

    if (activePage === "ips") {
      fetch(`http://localhost:3000/api/ip/ipsTable?page=${ipPage}`)
        .then(res => res.json())
        .then(data => {
          setIps(data.ips || []);
          setIpTotalPages(data.totalPages || 1);
        })
        .catch(err => console.error("Error fetching IPs:", err));
    }

    if (activePage === "automatic") {
      fetch("http://localhost:3000/api/security/login/attempts")
        .then(res => res.json())
        .then(data => {
          setLoginAttempts(Array.isArray(data) ? data : []);
        })
        .catch(err => console.error("Error fetching login attempts:", err));
    }

    if (activePage === "reports") {
      fetch("http://localhost:3000/api/reports/all")
        .then(res => res.json())
        .then(data => {
          const reportList = data.reports || [];
          setReports(reportList);
          reportList.forEach(report => {
            fetch(`http://localhost:3000/api/replies/${report.id}/replies`)
              .then(res => res.json())
              .then(r => setReplies(prev => ({ ...prev, [report.id]: r.replies || [] })))
              .catch(err => console.error("Error fetching replies:", err));
          });
        })
        .catch(err => console.error("Error fetching reports:", err));
    }
  }, [activePage, userPage, ipPage]);

  // Handlers
  const handleSuspendChange = (id, field, value) => {
    if (field === "reason") setSuspendedReason(prev => ({ ...prev, [id]: value }));
    if (field === "until") setSuspendedUntil(prev => ({ ...prev, [id]: value }));
  };

  const handleStatusChange = (id, newStatus) => {
    fetch(`http://localhost:3000/api/auth/updateStatus/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
      .then(() => {
        setUsers(prev => prev.map(u => (u.id === id ? { ...u, status: newStatus } : u)));
        setAllUsers(prev => prev.map(u => (u.id === id ? { ...u, status: newStatus } : u)));
        toast.success(`✅ User status updated to ${newStatus ? 'Active' : 'Inactive'}!`);
      })
      .catch(err => {
        console.error("Update status error:", err);
        toast.error("❌ Failed to update user status!");
      });
  };

  const handleResetPassword = (id) => {
    const loadingToast = toast.loading("Resetting password...");
    fetch(`http://localhost:3000/api/auth/usersTable/${id}/reset_password`, {
      method: "PATCH",
    })
      .then(res => res.json())
      .then(data => {
        toast.success("✅ Password reset initiated successfully!", { id: loadingToast });
        console.log("Reset token:", data.resetToken);
      })
      .catch(err => {
        console.error("Reset password error:", err);
        toast.error("❌ Failed to reset password!", { id: loadingToast });
      });
  };

  const saveSuspension = (id) => {
    const loadingToast = toast.loading("Updating suspension...");
    fetch(`http://localhost:3000/api/auth/suspend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: id,
        duration_days: calculateDaysDifference(suspendedUntil[id]),
        reason: suspendedReason[id] || "Suspicious activity",
      }),
    })
      .then(() => {
        toast.success("✅ User suspension updated successfully!", { id: loadingToast });
        fetch(`http://localhost:3000/api/auth/usersTable?page=${userPage}`)
          .then(res => res.json())
          .then(data => setUsers(data.users || []));
      })
      .catch(err => {
        console.error(err);
        toast.error("❌ Failed to update suspension!", { id: loadingToast });
      });
  };

  const calculateDaysDifference = (dateString) => {
    if (!dateString) return 1;
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const handleExportIPs = () => {
    toast.success("📥 Downloading CSV file...");
    window.location.href = "http://localhost:3000/api/ip/export";
  };

  const handleImportIPs = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);
    
    const loadingToast = toast.loading("📤 Importing IPs...");
    
    fetch("http://localhost:3000/api/ip/import", {
      method: "POST",
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        toast.success(`✅ ${data.message}`, { id: loadingToast });
        fetch(`http://localhost:3000/api/ip/ipsTable?page=${ipPage}`)
          .then(res => res.json())
          .then(data => setIps(data.ips || []));
      })
      .catch(err => {
        console.error("Error importing IPs:", err);
        toast.error("❌ Failed to import IPs!", { id: loadingToast });
      });
  };

  const handleUpdateReportStatus = (id, newStatus) => {
    fetch(`http://localhost:3000/api/reports/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
      .then(() => {
        setReports(prev => prev.map(r => (r.id === id ? { ...r, status: newStatus } : r)));
        toast.success(`✅ Report status updated to ${newStatus}!`);
      })
      .catch(err => {
        console.error("Update report status error:", err);
        toast.error("❌ Failed to update report status!");
      });
  };

  const handleUpdateReportCriticity = (id, newCriticity) => {
    fetch(`http://localhost:3000/api/reports/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ criticity: newCriticity }),
    })
      .then(() => {
        setReports(prev => prev.map(r => (r.id === id ? { ...r, criticity: newCriticity } : r)));
        toast.success(`✅ Report criticity updated to ${newCriticity}!`);
      })
      .catch(err => {
        console.error("Update report criticity error:", err);
        toast.error("❌ Failed to update report criticity!");
      });
  };

  const openRepliesModal = (reportId) => {
    setSelectedReplies(replies[reportId] || []);
    document.getElementById("replies_modal").showModal();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return dateString.slice(0, 10);
  };

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

            {activePage === "users" && (
              <div className="space-y-4">
                <h1 className="text-3xl font-bold">User Management</h1>
                <div className="card bg-base-100 shadow-xl overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Suspended Until</th>
                        <th>Reason</th>
                        <th>Actions</th>
                        <th>Status</th>
                        <th>Reset Password</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td>
                            <input
                              type="date"
                              value={suspendedUntil[u.id] || formatDate(u.suspended_until) || ""}
                              onChange={e => handleSuspendChange(u.id, "until", e.target.value)}
                              className="input input-sm input-bordered w-full"
                            />
                          </td>
                          <td>
                            <select
                              value={suspendedReason[u.id] || u.suspension_reason || ""}
                              onChange={e => handleSuspendChange(u.id, "reason", e.target.value)}
                              className="select select-sm select-bordered w-full"
                            >
                              <option value="">Select reason</option>
                              <option value="Suspicious activity">Suspicious activity</option>
                              <option value="Violation of rules">Violation of rules</option>
                              <option value="Security breach risk">Security breach risk</option>
                            </select>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => saveSuspension(u.id)}
                            >
                              Save
                            </button>
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              className="toggle toggle-success"
                              checked={u.status}
                              onChange={(e) => handleStatusChange(u.id, e.target.checked)}
                            />
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-error text-white"
                              onClick={() => handleResetPassword(u.id)}
                            >
                              Reset
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-center gap-2 mt-4">
                  <button 
                    className="btn btn-sm" 
                    disabled={userPage === 1}
                    onClick={() => setUserPage(p => p - 1)}
                  >
                    Previous
                  </button>
                  <span className="btn btn-sm btn-ghost">Page {userPage} of {userTotalPages}</span>
                  <button 
                    className="btn btn-sm"
                    disabled={userPage === userTotalPages}
                    onClick={() => setUserPage(p => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {activePage === "ips" && (
              <div className="space-y-4">
                <h1 className="text-3xl font-bold">Blocked IPs Management</h1>
                <div className="flex gap-2">
                  <button className="btn btn-primary" onClick={handleExportIPs}>
                    <FaFileExport className="mr-2"/> Export CSV
                  </button>
                  <label className="btn btn-secondary cursor-pointer">
                    <FaFileImport className="mr-2"/> Import CSV
                    <input type="file" className="hidden" accept=".csv" onChange={handleImportIPs}/>
                  </label>
                </div>
                <div className="card bg-base-100 shadow-xl overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>IP Address</th>
                        <th>Status</th>
                        <th>Reason</th>
                        <th>Date Added</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ips.map(ip => (
                        <tr key={ip.ip_address}>
                          <td className="font-mono">{ip.ip_address}</td>
                          <td>
                            <span className={`badge ${ip.status ? "badge-success" : "badge-error"}`}>
                              {ip.status ? "Allowed" : "Blocked"}
                            </span>
                          </td>
                          <td>{ip.reason || "N/A"}</td>
                          <td>{formatDate(ip.date_added)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-center gap-2 mt-4">
                  <button 
                    className="btn btn-sm" 
                    disabled={ipPage === 1}
                    onClick={() => setIpPage(p => p - 1)}
                  >
                    Previous
                  </button>
                  <span className="btn btn-sm btn-ghost">Page {ipPage} of {ipTotalPages}</span>
                  <button 
                    className="btn btn-sm"
                    disabled={ipPage === ipTotalPages}
                    onClick={() => setIpPage(p => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {activePage === "automatic" && (
              <div className="space-y-4">
                <h1 className="text-3xl font-bold">Automatic Blocks - Login Attempts</h1>
                <div className="card bg-base-100 shadow-xl overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>IP Address</th>
                        <th>Username</th>
                        <th>Success</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loginAttempts.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center py-10">
                            No login attempts found.
                          </td>
                        </tr>
                      ) : (
                        loginAttempts.map((a, index) => (
                          <tr key={a.attempt_id || index}>
                            <td className="font-mono">{a.ip_address}</td>
                            <td>{a.username || "N/A"}</td>
                            <td>
                              <span className={`badge ${a.success ? "badge-success" : "badge-error"}`}>
                                {a.success ? "Yes" : "No"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activePage === "alerts" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Security Alerts</h1>

                {securityAlerts.suspiciousIPs.length > 0 && (
                  <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                      <h2 className="card-title text-error">
                        <FaExclamationTriangle /> Suspicious IP Addresses
                      </h2>
                      <div className="overflow-x-auto">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>IP Address</th>
                              <th>Failed Attempts</th>
                              <th>Last Attempt</th>
                            </tr>
                          </thead>
                          <tbody>
                            {securityAlerts.suspiciousIPs.map((ip, index) => (
                              <tr key={index}>
                                <td className="font-mono">{ip.ip_address}</td>
                                <td>
                                  <span className="badge badge-error">
                                    {ip.failed_attempts}
                                  </span>
                                </td>
                                <td>{formatDate(ip.last_attempt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {securityAlerts.recentBlocks.length > 0 && (
                  <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                      <h2 className="card-title text-warning">
                        <FaBan /> Recent IP Blocks
                      </h2>
                      <div className="overflow-x-auto">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>IP Address</th>
                              <th>Reason</th>
                              <th>Date Blocked</th>
                            </tr>
                          </thead>
                          <tbody>
                            {securityAlerts.recentBlocks.map((block, index) => (
                              <tr key={index}>
                                <td className="font-mono">{block.ip_address}</td>
                                <td>{block.reason}</td>
                                <td>{formatDate(block.date_added)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {securityAlerts.criticalReports.length > 0 && (
                  <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                      <h2 className="card-title text-error">
                        <FaExclamationTriangle /> Critical Reports
                      </h2>
                      <div className="overflow-x-auto">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Subject</th>
                              <th>Criticity</th>
                              <th>Status</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {securityAlerts.criticalReports.map((report) => (
                              <tr key={report.id}>
                                <td>{report.subject}</td>
                                <td>
                                  <span className={`badge ${
                                    report.criticity === 'urgent' ? 'badge-error' : 'badge-warning'
                                  }`}>
                                    {report.criticity}
                                  </span>
                                </td>
                                <td>{report.status}</td>
                                <td>{formatDate(report.date_created)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {securityAlerts.totalAlerts === 0 && (
                  <div className="alert alert-success">
                    <FaShieldAlt className="text-2xl" />
                    <span>No security alerts at this time. System is secure! 🎉</span>
                  </div>
                )}
              </div>
            )}

            {activePage === "reports" && (
              <div className="space-y-4">
                <h1 className="text-3xl font-bold">User Reports</h1>
                <div className="card bg-base-100 shadow-xl overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th>Subject</th>
                        <th>Description</th>
                        <th>Criticity</th>
                        <th>Status</th>
                        <th>Replies</th>
                        <th>Date Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map(r => {
                        const userName = r.reporter_name || "Unknown";
                        return (
                          <tr key={r.id}>
                            <td>{userName}</td>
                            <td>{r.subject}</td>
                            <td className="max-w-xs truncate">{r.description}</td>
                            <td>
                              <select
                                value={r.criticity || "low"}
                                onChange={(e) => handleUpdateReportCriticity(r.id, e.target.value)}
                                className={`select select-sm select-bordered font-semibold text-white ${
                                  r.criticity === "urgent" ? "bg-black" :
                                  r.criticity === "high" ? "bg-red-500" :
                                  r.criticity === "medium" ? "bg-orange-500" :
                                  "bg-yellow-400 text-black"
                                }`}
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                              </select>
                            </td>
                            <td>
                              <select
                                value={r.status || "pending"}
                                onChange={(e) => handleUpdateReportStatus(r.id, e.target.value)}
                                className={`select select-sm select-bordered font-semibold text-white ${
                                  r.status === "pending" ? "bg-red-500" :
                                  r.status === "in_progress" ? "bg-orange-500" :
                                  "bg-green-500"
                                }`}
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                              </select>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-info text-white"
                                onClick={() => openRepliesModal(r.id)}
                              >
                                <FaComments className="mr-1" />
                                {replies[r.id]?.length || 0}
                              </button>
                            </td>
                            <td>{formatDate(r.date_created)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>

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

        <dialog id="replies_modal" className="modal">
          <div className="modal-box w-11/12 max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Report Replies</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedReplies && selectedReplies.length > 0 ? (
                selectedReplies.map(rep => (
                  <div key={rep.id} className="card bg-base-200 p-4">
                    <p className="mt-2">{rep.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDate(rep.date_created)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No replies yet</p>
              )}
            </div>
            <div className="modal-action">
              <button 
                className="btn" 
                onClick={() => document.getElementById("replies_modal").close()}
              >
                Close
              </button>
            </div>
          </div>
        </dialog>
      </div>
    </>
  );
}