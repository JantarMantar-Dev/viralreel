import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
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

// Create an SES client using credentials from environment variables
const sesClient = new SESClient({
    region: process.env.AMZ_SES_AWS_REGION || "us-east-2",
    credentials: {
        accessKeyId: process.env.AMZ_SES_ACCESS_KEY || "",
        secretAccessKey: process.env.AMZ_SES_SECRET_KEY || "",
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
 * Generic function to send an email using Amazon SES.
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
            return { success: true };
        }

        const command = new SendEmailCommand({
            Destination: {
                ToAddresses: [recipient],
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: emailHtml,
                    },
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: finalSubject,
                },
            },
            Source: FROM_EMAIL,
        });

        const response = await sesClient.send(command);
        console.log(`Email sent to ${recipient} with subject: ${finalSubject}. MessageId: ${response.MessageId}`);

        return { success: true, data: response };
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

