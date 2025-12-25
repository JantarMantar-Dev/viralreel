import { Button, Section, Text, Heading, Img, Link, Row, Column } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/Layout.js";

interface VideoReadyEmailProps {
    name?: string;
    videoTitle: string;
    thumbnailUrl: string;
    videoUrl: string;
    videoDuration?: string;
}

export const VideoReadyEmail = ({
    name = "there",
    videoTitle,
    thumbnailUrl,
    videoUrl,
    videoDuration = "00:00",
}: VideoReadyEmailProps) => {
    return (
        <EmailLayout preview="Your video is ready!">
            <Section style={videoSection}>
                <div style={thumbnailContainer}>
                    <Img
                        src={thumbnailUrl}
                        width="100%"
                        alt="Video Thumbnail"
                        style={thumbnail}
                    />
                    <div style={playButtonOverlay}>
                        <Img
                            src="https://cdn-icons-png.flaticon.com/512/0/375.png"
                            width="48"
                            height="48"
                            alt="Play"
                            style={playIcon}
                        />
                    </div>
                    <div style={durationBadge}>
                        {videoDuration}
                    </div>
                </div>
            </Section>

            <Heading style={heading}>Your video is ready!</Heading>

            <Text style={paragraph}>
                Good news, {name}! Your video project <strong>"{videoTitle}"</strong> has been successfully generated and is waiting for you in your dashboard.
            </Text>

            <Section style={btnContainer}>
                <Button style={button} href={videoUrl}>
                    Watch Video
                </Button>
            </Section>

            <Text style={subtext}>
                WHAT WOULD YOU LIKE TO DO NEXT?
            </Text>

            <Row style={actionsContainer}>
                <Column style={actionCard}>
                    <Img
                        src="https://cdn-icons-png.flaticon.com/512/1159/1159633.png"
                        width="24"
                        height="24"
                        alt="Edit"
                        style={actionIcon}
                    />
                    <Heading as="h3" style={actionTitle}>Edit Video</Heading>
                    <Text style={actionText}>
                        Refine clips or update text
                    </Text>
                </Column>
                <Column style={{ width: "20px" }} />
                <Column style={actionCard}>
                    <Img
                        src="https://cdn-icons-png.flaticon.com/512/2958/2958791.png"
                        width="24"
                        height="24"
                        alt="Share"
                        style={actionIcon}
                    />
                    <Heading as="h3" style={actionTitle}>Share & Export</Heading>
                    <Text style={actionText}>
                        Download or post to social
                    </Text>
                </Column>
            </Row>

            <Text style={footerLink}>
                Having trouble viewing? <Link href={videoUrl} style={link}>View in browser</Link> or <Link href="mailto:support@getviralreel.com" style={link}>Contact Support</Link>
            </Text>
        </EmailLayout>
    );
};

export default VideoReadyEmail;

const videoSection = {
    padding: "0",
    marginBottom: "32px",
};

const thumbnailContainer = {
    position: "relative" as const,
    borderRadius: "8px",
    overflow: "hidden",
};

const thumbnail = {
    width: "100%",
    borderRadius: "8px",
    display: "block",
};

const playButtonOverlay = {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: "50%",
    width: "80px",
    height: "80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
};

const playIcon = {
    opacity: 0.8,
};

const durationBadge = {
    position: "absolute" as const,
    bottom: "12px",
    right: "12px",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    color: "#ffffff",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
};

const heading = {
    fontSize: "30px",
    fontWeight: "bold",
    textAlign: "center" as const,
    margin: "0 0 16px",
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
    margin: "0 0 40px",
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
    fontSize: "12px",
    fontWeight: "600",
    color: "#9ca3af",
    textAlign: "center" as const,
    margin: "0 0 24px",
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
};

const actionsContainer = {
    margin: "0 0 32px",
};

const actionCard = {
    backgroundColor: "#ffffff",
    border: "1px solid #f3f4f6",
    borderRadius: "12px",
    padding: "24px",
    width: "50%",
    textAlign: "center" as const,
};

const actionIcon = {
    margin: "0 auto 12px",
    opacity: 0.6,
};

const actionTitle = {
    fontSize: "14px",
    fontWeight: "bold",
    margin: "0 0 8px",
    color: "#111827",
};

const actionText = {
    fontSize: "12px",
    lineHeight: "18px",
    color: "#6b7280",
    margin: "0",
};

const footerLink = {
    fontSize: "13px",
    color: "#9ca3af",
    textAlign: "center" as const,
    margin: "0",
};

const link = {
    color: "#7c3aed",
    textDecoration: "none",
    fontWeight: "600",
};
