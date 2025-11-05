import { Router } from "express";

export const decryptRouter = Router();

let latestSignal: any = null;

// Update latest signal from frontend
decryptRouter.post("/signal-update", (req, res) => {
  latestSignal = req.body;
  res.json({ success: true });
});

// Get latest signal
decryptRouter.get("/latest-signal", (req, res) => {
  if (!latestSignal)
    return res.status(400).json({ message: "No live signal available" });

  res.json({ success: true, latestSignal });
});

// Decrypt endpoint
decryptRouter.post("/", async (req, res) => {
  if (!latestSignal)
    return res.status(400).json({ message: "No live signal available" });

  const { encryptionType: requestedType } = req.body;
  const typeToUse = requestedType || latestSignal.encryptionType;

  // Simulate decryption delay
  await new Promise((r) => setTimeout(r, 1000));

  latestSignal.isDecrypted = true;

  res.json({
    success: true,
    decryptedFrequency: latestSignal.frequency,
    currentFrequency: latestSignal.frequency,
    message: `Decrypted ${typeToUse} signal at ${latestSignal.frequency.toFixed(
      3
    )} MHz`,
  });
});
