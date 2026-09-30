import { Logo } from "@/components/logo";
import { GuestOnly } from "@/components/guards";
import { AuthShowcase } from "./showcase";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm animate-fade-up">
            <GuestOnly>{children}</GuestOnly>
          </div>
        </div>
        <p className="text-xs text-subtle">© {new Date().getFullYear()} DocFlow</p>
      </div>
      <AuthShowcase />
    </div>
  );
}
