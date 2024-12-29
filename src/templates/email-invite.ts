export const emailInviteTemplate = (jobId: string, candidateName: string): string => {
    return `
        <html>
            <body>
                <h1>Hi ${candidateName},</h1>
                <p>You have been invited to apply for a job. Please click the link below to apply:</p> <br>
                <a href="http://134.209.226.138:5173/jobs/${jobId}">Apply for Job</a> <br>
                If the link does not work, please copy and paste the following URL in your browser:
                <br> 
                http://134.209.226.138:5173/jobs/${jobId}
            </body>
        </html>
    `;
};