import {sql} from "../lib/db.js";

//add reply to a status:
export const addReply = async (req, res) => {
  try {
    const { report_id, sender_id, sender_type, message } = req.body;

    if (!report_id || !sender_id || !sender_type || !message) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    const reply = await sql`
      INSERT INTO report_replies (report_id, sender_id, sender_type, message)
      VALUES (${report_id}, ${sender_id}, ${sender_type}, ${message})
      RETURNING *;
    `;

    res.status(201).json({ message: "Reply added!", reply: reply[0] });
  } catch (error) {
    console.error("ERROR in addReply:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


//get replies mt3 report specifique:
export const getReplies = async (req, res) => {
  try {
    const { report_id } = req.params;

    const replies = await sql`
      SELECT rr.*, u.name AS sender_name
      FROM report_replies rr
      LEFT JOIN users u ON rr.sender_id = u.id
      WHERE rr.report_id = ${report_id}
      ORDER BY rr.date_created ASC;
    `;

    res.status(200).json({ replies });
  } catch (error) {
    console.error("ERROR in getReplies:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};