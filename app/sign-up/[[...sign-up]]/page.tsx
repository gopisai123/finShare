import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <SignUp
        appearance={{
          variables: {
            colorPrimary: "#16a34a", // Custom green branding to match your layout
          },
        }}
        signInUrl="/sign-in"
      />
    </div>
  );
}
