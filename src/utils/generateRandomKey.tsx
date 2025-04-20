import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Generates a cryptographically secure random string (Base64 encoded).
 * @param length The desired length of the random bytes (default: 32 for AES-256).
 * @returns A Base64 encoded random string.
 */
export function generateRandomKey(length: number = 32): string {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    // Convert bytes to Base64 string
    return btoa(String.fromCharCode.apply(null, Array.from(array)));
}