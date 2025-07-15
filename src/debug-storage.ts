// Debug helper to inspect localStorage and test logout behavior
export const debugStorage = () => {
  console.log("🔍 LocalStorage Debug:");
  console.log("=".repeat(50));

  const bucketKeys: string[] = [];
  const otherKeys: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      if (key.startsWith("bucket-")) {
        bucketKeys.push(key);
      } else {
        otherKeys.push(key);
      }
    }
  }

  console.log("📦 Bucket keys:");
  bucketKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (key.includes("data")) {
      console.log(`  ${key}: ${value ? `${value.length} chars` : 'null'}`);
    } else {
      console.log(`  ${key}: ${value}`);
    }
  });

  console.log(`\n🔧 Other keys: ${otherKeys.length} items`);

  console.log(`\n📊 Total localStorage usage: ${JSON.stringify(localStorage).length} chars`);
  console.log("=".repeat(50));
};

// Test logout behavior
export const testLogout = async () => {
  console.log("🧪 Testing logout behavior...");

  // Log storage before logout
  console.log("📸 Before logout:");
  debugStorage();

  // Import logout function
  const { logout } = await import("./tinybase-store");

  // Perform logout
  await logout();

  // Log storage after logout
  console.log("\n📸 After logout:");
  debugStorage();
};

// Test user switching
export const testUserSwitch = async (newPassphrase: string) => {
  console.log("🔄 Testing user switch...");

  // Log storage before switch
  console.log("📸 Before user switch:");
  debugStorage();

  // Import setUser function
  const { setUser } = await import("./tinybase-store");

  // Switch user
  const userId = await setUser(newPassphrase);
  console.log(`✅ Switched to user: ${userId}`);

  // Log storage after switch
  console.log("\n📸 After user switch:");
  debugStorage();
};

// Expose to window for easy console access
if (typeof window !== "undefined") {
  (window as any).debugStorage = debugStorage;
  (window as any).testLogout = testLogout;
  (window as any).testUserSwitch = testUserSwitch;
}
