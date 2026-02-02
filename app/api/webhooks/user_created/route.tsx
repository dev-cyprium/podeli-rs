import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/backend/webhooks";
import { Resend } from "resend";
import { NewUserEmail } from "@/components/emails/NewUserEmail";

const NOTIFY_ADMINS = ["office@podeli.rs"];

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const evt = await verifyWebhook(request);

    if (evt.type === "user.created") {
      const user = evt.data;
      const email = user.email_addresses?.[0]?.email_address ?? "N/A";
      const name =
        [user.first_name, user.last_name].filter(Boolean).join(" ") ||
        "Nije uneto";

      await resend.emails.send({
        from: "Podeli.rs <obavestenja@updates.podeli.rs>",
        to: NOTIFY_ADMINS,
        subject: "Novi korisnik se registrovao",
        react: (
          <NewUserEmail
            name={name}
            email={email}
            userId={user.id}
            timestamp={new Date().toLocaleString("sr-RS")}
          />
        ),
      });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
