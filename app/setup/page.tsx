"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Shield, Eye, EyeOff } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [enableTotp, setEnableTotp] = useState(false);
  const [totpSecret, setTotpSecret] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session").then(async (res) => {
      const data = await res.json();
      if (!data.needsSetup) {
        router.push(data.authenticated ? "/" : "/login");
      }
    });
  }, [router]);

  useEffect(() => {
    if (enableTotp && !totpSecret && username.length >= 3) {
      generateTotp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omit generateTotp and totpSecret to avoid regenerating secret on every render
  }, [enableTotp, username]);

  const generateTotp = async () => {
    try {
      const { TOTP, Secret } = await import("otpauth");
      const secret = new Secret({ size: 20 });
      const totp = new TOTP({
        issuer: "ClaudeDeck",
        label: username,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret,
      });

      const uri = totp.toString();
      setTotpSecret(secret.base32);

      const QRCode = await import("qrcode");
      const dataUrl = await QRCode.toDataURL(uri, {
        width: 200,
        margin: 2,
        color: { dark: "#ffffff", light: "#00000000" },
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error("Failed to generate TOTP:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (enableTotp && totpCode.length !== 6) {
      setError("Enter the 6-digit code from your authenticator app");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          ...(enableTotp ? { totpSecret, totpCode } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Setup failed");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="border-border bg-card w-full max-w-md rounded-xl border p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-foreground text-2xl font-semibold">
            Welcome to ClaudeDeck
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create your account to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="text-foreground text-sm font-medium"
            >
              Username
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              autoFocus
              required
              minLength={3}
              maxLength={32}
              pattern="[a-zA-Z0-9_]+"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-foreground text-sm font-medium"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-foreground text-sm font-medium"
            >
              Confirm password
            </label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>

          <div className="border-border flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-foreground text-sm font-medium">
                Two-factor authentication
              </p>
              <p className="text-muted-foreground text-xs">
                Secure your account with TOTP
              </p>
            </div>
            <Switch checked={enableTotp} onCheckedChange={setEnableTotp} />
          </div>

          {enableTotp && qrDataUrl && (
            <div className="border-border space-y-3 rounded-lg border p-4">
              <p className="text-foreground text-center text-sm font-medium">
                Scan with your authenticator app
              </p>
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URL, next/image not applicable */}
                <img
                  src={qrDataUrl}
                  alt="TOTP QR Code"
                  className="h-[200px] w-[200px]"
                />
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-center text-xs">
                  Or enter manually:
                </p>
                <code className="bg-muted text-foreground block rounded p-2 text-center font-mono text-xs break-all">
                  {totpSecret}
                </code>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="totpVerify"
                  className="text-foreground text-sm font-medium"
                >
                  Verification code
                </label>
                <Input
                  id="totpVerify"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) =>
                    setTotpCode(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="000000"
                  className="text-center text-lg tracking-[0.3em]"
                  autoComplete="one-time-code"
                />
              </div>
            </div>
          )}

          {enableTotp && !qrDataUrl && username.length < 3 && (
            <p className="text-muted-foreground text-center text-sm">
              Enter a username (3+ characters) to generate the QR code
            </p>
          )}

          {error && (
            <p className="text-destructive text-center text-sm">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </form>
      </div>
    </div>
  );
}
