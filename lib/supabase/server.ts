import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

/**
 * Derive a consistent key for JWT signing/verification
 * Uses HMAC-SHA256 to ensure hashed secrets work correctly
 */
export function deriveJWTKey(secretKey: string): Uint8Array {
  // If the secret is already hashed (prefixed with "hash:"), use it directly
  if (secretKey.startsWith('hash:')) {
    const hashHex = secretKey.slice(5); // Remove "hash:" prefix
    return new Uint8Array(Buffer.from(hashHex, 'hex'));
  }
  
  // For plaintext secrets (legacy), hash them consistently
  const hash = createHmac('sha256', 'botshield-key-derivation')
    .update(secretKey)
    .digest();
  
  return new Uint8Array(hash);
}

/**
 * Verify a JWT using the derived key
 * Ensures hashed and plaintext secrets both work during migration
 */
export async function verifyProjectSecret(
  providedSecret: string,
  storedSecret: string
): Promise<boolean> {
  // If stored secret is hashed, verify against the hash
  if (storedSecret.startsWith('hash:')) {
    const hash = createHmac('sha256', 'botshield-key-derivation')
      .update(providedSecret)
      .digest('hex');
    return hash === storedSecret.slice(5);
  }
  
  // Legacy plaintext comparison (to be deprecated)
  return providedSecret === storedSecret;
}
