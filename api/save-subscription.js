module.exports = async (req, res) => {
    const { username, subscription } = req.body;
  
    await fetch("https://sheetdb.io/api/v1/niz1x0mjupz2d", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [{ username, subscription: JSON.stringify(subscription) }],
      }),
    });
  
    res.status(200).json({ message: "Subscription saved" });
  };