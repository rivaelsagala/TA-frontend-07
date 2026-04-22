import RegisterForm from "@/components/auth/RegisterForm";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-2">
          admin CORA
        </h1>
        <p className="text-sm text-center text-gray-500 mb-6">
          Silakan daftar untuk membuat akun admin CORA
        </p>

        <RegisterForm />

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Sudah punya akun?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Login di sini
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
