import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { useStreakStore } from '@/store/useStreakStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';

type View = 'prompt' | 'email' | 'success';

interface Props {
  visible: boolean;
  onDismiss(): void;
}

export default function SaveProgressModal({ visible, onDismiss }: Props) {
  const [view, setView] = useState<View>('prompt');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const streak = useStreakStore((s) => s.streak);
  const sessions = useWorkoutStore((s) => s.sessions);

  function handleDismiss() {
    setView('prompt');
    setEmail('');
    setPassword('');
    setError(null);
    onDismiss();
  }

  async function handleEmailSignUp() {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in both fields.');
      return;
    }
    setLoading(true);
    setError(null);
    const err = await signUpWithEmail(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setView('success');
    }
  }

  async function handleGoogle() {
    await signInWithGoogle();
    // OAuth redirects the page — modal will close naturally on return
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={{
            backgroundColor: '#1e293b',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 28,
            paddingBottom: 40,
          }}>

            {view === 'prompt' && (
              <PromptView
                streak={streak.current}
                sessionCount={sessions.length}
                onGoogle={handleGoogle}
                onEmail={() => setView('email')}
                onDismiss={handleDismiss}
              />
            )}

            {view === 'email' && (
              <EmailView
                email={email}
                password={password}
                loading={loading}
                error={error}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
                onSubmit={handleEmailSignUp}
                onBack={() => { setView('prompt'); setError(null); }}
              />
            )}

            {view === 'success' && (
              <SuccessView onDone={handleDismiss} />
            )}

          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function PromptView({
  streak,
  sessionCount,
  onGoogle,
  onEmail,
  onDismiss,
}: {
  streak: number;
  sessionCount: number;
  onGoogle(): void;
  onEmail(): void;
  onDismiss(): void;
}) {
  return (
    <>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 6 }}>
        Save your progress
      </Text>
      <Text style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>
        Your data is only on this device right now. Create an account to keep it safe.
      </Text>

      {/* Stakes */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 28 }}>
        <StakeBadge emoji="🔥" value={`${streak}`} label="day streak" />
        <StakeBadge emoji="💪" value={`${sessionCount}`} label="sessions logged" />
      </View>

      {/* Google */}
      <TouchableOpacity
        onPress={onGoogle}
        style={{
          backgroundColor: '#fff',
          borderRadius: 14,
          paddingVertical: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          marginBottom: 12,
        }}
        activeOpacity={0.85}
      >
        <Text style={{ fontSize: 16 }}>G</Text>
        <Text style={{ color: '#0f172a', fontWeight: '600', fontSize: 15 }}>
          Continue with Google
        </Text>
      </TouchableOpacity>

      {/* Email */}
      <TouchableOpacity
        onPress={onEmail}
        style={{
          borderWidth: 1,
          borderColor: '#334155',
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: 'center',
          marginBottom: 20,
        }}
        activeOpacity={0.85}
      >
        <Text style={{ color: '#cbd5e1', fontWeight: '600', fontSize: 15 }}>
          Use email instead
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onDismiss} style={{ alignItems: 'center' }}>
        <Text style={{ color: '#475569', fontSize: 14 }}>Not now</Text>
      </TouchableOpacity>
    </>
  );
}

function StakeBadge({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: '#0f172a',
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
    }}>
      <Text style={{ fontSize: 24, marginBottom: 4 }}>{emoji}</Text>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: '#475569', fontSize: 12, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function EmailView({
  email,
  password,
  loading,
  error,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onBack,
}: {
  email: string;
  password: string;
  loading: boolean;
  error: string | null;
  onEmailChange(v: string): void;
  onPasswordChange(v: string): void;
  onSubmit(): void;
  onBack(): void;
}) {
  return (
    <>
      <TouchableOpacity onPress={onBack} style={{ marginBottom: 20 }}>
        <Text style={{ color: '#f97316', fontSize: 14 }}>← Back</Text>
      </TouchableOpacity>

      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 6 }}>
        Create account
      </Text>
      <Text style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>
        Your existing progress will be saved automatically.
      </Text>

      <TextInput
        value={email}
        onChangeText={onEmailChange}
        placeholder="Email"
        placeholderTextColor="#475569"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        style={inputStyle}
      />
      <TextInput
        value={password}
        onChangeText={onPasswordChange}
        placeholder="Password"
        placeholderTextColor="#475569"
        secureTextEntry
        style={[inputStyle, { marginTop: 12 }]}
      />

      {error && (
        <Text style={{ color: '#ef4444', fontSize: 13, marginTop: 10 }}>{error}</Text>
      )}

      <TouchableOpacity
        onPress={onSubmit}
        disabled={loading}
        style={{
          backgroundColor: '#f97316',
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: 'center',
          marginTop: 20,
          opacity: loading ? 0.7 : 1,
        }}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Create account</Text>
        }
      </TouchableOpacity>
    </>
  );
}

function SuccessView({ onDone }: { onDone(): void }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>✅</Text>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 8 }}>
        Progress saved!
      </Text>
      <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 28 }}>
        Check your email to confirm your account. Your data is safe.
      </Text>
      <TouchableOpacity
        onPress={onDone}
        style={{
          backgroundColor: '#f97316',
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 40,
        }}
        activeOpacity={0.85}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const inputStyle = {
  backgroundColor: '#0f172a',
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 14,
  color: '#fff',
  fontSize: 15,
  borderWidth: 1,
  borderColor: '#334155',
};
