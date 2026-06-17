import { SearchInterface } from '@/components/SearchInterface';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Quire</h1>
        <p className="mt-1 text-sm text-zinc-500">Your ebook shelf, delivered.</p>
      </div>
      <SearchInterface />
    </main>
  );
}
