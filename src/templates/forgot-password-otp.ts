// export const emailInviteTemplate = (jobId: string, candidateName: string): string => {
//     return `
//         <html>
//             <body>
//                 <h1>Hi ${candidateName},</h1>
//                 <p>You have been invited to apply for a job. Please click the link below to apply:</p> <br>
//                 <a href="http://localhost:3000/jobs/${jobId}">Apply for Job</a> <br>
//                 If the link does not work, please copy and paste the following URL in your browser:
//                 <br> 
//                 http://localhost:3000/jobs/${jobId}
//             </body>
//         </html>
//     `;
// };

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