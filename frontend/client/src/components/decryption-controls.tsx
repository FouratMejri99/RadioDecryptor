import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertTriangle,
  Lock,
  Play,
  Radio,
  Shield,
  Square,
  Unlock,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface DecryptionControlsProps {
  signal: any; // the signal object
  decryptionEnabled: boolean;
  onToggleDecryption: (enabled: boolean) => void;
  onManualDecrypt: (signal: any) => void;
}

export function DecryptionControls({
  signal,
  decryptionEnabled,
  onToggleDecryption,
  onManualDecrypt,
}: DecryptionControlsProps) {
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [progress, setProgress] = useState(0);

  const encryptionIcons = {
    AES: Shield,
    P25: Radio,
    DMR: Zap,
    TETRA: AlertTriangle,
    DES: Lock,
  };
  const encryptionColors = {
    AES: "text-destructive",
    P25: "text-yellow-500",
    DMR: "text-blue-500",
    TETRA: "text-purple-500",
    DES: "text-orange-500",
  };

  const isEncrypted = signal?.isEncrypted || false;
  const isDecrypted = signal?.isDecrypted || false;
  const encryptionType = signal?.encryptionType;

  const Icon = isEncrypted
    ? encryptionIcons[encryptionType as keyof typeof encryptionIcons] || Lock
    : Unlock;
  const colorClass = isEncrypted
    ? encryptionColors[encryptionType as keyof typeof encryptionColors] ||
      "text-muted-foreground"
    : "text-accent";

  const handleDecrypt = async () => {
    if (!isEncrypted || isDecrypting || isDecrypted) return;

    setIsDecrypting(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + Math.random() * 10, 95));
    }, 100);

    try {
      const res = await fetch("/api/decrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frequency: signal.frequency,
          encryptionType: signal.encryptionType,
        }),
      });

      const data = await res.json();

      clearInterval(interval);
      setProgress(100);
      setIsDecrypting(false);

      if (data.success) {
        onManualDecrypt(signal); // let parent update state
        console.log("✅ Decryption success:", data.message);
      } else {
        console.error("❌ Decryption failed:", data.message);
      }
    } catch (err) {
      clearInterval(interval);
      setIsDecrypting(false);
      console.error("❌ Decryption request error:", err);
    }
  };

  return (
    <div className="px-4 pb-4">
      <div className="bg-card rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${colorClass}`} />
            <h3 className="text-sm font-medium">Decryption Control</h3>
          </div>
          <Badge
            variant={
              !isEncrypted
                ? "secondary"
                : isDecrypted
                ? "default"
                : "destructive"
            }
          >
            {!isEncrypted ? "CLEAR" : isDecrypted ? "DECRYPTED" : "ENCRYPTED"}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Auto Decryption</span>
            <Switch
              checked={decryptionEnabled}
              onCheckedChange={onToggleDecryption}
            />
          </div>

          {isEncrypted && (
            <Button
              onClick={handleDecrypt}
              disabled={!decryptionEnabled || isDecrypting || isDecrypted}
              className="w-full"
            >
              {isDecrypting ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Decrypting... {Math.round(progress)}%
                </>
              ) : isDecrypted ? (
                "Signal Decrypted"
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Decryption
                </>
              )}
            </Button>
          )}

          {!isEncrypted && (
            <Button disabled className="w-full" variant="secondary">
              No Encryption Detected
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground mt-2">
          {!isEncrypted
            ? "✓ Clear signal - no decryption needed"
            : isDecrypted
            ? "✓ Signal successfully decrypted"
            : decryptionEnabled
            ? "Decryption engine active - ready to decrypt"
            : "Enable auto decryption to decrypt signals"}
        </div>
      </div>
    </div>
  );
}
