import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { userRepository } from '@/lib/db';

// GET /api/admin/users/[userId] - Get specific user details
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const currentUser = await requireAdmin();
    const userId = parseInt(params.userId);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    const user = await userRepository.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[userId] - Update user roles and status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const currentUser = await requireAdmin();
    const userId = parseInt(params.userId);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    // Prevent admin from modifying their own account
    if (parseInt(currentUser.id) === userId) {
      return NextResponse.json(
        { error: 'Cannot modify your own account' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { isAdmin, isVerifiedOrganizer, isBanned } = body;
    
    // Validate input
    const updateData: any = {};
    
    if (typeof isAdmin === 'boolean') {
      updateData.isAdmin = isAdmin;
    }
    
    if (typeof isVerifiedOrganizer === 'boolean') {
      updateData.isVerifiedOrganizer = isVerifiedOrganizer;
    }
    
    if (typeof isBanned === 'boolean') {
      updateData.isBanned = isBanned;
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }
    
    const updatedUser = await userRepository.update({
      where: { id: userId },
      data: updateData
    });
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    return NextResponse.json({ 
      user: userWithoutPassword,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[userId] - Delete user account
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const currentUser = await requireAdmin();
    const userId = parseInt(params.userId);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    // Prevent admin from deleting their own account
    if (parseInt(currentUser.id) === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 403 }
      );
    }
    
    // Check if user exists
    const user = await userRepository.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Delete the user
    await userRepository.delete({
      where: { id: userId }
    });
    
    return NextResponse.json({ 
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 