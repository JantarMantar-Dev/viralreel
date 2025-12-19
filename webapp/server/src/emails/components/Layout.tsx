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
                        <Text style={logo}>ViralReel</Text>
                    </Section>
                    <Section style={content}>{children}</Section>
                    <Hr style={hr} />
                    <Section style={footer}>
                        <Text style={footerText}>
                            © {new Date().getFullYear()} ViralReel. All rights reserved.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

const main = {
    backgroundColor: "#f6f9fc",
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "20px 0 48px",
    marginBottom: "64px",
};

const header = {
    padding: "0 48px",
};

const logo = {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#333",
};

const content = {
    padding: "0 48px",
};

const hr = {
    borderColor: "#e6ebf1",
    margin: "20px 0",
};

const footer = {
    padding: "0 48px",
};

const footerText = {
    color: "#8898aa",
    fontSize: "12px",
};
