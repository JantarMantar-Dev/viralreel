import {
    Body,
    Container,
    Head,
    Hr,
    Html,
    Img,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";

interface EmailLayoutProps {
    preview?: string;
    children: React.ReactNode;
}

export const EmailLayout = ({ preview, children }: EmailLayoutProps) => {
    return (
        <Html>
            <Head />
            <Preview>{preview || ""}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <div style={logoContainer}>
                            <Text style={logo}>ViralReel</Text>
                        </div>
                    </Section>
                    <Section style={content}>{children}</Section>
                    <Hr style={hr} />
                    <Section style={footer}>
                        <Text style={footerText}>
                            © {new Date().getFullYear()} ViralReel Inc. All rights reserved.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

const main = {
    backgroundColor: "#f4f7f9",
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: "#ffffff",
    margin: "40px auto",
    padding: "0",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    maxWidth: "600px",
    overflow: "hidden",
};

const header = {
    padding: "32px 0 0",
};

const logoContainer = {
    textAlign: "center" as const,
};

const logo = {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#7c3aed", // Purple logo
    margin: "0",
};

const content = {
    padding: "0 40px 40px",
};

const hr = {
    borderColor: "#f0f0f0",
    margin: "0",
};

const footer = {
    padding: "32px 40px",
    backgroundColor: "#fafafa",
    textAlign: "center" as const,
};

const footerText = {
    color: "#9ca3af",
    fontSize: "12px",
    margin: "0",
};
