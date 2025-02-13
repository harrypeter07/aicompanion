import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { gsap } from "gsap";
import { useEffect, useRef } from "react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const formRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8" ref={formRef}>
          <h1 className="text-2xl font-bold mb-6">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending || registerMutation.isPending}
            >
              {isLogin ? "Login" : "Register"}
            </Button>
          </form>
          
          <p className="mt-4 text-sm text-center">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin ? "Register" : "Login"}
            </button>
          </p>
        </Card>
        
        <div className="hidden md:flex flex-col justify-center" ref={heroRef}>
          <h2 className="text-4xl font-bold mb-4">AI Companion</h2>
          <p className="text-lg text-muted-foreground">
            Your personal AI assistant that remembers your preferences and adapts to your needs.
            Have natural conversations with voice support and emotional understanding.
          </p>
        </div>
      </div>
    </div>
  );
}
