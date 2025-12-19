import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/Layout.js";

interface WelcomeEmailProps {
    userFirstname?: string;
}

export const WelcomeEmail = ({ userFirstname = "User" }: WelcomeEmailProps) => {
    return (
        <EmailLayout preview="Welcome to ViralReel!">
            <Text style={paragraph}>Hi {userFirstname},</Text>
            <Text style={paragraph}>
                Welcome to ViralReel! We're excited to have you on board.
            </Text>
            <Section style={btnContainer}>
                <Button style={button} href="https://viralreel.com/dashboard">
                    Get Started
                </Button>
            </Section>
            <Text style={paragraph}>
                If you have any questions, feel free to reply to this email.
            </Text>
        </EmailLayout>
    );
};

export default WelcomeEmail;

const paragraph = {
    fontSize: "16px",
    lineHeight: "26px",
    color: "#525f7f",
};

const btnContainer = {
    textAlign: "center" as const,
    margin: "32px 0",
};

const button = {
    backgroundColor: "#000",
    borderRadius: "5px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "12px 24px",
};
