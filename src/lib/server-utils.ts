import bcrypt from "bcrypt";

// Hash password for storage
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

// Compare password with hash
export async function comparePassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword);
} 