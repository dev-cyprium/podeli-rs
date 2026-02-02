import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Img,
  Preview,
} from "@react-email/components";

const BASE_URL = "https://podeli.rs";

const colors = {
  accent: "#16a34a",
  dark: "#1e293b",
  muted: "#64748b",
  light: "#f8fafc",
};

interface NewUserEmailProps {
  name: string;
  email: string;
  userId: string;
  timestamp: string;
}

export function NewUserEmail({
  name,
  email,
  userId,
  timestamp,
}: NewUserEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Novi korisnik: {name} ({email})
      </Preview>
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
          <Section style={{ textAlign: "center", marginBottom: "24px" }}>
            <Img
              src={`${BASE_URL}/images/brand/logo.png`}
              alt="Podeli"
              width="120"
              height="40"
              style={{ margin: "0 auto" }}
            />
          </Section>

          <Section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "32px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Text
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: colors.dark,
                margin: "0 0 16px 0",
              }}
            >
              Novi korisnik se registrovao
            </Text>

            <Section
              style={{
                backgroundColor: colors.light,
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              <Text
                style={{
                  color: colors.dark,
                  fontSize: "14px",
                  margin: "0 0 8px 0",
                }}
              >
                <strong>Ime:</strong> {name}
              </Text>
              <Text
                style={{
                  color: colors.dark,
                  fontSize: "14px",
                  margin: "0 0 8px 0",
                }}
              >
                <strong>Email:</strong> {email}
              </Text>
              <Text
                style={{
                  color: colors.dark,
                  fontSize: "14px",
                  margin: "0 0 8px 0",
                }}
              >
                <strong>ID:</strong> {userId}
              </Text>
              <Text
                style={{
                  color: colors.dark,
                  fontSize: "14px",
                  margin: 0,
                }}
              >
                <strong>Vreme:</strong> {timestamp}
              </Text>
            </Section>
          </Section>

          <Section style={{ textAlign: "center", marginTop: "24px" }}>
            <Text
              style={{
                color: colors.muted,
                fontSize: "12px",
                margin: 0,
              }}
            >
              Admin obavestenje - Podeli.rs
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
