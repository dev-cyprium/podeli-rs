import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Calendar, User, ArrowLeft } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { mdxComponents } from "@/components/blog/MDXComponents";
import { BlurImage } from "@/components/blog/BlurImage";
import { DateDisplay } from "@/components/ui/date-display";
import { getPostBySlug, getAllPostSlugs } from "@/lib/blog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://podeli.rs";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "Članak nije pronađen | PODELI.rs",
    };
  }

  const ogImage = post.image
    ? `${SITE_URL}${post.image}`
    : `${SITE_URL}/og-image.png`;

  return {
    title: `${post.title} | PODELI.rs`,
    description: post.description,
    authors: [{ name: post.author }],
    alternates: {
      canonical: `${SITE_URL}/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${SITE_URL}/blog/${slug}`,
      siteName: "PODELI.rs",
      locale: "sr_RS",
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: post.image ? `${SITE_URL}${post.image}` : undefined,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "PODELI.rs",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-podeli-light text-podeli-dark">
        <NavBar />

        <main className="mx-auto max-w-4xl px-6 py-16 sm:py-20 lg:px-8">
          <article>
            <header className="mb-10">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-podeli-accent/10 px-3 py-1 text-xs font-medium text-podeli-accent"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-podeli-dark sm:text-4xl lg:text-5xl">
                {post.title}
              </h1>

              <p className="mt-5 text-lg leading-relaxed text-muted-foreground sm:text-xl">
                {post.description}
              </p>

              <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <DateDisplay value={post.date} format="long" />
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {post.author}
                </span>
              </div>
            </header>

            {post.image && (
              <div className="relative mb-10 aspect-video overflow-hidden rounded-2xl bg-muted">
                <BlurImage src={post.image} alt={post.title} priority />
              </div>
            )}

            <div className="prose-podeli">
              <MDXRemote source={post.content} components={mdxComponents} />
            </div>
          </article>

          <footer className="mt-16 border-t border-border pt-8">
            <div className="flex flex-col items-center gap-4">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-medium text-podeli-accent hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Nazad na sve članke
              </Link>
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} podeli.rs – Sva prava zadržana.
              </p>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
