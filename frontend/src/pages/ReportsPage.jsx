import { useState, useEffect } from "react";
import { FaComments } from "react-icons/fa";
import toast from "react-hot-toast";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [replies, setReplies] = useState({});
  const [selectedReplies, setSelectedReplies] = useState(null);

  useEffect(() => {
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
  }, []);

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

  return (
    <>
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

      <dialog id="replies_modal" className="modal">
        <div className="modal-box w-11/12 max-w-2xl">
          <h3 className="font-bold text-lg mb-4">Report Replies</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {selectedReplies && selectedReplies.length > 0 ? (
              selectedReplies.map(rep => (
                <div key={rep.id} className="card bg-base-200 p-4">
                  <p className="font-semibold text-primary">{rep.sender_name}</p>
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
    </>
  );
}