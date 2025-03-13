const webpush = require("web-push");

// VAPID kalitlari Vercel env variable sifatida qo‘shiladi
webpush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

module.exports = async (req, res) => {
  const { title, body } = req.body;

  // Google Sheets dan barcha subscriptionlarni olish
  const response = await fetch("https://sheetdb.io/api/v1/niz1x0mjupz2d");
  const users = await response.json();

  const subscriptions = users
    .filter((user) => user.subscription)
    .map((user) => JSON.parse(user.subscription));

  // Har bir foydalanuvchiga push notification yuborish
  const pushPromises = subscriptions.map((subscription) =>
    webpush.sendNotification(subscription, JSON.stringify({ title, body })).catch((error) =>
      console.error("Push error:", error)
    )
  );

  await Promise.all(pushPromises);
  res.status(200).json({ message: "Push notifications sent" });
};