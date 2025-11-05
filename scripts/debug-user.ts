import prisma from "../lib/db";
import { compare } from "bcryptjs";

async function debugUser() {
  const email = "gauthamrkrishna8@gmai@gmail.com";
  const testPassword = "EnvShield@2024!";

  try {
    console.log("🔍 Debugging user login issue...");
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("❌ User not found in database");
      return;
    }

    console.log("✅ User found:");
    console.log("📧 Email:", user.email);
    console.log("👤 Name:", user.name);
    console.log("🆔 ID:", user.id);
    console.log("📅 Created:", user.createdAt);
    
    if (!user.passwordHash) {
      console.log("🔐 Password hash: Not set (OAuth-only user)");
      return;
    }
    
    console.log("🔐 Password hash length:", user.passwordHash.length);
    
    // Test password comparison
    console.log("\n🔑 Testing password comparison...");
    const passwordMatch = await compare(testPassword, user.passwordHash);
    console.log("Password match result:", passwordMatch);
    
    if (passwordMatch) {
      console.log("✅ Password verification successful - login should work");
    } else {
      console.log("❌ Password verification failed - this explains the 401 error");
    }
    
  } catch (error) {
    console.error("❌ Debug error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUser();
