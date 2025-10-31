import { sql } from "../lib/db.js";
import csvParser  from "csv-parser";
import csv from "fast-csv";
import fs from "fs";
// -------------------- >>Import / Export<< --------------------
//import
export const importIPs = async (req, res) => {
  try {
    //me famech fichier csv:
    if (!req.file) {
      return res.status(400).json({ message: "NO file uploaded!" });
    }

    //fama fichier:
    const filePath = req.file.path;
    const ips = [];
    let lineCount = 0;
    let validCound = 0;
    let invalidCount = 0;
    //y9ra w yparsi l csv:
    fs.createReadStream(filePath)
      .pipe(csvParser({ separator: "|", skipLines: 0 }))
      .on("data", (row) => {
        lineCount++;

        const ip_address = row.ip_address?.trim();
        const statusRaw = row.status?.toString().trim().toLowerCase();
        const reasonRaw = row.reason?.trim();

        //validation des champs:
        //1. status:
        let status = true;
        if (statusRaw === "false" || statusRaw === "0") {
          status = false;
        }
        //2. reason:
        const allowReasons = ["spam", "hack", "risk"];
        const reason =
          !status && allowReasons.includes(reasonRaw?.toLowerCase())
            ? reasonRaw?.toLowerCase()
            : null;

        // Skip invalid combinations
        if (!status && !allowReasons.includes(reasonRaw?.toLowerCase())) {
          invalidCount++;
          return;
        }

        ips.push({ ip_address, status, reason });
        validCound++;
      })
      .on("end", async () => {
        try {
          if (ips.length === 0) {
            fs.unlinkSync(filePath);
            return res
              .status(400)
              .json({ message: "NO Valid IPs found in your csv File!" });
          }

          //insert we ila update:
          for (const ip of ips) {
            await sql`
              INSERT INTO ips (ip_address, status, reason)
              VALUES (${ip.ip_address}, ${ip.status}, ${ip.reason})
              ON CONFLICT (ip_address) DO UPDATE
              SET status = EXCLUDED.status,
                  reason = EXCLUDED.reason,
                  date_added = CURRENT_DATE
            `;
          }
          fs.unlinkSync(filePath);

          await sql`SELECT setval('ips_ip_id_seq', (SELECT MAX(ip_id) FROM ips))`;

          res.status(200).json({
            message: "Import completed successfully!",
            total_lines: lineCount,
            valid_rows: validCound,
            invalid_rows: invalidCount,
            inserted_or_updated: validCound,
          });
        } catch (error) {
          console.error("ERROR: DATABASE import failed:", error);
          res
            .status(500)
            .json({ message: "Import failed", error: error.message });
        }
      })
      .on("error", (err) => {
        console.error("CSV read error:", err);
        res
          .status(500)
          .json({ message: "ERROR reading CSV", error: err.message });
      });
  } catch (error) {
    console.error("ERROR in importIPs:", error);
    res.status(500).json({ message: "INTERNAL SERVER ISSUES" });
  }
};

//export
export const exportIPs = async (req, res) => {
    try {
        //Fetch data in table ips fi bdd:
        const ips = await sql `
            SELECT 
              ip_id,
              ip_address,
              status,
              reason,
              date_added
            FROM ips ORDER BY ip_id ASC
        `;

        //set csv header bch ytsab csv:
        res.setHeader("Content-Disposition", "attachement; filename=Liste_Noire.csv");
        res.setHeader("Content-Type","text/csv");

        //stream csv lil admin:
        const csvStream = csv.format({ headers: true});
        csvStream.pipe(res);
        ips.forEach(ip => csvStream.write(ip));
        csvStream.end();
        
    } catch (error) {
        console.error("ERROR in exportIPs:",error);
        res.status(500).json({message:"INTERNAL SERVER ISSUES"});
    }
}

