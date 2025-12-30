import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import WelcomeEmail from "../emails/welcome.js";
import VerifyEmail from "../emails/verify.js";
import PasswordChangedEmail from "../emails/password-changed.js";
import ResetPasswordEmail from "../emails/reset-password.js";
import SubscriptionConfirmedEmail from "../emails/subscription-confirmed.js";
import VideoReadyEmail from "../emails/video-ready.js";
import SubscriptionCancelledEmail from "../emails/subscription-cancelled.js";
import WaitlistInviteEmail from "../emails/waitlist-invite.js";
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
const DEV_EMAIL = "test@getviralreel.com";
const IS_DEV = process.env.NODE_ENV === "development" || process.env.MOCK_EMAIL === "true";

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

        const recipient = IS_DEV ? DEV_EMAIL : to;
        const finalSubject = IS_DEV ? `[DEV to: ${to}] ${subject}` : subject;

        if (process.env.MOCK_EMAIL === "true") {
            console.log("================ MOCK EMAIL ================");
            console.log(`To: ${recipient} (Original: ${to})`);
            console.log(`Subject: ${finalSubject}`);
            console.log("--------------------------------------------");
            console.log(emailHtml);
            console.log("============================================");
            // In mock mode we just log, but we've applied the redirection logic to logs
            return { success: true };
        }

        const info = await transporter.sendMail({
            from: FROM_EMAIL,
            to: recipient,
            subject: finalSubject,
            html: emailHtml,
        });

        console.log(`Email sent to ${recipient} with subject: ${finalSubject}`);

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

export const sendVerifyEmail = async (email: string, url: string, name?: string) => {
    return sendEmail(
        email,
        "Verify your email",
        React.createElement(VerifyEmail, { url, name })
    );
};

export const sendPasswordChangedEmail = async (email: string, name?: string) => {
    return sendEmail(
        email,
        "Your password has been changed",
        React.createElement(PasswordChangedEmail, { userName: name })
    );
};

export const sendResetPasswordEmail = async (email: string, url: string, name?: string) => {
    return sendEmail(
        email,
        "Reset your password",
        React.createElement(ResetPasswordEmail, { url, name })
    );
};

export const sendSubscriptionEmail = async (
    email: string,
    name: string,
    planName: string,
    cost: string,
    nextBillingDate: string
) => {
    return sendEmail(
        email,
        "Subscription Confirmed!",
        React.createElement(SubscriptionConfirmedEmail, {
            name,
            planName,
            cost,
            nextBillingDate,
        })
    );
};

export const sendVideoReadyEmail = async (
    email: string,
    name: string,
    videoTitle: string,
    thumbnailUrl: string,
    videoUrl: string,
    videoDuration: string
) => {
    return sendEmail(
        email,
        "Your video is ready!",
        React.createElement(VideoReadyEmail, {
            name,
            videoTitle,
            thumbnailUrl,
            videoUrl,
            videoDuration,
        })
    );
};

export const sendSubscriptionCancelledEmail = async (
    email: string,
    name: string,
    planName: string,
    effectiveDate: string,
    accessEndsOn: string
) => {
    return sendEmail(
        email,
        "Subscription Canceled",
        React.createElement(SubscriptionCancelledEmail, {
            name,
            planName,
            effectiveDate,
            accessEndsOn,
        })
    );
};

export const sendWaitlistInviteEmail = async (email: string, name?: string) => {
    return sendEmail(
        email,
        "We are live!",
        React.createElement(WaitlistInviteEmail, { name })
    );
};

