const mongoose = require('mongoose');

const UserOTPVerificationSchema = mongoose.Schema(
    {
        email: {
            type: String,
        },
        otp: String,
    },
    { timestamps: true }
)
UserOTPVerificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

const UserOTPVerification = mongoose.model("userOtpVerification", UserOTPVerificationSchema);

module.exports = {
    UserOTPVerification
}
