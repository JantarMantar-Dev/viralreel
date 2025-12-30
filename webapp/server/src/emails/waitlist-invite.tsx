import { Button, Section, Text, Heading, Hr, Img, Link, Row, Column } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/Layout.js";

interface WaitlistInviteEmailProps {
    name?: string;
}

export const WaitlistInviteEmail = ({
    name = "there",
}: WaitlistInviteEmailProps) => {
    return (
        <EmailLayout preview="We are live!">
            <Heading style={heading}>We are live!</Heading>

            <Text style={paragraph}>
                Hi {name}, we are excited to announce that we are live!
            </Text>

            <Text style={paragraph}>
                If you see any issues, please raise them through feedback, and we will get to you immediately.
            </Text>

            <Text style={paragraph}>
                Thank you for patiently waiting, your support matters.
            </Text>

            <Section style={btnContainer}>
                <Button style={button} href="https://getviralreel.com">
                    Get Started
                </Button>
            </Section>

            <Text style={subtext}>
                <Link href="https://getviralreel.com" style={link}>viralreel</Link>
            </Text>
        </EmailLayout>
    );
};

export default WaitlistInviteEmail;

const heroSection = {
    backgroundColor: "#F0FDF4", // Light green background
    borderRadius: "8px",
    padding: "40px 0",
    marginBottom: "32px",
    textAlign: "center" as const,
};

const iconCircle = {
    backgroundColor: "#DCFCE7", // Slightly darker green circle
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
    margin: "32px 0 24px",
    color: "#111827",
};

const paragraph = {
    fontSize: "15px",
    lineHeight: "24px",
    color: "#4b5563",
    textAlign: "center" as const,
    margin: "0 0 32px",
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
