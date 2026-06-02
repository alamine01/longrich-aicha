/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin (server-side only)
if (getApps().length === 0) {
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const adminDb = getFirestore();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const brevoApiKey = process.env.BREVO_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL || email;

    if (!brevoApiKey) {
      return NextResponse.json(
        { error: "Configuration Brevo manquante. Veuillez ajouter BREVO_API_KEY dans les variables d'environnement." },
        { status: 500 }
      );
    }

    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store the code in Firestore (collection "2fa_codes")
    await adminDb.collection("2fa_codes").doc(email).set({
      code,
      expiresAt,
      createdAt: Date.now(),
    });

    // Send the email via Brevo API
    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "Longrich Stockiste",
          email: process.env.BREVO_SENDER_EMAIL || "noreply@longrich-system.com",
        },
        to: [{ email: adminEmail }],
        subject: "🔐 Code de vérification - Longrich Stockiste",
        htmlContent: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #0f172a; font-size: 24px; margin: 0;">Longrich <span style="color: #14b8a6;">Stockiste</span></h1>
              <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Vérification de sécurité</p>
            </div>
            <div style="background: white; border-radius: 12px; padding: 32px; text-align: center; border: 1px solid #e2e8f0;">
              <p style="color: #475569; font-size: 14px; margin: 0 0 16px;">Votre code de connexion est :</p>
              <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 0 auto; display: inline-block;">
                <span style="font-size: 36px; font-weight: 900; letter-spacing: 0.5em; color: #0f172a;">${code}</span>
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">Ce code expire dans <strong>5 minutes</strong>.</p>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 8px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
            </div>
            <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin-top: 24px;">
              &copy; ${new Date().getFullYear()} Longrich Admin System
            </p>
          </div>
        `,
      }),
    });

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.json();
      console.error("Brevo error:", errorData);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email. Vérifiez votre configuration Brevo." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Code envoyé par email." });
  } catch (error: any) {
    console.error("2FA API error:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error.message || "inconnue") },
      { status: 500 }
    );
  }
}
