import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  FaArrowRight,
  FaTrash,
  FaSearch,
  FaUsers,
  FaCog,
  FaUserCircle,
  FaSignOutAlt,
  FaTachometerAlt,
  FaBars,
} from "react-icons/fa";

function Dashboard() {
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeUsers, setActiveUsers] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    let url = "http://localhost:3000/api/auth/usersTable";
    if (search) {
      url = `http://localhost:3000/api/auth/usersTable/${search}`;
    } else {
      url += `?page=${page}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || []);
        setTotalUsers(data.totalUsers || data.count || 0);
        setTotalPages(data.totalPages || 1);
        setActiveUsers(data.users ? data.users.filter((u) => u.status).length : 0);
      })
      .catch((err) => console.error("Fetch error:", err));
  }, [page, search]);

  const handleStatusChange = (id, newStatus) => {
    fetch(`http://localhost:3000/api/auth/updateStatus/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
      .then(() => {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u))
        );
        setActiveUsers(() =>
          users.filter((u) => (u.id === id ? newStatus : u.status)).length
        );
      })
      .catch((err) => console.error("Update status error:", err));
  };

  const viewDetails = (id) => {
    fetch(`http://localhost:3000/api/auth/getUser/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setSelectedUser(data);
        document.getElementById("user_modal").showModal();
      })
      .catch((err) => console.error("Get details error:", err));
  };

  const handleReset = (id) => {
    fetch(`http://localhost:3000/api/auth/usersTable/${id}/reset_password`, {
      method: "PATCH",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Reset token:", data.resetToken);
        alert("Password reset initiated. Check email or console for token.");
      })
      .catch((err) => console.error("Reset password error:", err));
  };

  return (
    
    <div className="drawer lg:drawer-open min-h-screen bg-base-200 text-base-content">
      <input
        id="my-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={isSidebarOpen}
        onChange={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main content */}
      <div className="drawer-content flex flex-col">
        <div className="flex items-center justify-between p-4 bg-base-100 border-b border-base-300 lg:hidden">
          <label htmlFor="my-drawer" className="btn btn-ghost btn-circle">
            <FaBars />
          </label>
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>

        <main className="p-6 flex-1 space-y-6">
          <h1 className="text-3xl font-bold hidden lg:block">Dashboard Overview</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="stat bg-base-100 shadow-xl rounded-2xl">
              <div className="stat-figure text-primary">
                <FaUsers className="text-3xl" />
              </div>
              <div className="stat-title">Total Users</div>
              <div className="stat-value">{totalUsers}</div>
            </div>

            <div className="stat bg-base-100 shadow-xl rounded-2xl">
              <div className="stat-figure text-secondary">
                <FaUserCircle className="text-3xl" />
              </div>
              <div className="stat-title">Active Users</div>
              <div className="stat-value">{activeUsers}</div>
            </div>
          </div>

          {/* Search + Add User */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Search by name..."
                className="input input-bordered w-full pr-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <FaSearch className="absolute right-3 top-3 text-base-content/60" />
            </div>
            <button className="btn btn-primary w-full md:w-auto">+ Add User</button>
          </div>

          {/* Users Table */}
          <div className="card bg-base-100 shadow-xl">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="bg-base-300 text-base font-semibold">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-10">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover">
                        <td className="font-medium">{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <input
                            type="checkbox"
                            className="toggle toggle-success"
                            checked={u.status}
                            onChange={(e) => handleStatusChange(u.id, e.target.checked)}
                          />
                        </td>
                        <td className="flex gap-2">
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => viewDetails(u.id)}
                          >
                            <FaArrowRight />
                          </button>
                          <button
                            className="btn btn-sm btn-error text-white"
                            onClick={() => handleReset(u.id)}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {!search && (
            <div className="flex justify-center mt-4">
              <div className="join">
                <button
                  className="join-item btn"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <button className="join-item btn btn-active">{page}</button>
                <button
                  className="join-item btn"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Sidebar */}
      <div className="drawer-side">
        <label htmlFor="my-drawer" className="drawer-overlay"></label>
        <aside className="bg-base-100 w-64 h-full shadow-xl flex flex-col justify-between">
          <div>
            <div className="p-4 flex items-center gap-2 border-b border-base-300">
              <FaTachometerAlt className="text-primary text-xl" />
              <span className="font-bold text-lg">Admin Panel</span>
            </div>
            <ul className="menu p-4">
              <li><a className="active"><FaTachometerAlt /> Dashboard</a></li>
              <li><a><FaUsers /> Users</a></li>
              <li><a><FaUserCircle /> Profile</a></li>
              <li><a><FaCog /> Settings</a></li>
            </ul>
          </div>

          <div className="p-4 border-t border-base-300 space-y-3">
            <div className="flex items-center gap-2">
              <img
                src={user?.imageUrl}
                alt="Admin"
                className="rounded-full w-8 h-8"
              />
              <span>{user?.fullName || "Admin"}</span>
            </div>
            <button className="btn btn-outline btn-error w-full">
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </aside>
      </div>

      {/* User Modal */}
      <dialog id="user_modal" className="modal">
        <form method="dialog" className="modal-box w-11/12 max-w-md">
          {selectedUser && (
            <>
              <h3 className="font-bold text-lg mb-2">User Details</h3>
              <div className="space-y-1">
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Status:</strong> {selectedUser.status ? "Active" : "Inactive"}</p>
                <p><strong>Created At:</strong> {new Date(selectedUser.createdAt).toLocaleString()}</p>
                <p><strong>Updated At:</strong> {new Date(selectedUser.lastUpdated).toLocaleString()}</p>
              </div>
            </>
          )}
          <div className="modal-action">
            <button className="btn btn-primary">Close</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

export default Dashboard;
