import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { hashPassword } from "@/lib/server-utils";
import { sendOTPEmail, generateOTP } from "@/lib/email";
import { z } from "zod";

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().nullable(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate input data
    const validationResult = registerSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { message: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { name, email, phone, password } = validationResult.data;
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store user data temporarily with OTP
    try {
      await db.tempUser.create({
        data: {
          email,
          name,
          password: hashedPassword,
          phone,
          otpCode: otp,
          otpExpiry: otpExpiry.toISOString(),
          createdAt: new Date().toISOString(),
        }
      });
    } catch (error) {
      // If temp user already exists, update it
      await db.tempUser.update({
        where: { email },
      data: {
        name,
          password: hashedPassword,
        phone,
          otpCode: otp,
          otpExpiry: otpExpiry.toISOString(),
          updatedAt: new Date().toISOString(),
        }
      });
    }

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, name);

    if (!emailResult.success) {
      return NextResponse.json(
        { message: 'Failed to send OTP email' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: "OTP sent to your email. Please verify to complete registration." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 