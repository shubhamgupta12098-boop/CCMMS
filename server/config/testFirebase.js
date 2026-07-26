const { db } = require("./firebase");

async function testFirebase() {
  try {
    const docRef = await db.collection("connection_test").add({
      message: "Firebase connected successfully",
      createdAt: new Date(),
    });

    console.log("✅ Firebase connected");
    console.log("Document ID:", docRef.id);
  } catch (error) {
    console.error("❌ Firebase connection failed");
    console.error(error);
  }
}

testFirebase();