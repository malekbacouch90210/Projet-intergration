import { FaExclamationTriangle, FaBan, FaShieldAlt } from "react-icons/fa";

export default function AlertsPage({ securityAlerts }) {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return dateString.slice(0, 10);
  };

  return (
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
  );
}