"use client";

// A simple encryption/decryption utility for client-side storage
// Note: This is not meant for high-security applications
// For production, consider using a more secure approach

// Generate a random encryption key if not already present
function getEncryptionKey() {
	let key = localStorage.getItem("encryption_key");
	if (!key) {
		// Generate a random key
		const array = new Uint8Array(16);
		window.crypto.getRandomValues(array);
		key = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
			"",
		);
		localStorage.setItem("encryption_key", key);
	}
	return key;
}

// Simple XOR encryption
export async function encrypt(text: string): Promise<string> {
	const key = getEncryptionKey();
	const textBytes = new TextEncoder().encode(text);
	const keyBytes = new TextEncoder().encode(key);

	const encrypted = new Uint8Array(textBytes.length);
	for (let i = 0; i < textBytes.length; i++) {
		encrypted[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
	}

	return Array.from(encrypted, (byte) =>
		byte.toString(16).padStart(2, "0"),
	).join("");
}

// Simple XOR decryption
export async function decrypt(encryptedHex: string): Promise<string> {
	const key = getEncryptionKey();
	const keyBytes = new TextEncoder().encode(key);

	const encryptedBytes = new Uint8Array(
		encryptedHex.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16)),
	);
	const decrypted = new Uint8Array(encryptedBytes.length);

	for (let i = 0; i < encryptedBytes.length; i++) {
		decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
	}

	return new TextDecoder().decode(decrypted);
}
