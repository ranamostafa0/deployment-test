import nodemailer from "nodemailer"
import { APP_EMAIL, APP_PASS, APPLICATION_NAME } from "../../../../config/config.service.js";

export const sendEmail = async ({ to, cc, bcc, subject, html, attachments = [] } = {}) => {
    // Create a transporter using SMTP
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: APP_EMAIL,
            pass: APP_PASS,
        },
    });

    const info = await transporter.sendMail({
        from: `"${APPLICATION_NAME}" <${APP_EMAIL}>`, // sender address
        to,
        cc,
        bcc,
        subject,
        html,
        attachments
    });

    console.log("Message sent: %s", info.messageId);
}
