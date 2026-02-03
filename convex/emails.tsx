"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";
import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Img,
  Hr,
  Preview,
} from "@react-email/components";

const BASE_URL = "https://podeli.rs";

// Brand colors
const colors = {
  accent: "#16a34a", // green-600
  dark: "#1e293b",
  muted: "#64748b",
  light: "#f8fafc",
  border: "#e2e8f0",
};

// Email wrapper component
function EmailWrapper({
  preview,
  children,
}: {
  preview: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: colors.light,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            padding: "20px",
          }}
        >
          {/* Logo */}
          <Section style={{ textAlign: "center", marginBottom: "24px" }}>
            <Img
              src={`${BASE_URL}/images/brand/logo.png`}
              alt="Podeli"
              width="120"
              height="40"
              style={{ margin: "0 auto" }}
            />
          </Section>

          {/* Main content card */}
          <Section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "32px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
          >
            {children}
          </Section>

          {/* Footer */}
          <Section style={{ textAlign: "center", marginTop: "24px" }}>
            <Text
              style={{
                color: colors.muted,
                fontSize: "12px",
                margin: 0,
              }}
            >
              Ovu poruku ste primili jer ste registrovani na Podeli.rs
            </Text>
            <Text
              style={{
                color: colors.muted,
                fontSize: "12px",
                margin: "8px 0 0 0",
              }}
            >
              Podeli.rs - Platforma za iznajmljivanje stvari
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Booking Request Email Template
function BookingRequestEmail({
  ownerName,
  renterName,
  itemTitle,
  startDate,
  endDate,
  totalPrice,
  actionUrl,
}: {
  ownerName: string;
  renterName: string;
  itemTitle: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  actionUrl: string;
}) {
  return (
    <EmailWrapper preview={`Nova rezervacija za "${itemTitle}" od ${renterName}`}>
      <Text
        style={{
          fontSize: "20px",
          fontWeight: "bold",
          color: colors.dark,
          margin: "0 0 16px 0",
        }}
      >
        Nova rezervacija!
      </Text>

      <Text
        style={{
          color: colors.dark,
          fontSize: "15px",
          lineHeight: "24px",
          margin: "0 0 16px 0",
        }}
      >
        Zdravo {ownerName},
      </Text>

      <Text
        style={{
          color: colors.dark,
          fontSize: "15px",
          lineHeight: "24px",
          margin: "0 0 24px 0",
        }}
      >
        <strong>{renterName}</strong> zeli da rezervise vas predmet{" "}
        <strong>&quot;{itemTitle}&quot;</strong>.
      </Text>

      {/* Booking details box */}
      <Section
        style={{
          backgroundColor: colors.light,
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "24px",
        }}
      >
        <Text
          style={{
            color: colors.muted,
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            margin: "0 0 8px 0",
          }}
        >
          Detalji rezervacije
        </Text>
        <Text
          style={{
            color: colors.dark,
            fontSize: "14px",
            margin: "0 0 4px 0",
          }}
        >
          <strong>Predmet:</strong> {itemTitle}
        </Text>
        <Text
          style={{
            color: colors.dark,
            fontSize: "14px",
            margin: "0 0 4px 0",
          }}
        >
          <strong>Period:</strong> {startDate} - {endDate}
        </Text>
        <Text
          style={{
            color: colors.dark,
            fontSize: "14px",
            margin: 0,
          }}
        >
          <strong>Ukupna cena:</strong> {totalPrice.toLocaleString("sr-RS")} RSD
        </Text>
      </Section>

      <Hr style={{ borderColor: colors.border, margin: "24px 0" }} />

      <Button
        href={actionUrl}
        style={{
          backgroundColor: colors.accent,
          borderRadius: "8px",
          color: "#ffffff",
          fontSize: "15px",
          fontWeight: "600",
          textDecoration: "none",
          textAlign: "center" as const,
          display: "block",
          padding: "12px 24px",
        }}
      >
        Pregledaj rezervaciju
      </Button>

      <Text
        style={{
          color: colors.muted,
          fontSize: "13px",
          textAlign: "center" as const,
          margin: "16px 0 0 0",
        }}
      >
        Molimo odgovorite sto pre kako biste potvrdili ili odbili rezervaciju.
      </Text>
    </EmailWrapper>
  );
}

