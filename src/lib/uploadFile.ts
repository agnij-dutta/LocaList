import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Define allowed file types
const allowedFileTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

// Maximum file size (5MB)
const maxFileSize = 5 * 1024 * 1024;

export async function uploadFile(file: File): Promise<string | null> {
  try {
    // Validate file type
    if (!allowedFileTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only images are allowed.');
    }
    
    // Validate file size
    if (file.size > maxFileSize) {
      throw new Error('File size exceeds the 5MB limit.');
    }
    
    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = `${uuidv4()}.${fileExtension}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    const filePath = path.join(uploadDir, fileName);
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Write file to server
    fs.writeFileSync(filePath, buffer);
    
    // Return the relative path for storing in the database
    return fileName;
  } catch (error) {
    console.error('File upload error:', error);
    return null;
  }
}

export function deleteFile(fileName: string): boolean {
  try {
    const filePath = path.join(process.cwd(), 'public/uploads', fileName);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('File deletion error:', error);
    return false;
  }
} 