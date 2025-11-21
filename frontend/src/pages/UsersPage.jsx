import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [suspendedReason, setSuspendedReason] = useState({});
  const [suspendedUntil, setSuspendedUntil] = useState({});
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);

  useEffect(() => {
    fetch(`http://localhost:3000/api/auth/usersTable?page=${userPage}`)
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || []);
        setUserTotalPages(data.totalPages || 1);
      })
      .catch(err => console.error("Error fetching users:", err));
  }, [userPage]);

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
        toast.success(`✅ User status updated to ${newStatus ? 'Active' : 'Inactive'}!`);
      })
      .catch(err => {
        console.error("Update status error:", err);
        toast.error("❌ Failed to update user status!");
      });
  };

  const handleResetPassword = (id) => {
    const loadingToast = toast.loading("Resetting password...");
    fetch(`http://localhost:3000/api/auth/resetPassword/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then(() => {
        toast.success("✅ Password reset successfully!", { id: loadingToast });
      })
      .catch(err => {
        console.error("Reset password error:", err);
        toast.error("❌ Failed to reset password!", { id: loadingToast });
      });
  };

  const handleUpdateSuspension = (id) => {
    const loadingToast = toast.loading("Updating suspension...");
    fetch(`http://localhost:3000/api/auth/updateSuspension/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        suspended_until: suspendedUntil[id],
        suspended_reason: suspendedReason[id],
      }),
    })
      .then(() => {
        setUsers(prev => prev.map(u => 
          u.id === id 
            ? { ...u, suspended_until: suspendedUntil[id], suspension_reason: suspendedReason[id] } 
            : u
        ));
        toast.success("✅ Suspension details updated successfully!", { id: loadingToast });
      })
      .catch(err => {
        console.error("Update suspension error:", err);
        toast.error("❌ Failed to update suspension!", { id: loadingToast });
      });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return dateString.slice(0, 10);
  };

  return (
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
                    onClick={() => handleUpdateSuspension(u.id)}
                  >
                    Update
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
  );
}