import Image from "next/image";
import logo from "@/app/assets/engage-logo.png";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh w-full flex-col items-center justify-center gap-6 p-6 md:p-10">
      <h1 className="flex flex-col items-center gap-4 text-center text-4xl font-bold text-primary">
        <Image src={logo} alt="Partners in Health Engage" height={150} />
        Advocacy Tracking
      </h1>
      <div className="w-full max-w-sm">
        {children}
      </div>
    </main>
  );
}
