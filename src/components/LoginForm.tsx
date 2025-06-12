import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { UserRound, Lock, LogIn, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

interface LoginFormValues {
  loginId: string;
  password: string;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormValues>();

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    setWarning(null);
    
    try {
      const result = await login(data.loginId, data.password);
      
      if (result.success) {
        if (result.warning) {
          setWarning(result.warning);
          // Still proceed with login but show warning
          setTimeout(() => {
            onLoginSuccess();
          }, 2000); // Give user time to read warning
        } else {
          onLoginSuccess();
        }
      } else {
        setError('Invalid login ID or password');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
      <div className="flex flex-col items-center mb-8">
        <div className="bg-blue-100 p-4 rounded-full mb-4">
          <UserRound className="h-12 w-12 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Teacher Login</h1>
        <p className="text-gray-600 mt-2 text-center">
          Enter your credentials to access the attendance system
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-start">
          <span className="text-sm">{error}</span>
        </div>
      )}

      {warning && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6 flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium mb-1">Login Successful with Warnings:</p>
            <p>{warning}</p>
            <p className="mt-2 text-xs">Redirecting in a moment...</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="loginId" className="block text-sm font-medium text-gray-700 mb-1">
            Login ID
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserRound className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="loginId"
              type="text"
              {...register("loginId", { required: "Login ID is required" })}
              className={`block w-full pl-10 pr-3 py-2 rounded-md border ${
                errors.loginId ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              } focus:border-transparent focus:outline-none focus:ring-2 transition duration-200`}
              placeholder="Enter your login ID"
            />
          </div>
          {errors.loginId && (
            <p className="mt-1 text-sm text-red-600">{errors.loginId.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              type="password"
              {...register("password", { required: "Password is required" })}
              className={`block w-full pl-10 pr-3 py-2 rounded-md border ${
                errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              } focus:border-transparent focus:outline-none focus:ring-2 transition duration-200`}
              placeholder="Enter your password"
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Logging in...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </>
          )}
        </button>
      </form>
    </div>
  );
}