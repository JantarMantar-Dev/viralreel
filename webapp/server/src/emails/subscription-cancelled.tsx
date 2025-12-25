import { Button, Section, Text, Heading, Hr, Img, Link, Row, Column } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/Layout.js";

interface SubscriptionCancelledEmailProps {
    name?: string;
    planName: string;
    effectiveDate: string;
    accessEndsOn: string;
}

export const SubscriptionCancelledEmail = ({
    name = "there",
    planName,
    effectiveDate,
    accessEndsOn,
}: SubscriptionCancelledEmailProps) => {
    return (
        <EmailLayout preview="Subscription Cancellation">
            <Hr style={topDivider} />

            <Heading style={heading}>Subscription Canceled</Heading>

            <Text style={paragraph}>
                Hi {name}, we've received your request to cancel your <strong>{planName}</strong> subscription.
                We're sorry to see you go!
            </Text>

            <Section style={tableSection}>
                <Row style={tableRow}>
                    <Column style={tableLabel}>Plan Name</Column>
                    <Column style={tableValue}>{planName}</Column>
                </Row>
                <Hr style={tableHr} />
                <Row style={tableRow}>
                    <Column style={tableLabel}>Effective Date</Column>
                    <Column style={tableValue}>{effectiveDate}</Column>
                </Row>
                <Hr style={tableHr} />
                <Row style={tableRow}>
                    <Column style={tableLabel}>Access Ends On</Column>
                    <Column style={tableValue}>{accessEndsOn}</Column>
                </Row>
            </Section>

            <Text style={subtext}>
                You will continue to have full access to premium features until the end of your current billing cycle.
                No further charges will be applied to your payment method.
            </Text>

            <Hr style={divider} />

            <Text style={subtextBold}>
                CHANGED YOUR MIND?
            </Text>

            <Section style={btnContainer}>
                <Button style={button} href="https://viralreel.com/dashboard/settings">
                    Reactivate Subscription
                </Button>
            </Section>

            <Text style={subtextSmall}>
                Help us improve by telling us why you left. <Link href="https://viralreel.com/feedback" style={link}>Give Feedback</Link>
            </Text>
        </EmailLayout>
    );
};

export default SubscriptionCancelledEmail;

const topDivider = {
    borderColor: "#e5e7eb",
    margin: "0 0 32px",
    borderTopWidth: "4px",
    borderTopStyle: "solid" as const,
    width: "100%",
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

const tableSection = {
    backgroundColor: "#ffffff",
    border: "1px solid #f3f4f6",
    borderRadius: "12px",
    padding: "16px 24px",
    margin: "0 0 24px",
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

const subtext = {
    fontSize: "13px",
    lineHeight: "20px",
    color: "#6b7280",
    textAlign: "center" as const,
    margin: "0 0 32px",
    maxWidth: "480px",
    marginLeft: "auto",
    marginRight: "auto",
};

const divider = {
    borderColor: "#e5e7eb",
    margin: "0 0 32px",
    borderStyle: "dashed" as const,
};

const subtextBold = {
    fontSize: "12px",
    fontWeight: "bold",
    color: "#9ca3af",
    textAlign: "center" as const,
    margin: "0 0 16px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
};

const btnContainer = {
    textAlign: "center" as const,
    margin: "0 0 24px",
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

const subtextSmall = {
    fontSize: "13px",
    color: "#6b7280",
    textAlign: "center" as const,
    margin: "0",
};

const link = {
    color: "#7c3aed",
    textDecoration: "none",
    fontWeight: "600",
};
