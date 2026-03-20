import { AuthExperience } from "@/components/auth/auth-experience";

export default function LoginPage(): JSX.Element {
  return (
    <AuthExperience
      initialMode="login"
      googleAuthEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}
    />
  );
}
