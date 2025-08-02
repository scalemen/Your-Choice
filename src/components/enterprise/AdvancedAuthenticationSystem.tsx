import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Shield, 
  Key, 
  Smartphone, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Clock,
  Users,
  Settings,
  Globe,
  Fingerprint,
  UserCheck,
  Building
} from 'lucide-react';
import { cn } from '@/utils/cn';

// Types and interfaces
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  roles: Role[];
  permissions: Permission[];
  organization?: Organization;
  department?: string;
  lastLogin?: Date;
  mfaEnabled: boolean;
  ssoProvider?: string;
  accountStatus: 'active' | 'inactive' | 'suspended' | 'pending';
  passwordLastChanged?: Date;
  loginAttempts: number;
  lockoutUntil?: Date;
  sessionTimeout: number;
  ipWhitelist?: string[];
  deviceTrust: DeviceTrust[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
  organization?: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
  scope: 'global' | 'organization' | 'department' | 'user';
}

export interface Organization {
  id: string;
  name: string;
  domain: string;
  ssoConfig?: SSOConfig;
  securityPolicies: SecurityPolicy;
  branding: BrandingConfig;
  subscription: SubscriptionTier;
}

export interface SSOConfig {
  provider: 'azure' | 'google' | 'okta' | 'auth0' | 'saml' | 'oidc';
  clientId: string;
  domain: string;
  metadata?: Record<string, any>;
  autoProvisioning: boolean;
  attributeMapping: Record<string, string>;
  groupMapping: Record<string, string>;
  enabled: boolean;
}

export interface SecurityPolicy {
  passwordPolicy: PasswordPolicy;
  mfaRequired: boolean;
  sessionTimeout: number;
  ipRestrictions: boolean;
  deviceTrustRequired: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
  passwordHistory: number;
  requirePasswordChange: boolean;
  passwordChangeInterval: number;
  allowRememberDevice: boolean;
  requireApprovalForNewDevices: boolean;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  prohibitCommon: boolean;
  prohibitPersonalInfo: boolean;
  expiryDays: number;
}

export interface BrandingConfig {
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  loginPageCustomization: Record<string, any>;
}

export interface SubscriptionTier {
  name: string;
  features: string[];
  maxUsers: number;
  ssoEnabled: boolean;
  advancedSecurity: boolean;
}

export interface DeviceTrust {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  trusted: boolean;
  lastUsed: Date;
  location?: string;
  ipAddress: string;
  userAgent: string;
}

export interface MFAMethod {
  id: string;
  type: 'totp' | 'sms' | 'email' | 'push' | 'hardware' | 'backup';
  name: string;
  enabled: boolean;
  verified: boolean;
  secret?: string;
  phoneNumber?: string;
  email?: string;
  backupCodes?: string[];
  createdAt: Date;
  lastUsed?: Date;
}

export interface AuthSession {
  id: string;
  userId: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  startTime: Date;
  lastActivity: Date;
  expiresAt: Date;
  active: boolean;
}

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
  mfaCode: z.string().optional(),
});

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  organization: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const mfaSetupSchema = z.object({
  method: z.enum(['totp', 'sms', 'email']),
  phoneNumber: z.string().optional(),
  verificationCode: z.string().min(6, 'Verification code must be 6 digits'),
});

