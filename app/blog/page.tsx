import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { getAllPosts } from "@/lib/blog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://podeli.rs";

export const metadata: Metadata = {
  title: "Blog | PODELI.rs",
  description:
    "Saveti, vodiči i novosti o deljenju stvari u Beogradu. Naučite kako da maksimalno iskoristite PODELI platformu.",
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: "Blog | PODELI.rs",
    description:
      "Saveti, vodiči i novosti o deljenju stvari u Beogradu. Naučite kako da maksimalno iskoristite PODELI platformu.",
    url: `${SITE_URL}/blog`,
    siteName: "PODELI.rs",
    locale: "sr_RS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | PODELI.rs",
    description:
      "Saveti, vodiči i novosti o deljenju stvari u Beogradu. Naučite kako da maksimalno iskoristite PODELI platformu.",
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-podeli-light text-podeli-dark">
      <header className="border-b border-border bg-podeli-light/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Logo href="/" height={32} />
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-podeli-accent"
          >
            Nazad na pocetnu
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <section className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-podeli-accent/30 bg-podeli-accent/10 px-4 py-1.5 text-sm font-medium text-podeli-dark">
            PODELI Blog
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-podeli-dark sm:text-5xl">
            Saveti i vodiči
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Korisni članci o deljenju stvari, iznajmljivanju i korišćenju PODELI
            platforme.
          </p>
        </section>

        {posts.length === 0 ? (
          <div className="mt-16 text-center text-muted-foreground">
            <p>Uskoro dolaze novi članci!</p>
          </div>
        ) : (
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
