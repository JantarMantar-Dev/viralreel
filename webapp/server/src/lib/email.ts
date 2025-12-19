import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import WelcomeEmail from "../emails/welcome";
import VerifyEmail from "../emails/verify";
import * as React from "react";

// Create a transporter using SMTP credentials from environment variables
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_OUT_SERVER,
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_EMAIL_USER,
        pass: process.env.SMTP_EMAIL_PASS,
    },
});

const FROM_EMAIL = process.env.SMTP_EMAIL_USER || "noreply@getviralreel.com";

interface EmailResult {
    success: boolean;
    data?: any;
    error?: any;
}

/**
 * Generic function to send an email using the SMTP transporter.
 */
export const sendEmail = async (
    to: string,
    subject: string,
    component: React.ReactElement
): Promise<EmailResult> => {
    try {
        const emailHtml = await render(component);

        if (process.env.MOCK_EMAIL === "true") {
            console.log("================ MOCK EMAIL ================");
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log("--------------------------------------------");
            console.log(emailHtml);
            console.log("============================================");
            return { success: true };
        }

        const info = await transporter.sendMail({
            from: FROM_EMAIL,
            to,
            subject,
            html: emailHtml,
        });

        return { success: true, data: info };
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
        return { success: false, error };
    }
};

export const sendWelcomeEmail = async (email: string, name: string) => {
    return sendEmail(
        email,
        "Welcome to ViralReel!",
        React.createElement(WelcomeEmail, { userFirstname: name })
    );
};

export const sendVerifyEmail = async (email: string, url: string) => {
    return sendEmail(
        email,
        "Verify your email",
        React.createElement(VerifyEmail, { url })
    );
};
