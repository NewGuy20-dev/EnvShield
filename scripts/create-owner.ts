import { hash } from "bcryptjs";
import prisma from "../lib/db";

// Create Owner account
async function createOwner() {
  const email = "gauthamrkrishna8@gmai@gmail.com";
  const password = "EnvShield@2024!"; // Secure password with uppercase, lowercase, numbers, and special char
  const name = "Owner Account";

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("✅ Owner account already exists:", email);
      return;
    }

    // Hash the password
    const passwordHash = await hash(password, 12);

    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
    });

    console.log("✅ Owner account created successfully!");
    console.log("📧 Email:", email);
    console.log("👤 Name:", name);
    console.log("🔑 Password:", password);
    console.log("🆔 User ID:", user.id);
    console.log("\nPlease save these credentials securely!");
    
  } catch (error) {
    console.error("❌ Error creating owner account:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createOwner();
