console.log("App started");

// Test write to Firestore
db.collection("test").add({
  message: "Hello Firebase",
  time: Date.now()
})
.then(() => {
  console.log("Data written successfully");
})
.catch((error) => {
  console.error("Error writing data:", error);
});
