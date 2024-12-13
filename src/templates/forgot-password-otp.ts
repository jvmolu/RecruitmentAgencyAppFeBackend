export const forgotPasswordOtpTemplate = (otp: string): string => {
    return `
        <html>
            <body>
                <h1>Hi,</h1>
                <p>Your OTP for resetting password is: ${otp}</p>
            </body>
        </html>
    `;
}