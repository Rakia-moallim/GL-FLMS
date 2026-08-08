import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminFirestore } from "../../../../lib/firebase-admin";

export async function DELETE(request: NextRequest) {
  try {
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

    // Verify caller is admin
    const callerDoc = await adminFirestore.collection("users").doc(callerUid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
    }

    const { uid } = await request.json() as { uid: string };
    if (!uid) return NextResponse.json({ error: "uid required" }, { status: 400 });
    if (uid === callerUid) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

    await adminAuth.deleteUser(uid);
    await adminFirestore.collection("users").doc(uid).delete();

    return NextResponse.json({ message: "User deleted" });
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error("delete-user error:", err);
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
