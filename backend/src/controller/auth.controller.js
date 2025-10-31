import express from "express";
import { sql } from "../lib/db.js";
import crypto from "crypto";
//get users Table --> all users:
export const usersTab = async (req, res) => {
  try {
    // Pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    // Filtration
    const { status, from, to } = req.query;

    // Build WHERE clause dynamically
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

    // Count total users (after filters)
    const totalUsersResult = await sql`
      SELECT COUNT(*) AS count FROM users ${whereClause}
    `;
    const totalUsers = parseInt(totalUsersResult[0].count);

    // Get filtered users
    const users = await sql`
      SELECT id, email, name, status, created_at
      FROM users
      ${whereClause}
      ORDER BY id ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found matching filters" });
    }

    return res.status(200).json({
      page,
      limit,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      users,
    });
  } catch (error) {
    console.log("ERROR in usersTab:", error);
    return res.status(500).json({ message: "INTERNAL SERVER ISSUES" });
  }
};

//get user details --> one specific user
export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const users = await sql`
      SELECT 
        id, 
        name, 
        email, 
        status, 
        last_login, 
        created_at, 
        updated_at
      FROM users
      WHERE id = ${id}
    `;

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const user = users[0];
    
    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      status:user.status ,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      lastUpdated: user.updated_at,
    });

  } catch (error) {
    console.error("ERROR in getUserDetails:", error);
    return res.status(500).json({ message: "INTERNAL SERVER ISSUES" });
  }
};

//manually activate and desactivate a user status:
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || typeof status !== "boolean") {
      return res.status(400).json({ message: "Invalid id or status value" });
    }

    const user = await sql`SELECT * FROM users WHERE id = ${id}`;
    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await sql`
      UPDATE users 
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${id}
      RETURNING id, name, email, status, updated_at;
    `;

    return res.status(200).json({
      message: "User status updated successfully",
      user: updatedUser[0],
    });
  } catch (error) {
    console.error("ERROR in updateUserStatus:", error);
    return res.status(500).json({ message: "INTERNAL SERVER ISSUES" });
  }
};

//search user by name
export const searchUserByName = async (req, res) => {
  try {
    const { name } = req.params;

    const users = await sql`
      SELECT 
        id,
        name, 
        email, 
        status, 
        last_login, 
        created_at, 
        updated_at
      FROM users
      WHERE LOWER(name) LIKE LOWER(${`%${name}%`})
    `;

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      count: users.length,
      users,
    });

  } catch (error) {
    console.error("ERROR in searchUserByName:", error);
    return res.status(500).json({ message: "INTERNAL SERVER ISSUES" });
  }
};

//Reset password of user 
export const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;

    //validate user exists
    const users = await sql`SELECT id, email, name FROM users WHERE id = ${id}`;
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];

    //generate a secure token (hex) and expiry (1 hour)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    //save token + expiry in DB
    await sql`
      UPDATE users
      SET reset_password_token = ${token},
          reset_password_expires_at = ${expiresAt},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;

    // 4) Return success (for testing we include the token; remove in production)
    return res.status(200).json({
      message: "Password reset token generated. Send it to the user's email.",
      resetToken: token,           // Testing only ye bro testing onlyyyyyyyy
      expiresAt: expiresAt.toISOString(),
      userId: id,
      userEmail: user.email
    });
  } catch (error) {
    console.error("ERROR in resetPassword:", error);
    return res.status(500).json({ message: "INTERNAL SERVER ISSUES" });
  }
  
};

//suspend user temporarelly
export const suspendUser = async (req, res) => {
  try {
    const { id, duration_days, reason } = req.body;

    if (!id || !duration_days || !reason) {
      return res.status(400).json({ message: "id, duration_days, and reason are required!" });
    }

    const allowedReasons = ['Suspicious activity', 'Violation of rules', 'Security breach risk'];
    if (!allowedReasons.includes(reason)) {
      return res.status(400).json({ message: "Invalid suspension reason!" });
    }

    // Calculate suspension end date
    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + parseInt(duration_days));

    const result = await sql`
      UPDATE users
      SET suspended_until = ${suspendedUntil},
          suspension_reason = ${reason},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, name, email, suspended_until, suspension_reason
    `;

    if (result.length === 0) return res.status(404).json({ message: "User not found!" });

    res.status(200).json({ message: "User suspended successfully!", user: result[0] });
  } catch (error) {
    console.error("ERROR in suspendUser:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update user suspension details
export const updateSuspension = async (req, res) => {
  try {
    const { id } = req.params;
    const { suspended_until, suspended_reason } = req.body;

    if (!suspended_until && !suspended_reason) {
      return res.status(400).json({ message: "At least one field required!" });
    }

    const allowedReasons = ['Suspicious activity', 'Violation of rules', 'Security breach risk'];
    if (suspended_reason && !allowedReasons.includes(suspended_reason)) {
      return res.status(400).json({ message: "Invalid suspension reason!" });
    }

    const result = await sql`
      UPDATE users
      SET 
        suspended_until = COALESCE(${suspended_until}, suspended_until),
        suspension_reason = COALESCE(${suspended_reason}, suspension_reason),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, name, email, suspended_until, suspension_reason
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.status(200).json({ 
      message: "Suspension updated successfully!", 
      user: result[0] 
    });
  } catch (error) {
    console.error("ERROR in updateSuspension:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};