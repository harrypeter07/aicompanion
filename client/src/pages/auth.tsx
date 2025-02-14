
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { gsap } from "gsap";

const quotes = [
  "Your AI companion, always ready to help",
  "Smart conversations, personalized for you",
  "Let's explore ideas together",
  "Your digital assistant, evolving with you",
];

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [currentQuote, setCurrentQuote] = useState(quotes[0]);
  
  const formRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let quoteIndex = 0;
    const interval = setInterval(() => {
      quoteIndex = (quoteIndex + 1) % quotes.length;
      gsap.to(quoteRef.current, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
          setCurrentQuote(quotes[quoteIndex]);
          gsap.to(quoteRef.current, {
            opacity: 1,
            duration: 0.5,
          });
        },
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (formRef.current && heroRef.current) {
      gsap.from(formRef.current, {
        x: -100,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
      });

      gsap.from(heroRef.current, {
        x: 100,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
      });
    }
  }, []);

  if (user) {
    return <Redirect to="/" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mutation = isLogin ? loginMutation : registerMutation;
    mutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8 bg-zinc-800 border-zinc-700" ref={formRef}>
          <h1 className="text-3xl font-bold mb-6 text-white">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-zinc-300">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-zinc-700 border-zinc-600 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-zinc-700 border-zinc-600 text-white"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={loginMutation.isPending || registerMutation.isPending}
            >
              {isLogin ? "Login" : "Register"}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-zinc-800 text-zinc-400">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-zinc-700 text-white hover:bg-zinc-700"
              onClick={() => {
                // Google sign-in logic here
                console.log("Google sign-in clicked");
              }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>
          </form>
          
          <p className="mt-4 text-sm text-center text-zinc-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-400 hover:text-indigo-300"
            >
              {isLogin ? "Register" : "Login"}
            </button>
          </p>
        </Card>
        
        <div className="hidden md:flex flex-col justify-center text-white" ref={heroRef}>
          <h2 className="text-4xl font-bold mb-4">AI Companion</h2>
          <div ref={quoteRef} className="text-xl text-zinc-300 transition-opacity duration-500">
            {currentQuote}
          </div>
        </div>
      </div>
    </div>
  );
}
