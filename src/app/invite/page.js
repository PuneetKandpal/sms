"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  checkInvitation,
  acceptInvitation,
  loginUser,
} from "../utils/authService";

// Import modular components
import {
  LoadingState,
  ErrorState,
  SuccessState,
  InvitationCard,
  LoginForm,
  SignupForm,
  MarketingIllustration,
} from "../components/invite";

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [invitationData, setInvitationData] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState("checking"); // checking, login, signup, success, error
  const [isProcessing, setIsProcessing] = useState(false);

  // Form states
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    firstName: "",
    lastName: "",
    password: "",
    passwordConfirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Check invitation on component mount
  useEffect(() => {
    if (!token) {
      setError("No invitation token provided");
      setCurrentStep("error");
      setLoading(false);
      return;
    }

    checkInvitationToken();
  }, [token]);

  const checkInvitationToken = async () => {
    try {
      setLoading(true);
      const result = await checkInvitation(token);

      if (result.success) {
        setInvitationData(result.data);

        if (result.data.user_exists) {
          setCurrentStep("login");
          setLoginForm((prev) => ({
            ...prev,
            email: result.data.invitation.email,
          }));
        } else {
          setCurrentStep("signup");
          setSignupForm((prev) => ({
            ...prev,
            email: result.data.invitation.email,
          }));
        }
      } else {
        setError(result.error);
        setCurrentStep("error");
      }
    } catch (error) {
      console.error("Error checking invitation:", error);
      setError("Failed to check invitation");
      setCurrentStep("error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!loginForm.email || !loginForm.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsProcessing(true);

    try {
      // First login the user
      const loginResult = await loginUser(loginForm.email, loginForm.password);

      if (loginResult.success) {
        // Then accept the invitation
        const acceptResult = await acceptInvitation({ token });

        if (acceptResult.success) {
          toast.success("Successfully joined the company!");
          setCurrentStep("success");
          setTimeout(() => {
            router.push("/");
          }, 2000);
        } else {
          toast.error(acceptResult.error);
        }
      } else {
        toast.error(loginResult.error);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    // Validate form
    const errors = {};
    if (!signupForm.firstName.trim())
      errors.firstName = "First name is required";
    if (!signupForm.lastName.trim()) errors.lastName = "Last name is required";
    if (!signupForm.password || signupForm.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    if (signupForm.password !== signupForm.passwordConfirm) {
      errors.passwordConfirm = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fix the errors below");
      return;
    }

    setIsProcessing(true);

    try {
      const acceptResult = await acceptInvitation({
        token,
        firstName: signupForm.firstName,
        lastName: signupForm.lastName,
        password: signupForm.password,
      });

      if (acceptResult.success) {
        toast.success("Account created and invitation accepted!");
        setCurrentStep("success");
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        toast.error(acceptResult.error);
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (form, field, value) => {
    if (form === "login") {
      setLoginForm((prev) => ({ ...prev, [field]: value }));
    } else {
      setSignupForm((prev) => ({ ...prev, [field]: value }));
      // Clear errors on change
      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: "" }));
      }
    }
  };

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Error state
  if (currentStep === "error") {
    return <ErrorState error={error} />;
  }

  // Success state
  if (currentStep === "success") {
    return <SuccessState invitationData={invitationData} />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 bg-white overflow-y-auto ">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Invitation Info */}
          <InvitationCard invitationData={invitationData} />

          {/* Header */}
          <div className="mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold text-gray-900 mb-3 tracking-wide"
            >
              {currentStep === "login" ? "Welcome Back!" : "Join the Team"}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 text-lg"
            >
              {currentStep === "login"
                ? "Sign in to accept your invitation"
                : "Create your account to get started"}
            </motion.p>
          </div>

          {/* Login Form */}
          {currentStep === "login" && (
            <LoginForm
              loginForm={loginForm}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              handleInputChange={handleInputChange}
              handleLogin={handleLogin}
              isProcessing={isProcessing}
            />
          )}

          {/* Signup Form */}
          {currentStep === "signup" && (
            <SignupForm
              signupForm={signupForm}
              invitationData={invitationData}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showPasswordConfirm={showPasswordConfirm}
              setShowPasswordConfirm={setShowPasswordConfirm}
              handleInputChange={handleInputChange}
              handleSignup={handleSignup}
              isProcessing={isProcessing}
              formErrors={formErrors}
            />
          )}
        </motion.div>
      </div>

      {/* Right Side - Illustration */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-purple-600 via-purple-500 to-blue-600 relative overflow-hidden min-h-[50vh] lg:min-h-screen">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="h-full"
        >
          <MarketingIllustration />
        </motion.div>

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent"></div>
          <div className="absolute top-10 left-10 w-20 h-20 border border-white/20 rounded-full"></div>
          <div className="absolute bottom-20 right-16 w-32 h-32 border border-white/20 rounded-full"></div>
          <div className="absolute top-1/3 right-8 w-16 h-16 border border-white/20 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
