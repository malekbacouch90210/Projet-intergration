import { useState, useEffect } from "react";
import { FaFileExport, FaFileImport, FaShieldAlt } from "react-icons/fa";
import toast from "react-hot-toast";

export default function IPsPage() {
  const [ips, setIps] = useState([]);
  const [ipPage, setIpPage] = useState(1);
  const [ipTotalPages, setIpTotalPages] = useState(1);
  const [newIP, setNewIP] = useState({ ip_address: "", status: false, reason: "" });

  useEffect(() => {
    fetch(`http://localhost:3000/api/ip/ipsTable?page=${ipPage}`)
      .then(res => res.json())
      .then(data => {
        setIps(data.ips || []);
        setIpTotalPages(data.totalPages || 1);
      })
      .catch(err => console.error("Error fetching IPs:", err));
  }, [ipPage]);

  const handleUpdateIPStatus = (ip_address, newStatus, reason = null) => {
    const loadingToast = toast.loading("Updating IP status...");
    fetch(`http://localhost:3000/api/ip/updateIP/${ip_address}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        status: newStatus === "allowed",
        reason: newStatus === "blocked" ? reason : null 
      }),
    })
      .then(() => {
        setIps(prev => prev.map(ip => 
          ip.ip_address === ip_address 
            ? { ...ip, status: newStatus === "allowed", reason: newStatus === "blocked" ? reason : null } 
            : ip
        ));
        toast.success(`✅ IP status updated to ${newStatus}!`, { id: loadingToast });
      })
      .catch(err => {
        console.error("Update IP status error:", err);
        toast.error("❌ Failed to update IP status!", { id: loadingToast });
      });
  };

  const handleAddNewIP = () => {
    if (!newIP.ip_address.trim()) {
      toast.error("❌ IP address is required!");
      return;
    }

    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(newIP.ip_address.trim())) {
      toast.error("❌ Invalid IP address format!");
      return;
    }

    if (newIP.status === false && !newIP.reason.trim()) {
      toast.error("❌ Reason is required when blocking an IP!");
      return;
    }

    const loadingToast = toast.loading("Adding new IP...");

    fetch("http://localhost:3000/api/ip/addIP", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newIP),
    })
      .then(res => res.json())
      .then(data => {
        toast.success(`✅ ${data.message}`, { id: loadingToast });
        setNewIP({ ip_address: "", status: false, reason: "" });
        document.getElementById("add_ip_modal").close();
        fetch(`http://localhost:3000/api/ip/ipsTable?page=${ipPage}`)
          .then(res => res.json())
          .then(data => setIps(data.ips || []));
      })
      .catch(err => {
        console.error("Add IP error:", err);
        toast.error("❌ Failed to add IP!", { id: loadingToast });
      });
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

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return dateString.slice(0, 10);
  };

  return (
    <>
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
          <button className="btn btn-primary" onClick={() => document.getElementById("add_ip_modal").showModal()}>
            Add IP
          </button>
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
                    <select
                      value={ip.status ? "allowed" : "blocked"}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        const reason = newStatus === "blocked" ? (ip.reason || "spam") : null;
                        handleUpdateIPStatus(ip.ip_address, newStatus, reason);
                      }}
                      className={`select select-sm select-bordered font-semibold text-white ${
                        ip.status ? "bg-green-500" : "bg-red-500"
                      }`}
                    >
                      <option value="allowed">Allowed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </td>
                  <td>
                    {!ip.status && (
                      <select
                        value={ip.reason || "spam"}
                        onChange={(e) => handleUpdateIPStatus(ip.ip_address, "blocked", e.target.value)}
                        className="select select-sm select-bordered"
                      >
                        <option value="spam">Spam</option>
                        <option value="hack">Hack</option>
                        <option value="risk">Risk</option>
                        <option value="auto_block">Auto Block</option>
                      </select>
                    )}
                    {ip.status && <span className="text-gray-400">N/A</span>}
                  </td>
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

      {/* Add IP Modal */}
      <dialog id="add_ip_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Add New IP</h3>

          <div className="form-control mb-3">
            <label className="label">
              <span className="label-text">IP Address</span>
            </label>
            <input
              type="text"
              placeholder="e.g., 192.168.1.100"
              className="input input-bordered"
              value={newIP.ip_address}
              onChange={(e) => setNewIP({ ...newIP, ip_address: e.target.value })}
            />
          </div>

          <div className="form-control mb-3">
            <label className="label">
              <span className="label-text">Status</span>
            </label>
            <select
              className={`select select-bordered font-semibold text-white ${
                newIP.status === false ? "bg-red-500" : "bg-green-500"
              }`}
              value={newIP.status === false ? "blocked" : "allowed"}
              onChange={(e) =>
                setNewIP({
                  ...newIP,
                  status: e.target.value === "blocked" ? false : true,
                  reason: e.target.value === "allowed" ? "" : newIP.reason,
                })
              }
            >
              <option value="allowed">✅ Allowed</option>
              <option value="blocked">❌ Blocked</option>
            </select>
          </div>

          {newIP.status === false && (
            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">Reason (required)</span>
              </label>
              <select
                className="select select-bordered"
                value={newIP.reason}
                onChange={(e) => setNewIP({ ...newIP, reason: e.target.value })}
              >
                <option value="">Select reason...</option>
                <option value="spam">Spam</option>
                <option value="hack">Hack</option>
                <option value="risk">Risk</option>
              </select>
            </div>
          )}

          <div className="modal-action">
            <button 
              className="btn btn-success" 
              onClick={handleAddNewIP}
            >
              <FaShieldAlt className="mr-2" />
              Add IP
            </button>
            <button 
              className="btn" 
              onClick={() => {
                setNewIP({ ip_address: "", status: false, reason: "" });
                document.getElementById("add_ip_modal").close();
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}