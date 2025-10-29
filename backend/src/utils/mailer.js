import nodemailer from "nodemailer";

export const sendResetEmail = async (userEmail, resetToken) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // or your SMTP provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const resetLink = `https://yourfrontend.com/confirm-reset?token=${resetToken}`;

  const mailOptions = {
    from: `"Your App Support" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: "Password Reset Request",
    html: `
      <h2>Password Reset</h2>
      <p>We received a request to reset your password.</p>
      <p>If you made this request, click the link below to confirm:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>If you didn’t request this, you can safely ignore this email.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
