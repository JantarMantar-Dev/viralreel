import { Button, Section, Text, Heading, Hr, Img, Link, Row, Column } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/Layout.js";

interface WelcomeEmailProps {
    userFirstname?: string;
}

export const WelcomeEmail = ({ userFirstname = "there" }: WelcomeEmailProps) => {
    return (
        <EmailLayout preview="Welcome to ViralReel!">
            <Section style={heroSection}>
                <Heading style={heroText}>ViralReel</Heading>
            </Section>

            <Heading style={heading}>Welcome Aboard, {userFirstname}!</Heading>

            <Text style={paragraph}>
                Turn your ideas into videos in seconds with the power of AI.
                We're glad you're here to start creating content that captivates your audience.
            </Text>

            <Row style={featuresContainer}>
                <Column style={featureCard}>
                    <Text style={featureIcon}>🎬</Text>
                    <Heading as="h3" style={featureTitle}>Single Video Generation</Heading>
                    <Text style={featureText}>
                        Generate specific clips instantly from simple text prompts.
                    </Text>
                </Column>
                <Column style={{ width: "20px" }} />
                <Column style={featureCard}>
                    <Text style={featureIcon}>📺</Text>
                    <Heading as="h3" style={featureTitle}>Series Automation</Heading>
                    <Text style={featureText}>
                        Create full video playlists from a single concept automatically.
                    </Text>
                </Column>
            </Row>

            <Section style={btnContainer}>
                <Button style={button} href="https://viralreel.com/dashboard">
                    Launch Dashboard
                </Button>
            </Section>

            <Text style={subtext}>
                Need help getting started? <Link href="https://viralreel.com/docs" style={link}>Read the Quick Start Guide</Link>
            </Text>
        </EmailLayout>
    );
};

export default WelcomeEmail;

const heroSection = {
    height: "200px",
    background: "linear-gradient(135deg, #FF0000 0%, #0000FF 100%, #00FFFF 100%)", // Matching the image gradient roughly
    borderRadius: "8px",
    textAlign: "center" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "32px",
};

const heroText = {
    color: "#ffffff",
    fontSize: "32px",
    fontWeight: "800",
    margin: "0",
    paddingTop: "80px", // Align text somewhat centered vertically
};

const heading = {
    fontSize: "30px",
    fontWeight: "bold",
    textAlign: "center" as const,
    margin: "32px 0 16px",
    color: "#111827",
};

const paragraph = {
    fontSize: "15px",
    lineHeight: "24px",
    color: "#4b5563",
    textAlign: "center" as const,
    margin: "0 0 32px",
};

const featuresContainer = {
    margin: "0 0 32px",
};

const featureCard = {
    backgroundColor: "#ffffff",
    border: "1px solid #f3f4f6",
    borderRadius: "12px",
    padding: "24px",
    width: "50%",
};

const featureIcon = {
    fontSize: "24px",
    margin: "0 0 12px",
};

const featureTitle = {
    fontSize: "16px",
    fontWeight: "bold",
    margin: "0 0 8px",
    color: "#111827",
};

const featureText = {
    fontSize: "13px",
    lineHeight: "20px",
    color: "#6b7280",
    margin: "0",
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
