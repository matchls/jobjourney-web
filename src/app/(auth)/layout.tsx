import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Job Journey",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm px-4">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Job Journey</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Suis ta recherche, prépare tes entretiens.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