// New Message Email Template
function NewMessageEmail({
  recipientName,
  senderName,
  itemTitle,
  messagePreview,
  actionUrl,
}: {
  recipientName: string;
  senderName: string;
  itemTitle: string;
  messagePreview: string;
  actionUrl: string;
}) {
  return (
    <EmailWrapper preview={`Nova poruka od ${senderName}: "${messagePreview.slice(0, 50)}..."`}>
      <Text
        style={{
          fontSize: "20px",
          fontWeight: "bold",
          color: colors.dark,
          margin: "0 0 16px 0",
        }}
      >
        Nova poruka!
      </Text>

      <Text
        style={{
          color: colors.dark,
          fontSize: "15px",
          lineHeight: "24px",
          margin: "0 0 16px 0",
        }}
      >
        Zdravo {recipientName},
      </Text>

      <Text
        style={{
          color: colors.dark,
          fontSize: "15px",
          lineHeight: "24px",
          margin: "0 0 24px 0",
        }}
      >
        <strong>{senderName}</strong> vam je poslao/la poruku u vezi predmeta{" "}
        <strong>&quot;{itemTitle}&quot;</strong>.
      </Text>

      {/* Message preview box */}
      <Section
        style={{
          backgroundColor: colors.light,
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "24px",
          borderLeft: `4px solid ${colors.accent}`,
        }}
      >
        <Text
          style={{
            color: colors.dark,
            fontSize: "14px",
            fontStyle: "italic",
            margin: 0,
            lineHeight: "22px",
          }}
        >
          &quot;{messagePreview.length > 200 ? messagePreview.slice(0, 200) + "..." : messagePreview}&quot;
        </Text>
      </Section>

      <Hr style={{ borderColor: colors.border, margin: "24px 0" }} />

      <Button
        href={actionUrl}
        style={{
          backgroundColor: colors.accent,
          borderRadius: "8px",
          color: "#ffffff",
          fontSize: "15px",
          fontWeight: "600",
          textDecoration: "none",
          textAlign: "center" as const,
          display: "block",
          padding: "12px 24px",
        }}
      >
        Odgovori na poruku
      </Button>

      <Text
        style={{
          color: colors.muted,
          fontSize: "13px",
          textAlign: "center" as const,
          margin: "16px 0 0 0",
        }}
      >
        Kliknite da biste odgovorili u aplikaciji.
      </Text>
    </EmailWrapper>
  );
}

// Internal action to send booking request email
export const sendBookingRequestEmail = internalAction({
  args: {
    to: v.string(),
    ownerName: v.string(),
    renterName: v.string(),
    itemTitle: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    totalPrice: v.number(),
    actionUrl: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    if (process.env.DISABLE_EMAILS === "true") {
      console.log("[EMAIL DISABLED] Would send booking request email:", {
        to: args.to,
        subject: `Nova rezervacija za "${args.itemTitle}"`,
      });
      return true;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    try {
      const { error } = await resend.emails.send({
        from: "Podeli.rs <obavestenja@updates.podeli.rs>",
        to: args.to,
        subject: `Nova rezervacija za "${args.itemTitle}"`,
        react: (
          <BookingRequestEmail
            ownerName={args.ownerName}
            renterName={args.renterName}
            itemTitle={args.itemTitle}
            startDate={args.startDate}
            endDate={args.endDate}
            totalPrice={args.totalPrice}
            actionUrl={args.actionUrl}
          />
        ),
      });

      if (error) {
        console.error("Failed to send booking request email:", error);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Error sending booking request email:", err);
      return false;
    }
  },
});

// Internal action to send new message email
export const sendNewMessageEmail = internalAction({
  args: {
    to: v.string(),
    recipientName: v.string(),
    senderName: v.string(),
    itemTitle: v.string(),
    messagePreview: v.string(),
    actionUrl: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    if (process.env.DISABLE_EMAILS === "true") {
      console.log("[EMAIL DISABLED] Would send new message email:", {
        to: args.to,
        subject: `Nova poruka od ${args.senderName}`,
      });
      return true;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    try {
      const { error } = await resend.emails.send({
        from: "Podeli.rs <obavestenja@updates.podeli.rs>",
        to: args.to,
        subject: `Nova poruka od ${args.senderName}`,
        react: (
          <NewMessageEmail
            recipientName={args.recipientName}
            senderName={args.senderName}
            itemTitle={args.itemTitle}
            messagePreview={args.messagePreview}
            actionUrl={args.actionUrl}
          />
        ),
      });

      if (error) {
        console.error("Failed to send new message email:", error);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Error sending new message email:", err);
      return false;
    }
  },
});
