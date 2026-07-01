import React, { useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface LoginScreenProps {
  hasRememberedAccount: boolean;
  onPinLoginSuccess: (pin: string) => Promise<void>;
  onSignUpSuccess: (fullName: string, email: string, password: string) => Promise<void>;
}

const PIN_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', 'DEL'],
] as const;

export default function LoginScreen({
  hasRememberedAccount,
  onPinLoginSuccess,
  onSignUpSuccess,
}: LoginScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getAuthErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error && err.message.trim()) {
      const firebaseCode = (err as { code?: string }).code;

      if (firebaseCode === 'auth/email-already-in-use') {
        return 'This email is already in use. Please log in instead.';
      }

      if (firebaseCode === 'auth/invalid-email') {
        return 'Please enter a valid email address.';
      }

      if (firebaseCode === 'auth/weak-password') {
        return 'Password is too weak. Use at least 6 characters.';
      }

      if (firebaseCode === 'auth/network-request-failed') {
        return 'Network error. Check your internet and try again.';
      }

      return err.message;
    }

    return fallback;
  };

  const handleLogin = async (pinValue?: string) => {
    if (loading) return;

    const resolvedPin = (pinValue ?? pin).trim();

    if (!hasRememberedAccount) {
      setError('No saved account on this phone yet. Use Sign Up first.');
      return;
    }

    if (!/^\d{4}$/.test(resolvedPin)) {
      setError('PIN must be exactly 4 digits.');
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      await onPinLoginSuccess(resolvedPin);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Login failed. Check credentials and try again.'));
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handlePinPress = (digit: string) => {
    if (loading || pin.length >= 4) return;

    setError(null);
    setInfo(null);

    const nextPin = `${pin}${digit}`;
    setPin(nextPin);

    if (nextPin.length === 4) {
      void handleLogin(nextPin);
    }
  };

  const handlePinBackspace = () => {
    if (loading || !pin.length) return;

    setError(null);
    setInfo(null);
    setPin((current) => current.slice(0, -1));
  };

  const clearPin = () => {
    if (loading || !pin.length) return;

    setError(null);
    setInfo(null);
    setPin('');
  };

  const handleSignUp = async () => {
    if (signupLoading) return;

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    if (password.trim().length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and confirm password do not match.');
      return;
    }

    setSignupLoading(true);
    setError(null);
    setInfo(null);

    try {
      await onSignUpSuccess(fullName.trim(), email.trim().toLowerCase(), password);

      setInfo('Account created successfully.');
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setIsSignUp(false);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Account creation failed. Please try again.'));
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.fullWidth}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroTag}>MOTHER CARE</Text>
          <Text style={styles.heroTitle}>Safe motherhood starts here</Text>
          <Text style={styles.heroText}>
            Track appointments, records, wellness tips and your pregnancy journey in one secure place.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, !isSignUp ? styles.modeTabActive : null]}
              onPress={() => {
                setError(null);
                setInfo(null);
                setPin('');
                setIsSignUp(false);
              }}
            >
              <Text style={[styles.modeTabText, !isSignUp ? styles.modeTabTextActive : null]}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, isSignUp ? styles.modeTabActive : null]}
              onPress={() => {
                setError(null);
                setInfo(null);
                setIsSignUp(true);
              }}
            >
              <Text style={[styles.modeTabText, isSignUp ? styles.modeTabTextActive : null]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{isSignUp ? 'Create your account' : 'Welcome back, mama'}</Text>
          <Text style={styles.subtitle}>
            {isSignUp
              ? 'Create your account, then set up your profile and 4-digit login PIN.'
              : 'Enter your 4-digit PIN to unlock.'}
          </Text>

          <View style={styles.form}>
            {isSignUp ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                />
              </View>
            ) : null}

            {!isSignUp ? (
              <View style={styles.lockscreenWrap}>
                <View style={styles.pinDotsRow}>
                  {[0, 1, 2, 3].map((index) => (
                    <View key={index} style={[styles.pinDot, pin.length > index ? styles.pinDotFilled : null]} />
                  ))}
                </View>

                <View style={styles.pinPad}>
                  {PIN_ROWS.map((row) => (
                    <View key={row.join('-')} style={styles.pinPadRow}>
                      {row.map((item) => {
                        if (item === 'C') {
                          return (
                            <TouchableOpacity
                              key={item}
                              style={[styles.pinKey, styles.pinKeyAlt]}
                              onPress={clearPin}
                              disabled={loading || !pin.length}
                            >
                              <Text style={styles.pinKeyAltText}>Clear</Text>
                            </TouchableOpacity>
                          );
                        }

                        if (item === 'DEL') {
                          return (
                            <TouchableOpacity
                              key={item}
                              style={[styles.pinKey, styles.pinKeyAlt]}
                              onPress={handlePinBackspace}
                              disabled={loading || !pin.length}
                            >
                              <Text style={styles.pinKeyAltText}>Delete</Text>
                            </TouchableOpacity>
                          );
                        }

                        return (
                          <TouchableOpacity
                            key={item}
                            style={styles.pinKey}
                            onPress={() => handlePinPress(item)}
                            disabled={loading || pin.length >= 4}
                          >
                            <Text style={styles.pinKeyText}>{item}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>

                {!hasRememberedAccount ? (
                  <Text style={styles.lockHint}>No account is ready for PIN login yet. Tap Sign Up, then complete profile setup to create your PIN.</Text>
                ) : null}

                {loading ? <Text style={styles.lockHint}>Unlocking...</Text> : null}
              </View>
            ) : null}

            {isSignUp ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="Enter your email"
                />
              </View>
            ) : null}

            {isSignUp ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Enter your password"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword((current) => !current)}
                  >
                    <Text style={styles.eyeButtonText}>{showPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {isSignUp ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    placeholder="Confirm your password"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword((current) => !current)}
                  >
                    <Text style={styles.eyeButtonText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {!isSignUp ? (
              <TouchableOpacity
                style={[styles.button, loading ? styles.buttonDisabled : null]}
                onPress={() => {
                  void handleLogin();
                }}
                disabled={loading}
              >
                <Text style={styles.buttonText}>{loading ? 'Signing In...' : 'Log In'}</Text>
              </TouchableOpacity>
            ) : (
              <View>
                <TouchableOpacity
                  style={[styles.button, signupLoading ? styles.buttonDisabled : null]}
                  onPress={() => {
                    void handleSignUp();
                  }}
                  disabled={signupLoading}
                >
                  <Text style={styles.buttonText}>{signupLoading ? 'Creating Account...' : 'Create Account'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={() => {
                    setError(null);
                    setInfo(null);
                    setIsSignUp(false);
                  }}
                  disabled={signupLoading}
                >
                  <Text style={styles.switchButtonText}>Already have an account? Log In</Text>
                </TouchableOpacity>
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {info ? <Text style={styles.infoText}>{info}</Text> : null}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef0ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 14,
  },
  heroCard: {
    width: Platform.OS === 'web' && width > 480 ? 420 : '100%',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ddd6fe',
    backgroundColor: '#faf5ff',
  },
  heroTag: {
    alignSelf: 'flex-start',
    color: '#6d28d9',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.6,
    backgroundColor: '#ede9fe',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroTitle: {
    marginTop: 12,
    fontSize: 24,
    color: '#1f2937',
    fontWeight: '800',
  },
  heroText: {
    marginTop: 8,
    color: '#475569',
    lineHeight: 21,
  },
  card: {
    width: Platform.OS === 'web' && width > 480 ? 420 : '100%',
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#dbe1ff',
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: '#ffffff',
  },
  modeTabText: {
    color: '#64748b',
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: '#111827',
  },
  title: {
    fontSize: 27,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    color: '#64748b',
    marginTop: 6,
    marginBottom: 18,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  lockscreenWrap: {
    marginBottom: 16,
    alignItems: 'center',
  },
  pinDotsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    marginTop: 4,
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  pinDotFilled: {
    borderColor: '#6d28d9',
    backgroundColor: '#6d28d9',
  },
  pinPad: {
    width: '100%',
    gap: 10,
  },
  pinPadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  pinKey: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#dbe1ff',
    backgroundColor: '#f8faff',
  },
  pinKeyAlt: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  pinKeyText: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
  },
  pinKeyAltText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  lockHint: {
    marginTop: 12,
    color: '#64748b',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
  label: {
    marginBottom: 6,
    fontWeight: '600',
    color: '#475569',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 13,
    backgroundColor: '#f9fafb',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#f9fafb',
  },
  passwordInput: {
    flex: 1,
    padding: 13,
  },
  eyeButton: {
    borderLeftWidth: 1,
    borderLeftColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  eyeButtonText: {
    color: '#4f46e5',
    fontWeight: '600',
    fontSize: 12,
  },
  button: {
    backgroundColor: '#6d28d9',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#4338ca',
    fontWeight: '700',
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 14,
  },
  infoText: {
    color: '#0f766e',
    textAlign: 'center',
    marginTop: 14,
  },
});