// Main Authentication Component
export const AdvancedAuthenticationSystem: React.FC = () => {
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'mfa' | 'sso' | 'forgot'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaMethods, setMfaMethods] = useState<MFAMethod[]>([]);
  const [activeSessions, setActiveSessions] = useState<AuthSession[]>([]);

  // Login Component
  const LoginForm: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [requiresMFA, setRequiresMFA] = useState(false);
    const [availableSSO, setAvailableSSO] = useState<SSOConfig[]>([]);

    const {
      register,
      handleSubmit,
      formState: { errors },
      setValue,
      watch
    } = useForm({
      resolver: zodResolver(loginSchema),
      defaultValues: {
        email: '',
        password: '',
        rememberMe: false,
        mfaCode: ''
      }
    });

    const email = watch('email');

    useEffect(() => {
      if (email) {
        checkOrganizationSSO(email);
      }
    }, [email]);

    const checkOrganizationSSO = async (email: string) => {
      try {
        const domain = email.split('@')[1];
        const response = await fetch(`/api/auth/sso/check?domain=${domain}`);
        const data = await response.json();
        
        if (data.ssoAvailable) {
          setAvailableSSO(data.providers);
        } else {
          setAvailableSSO([]);
        }
      } catch (error) {
        console.error('SSO check failed:', error);
      }
    };

    const onSubmit = async (data: any) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message);
        }

        if (result.requiresMFA) {
          setRequiresMFA(true);
          setMfaMethods(result.mfaMethods);
        } else {
          setUser(result.user);
          localStorage.setItem('authToken', result.token);
        }
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    const handleSSOLogin = async (provider: SSOConfig) => {
      setIsLoading(true);
      try {
        window.location.href = `/api/auth/sso/${provider.provider}?domain=${provider.domain}`;
      } catch (error: any) {
        setError(error.message);
        setIsLoading(false);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Sign in to StudyGenius
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Access your learning dashboard
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {availableSSO.length > 0 && (
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Sign in with SSO</span>
              </div>
            </div>
            
            {availableSSO.map((sso, index) => (
              <button
                key={index}
                onClick={() => handleSSOLogin(sso)}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <Building className="h-5 w-5 mr-2" />
                Sign in with {sso.provider.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Email address
            </label>
            <div className="mt-1 relative">
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className={cn(
                  "appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                  errors.email 
                    ? "border-red-300 dark:border-red-600" 
                    : "border-gray-300 dark:border-gray-600"
                )}
                placeholder="Enter your email"
              />
              <Mail className="absolute right-3 top-2 h-5 w-5 text-gray-400" />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Password
            </label>
            <div className="mt-1 relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={cn(
                  "appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                  errors.password 
                    ? "border-red-300 dark:border-red-600" 
                    : "border-gray-300 dark:border-gray-600"
                )}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
            )}
          </div>

          {requiresMFA && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="mfaCode" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Verification Code
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register('mfaCode')}
                    type="text"
                    maxLength={6}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter 6-digit code"
                  />
                  <Smartphone className="absolute right-3 top-2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex">
                  <Fingerprint className="h-5 w-5 text-blue-400" />
                  <div className="ml-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Enter the verification code from your authenticator app or SMS.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                {...register('rememberMe')}
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900 dark:text-gray-200">
                Remember me
              </label>
            </div>

            <button
              type="button"
              onClick={() => setCurrentView('forgot')}
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500",
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-primary-600 hover:bg-primary-700"
            )}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Don't have an account?{' '}
            <button
              onClick={() => setCurrentView('register')}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign up
            </button>
          </p>
        </div>
      </motion.div>
    );
  };

  // Multi-Factor Authentication Setup Component
  const MFASetup: React.FC = () => {
    const [selectedMethod, setSelectedMethod] = useState<'totp' | 'sms' | 'email'>('totp');
    const [qrCode, setQrCode] = useState<string>('');
    const [secret, setSecret] = useState<string>('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [step, setStep] = useState<'method' | 'setup' | 'verify' | 'backup'>('method');

    const {
      register,
      handleSubmit,
      formState: { errors }
    } = useForm({
      resolver: zodResolver(mfaSetupSchema),
      defaultValues: {
        method: 'totp',
        phoneNumber: '',
        verificationCode: ''
      }
    });

    const generateTOTPSecret = async () => {
      try {
        const response = await fetch('/api/auth/mfa/generate-secret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        setSecret(data.secret);
        setQrCode(data.qrCode);
      } catch (error) {
        setError('Failed to generate TOTP secret');
      }
    };

    useEffect(() => {
      if (selectedMethod === 'totp' && step === 'setup') {
        generateTOTPSecret();
      }
    }, [selectedMethod, step]);

    const onSubmit = async (data: any) => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/mfa/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: selectedMethod,
            secret: secret,
            verificationCode: data.verificationCode,
            phoneNumber: data.phoneNumber
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message);
        }

        setBackupCodes(result.backupCodes);
        setStep('backup');
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Set up Multi-Factor Authentication
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Add an extra layer of security to your account
          </p>
        </div>

        {step === 'method' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Choose a method</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => {
                  setSelectedMethod('totp');
                  setStep('setup');
                }}
                className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center">
                  <Smartphone className="h-6 w-6 text-primary-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Authenticator App</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Use Google Authenticator, Authy, or similar apps
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setSelectedMethod('sms');
                  setStep('setup');
                }}
                className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center">
                  <Mail className="h-6 w-6 text-primary-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">SMS</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive codes via text message
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setSelectedMethod('email');
                  setStep('setup');
                }}
                className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center">
                  <Key className="h-6 w-6 text-primary-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Email</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive codes via email
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {step === 'setup' && selectedMethod === 'totp' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Scan QR Code
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                Scan this QR code with your authenticator app
              </p>
            </div>

            {qrCode && (
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG value={qrCode} size={200} />
                </div>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Manual entry</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                If you can't scan the QR code, enter this secret manually:
              </p>
              <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded break-all">
                {secret}
              </code>
            </div>

            <button
              onClick={() => setStep('verify')}
              className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Continue to verification
            </button>
          </div>
        )}

        {step === 'verify' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Verify Setup
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                Enter the 6-digit code from your {selectedMethod === 'totp' ? 'authenticator app' : selectedMethod}
              </p>
            </div>

            {selectedMethod === 'sms' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Phone Number
                </label>
                <input
                  {...register('phoneNumber')}
                  type="tel"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Verification Code
              </label>
              <input
                {...register('verificationCode')}
                type="text"
                maxLength={6}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="123456"
              />
              {errors.verificationCode && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.verificationCode.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify and Enable'}
            </button>
          </form>
        )}

        {step === 'backup' && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                MFA Enabled Successfully!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                Save these backup codes in a safe place
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Important: Save your backup codes
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    These codes can be used to access your account if you lose your device.
                    Each code can only be used once.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-center"
                >
                  {code}
                </div>
              ))}
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  const codesText = backupCodes.join('\n');
                  navigator.clipboard.writeText(codesText);
                }}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Copy Codes
              </button>
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(backupCodes, null, 2);
                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'studygenius-backup-codes.json';
                  link.click();
                }}
                className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Download
              </button>
            </div>

            <button
              onClick={() => setCurrentView('login')}
              className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Continue to Dashboard
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  // Session Management Component
  const SessionManagement: React.FC = () => {
    const [sessions, setSessions] = useState<AuthSession[]>([]);
    const [devices, setDevices] = useState<DeviceTrust[]>([]);

    useEffect(() => {
      loadSessions();
      loadDevices();
    }, []);

    const loadSessions = async () => {
      try {
        const response = await fetch('/api/auth/sessions');
        const data = await response.json();
        setSessions(data);
      } catch (error) {
        console.error('Failed to load sessions:', error);
      }
    };

    const loadDevices = async () => {
      try {
        const response = await fetch('/api/auth/devices');
        const data = await response.json();
        setDevices(data);
      } catch (error) {
        console.error('Failed to load devices:', error);
      }
    };

    const terminateSession = async (sessionId: string) => {
      try {
        await fetch(`/api/auth/sessions/${sessionId}`, {
          method: 'DELETE',
        });
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      } catch (error) {
        console.error('Failed to terminate session:', error);
      }
    };

    const trustDevice = async (deviceId: string) => {
      try {
        await fetch(`/api/auth/devices/${deviceId}/trust`, {
          method: 'POST',
        });
        setDevices(prev => prev.map(d => 
          d.deviceId === deviceId ? { ...d, trusted: true } : d
        ));
      } catch (error) {
        console.error('Failed to trust device:', error);
      }
    };

    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Active Sessions
          </h3>
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {session.deviceId}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {session.ipAddress} • {session.location}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Last active: {new Date(session.lastActivity).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => terminateSession(session.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Terminate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Trusted Devices
          </h3>
          <div className="space-y-4">
            {devices.map((device) => (
              <div
                key={device.deviceId}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {device.deviceName}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {device.deviceType} • {device.location}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Last used: {new Date(device.lastUsed).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={cn(
                        "px-2 py-1 text-xs rounded-full",
                        device.trusted
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                      )}
                    >
                      {device.trusted ? 'Trusted' : 'Pending'}
                    </span>
                    {!device.trusted && (
                      <button
                        onClick={() => trustDevice(device.deviceId)}
                        className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                      >
                        Trust
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Role-Based Access Control Component
  const RoleManagement: React.FC = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    useEffect(() => {
      loadRoles();
      loadPermissions();
    }, []);

    const loadRoles = async () => {
      try {
        const response = await fetch('/api/auth/roles');
        const data = await response.json();
        setRoles(data);
      } catch (error) {
        console.error('Failed to load roles:', error);
      }
    };

    const loadPermissions = async () => {
      try {
        const response = await fetch('/api/auth/permissions');
        const data = await response.json();
        setPermissions(data);
      } catch (error) {
        console.error('Failed to load permissions:', error);
      }
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Roles
          </h3>
          <div className="space-y-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-colors",
                  selectedRole?.id === role.id
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
              >
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {role.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {role.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {role.permissions.length} permissions
                </p>
              </button>
            ))}
          </div>
        </div>

        <div>
          {selectedRole ? (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {selectedRole.name} Permissions
              </h3>
              <div className="space-y-2">
                {selectedRole.permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {permission.action} {permission.resource}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Scope: {permission.scope}
                        </p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <Users className="mx-auto h-12 w-12 mb-4" />
                <p>Select a role to view permissions</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <AnimatePresence mode="wait">
          {currentView === 'login' && <LoginForm key="login" />}
          {currentView === 'mfa' && <MFASetup key="mfa" />}
        </AnimatePresence>
      </div>

      {user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-4xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Security Dashboard
              </h2>
              <button
                onClick={() => setUser(null)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Account Secure</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">MFA enabled</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Last Login</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">2 hours ago</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-purple-500 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Security Score</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">95/100</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SessionManagement />
              <RoleManagement />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAuthenticationSystem;