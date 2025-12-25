import { Button, Section, Text, Heading, Hr, Img, Link, Row, Column } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/Layout.js";

interface SubscriptionConfirmedEmailProps {
    name?: string;
    planName: string;
    cost: string;
    nextBillingDate: string;
}

export const SubscriptionConfirmedEmail = ({
    name = "there",
    planName,
    cost,
    nextBillingDate,
}: SubscriptionConfirmedEmailProps) => {
    return (
        <EmailLayout preview="Subscription Confirmed!">
            <Section style={imageSection}>
                <Img
                    src="https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=600&auto=format&fit=crop"
                    width="100%"
                    alt="Subscription Confirmed"
                    style={heroImage}
                />
            </Section>

            <Heading style={heading}>Subscription Confirmed!</Heading>

            <Text style={paragraph}>
                Hi {name}, thanks for upgrading to the <strong>{planName}</strong> plan. Your payment was successful, and you've unlocked premium features for your video creation workflow.
            </Text>

            <Section style={tableSection}>
                <Row style={tableRow}>
                    <Column style={tableLabel}>Plan Name</Column>
                    <Column style={tableValue}>{planName}</Column>
                </Row>
                <Hr style={tableHr} />
                <Row style={tableRow}>
                    <Column style={tableLabel}>Cost</Column>
                    <Column style={tableValue}>{cost}</Column>
                </Row>
                <Hr style={tableHr} />
                <Row style={tableRow}>
                    <Column style={tableLabel}>Next Billing Date</Column>
                    <Column style={tableValue}>{nextBillingDate}</Column>
                </Row>
            </Section>

            <Section style={btnContainer}>
                <Button style={button} href="https://viralreel.com/dashboard">
                    Go to Dashboard
                </Button>
            </Section>

            <Text style={subtext}>
                Need to change your plan? <Link href="https://viralreel.com/dashboard/settings" style={link}>Manage Subscription</Link>
            </Text>
        </EmailLayout>
    );
};

export default SubscriptionConfirmedEmail;

const imageSection = {
    padding: "0",
};

const heroImage = {
    borderRadius: "8px",
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

const tableSection = {
    backgroundColor: "#ffffff",
    border: "1px solid #f3f4f6",
    borderRadius: "12px",
    padding: "16px 24px",
    margin: "0 0 32px",
};

const tableRow = {
    height: "44px",
};

const tableLabel = {
    fontSize: "14px",
    color: "#6b7280",
};

const tableValue = {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#111827",
    textAlign: "right" as const,
};

const tableHr = {
    borderColor: "#f3f4f6",
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
