import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { sendOTPEmail, generateOTP } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email || !name) {
      return NextResponse.json(
        { message: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists with this email' },
        { status: 409 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store OTP in a temporary table or update user table
    // For now, we'll use a simple approach with a temp users table
    try {
      await db.tempUser.create({
        data: {
          email,
          name,
          otpCode: otp,
          otpExpiry: otpExpiry.toISOString(),
          createdAt: new Date().toISOString(),
        }
      });
    } catch (error) {
      // If user already exists in temp table, update it
      await db.tempUser.update({
        where: { email },
        data: {
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

    return NextResponse.json({
      message: 'OTP sent successfully',
      success: true
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { message: 'Error sending OTP', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 