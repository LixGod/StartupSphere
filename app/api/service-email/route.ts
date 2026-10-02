import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// SMTP config (Gmail example – use App Password)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,   // youraddress@gmail.com
    pass: process.env.SMTP_PASS,   // 16-char App Password
  },
});

// Recipients are selected based on service type in the POST handler

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { service, userEmail, phone, location, time, description, budget } = body;

    const subject = service === "shoot"
      ? "New Reel-Shoot Request"
      : "New Strategy Request";

    const html = `
      <h2>${subject}</h2>
      <ul>
        <li><strong>Service:</strong> ${service}</li>
        <li><strong>User e-mail:</strong> ${userEmail}</li>
        <li><strong>Phone:</strong> ${phone}</li>
        <li><strong>Location:</strong> ${location}</li>
        <li><strong>Preferred time:</strong> ${time}</li>
        ${budget ? `<li><strong>Budget:</strong> ${budget}</li>` : ""}
        <li><strong>Description:</strong> ${description}</li>
      </ul>
    `;

    const recipient = service === "shoot" 
      ? process.env.REEL_SHOOT_EMAIL 
      : process.env.REEL_STRATEGY_EMAIL;

    const finalRecipient = recipient || "adnanrampurawala99@gmail.com";

    await transporter.sendMail({
      from: `"Startup Sphere" <${process.env.SMTP_USER}>`,
      to: finalRecipient,
      subject,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Service e-mail error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}