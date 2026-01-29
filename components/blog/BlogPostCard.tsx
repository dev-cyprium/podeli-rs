import Link from "next/link";
import { Calendar, User } from "lucide-react";
import type { BlogPostMeta } from "@/lib/blog";

interface BlogPostCardProps {
  post: BlogPostMeta;
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  const formattedDate = new Date(post.date).toLocaleDateString("sr-Latn-RS", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="h-full rounded-2xl bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
        {post.image && (
          <div className="mb-4 aspect-video overflow-hidden rounded-xl bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.image}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {post.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-podeli-accent/10 px-2.5 py-0.5 text-xs font-medium text-podeli-accent"
            >
              {tag}
            </span>
          ))}
        </div>

        <h2 className="mt-3 text-xl font-semibold text-podeli-dark transition-colors group-hover:text-podeli-accent">
          {post.title}
        </h2>

        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {post.description}
        </p>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {post.author}
          </span>
        </div>
      </article>
    </Link>
  );
}
