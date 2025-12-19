import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/Layout.js";

interface VerifyEmailProps {
    url: string;
}

export const VerifyEmail = ({ url }: VerifyEmailProps) => {
    return (
        <EmailLayout preview="Verify your email address">
            <Text style={paragraph}>Hi there,</Text>
            <Text style={paragraph}>
                Please click the button below to verify your email address for ViralReel.
            </Text>
            <Section style={btnContainer}>
                <Button style={button} href={url}>
                    Verify Email
                </Button>
            </Section>
            <Text style={paragraph}>
                If you didn't request this code, you can safely ignore this email.
            </Text>
        </EmailLayout>
    );
};

export default VerifyEmail;

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
