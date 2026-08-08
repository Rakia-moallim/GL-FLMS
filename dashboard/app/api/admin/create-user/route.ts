import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminFirestore } from "../../../../lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    // Verify the caller's ID token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.slice(7);
    let callerUid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      callerUid = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check the caller is an admin
    const callerDoc = await adminFirestore.collection("users").doc(callerUid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role } = body as {
      name: string;
      email: string;
      password: string;
      role: "admin" | "staff";
    };

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create the Firebase Auth user
    const newUser = await adminAuth.createUser({ email, password, displayName: name });

    // Write the Firestore profile
    await adminFirestore.collection("users").doc(newUser.uid).set({
      uid: newUser.uid,
      name,
      email,
      role,
      active: true,
      createdAt: new Date().toISOString(),
      createdBy: callerUid,
    });

    return NextResponse.json({ uid: newUser.uid, message: "User created" }, { status: 201 });
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e.code === "auth/email-already-exists") {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
    console.error("create-user error:", err);
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
