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

    // Check if user already exists (completed registration)
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists with this email' },
        { status: 409 }
      );
    }

    // Check if there's already a temp user (for resend case)
    const existingTempUser = await db.tempUser.findUnique({
      where: { email }
    });

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    if (existingTempUser) {
      // Update existing temp user with new OTP (resend case)
      await db.tempUser.update({
        where: { email },
        data: {
          otpCode: otp,
          otpExpiry: otpExpiry.toISOString(),
          updatedAt: new Date().toISOString(),
        }
      });
    } else {
      // This shouldn't happen in normal flow since temp user is created during registration
      // But we'll handle it just in case
      await db.tempUser.create({
        data: {
          email,
          name,
          otpCode: otp,
          otpExpiry: otpExpiry.toISOString(),
          createdAt: new Date().toISOString(),
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