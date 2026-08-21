export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-bold">
          Login
        </h1>

        <form className="space-y-4">
          <input
            type="email"
            placeholder="E-mail"
            className="w-full rounded border p-3"
          />

          <input
            type="password"
            placeholder="Senha"
            className="w-full rounded border p-3"
          />

          <button
            type="submit"
            className="w-full rounded bg-blue-600 p-3 text-white"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
