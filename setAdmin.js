const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uid = cxtj0tJ5MHb0YQcWh9XomNdorzw1;

admin.auth().setCustomUserClaims(uid, {
  admin: true
})
.then(() => {
  console.log("Admin claim added successfully");
});
