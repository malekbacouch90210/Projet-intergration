import {sql} from "../lib/db.js";

//get all reports mi reports table fi db:
export const getReports = async (req, res) => {
  try {
    const { criticity, status } = req.query;

    let query = sql`
      SELECT r.*, u.username AS reporter_name, a.username AS assigned_admin
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN users a ON r.assigned_to = a.id
    `;

    if (criticity && status) {
      query = sql`${query} WHERE r.criticity = ${criticity} AND r.status = ${status}`;
    } else if (criticity) {
      query = sql`${query} WHERE r.criticity = ${criticity}`;
    } else if (status) {
      query = sql`${query} WHERE r.status = ${status}`;
    }

    query = sql`${query} ORDER BY r.date_created DESC`;

    const reports = await query;
    res.status(200).json({ reports });
  } catch (error) {
    console.error("ERROR in getReports:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//create a new report fil reports table:
export const createReport = async (req, res) => {
  try {
    const { user_id, subject, description, criticity, status } = req.body;

    if (!user_id || !subject || !description) {
      return res.status(400).json({ message: "Missing required fields!" });
    }

    const result = await sql`
      INSERT INTO reports (user_id, subject, description, criticity, status)
      VALUES (${user_id}, ${subject}, ${description}, ${criticity || "low"}, ${status || "pending"})
      RETURNING *;
    `;

    res.status(201).json({ message: "Report created!", report: result[0] });
  } catch (error) {
    console.error("ERROR in createReport:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//get ALL reports without filters (for admin dashboard):
export const getAllReports = async (req, res) => {
  try {
    const reports = await sql`
      SELECT r.*, u.name AS reporter_name, a.name AS assigned_admin
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN users a ON r.assigned_to = a.id
      ORDER BY r.date_created DESC
    `;

    res.status(200).json({ reports });
  } catch (error) {
    console.error("ERROR in getAllReports:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


//update a report status:
export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, criticity, assigned_to } = req.body;

    if (!status && !criticity && !assigned_to) {
      return res.status(400).json({ message: "Nothing to update!" });
    }

    const result = await sql`
      UPDATE reports
      SET 
        status = COALESCE(${status}, status),
        criticity = COALESCE(${criticity}, criticity),
        assigned_to = COALESCE(${assigned_to}, assigned_to),
        date_updated = NOW()
      WHERE id = ${id}
      RETURNING *;
    `;

    if (result.length === 0) return res.status(404).json({ message: "Report not found!" });

    res.status(200).json({ message: "Report updated!", report: result[0] });
  } catch (error) {
    console.error("ERROR in updateReport:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
