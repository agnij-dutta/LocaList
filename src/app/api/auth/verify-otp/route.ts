import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { message: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Find the temporary user
    const tempUser = await db.tempUser.findUnique({
      where: { email }
    });

    if (!tempUser) {
      return NextResponse.json(
        { message: 'No OTP request found for this email' },
        { status: 404 }
      );
    }

    // Check if OTP is expired
    const otpExpiry = new Date(tempUser.otpExpiry);
    if (otpExpiry < new Date()) {
      // Clean up expired temp user
      await db.tempUser.delete({ where: { email } });
      return NextResponse.json(
        { message: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (tempUser.otpCode !== otp) {
      return NextResponse.json(
        { message: 'Invalid OTP' },
        { status: 400 }
      );
    }

    // Check if user already exists (double check)
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // Clean up temp user
      await db.tempUser.delete({ where: { email } });
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 409 }
      );
    }

    // Create the user with data from temp user
    const user = await db.user.create({
      data: {
        name: tempUser.name,
        email: tempUser.email,
        password: tempUser.password,
        phone: tempUser.phone || null,
        isEmailVerified: true,
      }
    });

    // Clean up temp user
    await db.tempUser.delete({ where: { email } });

    return NextResponse.json({
      message: 'Registration completed successfully',
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isEmailVerified: true
      }
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { message: 'Error verifying OTP', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 