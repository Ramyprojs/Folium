import { AuthExperience } from "@/components/auth/auth-experience";

export default function SignupPage(): JSX.Element {
  return (
    <AuthExperience
      initialMode="signup"
      googleAuthEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}
    />
  );
}
