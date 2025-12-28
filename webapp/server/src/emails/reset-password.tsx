import { Button, Section, Text, Heading, Hr, Img, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/Layout.js";

interface ResetPasswordEmailProps {
    url: string;
    name?: string;
}

export const ResetPasswordEmail = ({ url, name = "there" }: ResetPasswordEmailProps) => {
    return (
        <EmailLayout preview="Reset Your Password">
            <Section style={iconSection}>
                <div style={iconCircle}>
                    <Img
                        src="https://cdn-icons-png.flaticon.com/512/6195/6195696.png"
                        width="40"
                        height="40"
                        alt="Reset Password"
                        style={icon}
                    />
                </div>
            </Section>

            <Heading style={heading}>Reset Your Password</Heading>

            <Text style={paragraph}>Hi {name},</Text>
            <Text style={paragraph}>
                We received a request to reset the password for your account.
                If you made this request, please click the button below to choose a new password.
            </Text>

            <Section style={btnContainer}>
                <Button style={button} href={url}>
                    Reset Password
                </Button>
            </Section>

            <Text style={paragraphSmall}>
                This link will expire in 60 minutes.
            </Text>

            <Hr style={innerHr} />

            <Text style={subtextMuted}>
                If you didn't request a password reset, you can safely ignore this email.
                Your password will not be changed.
            </Text>

            <Text style={subtextMuted}>
                Need help? <Link href="mailto:support@getviralreel.com" style={supportLink}>Contact Support</Link>
            </Text>
        </EmailLayout>
    );
};

export default ResetPasswordEmail;

const iconSection = {
    textAlign: "center" as const,
    padding: "40px 0 24px",
};

const iconCircle = {
    backgroundColor: "#f5f3ff",
    borderRadius: "50%",
    width: "80px",
    height: "80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
};

const icon = {
    margin: "0 auto",
    display: "block",
};

const heading = {
    fontSize: "30px",
    fontWeight: "bold",
    textAlign: "center" as const,
    margin: "0 0 24px",
    color: "#111827",
};

const paragraph = {
    fontSize: "15px",
    lineHeight: "24px",
    color: "#4b5563",
    textAlign: "center" as const,
    margin: "0 0 16px",
};

const paragraphSmall = {
    fontSize: "14px",
    color: "#6b7280",
    textAlign: "center" as const,
    margin: "0 0 16px",
};

const btnContainer = {
    textAlign: "center" as const,
    margin: "32px 0",
};

const button = {
    backgroundColor: "#7c3aed",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "16px 32px",
};

const innerHr = {
    borderColor: "#f3f4f6",
    margin: "32px 0",
};

const subtextMuted = {
    fontSize: "13px",
    color: "#9ca3af",
    textAlign: "center" as const,
    lineHeight: "20px",
    margin: "0 0 8px",
};

const supportLink = {
    color: "#7c3aed",
    textDecoration: "none",
    fontWeight: "600",
};
