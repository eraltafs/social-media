const bcrypt = require("bcrypt");
const User = require("../models/User");
const nodemailer = require("nodemailer");


// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.APP_PASS,
  },
});

const generateToken = () => {
  return Math.floor(1000 + Math.random() * 9000);
}

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: 0, message: "User not found" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.json({ success: 1, message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ success: 0, message: "Internal server error" });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const resetToken = generateToken();

  // Store the reset token and associated email in the database
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { $set: { resetToken, resetTokenExpires: Date.now() + 900000 } }, // OTP expires in 15 minutes
      { new: true }
    );

    if (!user) {
      return res.json({ Success: 0, message: "User not found", resetToken });
    }

    const mailOptions = {
      from: process.env.USER_EMAIL,
      to: email,
      subject: "Your Socilious App Password Change OTP",
      html: `
      <html>
      <head>
        <style>
          h1 { color: #333; }
          p { color: #555; }
          strong { color: #000; }
        </style>
      </head>
      <body>
        <div>
          <table border="0" cellspacing="0" cellpadding="0" style="max-width:600px">
            <tbody>
              <tr>
                <td>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr height="10"></tr>
                    <tr>
                      <td>
                        <table bgcolor="#4184F3" width="100%" border="0" cellspacing="0" cellpadding="0" style="min-width:332px;max-width:600px;border:1px solid #e0e0e0;border-bottom:0;border-top-left-radius:3px;border-top-right-radius:3px">
                          <tr>
                            <td height="36px" colspan="3"></td>
                          </tr>
                          <tr>
                            <td width="32px"></td>
                            <td style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;font-size:24px;color:#ffffff;line-height:1.25">Socilious App Verification Code</td>
                            <td width="32px"></td>
                          </tr>
                          <tr>
                            <td height="18px" colspan="3"></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <table bgcolor="#FAFAFA" width="100%" border="0" cellspacing="0" cellpadding="0" style="min-width:332px;max-width:600px;border:1px solid #f0f0f0;border-bottom:1px solid #c0c0c0;border-top:0;border-bottom-left-radius:3px;border-bottom-right-radius:3px">
                          <tr height="16px">
                            <td width="32px" rowspan="3"></td>
                            <td></td>
                            <td width="32px" rowspan="3"></td>
                          </tr>
                          <tr>
                            <td>
                              <p>Greetings from Socilious App!</p>
                              <p>Thank you for your continued interest in Socilious App. To proceed with the password change for your Socilious App account, please use the following verification code: <div style="text-align:center">
                              <p dir="ltr">
                                <strong style="text-align:center;font-size:24px;font-weight:bold">${resetToken}</strong>
                              </p>
                            </div></p>
                              <p>Remember, the OTP is confidential and should not be shared with anyone. We prioritize the security of your account, and this additional verification step ensures a secure password change process.</p>
                              <p>If you encounter any issues or have questions, please feel free to reach out to our support team at <a href="mailto:support@socilious.com">support@socilious.com</a>. We are here to assist you.</p>
                              <p>Best regards,</p>
                              <p>Team Socilious</p>
                              <p><em>*Note: Please do not reply to this email, as this inbox is not monitored. For support inquiries, contact us at support@socilious.com.</em></p>
                            </td>
                          </tr>
                          <tr height="32px"></tr>
                        </table>
                      </td>
                    </tr>
                    <tr height="16"></tr>
                    <tr>
                      <td style="max-width:600px;font-family:Roboto-Regular,Helvetica,Arial,sans-serif;font-size:10px;color:#bcbcbc;line-height:1.5">
                        <table>
                          <tbody>
                            <tr>
                              <td>
                                <table style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;font-size:10px;color:#666666;line-height:18px;padding-bottom:10px"></table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </body>
      </html>
      `,


    };

    // Send an email to the user with the OTP
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        res.json({
          Success: 0,
          error: "An error occurred while sending the email",
          resetToken,
        });
      } else {
        res.json({
          Success: 1,
          message: "Password reset email sent",
          resetToken,
        });
      }
    });
  } catch (error) {
    // console.error('Database error:', error);
    res.status(500).json({ Success: 0, error: "Error accessing the database" });
  }
};

module.exports = {
  resetPassword,
  forgotPassword,
};
