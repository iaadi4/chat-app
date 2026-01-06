import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";

type VerificationStatus = "loading" | "success" | "error";

export function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setErrorMessage("Invalid verification link");
        return;
      }

      try {
        await authService.verifyEmail(token);
        setStatus("success");
      } catch (error: unknown) {
        setStatus("error");
        const err = error as { response?: { data?: { message?: string } } };
        setErrorMessage(err.response?.data?.message || "Verification failed");
      }
    };

    verifyEmail();
  }, [token]);

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30">
                <Loader2 className="w-12 h-12 text-violet-400 animate-spin" />
              </div>
            </div>
            <p className="text-zinc-300">Verifying your email...</p>
          </div>
        );

      case "success":
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-zinc-100">
                Email verified!
              </h3>
              <p className="text-zinc-400">
                Your email has been successfully verified. You can now sign in
                to your account.
              </p>
            </div>
            <Button
              onClick={() => navigate("/login")}
              className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-medium shadow-lg shadow-violet-500/25"
            >
              Sign in to your account
            </Button>
          </div>
        );

      case "error":
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30">
                <XCircle className="w-12 h-12 text-red-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-zinc-100">
                Verification failed
              </h3>
              <p className="text-zinc-400">{errorMessage}</p>
            </div>
            <div className="space-y-3">
              <Link to="/resend-verification">
                <Button
                  variant="outline"
                  className="w-full bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 text-zinc-200"
                >
                  Resend verification email
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="ghost"
                  className="w-full text-zinc-400 hover:text-zinc-200"
                >
                  Back to login
                </Button>
              </Link>
            </div>
          </div>
        );
    }
  };

  return (
    <AuthLayout
      title="Email Verification"
      description="Verifying your email address"
    >
      {renderContent()}
    </AuthLayout>
  );
}