// -------------------- >>Gestion des IP's CRUD me y7ararch<< --------------------
//get all IPs avec pagination: (R)
export const getIPsTable = async (req, res) => {
  try {
    // Pagination 
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    // Filtration
    const { status, from, to } = req.query;

    // WHERECLAUSE dynamique
    let whereClause = sql``;
    if (status) {
      whereClause = sql`${whereClause} WHERE status = ${status === "true"}`;
    }
    if (from && to) {
      whereClause =
        whereClause.text === ""
          ? sql`WHERE created_at BETWEEN ${from} AND ${to}`
          : sql`${whereClause} AND created_at BETWEEN ${from} AND ${to}`;
    }

    // Count total ips (b3d filtre baz)
    const totalIPsResult = await sql`
      SELECT COUNT(*) AS count FROM ips ${whereClause}
    `;
    const totalIPs = parseInt(totalIPsResult[0].count);

    // Filtered ips
    const ips = await sql`
      SELECT ip_id, ip_address, status, reason, date_added
      FROM ips
      ${whereClause}
      ORDER BY ip_id ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    if (ips.length === 0) {
      return res.status(404).json({ message: "No ips found matching filters" });
    }

    return res.status(200).json({
      page,
      limit,
      totalIPs,
      totalPages: Math.ceil(totalIPs / limit),
      ips,
    });
  } catch (error) {
    console.error("ERROR in getIPsTable:", error);
    res.status(500).json({ message: "INTERNAL SERVER ISSUES" });
  }
};

//add an IP Address manuellement: (C)
export const addIpAdress = async (req, res) => {
    try {
        const { ip_address, status, reason } = req.body;
        if (!ip_address) {
            return res.status(400).json({ message: "IP address Required!" });
        }

        //status == false (blocked):
        if (status === false) {
            if (!reason || !["spam", "risk", "hack"].includes(reason.toLowerCase())) {
                return res.status(400).json({ message: "Reason invalid for blocked IP!" });
            }
        }

        //add l IP manuel:
        const result = await sql`
          INSERT INTO ips (ip_address, status, reason)
          VALUES (${ip_address}, ${status}, ${reason || null})
          ON CONFLICT (ip_address) DO UPDATE
          SET status = EXCLUDED.status,
              reason = EXCLUDED.reason,
              date_added = CURRENT_DATE
          RETURNING ip_id, ip_address, status, reason
        `;

        res.status(200).json({ message: "IP added successfully!", ip: result[0] });
    } catch (error) {
        console.error("ERROR in addIpAdress:", error);
        res.status(500).json({ message: "INTERNAL SERVER ISSUE" });
    }
}

//search IP by address
export const searchIP = async (req, res) => {
  try {
    const { ip } = req.query;
    console.log("Searching for IP:", ip);

    if (!ip) {
      return res.status(400).json({ message: "IP query is required!" });
    }

    const result = await sql`
      SELECT ip_id, ip_address, status, reason, date_added
      FROM ips
      WHERE TRIM(ip_address) ILIKE ${'%' + ip.trim() + '%'}
      ORDER BY ip_id ASC
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "No IPs found matching your search!" });
    }

    res.status(200).json({ ips: result });
  } catch (error) {
    console.error("ERROR in searchIP:", error.message);
    res.status(500).json({ message: "INTERNAL SERVER ISSUE" });
  }
};

// Update IP status
export const updateIPStatus = async (req, res) => {
  try {
    const { ip_address } = req.params;
    const { status, reason } = req.body;

    if (typeof status !== "boolean") {
      return res.status(400).json({ message: "Status must be a boolean!" });
    }

    // If blocking (status = false), reason is required
    if (!status && !reason) {
      return res.status(400).json({ message: "Reason required when blocking an IP!" });
    }

    const allowedReasons = ["spam", "hack", "risk", "auto_block"];
    if (!status && !allowedReasons.includes(reason?.toLowerCase())) {
      return res.status(400).json({ message: "Invalid reason!" });
    }

    const result = await sql`
      UPDATE ips
      SET status = ${status},
          reason = ${!status ? reason?.toLowerCase() : null},
          date_added = CURRENT_DATE
      WHERE ip_address = ${ip_address}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "IP not found!" });
    }

    res.status(200).json({ 
      message: "IP status updated successfully!", 
      ip: result[0] 
    });
  } catch (error) {
    console.error("ERROR in updateIPStatus:", error);
    res.status(500).json({ message: "INTERNAL SERVER ISSUE" });
  }
};
