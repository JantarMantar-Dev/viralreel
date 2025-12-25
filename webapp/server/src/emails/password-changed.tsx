import { Text, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/Layout.js";

interface PasswordChangedEmailProps {
    userName?: string;
}

export const PasswordChangedEmail = ({ userName }: PasswordChangedEmailProps) => {
    return (
        <EmailLayout preview="Your password has been changed">
            <Text style={paragraph}>Hi {userName || "there"},</Text>
            <Text style={paragraph}>
                This is a confirmation that the password for your ViralReel account has been changed.
            </Text>
            <Text style={paragraph}>
                If you did not make this change, please contact our support team immediately or reset your password.
            </Text>
            <Text style={paragraph}>
                Best,<br />
                The ViralReel Team
            </Text>
        </EmailLayout>
    );
};

export default PasswordChangedEmail;

const paragraph = {
    fontSize: "16px",
    lineHeight: "26px",
    color: "#525f7f",
};
