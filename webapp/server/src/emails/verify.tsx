import { Button, Section, Text, Heading, Hr, Img, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/Layout.js";

interface VerifyEmailProps {
    url: string;
    name?: string;
}

export const VerifyEmail = ({ url, name = "there" }: VerifyEmailProps) => {
    return (
        <EmailLayout preview="Verify Your Email Address">
            <Section style={iconSection}>
                <div style={iconCircle}>
                    <Img
                        src="https://cdn-icons-png.flaticon.com/512/6620/6620925.png"
                        width="40"
                        height="40"
                        alt="Verification"
                        style={icon}
                    />
                </div>
            </Section>

            <Heading style={heading}>Verify Your Email Address</Heading>

            <Text style={paragraph}>Hi {name},</Text>
            <Text style={paragraph}>
                Thanks for signing up for ViralReel! We're excited to have you on board.
                To get started creating amazing videos, please verify your email address by clicking the button below.
            </Text>

            <Section style={btnContainer}>
                <Button style={button} href={url}>
                    Verify Email Address
                </Button>
            </Section>

            <Hr style={innerHr} />

            <Text style={subtext}>
                Button not working? Copy and paste this link into your browser:
            </Text>
            <Link href={url} style={link}>
                {url}
            </Link>

            <Text style={subtextMuted}>
                If you didn't create an account with ViralReel, you can safely ignore this email.
                Your account will not be activated.
            </Text>
        </EmailLayout>
    );
};

export default VerifyEmail;

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

const subtext = {
    fontSize: "13px",
    color: "#6b7280",
    textAlign: "center" as const,
    margin: "0 0 8px",
};

const link = {
    fontSize: "13px",
    color: "#7c3aed",
    textDecoration: "underline",
    textAlign: "center" as const,
    display: "block",
    margin: "0 0 32px",
    wordBreak: "break-all" as const,
};

const subtextMuted = {
    fontSize: "12px",
    color: "#9ca3af",
    textAlign: "center" as const,
    lineHeight: "20px",
    margin: "0",
};
