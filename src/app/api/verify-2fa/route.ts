import { NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase-admin/app";
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
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email et code requis" }, { status: 400 });
    }

    const docRef = adminDb.collection("2fa_codes").doc(email);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Code invalide ou expiré" }, { status: 400 });
    }

    const data = docSnap.data();
    if (!data) {
      return NextResponse.json({ error: "Aucune donnée trouvée" }, { status: 400 });
    }

    // Verify expiration (5 minutes)
    if (Date.now() > data.expiresAt) {
      // Delete expired code
      await docRef.delete();
      return NextResponse.json({ error: "Code expiré" }, { status: 400 });
    }

    // Verify code match
    if (data.code !== code.trim()) {
      return NextResponse.json({ error: "Code de vérification incorrect" }, { status: 400 });
    }

    // Code is correct and valid, delete it so it can't be reused
    await docRef.delete();

    return NextResponse.json({ success: true, message: "Code vérifié avec succès." });
  } catch (error: any) {
    console.error("2FA Verification API error:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error.message || "inconnue") },
      { status: 500 }
    );
  }
}
