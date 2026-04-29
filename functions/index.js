const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Configure the email transport using the default SMTP transport and a GMail account.
// For production, use a service like SendGrid, Mailgun, or Postmark.
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;
const mailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

/**
 * Triggered when a new alert is added to the Realtime Database.
 */
exports.sendEmailAlert = functions.database.ref("/alerts/{alertId}")
    .onCreate(async (snapshot, context) => {
      const alertData = snapshot.val();
      const alertId = context.params.alertId;

      console.log(`New alert detected: ${alertId}`, alertData);

      // 1. Determine which home this alert belongs to. 
      // Note: The IoT code currently doesn't include homeID in the alert object path, 
      // but we can infer it or modify the hardware to include it.
      // For now, we'll search the "homes" collection in Firestore to find the email.
      
      try {
        // We assume the alert might have a 'homeId' field. 
        // If not, we'd need to modify the hardware to include it.
        const homeId = alertData.homeId || "100011"; // Fallback for testing

        const homeDoc = await admin.firestore().collection("homes").where("home_id", "==", homeId).get();
        
        if (homeDoc.empty) {
          console.log(`No home found for ID: ${homeId}`);
          return null;
        }

        const userData = homeDoc.docs[0].data();
        const userEmail = userData.email;
        const fcmToken = userData.fcmToken;

        // 2. Send Email Alert (if enabled and email exists)
        if (userEmail && userData.email_alerts !== false) {
          const mailOptions = {
            from: `"GL-FLMS Security" <${gmailEmail}>`,
            to: userEmail,
            subject: `⚠️ EMERGENCY: ${alertData.type} Alert Detected!`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #d9534f;">Critical Alert Detected</h2>
                <p>Hello,</p>
                <p>Our monitoring system has detected a potential hazard at your registered location:</p>
                <div style="background: #f9f9f9; padding: 15px; border-left: 5px solid #d9534f; margin: 20px 0;">
                  <strong>Type:</strong> ${alertData.type}<br>
                  <strong>Description:</strong> ${alertData.desc}<br>
                  <strong>Time:</strong> ${alertData.timestamp}
                </div>
                <p>Please check your mobile dashboard immediately.</p>
              </div>
            `,
          };
          await mailTransport.sendMail(mailOptions);
          console.log(`Email sent to ${userEmail}`);
        }

        // 3. Send Push Notification (if token exists)
        if (fcmToken && userData.push_alerts !== false) {
          const message = {
            notification: {
              title: `⚠️ ${alertData.type} Alert!`,
              body: alertData.desc,
            },
            android: {
              priority: "high",
              notification: {
                channelId: "high_importance_channel",
                priority: "high",
                sound: "default",
                defaultSound: true,
                defaultVibrateTimings: true,
              },
            },
            data: {
              type: alertData.type,
              homeId: homeId,
              click_action: "FLUTTER_NOTIFICATION_CLICK",
            },
            token: fcmToken,
          };

          await admin.messaging().send(message);
          console.log(`High-priority Push notification sent to: ${fcmToken}`);
        }

        return null;
      } catch (error) {
        console.error("Error processing alert:", error);
        return null;
      }
    });
