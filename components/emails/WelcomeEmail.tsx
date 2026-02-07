import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Img,
  Preview,
  Link,
} from "@react-email/components";

const BASE_URL = "https://podeli.rs";
const DISCORD_INVITE = "https://discord.gg/69MBaCTEnz";

const colors = {
  accent: "#f0a202",
  dark: "#02020a",
  muted: "#64748b",
  light: "#f8f7ff",
  blue: "#006992",
};

interface WelcomeEmailProps {
  name: string;
}

export function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Dobrodošli na podeli.rs, {name}!</Preview>
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
              Dobrodošli, {name}!
            </Text>

            <Text
              style={{
                fontSize: "15px",
                color: colors.dark,
                lineHeight: "1.6",
                margin: "0 0 16px 0",
              }}
            >
              Hvala vam što ste se pridružili platformi podeli.rs! Drago nam je
              što ste tu.
            </Text>

            <Text
              style={{
                fontSize: "15px",
                color: colors.dark,
                lineHeight: "1.6",
                margin: "0 0 16px 0",
              }}
            >
              Platforma je još uvek u ranoj fazi razvoja i svaki predlog je
              dobrodošao. Ako imate ideje, sugestije ili povratne informacije,
              voleli bismo da ih čujemo!
            </Text>

            <Text
              style={{
                fontSize: "15px",
                color: colors.dark,
                lineHeight: "1.6",
                margin: "0 0 24px 0",
              }}
            >
              Pridružite se našoj Discord zajednici gde možemo direktno da
              popričamo:
            </Text>

            <Section style={{ textAlign: "center", marginBottom: "24px" }}>
              <Link
                href={DISCORD_INVITE}
                style={{
                  backgroundColor: colors.accent,
                  color: "#ffffff",
                  fontSize: "16px",
                  fontWeight: "bold",
                  textDecoration: "none",
                  borderRadius: "8px",
                  padding: "12px 32px",
                  display: "inline-block",
                }}
              >
                Pridružite se na Discordu
              </Link>
            </Section>

            <Text
              style={{
                fontSize: "14px",
                color: colors.muted,
                lineHeight: "1.5",
                margin: 0,
              }}
            >
              Ili nas kontaktirajte na{" "}
              <Link
                href="mailto:office@podeli.rs"
                style={{ color: colors.blue }}
              >
                office@podeli.rs
              </Link>
            </Text>
          </Section>

          <Section style={{ textAlign: "center", marginTop: "24px" }}>
            <Text
              style={{
                color: colors.muted,
                fontSize: "12px",
                margin: 0,
              }}
            >
              Podeli.rs - Delimo zajedno
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
