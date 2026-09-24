import argon2 from 'argon2';

// argon2id with the library's recommended defaults.
export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    // Malformed hash — treat as a failed match rather than a server error.
    return false;
  }
}
