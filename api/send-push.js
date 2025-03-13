const webpush = require("web-push");

webpush.setVapidDetails(
  "mailto:sweulugek@gmail.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

module.exports = async (req, res) => {
  const { title, body } = req.body;

  const response = await fetch("https://sheetdb.io/api/v1/niz1x0mjupz2d");
  const users = await response.json();
  console.log("Users from Google Sheets:", users);

  const subscriptions = users
    .filter((user) => user.subscription)
    .map((user) => JSON.parse(user.subscription));
  console.log("Subscriptions:", subscriptions);

  const pushPromises = subscriptions.map((subscription) =>
    webpush
      .sendNotification(subscription, JSON.stringify({ title, body }))
      .catch((error) => console.error("Push error for subscription:", error))
  );

  await Promise.all(pushPromises);
  res.status(200).json({ message: "Push notifications sent" });
};