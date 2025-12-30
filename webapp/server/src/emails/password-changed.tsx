import { Button, Section, Text, Heading, Hr, Img, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/Layout.js";

interface PasswordChangedEmailProps {
    userName?: string;
}

export const PasswordChangedEmail = ({ userName }: PasswordChangedEmailProps) => {
    return (
        <EmailLayout preview="Your password has been changed">
            <Section style={iconContainer}>
                <Img
                    src="https://cdn-icons-png.flaticon.com/512/2889/2889676.png"
                    width="48"
                    height="48"
                    alt="Security"
                    style={icon}
                />
            </Section>

            <Heading style={heading}>Password Changed</Heading>

            <Text style={paragraph}>
                Hi {userName || "there"}, this is a confirmation that the password for your ViralReel account has been changed.
            </Text>

            <Text style={paragraph}>
                If you did not make this change, please contact our support team immediately or reset your password.
            </Text>

            <Section style={btnContainer}>
                <Button style={button} href="https://getviralreel.com/reset-password">
                    Reset Password
                </Button>
            </Section>

            <Hr style={divider} />

            <Text style={subtext}>
                If you have any questions, simply reply to this email or contact us at <Link href="mailto:support@getviralreel.com" style={link}>support@getviralreel.com</Link>
            </Text>
        </EmailLayout>
    );
};

export default PasswordChangedEmail;

const iconContainer = {
    textAlign: "center" as const,
    margin: "32px 0 24px",
};

const icon = {
    margin: "0 auto",
    display: "block",
};

const heading = {
    fontSize: "24px",
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
    margin: "0 0 24px",
};

const btnContainer = {
    textAlign: "center" as const,
    margin: "32px 0 32px",
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
    padding: "12px 24px",
};

const divider = {
    borderColor: "#e5e7eb",
    margin: "32px 0",
};

const subtext = {
    fontSize: "14px",
    color: "#6b7280",
    textAlign: "center" as const,
    margin: "0",
};

const link = {
    color: "#7c3aed",
    textDecoration: "none",
    fontWeight: "600",
};
