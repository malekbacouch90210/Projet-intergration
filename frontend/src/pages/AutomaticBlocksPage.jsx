import { useState, useEffect } from "react";

export default function AutomaticBlocksPage() {
  const [loginAttempts, setLoginAttempts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/api/security/login/attempts")
      .then(res => res.json())
      .then(data => {
        setLoginAttempts(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Error fetching login attempts:", err));
  }, []);

  return (
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
  );
}