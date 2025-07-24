// Debug utility to diagnose passphrase privacy issues
import { deriveUserId, setUser, logout } from "./tinybase-store";
import { generateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";

// Test if different passphrases generate different user IDs
export const testPassphraseUniqueness = async (passphrases: string[]) => {
  console.log("🔍 Testing Passphrase Uniqueness");
  console.log("=".repeat(60));

  const results: Array<{ passphrase: string; userId?: string; error?: string }> = [];

  for (const passphrase of passphrases) {
    try {
      const userId = await deriveUserId(passphrase);
      results.push({ passphrase, userId });
      console.log(`✅ "${passphrase}" → ${userId}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.push({ passphrase, error: errorMsg });
      console.log(`❌ "${passphrase}" → ERROR: ${errorMsg}`);
    }
  }

  console.log("\n📊 Analysis:");

  // Check for duplicates among successful derivations
  const successfulResults = results.filter(r => r.userId);
  const userIds = successfulResults.map(r => r.userId);
  const uniqueUserIds = new Set(userIds);

  if (uniqueUserIds.size !== userIds.length) {
    console.log("🚨 PRIVACY ISSUE: Found duplicate user IDs!");
    const duplicates = userIds.filter((id, index) => userIds.indexOf(id) !== index);
    console.log("Duplicate IDs:", duplicates);
  } else if (successfulResults.length > 1) {
    console.log("✅ All successful passphrases generated unique user IDs");
  }

  console.log(`📈 Success rate: ${successfulResults.length}/${passphrases.length}`);
  console.log("=".repeat(60));

  return results;
};

// Test common invalid passphrase patterns that users might enter
export const testCommonInvalidPatterns = async () => {
  console.log("🧪 Testing Common Invalid Passphrase Patterns");
  console.log("=".repeat(60));

  const invalidPatterns = [
    "password123",
    "my secret password",
    "hello world test",
    "admin admin admin",
    "one two three four five six seven eight nine ten eleven twelve",
    "word word word word word word word word word word word word",
    "test test test test test test test test test test test test",
    "",
    " ",
    "a b c d e f g h i j k l",
  ];

  await testPassphraseUniqueness(invalidPatterns);
};

// Generate and test valid BIP39 passphrases
export const testValidBIP39Passphrases = async (count = 5) => {
  console.log(`🎲 Testing ${count} Valid BIP39 Passphrases`);
  console.log("=".repeat(60));

  const validPassphrases = Array(count).fill(0).map(() =>
    generateMnemonic(wordlist, 128) // 12 words
  );

  await testPassphraseUniqueness(validPassphrases);
};

// Test the full user flow to see where data isolation might break
export const testUserSwitchingFlow = async () => {
  console.log("🔄 Testing User Switching Flow");
  console.log("=".repeat(60));

  const passphrase1 = generateMnemonic(wordlist, 128);
  const passphrase2 = generateMnemonic(wordlist, 128);

  console.log("Step 1: Set user 1");
  console.log(`Passphrase: ${passphrase1}`);
  await setUser(passphrase1);
  const userId1 = localStorage.getItem("bucket-userId");
  console.log(`User ID: ${userId1}`);
  console.log(`Storage key: bucket-data-${userId1}`);

  console.log("\nStep 2: Logout");
  await logout();
  console.log("Logged out");

  console.log("\nStep 3: Set user 2");
  console.log(`Passphrase: ${passphrase2}`);
  await setUser(passphrase2);
  const userId2 = localStorage.getItem("bucket-userId");
  console.log(`User ID: ${userId2}`);
  console.log(`Storage key: bucket-data-${userId2}`);

  console.log("\n📊 Analysis:");
  if (userId1 === userId2) {
    console.log("🚨 PRIVACY ISSUE: Same user ID for different passphrases!");
  } else {
    console.log("✅ Different user IDs for different passphrases");
  }

  console.log("=".repeat(60));
};

// Check what's currently in localStorage
export const inspectLocalStorage = () => {
  console.log("🔍 LocalStorage Inspection");
  console.log("=".repeat(60));

  const bucketKeys: string[] = [];
  const allKeys: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      allKeys.push(key);
      if (key.startsWith("bucket-")) {
        bucketKeys.push(key);
      }
    }
  }

  console.log("📦 Bucket-related keys:");
  bucketKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (key.includes("data-")) {
      console.log(`  ${key}: ${value ? `${value.length} chars` : 'null'}`);
    } else {
      console.log(`  ${key}: ${value}`);
    }
  });

  if (bucketKeys.length === 0) {
    console.log("  (no bucket keys found)");
  }

  console.log(`\n📊 Total keys: ${allKeys.length}, Bucket keys: ${bucketKeys.length}`);
  console.log("=".repeat(60));
};

// Main diagnostic function
export const diagnosePrivacyIssue = async () => {
  console.log("🩺 BUCKET PRIVACY DIAGNOSTIC");
  console.log("=".repeat(60));

  // 1. Check current state
  inspectLocalStorage();

  // 2. Test valid BIP39 passphrases
  await testValidBIP39Passphrases(3);

  // 3. Test invalid patterns
  await testCommonInvalidPatterns();

  // 4. Test user switching
  await testUserSwitchingFlow();

  // 5. Final inspection
  inspectLocalStorage();

  console.log("\n🎯 RECOMMENDATIONS:");
  console.log("1. Only use valid BIP39 12-word or 24-word passphrases");
  console.log("2. Generate passphrases using the app's 'Create New' button");
  console.log("3. Avoid typing random words - they likely aren't valid BIP39");
  console.log("4. If you see errors, the passphrase is invalid (this is good!)");
  console.log("5. Different valid passphrases should always give different data");
};

// Expose functions to window for easy console access
if (typeof window !== "undefined") {
  (window as any).testPassphraseUniqueness = testPassphraseUniqueness;
  (window as any).testCommonInvalidPatterns = testCommonInvalidPatterns;
  (window as any).testValidBIP39Passphrases = testValidBIP39Passphrases;
  (window as any).testUserSwitchingFlow = testUserSwitchingFlow;
  (window as any).inspectLocalStorage = inspectLocalStorage;
  (window as any).diagnosePrivacyIssue = diagnosePrivacyIssue;
}
