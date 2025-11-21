import { useState, useEffect } from "react";
import {
  FaShieldAlt,
  FaUsers,
  FaKey,
  FaMobileAlt,
  FaEnvelope,
  FaFingerprint,
  FaUsb,
  FaChartBar,
  FaBullhorn,
  FaExclamationTriangle,
  FaHistory,
  FaCog,
  FaLock,
  FaCheckCircle,
  FaTimesCircle
} from "react-icons/fa";

export default function AuthMethodsDashboard() {
  const [activePage, setActivePage] = useState("overview");
  const [loading, setLoading] = useState(false);

  // USADMIN-AUTH-001: Users & Methods
  const [usersWithMethods, setUsersWithMethods] = useState([]);
  const [statistics, setStatistics] = useState({
    methodStats: [],
    obsoleteMethods: [],
    usersWithoutActiveMethods: [],
    summary: {}
  });

  // USADMIN-AUTH-002: Migration Campaigns
  const [campaigns, setCampaigns] = useState([]);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    target_method: "",
    notification_message: "",
    deadline: "",
    target_users: "all"
  });

  // USADMIN-AUTH-003: Available Methods
  const [availableMethods, setAvailableMethods] = useState([]);

  // USADMIN-AUTH-004: Security Rules
  const [securityRules, setSecurityRules] = useState([]);
  const [newRule, setNewRule] = useState({
    rule_name: "",
    target_role: "",
    required_methods: [],
    min_methods_count: 1,
    enforcement_date: ""
  });

  // USADMIN-AUTH-005: Audit Log
  const [auditLogs, setAuditLogs] = useState([]);
  const [suspiciousChanges, setSuspiciousChanges] = useState({
    rapidChanges: [],
    unauthorizedDisables: [],
    alertCount: 0
  });

  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Method icons mapping
  const methodIcons = {
    password: <FaKey className="text-blue-500" />,
    totp: <FaMobileAlt className="text-green-500" />,
    sms: <FaMobileAlt className="text-orange-500" />,
    email: <FaEnvelope className="text-purple-500" />,
    biometric: <FaFingerprint className="text-pink-500" />,
    hardware_key: <FaUsb className="text-gray-500" />
  };

  // ==================== FETCH DATA ====================

// USADMIN-AUTH-001
useEffect(() => {
  if (activePage === "overview" || activePage === "users-methods") {
    fetch("http://localhost:3000/api/auth-methods/users")
      .then(res => res.json())
      .then(data => setUsersWithMethods(data.users || []))
      .catch(() => console.error("Failed to fetch users with methods"));

    fetch("http://localhost:3000/api/auth-methods/statistics")
      .then(res => res.json())
      .then(data => setStatistics(data))
      .catch(() => console.error("Failed to fetch auth statistics"));
  }
}, [activePage]);

// USADMIN-AUTH-002
useEffect(() => {
  if (activePage === "migration") {
    fetch("http://localhost:3000/api/auth-methods/migration-campaigns")
      .then(res => res.json())
      .then(data => setCampaigns(data.campaigns || []))
      .catch(() => console.error("Failed to fetch migration campaigns"));
  }
}, [activePage]);

// USADMIN-AUTH-003
useEffect(() => {
  if (activePage === "configuration") {
    fetch("http://localhost:3000/api/auth-methods/available")
      .then(res => res.json())
      .then(data => setAvailableMethods(data.methods || []))
      .catch(() => console.error("Failed to fetch available methods"));
  }
}, [activePage]);

// USADMIN-AUTH-004
useEffect(() => {
  if (activePage === "security-rules") {
    fetch("http://localhost:3000/api/auth-methods/security-rules")
      .then(res => res.json())
      .then(data => setSecurityRules(data.rules || []))
      .catch(() => console.error("Failed to fetch security rules"));
  }
}, [activePage]);

// USADMIN-AUTH-005
useEffect(() => {
  if (activePage === "audit") {
    fetch("http://localhost:3000/api/auth-methods/audit-log")
      .then(res => res.json())
      .then(data => setAuditLogs(data.logs || []))
      .catch(() => console.error("Failed to fetch audit log"));

    fetch("http://localhost:3000/api/auth-methods/suspicious-changes")
      .then(res => res.json())
      .then(data => setSuspiciousChanges(data))
      .catch(() => console.error("Failed to fetch suspicious changes"));
  }
}, [activePage]);

// ==================== HANDLERS ====================

