import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    else navigate("/dashboard");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else setError("Account created! Please login.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl lg:text-3xl font-bold text-center mb-6">
          Rent Manager
        </h1>
        <form
          onSubmit={isSignup ? handleSignup : handleLogin}
          className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 ml-1">Email</label>
            <input
              type="email"
              required
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 ml-1">
              Password
            </label>
            <input
              type="password"
              required
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button type="submit" className="w-full">
            {isSignup ? "Sign Up" : "Login"}
          </Button>
          <button
            type="button"
            onClick={() => setIsSignup(!isSignup)}
            className="w-full text-sm text-indigo-600">
            {isSignup
              ? "Already have an account? Login"
              : "Need an account? Sign Up"}
          </button>
        </form>
      </Card>
    </div>
  );
}
