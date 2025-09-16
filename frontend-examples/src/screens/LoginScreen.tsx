import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { login } from '../auth/store';

export default function LoginScreen() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const onLogin = async () => {
		setError(null);
		setLoading(true);
		try {
			await login(email.trim(), password);
			// Aqui você faria a navegação para a Home
		} catch (e: any) {
			setError(e?.message || 'Falha ao autenticar');
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>MedicalTime</Text>
			<TextInput
				style={styles.input}
				placeholder="E-mail"
				keyboardType="email-address"
				autoCapitalize="none"
				value={email}
				onChangeText={setEmail}
			/>
			<TextInput
				style={styles.input}
				placeholder="Senha"
				secureTextEntry
				value={password}
				onChangeText={setPassword}
			/>
			{error ? <Text style={styles.error}>{error}</Text> : null}
			<Button title={loading ? 'Entrando...' : 'Entrar'} onPress={onLogin} disabled={loading} />
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
	title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
	input: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
	error: { color: 'red', marginBottom: 12 },
});