// USADMIN-AUTH-002: Create campaign
const handleCreateCampaign = () => {
  if (!newCampaign.name || !newCampaign.target_method) {
    showToast("Name and target method required!", "error");
    return;
  }

  setLoading(true);
  fetch("http://localhost:3000/api/auth-methods/migration-campaign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newCampaign)
  })
    .then(res => res.json())
    .then(() => {
      showToast("Campaign created successfully!");
      setNewCampaign({
        name: "",
        target_method: "",
        notification_message: "",
        deadline: "",
        target_users: "all"
      });
      document.getElementById("campaign_modal")?.close();

      // Refresh list
      fetch("http://localhost:3000/api/auth-methods/migration-campaigns")
        .then(res => res.json())
        .then(data => setCampaigns(data.campaigns || []));
    })
    .catch(() => showToast("Failed to create campaign", "error"))
    .finally(() => setLoading(false));
};

// USADMIN-AUTH-003: Toggle method
const handleToggleMethod = (methodName, enabled) => {
  fetch(`http://localhost:3000/api/auth-methods/available/${methodName}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled })
  })
    .then(() => {
      showToast(`${methodName} ${enabled ? "enabled" : "disabled"}!`);
      fetch("http://localhost:3000/api/auth-methods/available")
        .then(res => res.json())
        .then(data => setAvailableMethods(data.methods || []));
    })
    .catch(() => showToast("Failed to update method", "error"));
};

// USADMIN-AUTH-004: Create security rule
const handleCreateSecurityRule = () => {
  if (!newRule.rule_name) {
    showToast("Rule name required!", "error");
    return;
  }

  setLoading(true);
  fetch("http://localhost:3000/api/auth-methods/security-rules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newRule)
  })
    .then(() => {
      showToast("Security rule created!");
      setNewRule({
        rule_name: "",
        target_role: "",
        required_methods: [],
        min_methods_count: 1,
        enforcement_date: ""
      });
      document.getElementById("rule_modal")?.close();

      // Refresh list
      fetch("http://localhost:3000/api/auth-methods/security-rules")
        .then(res => res.json())
        .then(data => setSecurityRules(data.rules || []));
    })
    .catch(() => showToast("Failed to create rule", "error"))
    .finally(() => setLoading(false));
};
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};
  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 alert ${
          toast.type === "error" ? "alert-error" : "alert-success"
        } shadow-lg w-96`}>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="min-h-screen bg-base-200 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <FaShieldAlt className="text-4xl text-primary" />
            <h1 className="text-3xl font-bold">Authentication Methods Management</h1>
          </div>

          {/* Navigation */}
          <div className="tabs tabs-boxed mb-6 bg-base-100 shadow-xl p-2">
            <button
              className={`tab ${activePage === "overview" ? "tab-active" : ""}`}
              onClick={() => setActivePage("overview")}
            >
              <FaChartBar className="mr-2" /> Overview
            </button>
            <button
              className={`tab ${activePage === "users-methods" ? "tab-active" : ""}`}
              onClick={() => setActivePage("users-methods")}
            >
              <FaUsers className="mr-2" /> Users & Methods
            </button>
            <button
              className={`tab ${activePage === "migration" ? "tab-active" : ""}`}
              onClick={() => setActivePage("migration")}
            >
              <FaBullhorn className="mr-2" /> Migration
            </button>
            <button
              className={`tab ${activePage === "configuration" ? "tab-active" : ""}`}
              onClick={() => setActivePage("configuration")}
            >
              <FaCog className="mr-2" /> Configuration
            </button>
            <button
              className={`tab ${activePage === "security-rules" ? "tab-active" : ""}`}
              onClick={() => setActivePage("security-rules")}
            >
              <FaLock className="mr-2" /> Security Rules
            </button>
            <button
              className={`tab ${activePage === "audit" ? "tab-active" : ""}`}
              onClick={() => setActivePage("audit")}
            >
              <FaHistory className="mr-2" /> Audit Log
            </button>
          </div>

          {/* OVERVIEW PAGE */}
          {activePage === "overview" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Statistics Overview</h2>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statistics.methodStats.map(method => (
                  <div key={method.method_name} className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{methodIcons[method.method_name]}</div>
                        <div>
                          <h3 className="text-lg font-bold capitalize">{method.method_name}</h3>
                          <p className="text-sm text-base-content/70">
                            {method.active_users} active / {method.total_users} total
                          </p>
                        </div>
                      </div>
                      <div className="stats stats-vertical mt-2">
                        <div className="stat">
                          <div className="stat-title">Avg. Days Since Use</div>
                          <div className="stat-value text-2xl">
                            {Math.round(method.avg_days_since_last_use || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Alerts */}
              {statistics.summary.users_without_active_methods > 0 && (
                <div className="alert alert-warning">
                  <FaExclamationTriangle />
                  <span>
                    {statistics.summary.users_without_active_methods} users without active authentication methods!
                  </span>
                  <button className="btn btn-sm">View Details</button>
                </div>
              )}

              {statistics.obsoleteMethods.length > 0 && (
                <div className="alert alert-warning">
                  <FaExclamationTriangle />
                  <span>
                    {statistics.obsoleteMethods.length} obsolete authentication methods detected (90+ days inactive)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* USERS & METHODS PAGE */}
          {activePage === "users-methods" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Users Authentication Methods</h2>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Auth Methods</th>
                        <th>Active Methods</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersWithMethods.map(user => (
                        <tr key={user.id}>
                          <td className="font-semibold">{user.name}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`badge ${user.status ? 'badge-success' : 'badge-error'}`}>
                              {user.status ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="flex flex-wrap gap-2">
                              {user.auth_methods?.map(method => (
                                <div
                                  key={method.method_id}
                                  className={`badge gap-2 ${method.is_active ? 'badge-primary' : 'badge-ghost'}`}
                                >
                                  {methodIcons[method.method_name]}
                                  {method.method_name}
                                  {method.is_active ? <FaCheckCircle /> : <FaTimesCircle />}
                                </div>
                              )) || "No methods"}
                            </div>
                          </td>
                          <td>
                            <span className="font-bold">
                              {user.auth_methods?.filter(m => m.is_active).length || 0}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MIGRATION PAGE */}
          {activePage === "migration" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Migration Campaigns</h2>
                <button
                  className="btn btn-primary"
                  onClick={() => document.getElementById("campaign_modal").showModal()}
                >
                  <FaBullhorn className="mr-2" /> Create Campaign
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {campaigns.map(campaign => (
                  <div key={campaign.campaign_id} className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                      <h3 className="card-title">{campaign.name}</h3>
                      <p className="text-sm text-base-content/70">Target: {campaign.target_method}</p>
                      <div className="stats stats-vertical mt-2">
                        <div className="stat">
                          <div className="stat-title">Adoption Rate</div>
                          <div className="stat-value text-2xl">{campaign.adoption_rate || 0}%</div>
                          <div className="stat-desc">
                            {campaign.adopted_users} / {campaign.total_users} users
                          </div>
                        </div>
                      </div>
                      <div className="badge badge-lg mt-2">
                        Deadline: {formatDate(campaign.deadline)}
                      </div>
                      <div className="card-actions justify-end mt-4">
                        <span className={`badge ${
                          campaign.status === 'active' ? 'badge-success' : 'badge-ghost'
                        }`}>
                          {campaign.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONFIGURATION PAGE */}
          {activePage === "configuration" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Available Authentication Methods</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableMethods.map(method => (
                  <div key={method.method_name} className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{methodIcons[method.method_name]}</div>
                          <div>
                            <h3 className="text-lg font-bold">{method.display_name}</h3>
                            <p className="text-xs text-base-content/70">{method.description}</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          checked={method.enabled}
                          onChange={(e) => handleToggleMethod(method.method_name, e.target.checked)}
                        />
                      </div>
                      <div className="badge badge-outline mt-2">Priority: {method.priority}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECURITY RULES PAGE */}
          {activePage === "security-rules" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Security Rules</h2>
                <button
                  className="btn btn-primary"
                  onClick={() => document.getElementById("rule_modal").showModal()}
                >
                  <FaLock className="mr-2" /> Create Rule
                </button>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Rule Name</th>
                        <th>Target Role</th>
                        <th>Required Methods</th>
                        <th>Min Methods</th>
                        <th>Enforcement Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {securityRules.map(rule => (
                        <tr key={rule.rule_id}>
                          <td className="font-semibold">{rule.rule_name}</td>
                          <td>{rule.target_role || "All"}</td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              {rule.required_methods?.map((m, i) => (
                                <span key={i} className="badge badge-sm badge-outline">{m}</span>
                              ))}
                            </div>
                          </td>
                          <td>{rule.min_methods_count}</td>
                          <td>{formatDate(rule.enforcement_date)}</td>
                          <td>
                            <span className={`badge ${rule.active ? 'badge-success' : 'badge-error'}`}>
                              {rule.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* AUDIT LOG PAGE */}
          {activePage === "audit" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Audit Log & Suspicious Activities</h2>

              {/* Suspicious Changes Alert */}
              {suspiciousChanges.alertCount > 0 && (
                <div className="alert alert-error">
                  <FaExclamationTriangle className="text-2xl" />
                  <div>
                    <h3 className="font-bold">Suspicious Activities Detected!</h3>
                    <div className="text-sm">
                      {suspiciousChanges.rapidChanges.length > 0 && (
                        <p>• {suspiciousChanges.rapidChanges.length} users with rapid changes (3+ in 24h)</p>
                      )}
                      {suspiciousChanges.unauthorizedDisables.length > 0 && (
                        <p>• {suspiciousChanges.unauthorizedDisables.length} unauthorized disables</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Audit Logs Table */}
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>User</th>
                        <th>Method</th>
                        <th>Action</th>
                        <th>Performed By</th>
                        <th>IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(log => (
                        <tr key={log.log_id}>
                          <td className="text-xs">{formatDate(log.created_at)}</td>
                          <td>
                            <div className="text-xs">
                              <div className="font-semibold">{log.user_name}</div>
                              <div className="text-base-content/60">{log.user_email}</div>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-sm badge-outline">{log.method_name}</span>
                          </td>
                          <td>
                            <span className={`badge badge-sm ${
                              log.action_type === 'added' ? 'badge-success' :
                              log.action_type === 'enabled' ? 'badge-info' :
                              log.action_type === 'disabled' ? 'badge-warning' :
                              log.action_type === 'removed' ? 'badge-error' :
                              'badge-ghost'
                            }`}>
                              {log.action_type}
                            </span>
                          </td>
                          <td className="text-xs">{log.performed_by || "System"}</td>
                          <td className="font-mono text-xs">{log.ip_address || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CAMPAIGN MODAL */}
        <dialog id="campaign_modal" className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Create Migration Campaign</h3>

            <div className="form-control mb-3">
              <label className="label"><span className="label-text">Campaign Name</span></label>
              <input
                type="text"
                className="input input-bordered"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              />
            </div>

            <div className="form-control mb-3">
              <label className="label"><span className="label-text">Target Method</span></label>
              <select
                className="select select-bordered"
                value={newCampaign.target_method}
                onChange={(e) => setNewCampaign({ ...newCampaign, target_method: e.target.value })}
              >
                <option value="">Select method...</option>
                <option value="totp">TOTP</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="biometric">Biometric</option>
                <option value="hardware_key">Hardware Key</option>
              </select>
            </div>

            <div className="form-control mb-3">
              <label className="label"><span className="label-text">Notification Message</span></label>
              <textarea
                className="textarea textarea-bordered"
                value={newCampaign.notification_message}
                onChange={(e) => setNewCampaign({ ...newCampaign, notification_message: e.target.value })}
              />
            </div>

            <div className="form-control mb-3">
              <label className="label"><span className="label-text">Deadline</span></label>
              <input
                type="date"
                className="input input-bordered"
                value={newCampaign.deadline}
                onChange={(e) => setNewCampaign({ ...newCampaign, deadline: e.target.value })}
              />
            </div>

            <div className="modal-action">
              <button className="btn btn-primary" onClick={handleCreateCampaign} disabled={loading}>
                {loading ? "Creating..." : "Create Campaign"}
              </button>
              <button className="btn" onClick={() => document.getElementById("campaign_modal").close()}>
                Cancel
              </button>
            </div>
          </div>
        </dialog>

        {/* SECURITY RULE MODAL */}
        <dialog id="rule_modal" className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Create Security Rule</h3>

            <div className="form-control mb-3">
              <label className="label"><span className="label-text">Rule Name</span></label>
              <input
                type="text"
                className="input input-bordered"
                value={newRule.rule_name}
                onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
              />
            </div>

            <div className="form-control mb-3">
              <label className="label"><span className="label-text">Target Role (optional)</span></label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="e.g., admin"
                value={newRule.target_role}
                onChange={(e) => setNewRule({ ...newRule, target_role: e.target.value })}
              />
            </div>

            <div className="form-control mb-3">
              <label className="label"><span className="label-text">Minimum Methods Count</span></label>
              <input
                type="number"
                className="input input-bordered"
                min="1"
                value={newRule.min_methods_count}
                onChange={(e) => setNewRule({ ...newRule, min_methods_count: parseInt(e.target.value) })}
              />
            </div>

            <div className="form-control mb-3">
              <label className="label"><span className="label-text">Enforcement Date</span></label>
              <input
                type="date"
                className="input input-bordered"
                value={newRule.enforcement_date}
                onChange={(e) => setNewRule({ ...newRule, enforcement_date: e.target.value })}
              />
            </div>

            <div className="modal-action">
              <button className="btn btn-primary" onClick={handleCreateSecurityRule} disabled={loading}>
                {loading ? "Creating..." : "Create Rule"}
              </button>
              <button className="btn" onClick={() => document.getElementById("rule_modal").close()}>
                Cancel
              </button>
            </div>
          </div>
        </dialog>
      </div>
    </>
  );
}