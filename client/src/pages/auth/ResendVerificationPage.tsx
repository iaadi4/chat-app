import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Mail, CheckCircle2, ArrowLeft } from "lucide-react";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  resendVerificationSchema,
  type ResendVerificationFormData,
} from "@/schemas/auth.schema";
import { authService } from "@/services/auth.service";

export function ResendVerificationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const form = useForm<ResendVerificationFormData>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ResendVerificationFormData) => {
    try {
      setIsLoading(true);
      await authService.resendVerification(data.email);
      setSubmittedEmail(data.email);
      setIsSuccess(true);
      toast.success("Verification email sent!");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Failed to resend verification email"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout
        title="Email sent!"
        description="Check your inbox for the verification link"
      >
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-zinc-300">
              We've sent a new verification email to:
            </p>
            <p className="text-violet-400 font-medium">{submittedEmail}</p>
            <p className="text-sm text-zinc-500">
              Please check your inbox and spam folder.
            </p>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => {
                setIsSuccess(false);
                form.reset();
              }}
              variant="outline"
              className="w-full bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 text-zinc-200"
            >
              Send to a different email
            </Button>
            <Link to="/login">
              <Button
                variant="ghost"
                className="w-full text-zinc-400 hover:text-zinc-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Resend verification"
      description="Enter your email to receive a new verification link"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300">Email</FormLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <FormControl>
                    <Input
                      placeholder="you@example.com"
                      type="email"
                      className="pl-10 bg-zinc-800/50 border-zinc-700 focus:border-violet-500 focus:ring-violet-500/20 text-zinc-100 placeholder:text-zinc-500"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-medium shadow-lg shadow-violet-500/25 transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Resend verification email"
            )}
          </Button>
        </form>
      </Form>

      <Link to="/login">
        <Button
          variant="ghost"
          className="w-full mt-4 text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to login
        </Button>
      </Link>
    </AuthLayout>
  );
}
